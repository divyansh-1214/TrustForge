import express from "express";
import prisma from "../../config/prisma.js";
import axios from "axios";
import { isGuardrailRule } from "../guardrailPolicies/guardrailPolicies.services.js";
import { isJsonObject, isNonEmptyString, isUuid, sendDatabaseError } from "../api.helpers.js";

const guardrailDetectionRulesRoutes = express.Router();
const safetyServiceUrl = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000";

guardrailDetectionRulesRoutes.get("/", async (req, res) => {
  try {
    const policy_id = req.query.policy_id;
    if (!isUuid(policy_id))
      return res.status(400).json({ error: "policy_id is required" });
    const rules = await prisma.guardrail_detection_rules.findMany({
      where: {
        policy_id,
      },
      orderBy: { priority: "asc" },
    });
    return res.json({ success: true, rules });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch guardrail detection rules");
  }
});

guardrailDetectionRulesRoutes.post("/", async (req, res) => {
  try {
    const policy_id = req.query.policy_id;
    if (!isUuid(policy_id))
      return res.status(400).json({ error: "policy_id is required" });
    const { prompt } = req.body;
    if (typeof prompt !== "string" || prompt.trim() === "") {
      return res.status(400).json({ success: false, error: "prompt is required" });
    }
    const rules = await prisma.guardrail_detection_rules.findMany({
      where: {
        policy_id,
        enabled: true,
      },
      orderBy: { priority: "asc" },
    });
    if (rules.length === 0) {
      return res.status(404).json({ success: false, error: "no enabled detection rules found" });
    }
    const result = await axios.post(`${safetyServiceUrl}/safety`, {
      prompt: prompt.trim(),
      rules,
    });
    return res.json({ success: true, result: result.data });
  } catch (error) {
    console.error(error);
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status ?? 502).json({
        success: false,
        error: "safety service request failed",
        details: error.response?.data,
      });
    }
    return res.status(500).json({ success: false, error: "failed to run safety rules" });
  }
});

guardrailDetectionRulesRoutes.post("/rules", async (req, res) => {
  const { policy_id, type, name, action, enabled, threshold, config, priority } = req.body;
  const rule = { type, name, action, enabled, threshold, config, priority };
  if (!isUuid(policy_id) || !isGuardrailRule(rule)) {
    return res.status(400).json({ success: false, error: "invalid detection rule fields" });
  }
  try {
    const detectionRule = await prisma.guardrail_detection_rules.create({
      data: {
        policy_id,
        type: type.trim(),
        name: name.trim(),
        action: action.trim(),
        ...(enabled !== undefined && { enabled }),
        ...(threshold !== undefined && { threshold }),
        ...(config !== undefined && { config }),
        ...(priority !== undefined && { priority }),
      },
      include: { guardrail_policies: true },
    });
    return res.status(201).json({ success: true, detectionRule });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create detection rule");
  }
});

guardrailDetectionRulesRoutes.patch("/rules/:id", async (req, res) => {
  const { id } = req.params;
  const { policy_id, type, name, action, enabled, threshold, config, priority } = req.body;
  const rule = { type, name, action, enabled, threshold, config, priority };
  if (
    !isUuid(id) ||
    (policy_id !== undefined && !isUuid(policy_id)) ||
    (type !== undefined && !isNonEmptyString(type)) ||
    (name !== undefined && !isNonEmptyString(name)) ||
    (action !== undefined && !isNonEmptyString(action)) ||
    (enabled !== undefined && typeof enabled !== "boolean") ||
    (threshold !== undefined &&
      threshold !== null &&
      (typeof threshold !== "number" || !Number.isFinite(threshold))) ||
    (config !== undefined && !isJsonObject(config)) ||
    (priority !== undefined && priority !== null && !Number.isInteger(priority)) ||
    Object.values(rule).every((value) => value === undefined) && policy_id === undefined
  ) {
    return res.status(400).json({ success: false, error: "invalid detection rule fields" });
  }
  try {
    const detectionRule = await prisma.guardrail_detection_rules.update({
      where: { id },
      data: {
        ...(policy_id !== undefined && { policy_id }),
        ...(type !== undefined && { type: type.trim() }),
        ...(name !== undefined && { name: name.trim() }),
        ...(action !== undefined && { action: action.trim() }),
        ...(enabled !== undefined && { enabled }),
        ...(threshold !== undefined && { threshold }),
        ...(config !== undefined && { config }),
        ...(priority !== undefined && { priority }),
      },
    });
    return res.json({ success: true, detectionRule });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update detection rule");
  }
});

guardrailDetectionRulesRoutes.delete("/rules/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    await prisma.guardrail_detection_rules.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to delete detection rule");
  }
});

export default guardrailDetectionRulesRoutes;
