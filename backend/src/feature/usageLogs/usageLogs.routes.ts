import express from "express";
import prisma from "../../config/prisma.js";
import { isUuid, sendDatabaseError } from "../api.helpers.js";

const usageLogsRouter = express.Router();
const statuses = ["success", "error", "blocked", "rate_limited", "fallback_used"] as const;

usageLogsRouter.post("/", async (req, res) => {
  const {
    request_id,
    organization_id,
    project_id = null,
    api_key_id = null,
    model_id = null,
    provider_id = null,
    requested_alias = null,
    input_tokens = 0,
    output_tokens = 0,
    latency_ms = null,
    cost = 0,
    status,
    error_message = null,
  } = req.body;
  if (
    !isUuid(request_id) ||
    !isUuid(organization_id) ||
    (project_id !== null && !isUuid(project_id)) ||
    (api_key_id !== null && !isUuid(api_key_id)) ||
    (model_id !== null && !isUuid(model_id)) ||
    (provider_id !== null && !isUuid(provider_id)) ||
    (requested_alias !== null && typeof requested_alias !== "string") ||
    !Number.isInteger(input_tokens) ||
    input_tokens < 0 ||
    !Number.isInteger(output_tokens) ||
    output_tokens < 0 ||
    (latency_ms !== null && (!Number.isInteger(latency_ms) || latency_ms < 0)) ||
    typeof cost !== "number" ||
    !Number.isFinite(cost) ||
    cost < 0 ||
    !statuses.includes(status) ||
    (error_message !== null && typeof error_message !== "string")
  ) {
    return res.status(400).json({ success: false, error: "invalid usage log fields" });
  }
  try {
    if (project_id !== null) {
      const project = await prisma.projects.findUnique({
        where: { id: project_id },
        select: { organization_id: true },
      });
      if (!project || project.organization_id !== organization_id) {
        return res.status(400).json({
          success: false,
          error: "project must belong to the specified organization",
        });
      }
    }
    if (api_key_id !== null) {
      const apiKey = await prisma.api_keys.findUnique({
        where: { id: api_key_id },
        select: { organization_id: true, project_id: true },
      });
      if (
        !apiKey ||
        apiKey.organization_id !== organization_id ||
        (apiKey.project_id !== null && apiKey.project_id !== project_id)
      ) {
        return res.status(400).json({
          success: false,
          error: "API key must match the usage log organization and project",
        });
      }
    }
    let effectiveProviderId = provider_id;
    if (model_id !== null) {
      const model = await prisma.models.findUnique({
        where: { id: model_id },
        select: { provider_id: true },
      });
      if (!model || (provider_id !== null && provider_id !== model.provider_id)) {
        return res.status(400).json({
          success: false,
          error: "provider_id must match the selected model",
        });
      }
      effectiveProviderId = model.provider_id;
    }
    const usageLog = await prisma.usage_logs.create({
      data: {
        request_id,
        organization_id,
        project_id,
        api_key_id,
        model_id,
        provider_id: effectiveProviderId,
        requested_alias,
        input_tokens,
        output_tokens,
        latency_ms,
        cost,
        status,
        error_message,
      },
      include: {
        organizations: true,
        projects: true,
        api_keys: { select: { id: true, key_prefix: true, name: true } },
        models: true,
        providers: { select: { id: true, name: true } },
      },
    });
    return res.status(201).json({ success: true, usageLog });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create usage log");
  }
});

usageLogsRouter.get("/", async (req, res) => {
  const { organization_id, project_id, api_key_id, model_id, provider_id, request_id, status } = req.query;
  if (
    [organization_id, project_id, api_key_id, model_id, provider_id, request_id]
      .some((value) => value !== undefined && !isUuid(value)) ||
    (status !== undefined && !statuses.includes(status as (typeof statuses)[number]))
  ) {
    return res.status(400).json({ success: false, error: "invalid usage log filters" });
  }
  const requestedLimit = Number(req.query.limit ?? 100);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 500) {
    return res.status(400).json({ success: false, error: "limit must be between 1 and 500" });
  }
  try {
    const usageLogs = await prisma.usage_logs.findMany({
      where: {
        ...(organization_id && { organization_id: organization_id as string }),
        ...(project_id && { project_id: project_id as string }),
        ...(api_key_id && { api_key_id: api_key_id as string }),
        ...(model_id && { model_id: model_id as string }),
        ...(provider_id && { provider_id: provider_id as string }),
        ...(request_id && { request_id: request_id as string }),
        ...(status && { status: status as (typeof statuses)[number] }),
      },
      include: {
        projects: true,
        api_keys: { select: { id: true, key_prefix: true, name: true } },
        models: true,
        providers: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "desc" },
      take: requestedLimit,
    });
    return res.json({ success: true, usageLogs });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch usage logs");
  }
});

usageLogsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    const usageLog = await prisma.usage_logs.findUnique({
      where: { id },
      include: {
        organizations: true,
        projects: true,
        api_keys: { select: { id: true, key_prefix: true, name: true } },
        models: true,
        providers: { select: { id: true, name: true } },
      },
    });
    if (!usageLog) {
      return res.status(404).json({ success: false, error: "usage log not found" });
    }
    return res.json({ success: true, usageLog });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch usage log");
  }
});

export default usageLogsRouter;
