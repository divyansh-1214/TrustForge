import express from "express";
import prisma from "../../config/prisma.js";
import { isJsonObject, isNonEmptyString, isUuid, sendDatabaseError } from "../api.helpers.js";

const modelsRouter = express.Router();
const statuses = ["active", "deprecated", "disabled"] as const;

modelsRouter.post("/", async (req, res) => {
  const {
    provider_id,
    name,
    model_identifier,
    context_window,
    input_cost_per_1m,
    output_cost_per_1m,
    capabilities = {},
    status = "active",
  } = req.body;
  if (
    !isUuid(provider_id) ||
    !isNonEmptyString(name) ||
    !isNonEmptyString(model_identifier) ||
    !Number.isInteger(context_window) ||
    context_window <= 0 ||
    typeof input_cost_per_1m !== "number" ||
    !Number.isFinite(input_cost_per_1m) ||
    input_cost_per_1m < 0 ||
    typeof output_cost_per_1m !== "number" ||
    !Number.isFinite(output_cost_per_1m) ||
    output_cost_per_1m < 0 ||
    !isJsonObject(capabilities) ||
    !statuses.includes(status)
  ) {
    return res.status(400).json({ success: false, error: "invalid model fields" });
  }
  try {
    const model = await prisma.models.create({
      data: {
        provider_id,
        name: name.trim(),
        model_identifier: model_identifier.trim(),
        context_window,
        input_cost_per_1m,
        output_cost_per_1m,
        capabilities,
        status,
      },
      include: { providers: { select: { id: true, name: true, status: true } } },
    });
    return res.status(201).json({ success: true, model });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create model");
  }
});

modelsRouter.get("/", async (req, res) => {
  const providerId = req.query.provider_id;
  if (providerId !== undefined && !isUuid(providerId)) {
    return res.status(400).json({ success: false, error: "provider_id must be a valid UUID" });
  }
  try {
    const models = await prisma.models.findMany({
      where: providerId ? { provider_id: providerId } : undefined,
      include: { providers: { select: { id: true, name: true, status: true } }, provider_models: true },
    });
    return res.json({ success: true, models });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch models");
  }
});

modelsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    const model = await prisma.models.findUnique({
      where: { id },
      include: {
        providers: { select: { id: true, name: true, status: true } },
        provider_models: true,
        routing_rules_routing_rules_target_model_idTomodels: true,
        routing_rules_routing_rules_fallback_model_idTomodels: true,
      },
    });
    if (!model) {
      return res.status(404).json({ success: false, error: "model not found" });
    }
    return res.json({ success: true, model });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch model");
  }
});

modelsRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const fields = [
    "provider_id",
    "name",
    "model_identifier",
    "context_window",
    "input_cost_per_1m",
    "output_cost_per_1m",
    "capabilities",
    "status",
  ] as const;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  if (!fields.some((field) => req.body[field] !== undefined)) {
    return res.status(400).json({ success: false, error: "no model fields supplied" });
  }
  const {
    provider_id,
    name,
    model_identifier,
    context_window,
    input_cost_per_1m,
    output_cost_per_1m,
    capabilities,
    status,
  } = req.body;
  if (
    (provider_id !== undefined && !isUuid(provider_id)) ||
    (name !== undefined && !isNonEmptyString(name)) ||
    (model_identifier !== undefined && !isNonEmptyString(model_identifier)) ||
    (context_window !== undefined && (!Number.isInteger(context_window) || context_window <= 0)) ||
    (input_cost_per_1m !== undefined &&
      (typeof input_cost_per_1m !== "number" || !Number.isFinite(input_cost_per_1m) || input_cost_per_1m < 0)) ||
    (output_cost_per_1m !== undefined &&
      (typeof output_cost_per_1m !== "number" || !Number.isFinite(output_cost_per_1m) || output_cost_per_1m < 0)) ||
    (capabilities !== undefined && !isJsonObject(capabilities)) ||
    (status !== undefined && !statuses.includes(status))
  ) {
    return res.status(400).json({ success: false, error: "invalid model fields" });
  }
  try {
    const model = await prisma.models.update({
      where: { id },
      data: {
        ...(provider_id !== undefined && { provider_id }),
        ...(name !== undefined && { name: name.trim() }),
        ...(model_identifier !== undefined && { model_identifier: model_identifier.trim() }),
        ...(context_window !== undefined && { context_window }),
        ...(input_cost_per_1m !== undefined && { input_cost_per_1m }),
        ...(output_cost_per_1m !== undefined && { output_cost_per_1m }),
        ...(capabilities !== undefined && { capabilities }),
        ...(status !== undefined && { status }),
      },
      include: { providers: { select: { id: true, name: true, status: true } } },
    });
    return res.json({ success: true, model });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update model");
  }
});

modelsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    await prisma.models.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to delete model");
  }
});

export default modelsRouter;
