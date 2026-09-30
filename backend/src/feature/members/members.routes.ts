import express from "express";
import prisma from "../../config/prisma.js";
import { isUuid, sendDatabaseError } from "../api.helpers.js";

const membersRouter = express.Router();
const roles = ["owner", "admin", "developer", "viewer"] as const;

membersRouter.post("/", async (req, res) => {
  const { organization_id, user_id, role = "developer" } = req.body;
  if (!isUuid(organization_id) || !isUuid(user_id) || !roles.includes(role)) {
    return res.status(400).json({
      success: false,
      error: "valid organization_id, user_id, and role are required",
    });
  }

  try {
    const member = await prisma.members.create({
      data: { organization_id, user_id, role },
      include: { users: { select: { id: true, email: true, name: true } } },
    });
    return res.status(201).json({ success: true, member });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to add organization member");
  }
});

membersRouter.get("/", async (req, res) => {
  const organizationId = req.query.organization_id;
  const userId = req.query.user_id;
  if (
    (organizationId !== undefined && !isUuid(organizationId)) ||
    (userId !== undefined && !isUuid(userId))
  ) {
    return res.status(400).json({ success: false, error: "filters must be valid UUIDs" });
  }

  try {
    const members = await prisma.members.findMany({
      where: {
        ...(organizationId && { organization_id: organizationId }),
        ...(userId && { user_id: userId }),
      },
      include: {
        users: { select: { id: true, email: true, name: true } },
        organizations: true,
      },
    });
    return res.json({ success: true, members });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch organization members");
  }
});

membersRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }

  try {
    const member = await prisma.members.findUnique({
      where: { id },
      include: { users: { select: { id: true, email: true, name: true } }, organizations: true },
    });
    if (!member) {
      return res.status(404).json({ success: false, error: "member not found" });
    }
    return res.json({ success: true, member });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch member");
  }
});

membersRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!isUuid(id) || !roles.includes(role)) {
    return res.status(400).json({ success: false, error: "id and a valid role are required" });
  }

  try {
    const member = await prisma.members.update({
      where: { id },
      data: { role },
      include: { users: { select: { id: true, email: true, name: true } } },
    });
    return res.json({ success: true, member });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update member");
  }
});

membersRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }

  try {
    await prisma.members.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to remove member");
  }
});

export default membersRouter;
