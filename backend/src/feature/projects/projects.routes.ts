import express from "express";
import prisma from "../../config/prisma.js";
import { isNonEmptyString, isUuid, sendDatabaseError } from "../api.helpers.js";

const projectsRouter = express.Router();

projectsRouter.get("/", async (req, res) => {
  const organizationId = req.query.organization_id;
  if (organizationId !== undefined && !isUuid(organizationId)) {
    return res.status(400).json({ success: false, error: "organization_id must be a valid UUID" });
  }

  try {
    const projects = await prisma.projects.findMany({
      where: organizationId ? { organization_id: organizationId } : undefined,
      include: { organizations: true },
    });
    return res.json({ success: true, projects });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch projects");
  }
});

projectsRouter.post("/", async (req, res) => {
  const { organization_id, name, slug: requestedSlug } = req.body;
  if (!isUuid(organization_id) || !isNonEmptyString(name)) {
    return res.status(400).json({
      success: false,
      error: "organization_id and name are required",
    });
  }
  if (requestedSlug !== undefined && !isNonEmptyString(requestedSlug)) {
    return res.status(400).json({ success: false, error: "slug must be a non-empty string" });
  }

  try {
    const slug =
      requestedSlug?.trim().toLowerCase().replace(/\s+/g, "-") ??
      name.trim().toLowerCase().replace(/\s+/g, "-");
    const project = await prisma.projects.create({
      data: { organization_id, name: name.trim(), slug },
      include: { organizations: true },
    });
    return res.status(201).json({ success: true, project });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create project");
  }
});

projectsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }

  try {
    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        organizations: true,
        guardrail_policies: {
          include: {
            guardrail_detection_rules: true,
            guardrail_transformation_rules: true,
          },
        },
        routing_rules: true,
      },
    });
    if (!project) {
      return res.status(404).json({ success: false, error: "project not found" });
    }
    return res.json({ success: true, project });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch project");
  }
});

projectsRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, slug } = req.body;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  if (
    (name !== undefined && !isNonEmptyString(name)) ||
    (slug !== undefined && !isNonEmptyString(slug)) ||
    (name === undefined && slug === undefined)
  ) {
    return res.status(400).json({ success: false, error: "provide a non-empty name or slug" });
  }

  try {
    const project = await prisma.projects.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && {
          slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        }),
        ...(slug === undefined && name !== undefined && {
          slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
        }),
      },
      include: { organizations: true },
    });
    return res.json({ success: true, project });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update project");
  }
});

projectsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const policy = await transaction.guardrail_policies.findUnique({
        where: { project_id: id },
        select: { id: true },
      });
      if (policy) {
        await transaction.guardrail_events.deleteMany({
          where: { guardrail_policy_id: policy.id },
        });
        await transaction.guardrail_detection_rules.deleteMany({
          where: { policy_id: policy.id },
        });
        await transaction.guardrail_transformation_rules.deleteMany({
          where: { policy_id: policy.id },
        });
        await transaction.guardrail_policies.delete({ where: { id: policy.id } });
      }
      await transaction.projects.delete({ where: { id } });
    });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to delete project");
  }
});

export default projectsRouter;
