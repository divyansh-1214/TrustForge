import express from "express";
import prisma from "../../config/prisma.js";
import { isNonEmptyString, isUuid, sendDatabaseError } from "../api.helpers.js";

const providersRouter = express.Router();
const statuses = ["active", "disabled", "degraded"] as const;
const publicProviderSelect = {
  id: true,
  name: true,
  base_url: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

providersRouter.post("/", async (req, res) => {
  const { name, base_url, api_key_encrypted, status = "active" } = req.body;
  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(base_url) ||
    !isNonEmptyString(api_key_encrypted) ||
    !statuses.includes(status)
  ) {
    return res.status(400).json({
      success: false,
      error: "name, base_url, api_key_encrypted, and a valid status are required",
    });
  }
  try {
    const provider = await prisma.providers.create({
      data: {
        name: name.trim(),
        base_url: base_url.trim(),
        api_key_encrypted,
        status,
      },
      select: publicProviderSelect,
    });
    return res.status(201).json({ success: true, provider });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create provider");
  }
});

providersRouter.get("/", async (_req, res) => {
  try {
    const providers = await prisma.providers.findMany({
      select: { ...publicProviderSelect, _count: { select: { models: true } } },
    });
    return res.json({ success: true, providers });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch providers");
  }
});

providersRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    const provider = await prisma.providers.findUnique({
      where: { id },
      select: {
        ...publicProviderSelect,
        models: { include: { provider_models: true } },
      },
    });
    if (!provider) {
      return res.status(404).json({ success: false, error: "provider not found" });
    }
    return res.json({ success: true, provider });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch provider");
  }
});

providersRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, base_url, api_key_encrypted, status } = req.body;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  if (
    (name !== undefined && !isNonEmptyString(name)) ||
    (base_url !== undefined && !isNonEmptyString(base_url)) ||
    (api_key_encrypted !== undefined && !isNonEmptyString(api_key_encrypted)) ||
    (status !== undefined && !statuses.includes(status)) ||
    [name, base_url, api_key_encrypted, status].every((value) => value === undefined)
  ) {
    return res.status(400).json({ success: false, error: "no valid provider fields supplied" });
  }
  try {
    const provider = await prisma.providers.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(base_url !== undefined && { base_url: base_url.trim() }),
        ...(api_key_encrypted !== undefined && { api_key_encrypted }),
        ...(status !== undefined && { status }),
      },
      select: publicProviderSelect,
    });
    return res.json({ success: true, provider });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update provider");
  }
});

providersRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    await prisma.providers.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to delete provider");
  }
});

export default providersRouter;
