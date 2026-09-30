import express from "express";
import prisma from "../../config/prisma.js";
import {
  isNonEmptyString,
  isJsonObject,
  isUuid,
  sendDatabaseError,
} from "../api.helpers.js";

const routingRulesRouter = express.Router();

async function projectBelongsToOrganization(projectId: string, organizationId: string) {
  const project = await prisma.projects.findUnique({
    where: { id: projectId },
    select: { organization_id: true },
  });
  return project?.organization_id === organizationId;
}

routingRulesRouter.post("/", async (req, res) => {
  const {
    organization_id,
    project_id,
    name,
    conditions = {},
    target_model_id,
    fallback_model_id,
    priority = 0,
    enabled = true,
  } = req.body;
  if (
    !isUuid(organization_id) ||
    !isUuid(project_id) ||
    !isNonEmptyString(name) ||
    !isJsonObject(conditions) ||
    (target_model_id !== undefined && target_model_id !== null && !isUuid(target_model_id)) ||
    (fallback_model_id !== undefined && fallback_model_id !== null && !isUuid(fallback_model_id)) ||
    !Number.isInteger(priority) ||
    typeof enabled !== "boolean"
  ) {
    return res.status(400).json({ success: false, error: "invalid routing rule fields" });
  }
  try {
    if (!(await projectBelongsToOrganization(project_id, organization_id))) {
      return res.status(400).json({
        success: false,
        error: "project must belong to the specified organization",
      });
    }
    const routingRule = await prisma.routing_rules.create({
      data: {
        organization_id,
        project_id,
        name: name.trim(),
        conditions,
        target_model_id: target_model_id ?? null,
        fallback_model_id: fallback_model_id ?? null,
        priority,
        enabled,
      },
      include: {
        organizations: true,
        projects: true,
        models_routing_rules_target_model_idTomodels: true,
        models_routing_rules_fallback_model_idTomodels: true,
      },
    });
    return res.status(201).json({ success: true, routingRule });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create routing rule");
  }
});

routingRulesRouter.get("/", async (req, res) => {
  const organizationId = req.query.organization_id;
  const projectId = req.query.project_id;
  if (
    (organizationId !== undefined && !isUuid(organizationId)) ||
    (projectId !== undefined && !isUuid(projectId))
  ) {
    return res.status(400).json({ success: false, error: "filters must be valid UUIDs" });
  }
  try {
    const routingRules = await prisma.routing_rules.findMany({
      where: {
        ...(organizationId && { organization_id: organizationId }),
        ...(projectId && { project_id: projectId }),
      },
      include: {
        organizations: true,
        projects: true,
        models_routing_rules_target_model_idTomodels: true,
        models_routing_rules_fallback_model_idTomodels: true,
      },
      orderBy: [{ priority: "asc" }, { created_at: "asc" }],
    });
    return res.json({ success: true, routingRules });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch routing rules");
  }
});

routingRulesRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    const routingRule = await prisma.routing_rules.findUnique({
      where: { id },
      include: {
        organizations: true,
        projects: true,
        models_routing_rules_target_model_idTomodels: true,
        models_routing_rules_fallback_model_idTomodels: true,
      },
    });
    if (!routingRule) {
      return res.status(404).json({ success: false, error: "routing rule not found" });
    }
    return res.json({ success: true, routingRule });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch routing rule");
  }
});

routingRulesRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    organization_id,
    project_id,
    name,
    conditions,
    target_model_id,
    fallback_model_id,
    priority,
    enabled,
  } = req.body;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  if (
    (organization_id !== undefined && !isUuid(organization_id)) ||
    (project_id !== undefined && !isUuid(project_id)) ||
    (name !== undefined && !isNonEmptyString(name)) ||
    (conditions !== undefined && !isJsonObject(conditions)) ||
    (target_model_id !== undefined && target_model_id !== null && !isUuid(target_model_id)) ||
    (fallback_model_id !== undefined && fallback_model_id !== null && !isUuid(fallback_model_id)) ||
    (priority !== undefined && !Number.isInteger(priority)) ||
    (enabled !== undefined && typeof enabled !== "boolean") ||
    [
      organization_id,
      project_id,
      name,
      conditions,
      target_model_id,
      fallback_model_id,
      priority,
      enabled,
    ].every((value) => value === undefined)
  ) {
    return res.status(400).json({ success: false, error: "invalid routing rule fields" });
  }
  try {
    const current = await prisma.routing_rules.findUnique({
      where: { id },
      select: { organization_id: true, project_id: true },
    });
    if (!current) {
      return res.status(404).json({ success: false, error: "routing rule not found" });
    }
    const nextOrganizationId = organization_id ?? current.organization_id;
    const nextProjectId = project_id ?? current.project_id;
    if (!(await projectBelongsToOrganization(nextProjectId, nextOrganizationId))) {
      return res.status(400).json({
        success: false,
        error: "project must belong to the specified organization",
      });
    }
    const routingRule = await prisma.routing_rules.update({
      where: { id },
      data: {
        ...(organization_id !== undefined && { organization_id }),
        ...(project_id !== undefined && { project_id }),
        ...(name !== undefined && { name: name.trim() }),
        ...(conditions !== undefined && { conditions }),
        ...(target_model_id !== undefined && { target_model_id }),
        ...(fallback_model_id !== undefined && { fallback_model_id }),
        ...(priority !== undefined && { priority }),
        ...(enabled !== undefined && { enabled }),
      },
      include: {
        organizations: true,
        projects: true,
        models_routing_rules_target_model_idTomodels: true,
        models_routing_rules_fallback_model_idTomodels: true,
      },
    });
    return res.json({ success: true, routingRule });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update routing rule");
  }
});

routingRulesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    await prisma.routing_rules.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to delete routing rule");
  }
});

export default routingRulesRouter;
