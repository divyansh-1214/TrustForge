import express from "express";
import prisma from "../../config/prisma.js";
import { isRecord,isGuardrailRule, isGuardrailRuleArray } from "./guardrailPolicies.services.js";

const guardrailPoliciesRouter = express.Router();

guardrailPoliciesRouter.post("/", async (req, res) => {
  if (!isRecord(req.body)) {
    res.status(400).json({ success: false, error: "request body must be a JSON object" });
    return;
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

  if (typeof organization_id !== "string" || organization_id.trim() === "") {
    res.status(400).json({ success: false, error: "organization_id is required" });
    return;
  }

  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ success: false, error: "name is required" });
    return;
  }

  if (description !== undefined && description !== null && typeof description !== "string") {
    res.status(400).json({
      success: false,
      error: "description must be a string or null",
    });
    return;
  }

  if (enabled !== undefined && typeof enabled !== "boolean") {
    res.status(400).json({
      success: false,
      error: "enabled must be a boolean",
    });
    return;
  }

  if (
    project_id !== undefined &&
    project_id !== null &&
    (typeof project_id !== "string" || project_id.trim() === "")
  ) {
    res.status(400).json({
      success: false,
      error: "project_id must be a non-empty string or null",
    });
    return;
  }

  if (
    guardrail_detection_rules !== undefined &&
    !isGuardrailRuleArray(guardrail_detection_rules)
  ) {
    res.status(400).json({
      success: false,
      error: "guardrail_detection_rules must be an array of valid detection rules",
    });
    return;
  }

  if (
    guardrail_transformation_rules !== undefined &&
    (!isGuardrailRuleArray(guardrail_transformation_rules) ||
      guardrail_transformation_rules.some((rule) => rule.threshold !== undefined))
  ) {
    res.status(400).json({
      success: false,
      error: "guardrail_transformation_rules must be an array of valid transformation rules without threshold",
    });
    return;
  }

  try {
    const guardrailPolicy = await prisma.guardrail_policies.create({
      data: {
        organization_id,
        project_id: project_id ?? null,
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

    res.status(201).json({ success: true, guardrailPolicy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "failed to create guardrail policy" });
  }
});


guardrailPoliciesRouter.get("/", async (req, res) => {
  try {
    const organization_id = req.query.organization_id as string;
    const guardrailPolicies = await prisma.guardrail_policies.findMany({
      where: { organization_id },
    });
    res.status(200).json({ success: true, guardrailPolicies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "failed to fetch guardrail policies" });
  }
});

guardrailPoliciesRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const guardrailPolicy = await prisma.guardrail_policies.findUnique({
      where: { id },
    });
    if (!guardrailPolicy) {
      res.status(404).json({ success: false, error: "guardrail policy not found" });
      return;
    }
    res.status(200).json({ success: true, guardrailPolicy: guardrailPolicy });
  } catch(error) {
    console.log(error)
  }
})


export default guardrailPoliciesRouter;
