import express from "express";
import prisma from "../../config/prisma.js";
import { isNonEmptyString, isUuid, sendDatabaseError } from "../api.helpers.js";

const organizationsRouter = express.Router();

organizationsRouter.post("/", async (req, res) => {
  const { name } = req.body;
  if (!isNonEmptyString(name)) {
    return res.status(400).json({ success: false, error: "name is required" });
  }

  try {
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
    const organization = await prisma.organizations.create({
      data: { name: name.trim(), slug },
    });
    return res.status(201).json({ success: true, organization });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create organization");
  }
});

organizationsRouter.get("/", async (_req, res) => {
  try {
    const organizations = await prisma.organizations.findMany({
      include: { projects: true, members: true },
    });
    return res.json({ success: true, organizations });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch organizations");
  }
});

organizationsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }

  try {
    const organization = await prisma.organizations.findUnique({
      where: { id },
      include: {
        projects: true,
        members: {
          include: {
            users: { select: { id: true, email: true, name: true, created_at: true } },
          },
        },
        api_keys: {
          select: {
            id: true,
            name: true,
            key_prefix: true,
            project_id: true,
            status: true,
            rate_limit_per_min: true,
            created_at: true,
            expires_at: true,
          },
        },
      },
    });
    if (!organization) {
      return res.status(404).json({ success: false, error: "organization not found" });
    }
    return res.json({ success: true, organization });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch organization");
  }
});

organizationsRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!isUuid(id) || !isNonEmptyString(name)) {
    return res.status(400).json({
      success: false,
      error: "a valid id and non-empty name are required",
    });
  }

  try {
    const organization = await prisma.organizations.update({
      where: { id },
      data: {
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
      },
    });
    return res.json({ success: true, organization });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update organization");
  }
});

organizationsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const policies = await transaction.guardrail_policies.findMany({
        where: { organization_id: id },
        select: { id: true },
      });
      const policyIds = policies.map((policy) => policy.id);
      await transaction.guardrail_events.deleteMany({
        where: { guardrail_policy_id: { in: policyIds } },
      });
      await transaction.guardrail_detection_rules.deleteMany({
        where: { policy_id: { in: policyIds } },
      });
      await transaction.guardrail_transformation_rules.deleteMany({
        where: { policy_id: { in: policyIds } },
      });
      await transaction.guardrail_policies.deleteMany({ where: { organization_id: id } });
      await transaction.organizations.delete({ where: { id } });
    });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to delete organization");
  }
});

export default organizationsRouter;
