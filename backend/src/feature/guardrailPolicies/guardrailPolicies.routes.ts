import express from "express";
import prisma from "../../config/prisma.js";

const guardrailPoliciesRouter = express.Router();

guardrailPoliciesRouter.post("/", async (req, res) => {
  const { organization_id, project_id, name, rules, enable, enabled } = req.body;

  if (typeof organization_id !== "string" || organization_id.trim() === "") {
    res.status(400).json({ success: false, error: "organization_id is required" });
    return;
  }

  if (typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ success: false, error: "name is required" });
    return;
  }

  if (
    rules === null ||
    typeof rules !== "object" ||
    Array.isArray(rules)
  ) {
    res.status(400).json({
      success: false,
      error: "rules must be a JSON object",
    });
    return;
  }

  const policyEnabled = enabled ?? enable;
  if (typeof policyEnabled !== "boolean") {
    res.status(400).json({
      success: false,
      error: "enable is required and must be a boolean",
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

  try {
    const guardrailPolicy = await prisma.guardrail_policies.create({
      data: {
        organization_id: organization_id,
        project_id: project_id ?? null,
        name: name.trim(),
        rules,
        enabled: policyEnabled,
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
    const guardrailPolicies = await prisma.guardrail_policies.findMany();
    res.status(200).json({ success: true, guardrailPolicies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "failed to fetch guardrail policies" });
  }
});
export default guardrailPoliciesRouter;
