import express from "express";
import prisma from "../../config/prisma.js";
import { isGuardrailRuleArray, isRecord } from "./guardrailPolicies.services.js";
import {
  isNonEmptyString,
  isUuid,
  sendDatabaseError,
} from "../api.helpers.js";

const guardrailPoliciesRouter = express.Router();

guardrailPoliciesRouter.post("/", async (req, res) => {
  if (!isRecord(req.body)) {
    return res.status(400).json({ success: false, error: "request body must be a JSON object" });
  }

  const {
    organization_id,
    project_id,
    name,
    description,
    enabled,
    guardrail_detection_rules,
    guardrail_transformation_rules,
  } = req.body;

  if (!isUuid(organization_id) || !isUuid(project_id)) {
    return res.status(400).json({
      success: false,
      error: "valid organization_id and project_id are required",
    });
  }
  if (!isNonEmptyString(name)) {
    return res.status(400).json({ success: false, error: "name is required" });
  }
  if (description !== undefined && description !== null && typeof description !== "string") {
    return res.status(400).json({ success: false, error: "description must be a string or null" });
  }
  if (enabled !== undefined && typeof enabled !== "boolean") {
    return res.status(400).json({ success: false, error: "enabled must be a boolean" });
  }
  if (
    guardrail_detection_rules !== undefined &&
    !isGuardrailRuleArray(guardrail_detection_rules)
  ) {
    return res.status(400).json({
      success: false,
      error: "guardrail_detection_rules must be an array of valid detection rules",
    });
  }
  if (
    guardrail_transformation_rules !== undefined &&
    (!isGuardrailRuleArray(guardrail_transformation_rules) ||
      guardrail_transformation_rules.some((rule) => rule.threshold !== undefined))
  ) {
    return res.status(400).json({
      success: false,
      error: "guardrail_transformation_rules must be valid transformation rules without threshold",
    });
  }

  try {
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

    const guardrailPolicy = await prisma.guardrail_policies.create({
      data: {
        organization_id,
        project_id,
        name: name.trim(),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled }),
        ...(guardrail_detection_rules !== undefined && {
          guardrail_detection_rules: {
            create: guardrail_detection_rules.map((rule) => ({
              type: rule.type.trim(),
              name: rule.name.trim(),
              action: rule.action.trim(),
              ...(rule.enabled !== undefined && { enabled: rule.enabled }),
              ...(rule.threshold !== undefined && { threshold: rule.threshold }),
              ...(rule.config !== undefined && { config: rule.config }),
              ...(rule.priority !== undefined && { priority: rule.priority }),
            })),
          },
        }),
        ...(guardrail_transformation_rules !== undefined && {
          guardrail_transformation_rules: {
            create: guardrail_transformation_rules.map((rule) => ({
              type: rule.type.trim(),
              name: rule.name.trim(),
              action: rule.action.trim(),
              ...(rule.enabled !== undefined && { enabled: rule.enabled }),
              ...(rule.config !== undefined && { config: rule.config }),
              ...(rule.priority !== undefined && { priority: rule.priority }),
            })),
          },
        }),
      },
      include: {
        guardrail_detection_rules: true,
        guardrail_transformation_rules: true,
      },
    });
    return res.status(201).json({ success: true, guardrailPolicy });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create guardrail policy");
  }
});

guardrailPoliciesRouter.get("/", async (req, res) => {
  const organizationId = req.query.organization_id;
  const projectId = req.query.project_id;
  if (
    (organizationId !== undefined && !isUuid(organizationId)) ||
    (projectId !== undefined && !isUuid(projectId))
  ) {
    return res.status(400).json({ success: false, error: "filters must be valid UUIDs" });
  }

  try {
    const guardrailPolicies = await prisma.guardrail_policies.findMany({
      where: {
        ...(organizationId && { organization_id: organizationId }),
        ...(projectId && { project_id: projectId }),
      },
      include: {
        guardrail_detection_rules: true,
        guardrail_transformation_rules: true,
      },
    });
    return res.json({ success: true, guardrailPolicies });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch guardrail policies");
  }
});

guardrailPoliciesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }

  try {
    const guardrailPolicy = await prisma.guardrail_policies.findUnique({
      where: { id },
      include: {
        organizations: true,
        projects: true,
        guardrail_detection_rules: true,
        guardrail_transformation_rules: true,
        guardrail_events: true,
      },
    });
    if (!guardrailPolicy) {
      return res.status(404).json({ success: false, error: "guardrail policy not found" });
    }
    return res.json({ success: true, guardrailPolicy });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch guardrail policy");
  }
});

guardrailPoliciesRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, enabled } = req.body;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  if (
    (name !== undefined && !isNonEmptyString(name)) ||
    (description !== undefined && description !== null && typeof description !== "string") ||
    (enabled !== undefined && typeof enabled !== "boolean") ||
    (name === undefined && description === undefined && enabled === undefined)
  ) {
    return res.status(400).json({ success: false, error: "no valid policy fields supplied" });
  }

  try {
    const guardrailPolicy = await prisma.guardrail_policies.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled }),
      },
      include: {
        guardrail_detection_rules: true,
        guardrail_transformation_rules: true,
      },
    });
    return res.json({ success: true, guardrailPolicy });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update guardrail policy");
  }
});

guardrailPoliciesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.guardrail_events.deleteMany({ where: { guardrail_policy_id: id } });
      await transaction.guardrail_detection_rules.deleteMany({ where: { policy_id: id } });
      await transaction.guardrail_transformation_rules.deleteMany({ where: { policy_id: id } });
      await transaction.guardrail_policies.delete({ where: { id } });
    });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to delete guardrail policy");
  }
});

export default guardrailPoliciesRouter;
