import express from "express";
import prisma from "../../config/prisma.js";
import { isNonEmptyString, isUuid, sendDatabaseError } from "../api.helpers.js";

const providerModelsRouter = express.Router();

providerModelsRouter.post("/", async (req, res) => {
  const { alias, model_id, priority = 0, is_fallback = false } = req.body;
  if (
    !isNonEmptyString(alias) ||
    !isUuid(model_id) ||
    !Number.isInteger(priority) ||
    typeof is_fallback !== "boolean"
  ) {
    return res.status(400).json({ success: false, error: "invalid provider model fields" });
  }
  try {
    const providerModel = await prisma.provider_models.create({
      data: { alias: alias.trim(), model_id, priority, is_fallback },
      include: {
        models: { select: { id: true, name: true, model_identifier: true, provider_id: true } },
      },
    });
    return res.status(201).json({ success: true, providerModel });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create provider model alias");
  }
});

providerModelsRouter.get("/", async (req, res) => {
  const alias = req.query.alias;
  const modelId = req.query.model_id;
  if (
    (alias !== undefined && !isNonEmptyString(alias)) ||
    (modelId !== undefined && !isUuid(modelId))
  ) {
    return res.status(400).json({ success: false, error: "invalid alias or model_id filter" });
  }
  try {
    const providerModels = await prisma.provider_models.findMany({
      where: {
        ...(alias && { alias }),
        ...(modelId && { model_id: modelId }),
      },
      include: {
        models: { select: { id: true, name: true, model_identifier: true, provider_id: true } },
      },
      orderBy: [{ alias: "asc" }, { priority: "asc" }],
    });
    return res.json({ success: true, providerModels });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch provider model aliases");
  }
});

providerModelsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    const providerModel = await prisma.provider_models.findUnique({
      where: { id },
      include: {
        models: { select: { id: true, name: true, model_identifier: true, provider_id: true } },
      },
    });
    if (!providerModel) {
      return res.status(404).json({ success: false, error: "provider model alias not found" });
    }
    return res.json({ success: true, providerModel });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch provider model alias");
  }
});

providerModelsRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { alias, model_id, priority, is_fallback } = req.body;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  if (
    (alias !== undefined && !isNonEmptyString(alias)) ||
    (model_id !== undefined && !isUuid(model_id)) ||
    (priority !== undefined && !Number.isInteger(priority)) ||
    (is_fallback !== undefined && typeof is_fallback !== "boolean") ||
    [alias, model_id, priority, is_fallback].every((value) => value === undefined)
  ) {
    return res.status(400).json({ success: false, error: "invalid provider model fields" });
  }
  try {
    const providerModel = await prisma.provider_models.update({
      where: { id },
      data: {
        ...(alias !== undefined && { alias: alias.trim() }),
        ...(model_id !== undefined && { model_id }),
        ...(priority !== undefined && { priority }),
        ...(is_fallback !== undefined && { is_fallback }),
      },
      include: {
        models: { select: { id: true, name: true, model_identifier: true, provider_id: true } },
      },
    });
    return res.json({ success: true, providerModel });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update provider model alias");
  }
});

providerModelsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    await prisma.provider_models.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to delete provider model alias");
  }
});

export default providerModelsRouter;
