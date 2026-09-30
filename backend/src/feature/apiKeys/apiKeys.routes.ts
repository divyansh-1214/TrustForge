import { createHash, randomBytes } from "node:crypto";
import express from "express";
import prisma from "../../config/prisma.js";
import { isJsonObject, isNonEmptyString, isUuid, sendDatabaseError } from "../api.helpers.js";

const apiKeysRouter = express.Router();
const statuses = ["active", "revoked", "expired"] as const;
const publicApiKeySelect = {
  id: true,
  organization_id: true,
  project_id: true,
  key_prefix: true,
  name: true,
  permissions: true,
  rate_limit_per_min: true,
  last_used_at: true,
  expires_at: true,
  status: true,
  created_at: true,
} as const;

apiKeysRouter.post("/", async (req, res) => {
  const {
    organization_id,
    project_id = null,
    name,
    permissions = {},
    rate_limit_per_min = 60,
    expires_at = null,
  } = req.body;
  const expiry = expires_at === null ? null : new Date(expires_at);
  if (
    !isUuid(organization_id) ||
    (project_id !== null && !isUuid(project_id)) ||
    (name !== undefined && name !== null && !isNonEmptyString(name)) ||
    !isJsonObject(permissions) ||
    !Number.isInteger(rate_limit_per_min) ||
    rate_limit_per_min < 1 ||
    (expires_at !== null &&
      (typeof expires_at !== "string" ||
        !Number.isFinite(expiry?.getTime()) ||
        expiry === null ||
        expiry.getTime() <= Date.now()))
  ) {
    return res.status(400).json({ success: false, error: "invalid API key fields" });
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

    const key = `tf_${randomBytes(32).toString("hex")}`;
    const key_prefix = key.slice(0, 11);
    const key_hash = createHash("sha256").update(key).digest("hex");
    const apiKey = await prisma.api_keys.create({
      data: {
        organization_id,
        project_id,
        name: name?.trim() ?? null,
        permissions,
        rate_limit_per_min,
        expires_at: expiry,
        key_prefix,
        key_hash,
      },
      select: publicApiKeySelect,
    });
    return res.status(201).json({
      success: true,
      apiKey: { ...apiKey, key },
      message: "Save this key now; it cannot be retrieved again.",
    });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create API key");
  }
});

apiKeysRouter.get("/", async (req, res) => {
  const organizationId = req.query.organization_id;
  const projectId = req.query.project_id;
  if (
    (organizationId !== undefined && !isUuid(organizationId)) ||
    (projectId !== undefined && !isUuid(projectId))
  ) {
    return res.status(400).json({ success: false, error: "filters must be valid UUIDs" });
  }
  try {
    const apiKeys = await prisma.api_keys.findMany({
      where: {
        ...(organizationId && { organization_id: organizationId }),
        ...(projectId && { project_id: projectId }),
      },
      select: publicApiKeySelect,
      orderBy: { created_at: "desc" },
    });
    return res.json({ success: true, apiKeys });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch API keys");
  }
});

apiKeysRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    const apiKey = await prisma.api_keys.findUnique({
      where: { id },
      select: publicApiKeySelect,
    });
    if (!apiKey) {
      return res.status(404).json({ success: false, error: "API key not found" });
    }
    return res.json({ success: true, apiKey });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch API key");
  }
});

apiKeysRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, permissions, rate_limit_per_min, status, expires_at } = req.body;
  const expiry = expires_at === null || expires_at === undefined ? expires_at : new Date(expires_at);
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  if (
    (name !== undefined && name !== null && !isNonEmptyString(name)) ||
    (permissions !== undefined && !isJsonObject(permissions)) ||
    (rate_limit_per_min !== undefined &&
      (!Number.isInteger(rate_limit_per_min) || rate_limit_per_min < 1)) ||
    (status !== undefined && !statuses.includes(status)) ||
    (expires_at !== undefined &&
      expires_at !== null &&
      (typeof expires_at !== "string" || !Number.isFinite(expiry?.getTime()))) ||
    [name, permissions, rate_limit_per_min, status, expires_at].every((value) => value === undefined)
  ) {
    return res.status(400).json({ success: false, error: "invalid API key fields" });
  }
  try {
    const apiKey = await prisma.api_keys.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name?.trim() ?? null }),
        ...(permissions !== undefined && { permissions }),
        ...(rate_limit_per_min !== undefined && { rate_limit_per_min }),
        ...(status !== undefined && { status }),
        ...(expires_at !== undefined && { expires_at: expiry }),
      },
      select: publicApiKeySelect,
    });
    return res.json({ success: true, apiKey });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update API key");
  }
});

apiKeysRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    await prisma.api_keys.update({
      where: { id },
      data: { status: "revoked" },
    });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to revoke API key");
  }
});

export default apiKeysRouter;
