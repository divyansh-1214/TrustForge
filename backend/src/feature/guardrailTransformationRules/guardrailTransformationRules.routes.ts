import express from "express";
import prisma from "../../config/prisma.js";
import { isGuardrailRule } from "../guardrailPolicies/guardrailPolicies.services.js";
import { isJsonObject, isNonEmptyString, isUuid, sendDatabaseError } from "../api.helpers.js";

const transformationRulesRouter = express.Router();

transformationRulesRouter.post("/", async (req, res) => {
  const { policy_id, type, name, action, enabled, config, priority } = req.body;
  const rule = { type, name, action, enabled, config, priority };
  if (!isUuid(policy_id) || !isGuardrailRule(rule)) {
    return res.status(400).json({ success: false, error: "invalid transformation rule fields" });
  }
  try {
    const transformationRule = await prisma.guardrail_transformation_rules.create({
      data: {
        policy_id,
        type: type.trim(),
        name: name.trim(),
        action: action.trim(),
        ...(enabled !== undefined && { enabled }),
        ...(config !== undefined && { config }),
        ...(priority !== undefined && { priority }),
      },
      include: { guardrail_policies: true },
    });
    return res.status(201).json({ success: true, transformationRule });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create transformation rule");
  }
});

transformationRulesRouter.get("/", async (req, res) => {
  const policyId = req.query.policy_id;
  if (policyId !== undefined && !isUuid(policyId)) {
    return res.status(400).json({ success: false, error: "policy_id must be a valid UUID" });
  }
  try {
    const transformationRules = await prisma.guardrail_transformation_rules.findMany({
      where: policyId ? { policy_id: policyId } : undefined,
      include: { guardrail_policies: true },
      orderBy: { priority: "asc" },
    });
    return res.json({ success: true, transformationRules });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch transformation rules");
  }
});

transformationRulesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    const transformationRule = await prisma.guardrail_transformation_rules.findUnique({
      where: { id },
      include: { guardrail_policies: true },
    });
    if (!transformationRule) {
      return res.status(404).json({ success: false, error: "transformation rule not found" });
    }
    return res.json({ success: true, transformationRule });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch transformation rule");
  }
});

transformationRulesRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { policy_id, type, name, action, enabled, config, priority, threshold } = req.body;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  if (
    threshold !== undefined ||
    (policy_id !== undefined && !isUuid(policy_id)) ||
    (type !== undefined && !isNonEmptyString(type)) ||
    (name !== undefined && !isNonEmptyString(name)) ||
    (action !== undefined && !isNonEmptyString(action)) ||
    (enabled !== undefined && typeof enabled !== "boolean") ||
    (config !== undefined && !isJsonObject(config)) ||
    (priority !== undefined && priority !== null && !Number.isInteger(priority)) ||
    [policy_id, type, name, action, enabled, config, priority].every((value) => value === undefined)
  ) {
    return res.status(400).json({ success: false, error: "invalid transformation rule fields" });
  }
  try {
    const transformationRule = await prisma.guardrail_transformation_rules.update({
      where: { id },
      data: {
        ...(policy_id !== undefined && { policy_id }),
        ...(type !== undefined && { type: type.trim() }),
        ...(name !== undefined && { name: name.trim() }),
        ...(action !== undefined && { action: action.trim() }),
        ...(enabled !== undefined && { enabled }),
        ...(config !== undefined && { config }),
        ...(priority !== undefined && { priority }),
      },
    });
    return res.json({ success: true, transformationRule });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update transformation rule");
  }
});

transformationRulesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    await prisma.guardrail_transformation_rules.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to delete transformation rule");
  }
});

export default transformationRulesRouter;
