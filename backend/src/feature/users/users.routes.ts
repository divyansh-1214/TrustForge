import express from "express";
import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { isNonEmptyString, isUuid, sendDatabaseError } from "../api.helpers.js";

const usersRouter = express.Router();
const saltRounds = 10;
const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  created_at: true,
  updated_at: true,
} as const;

usersRouter.post("/", async (req, res) => {
  const { email, password, name } = req.body;
  if (
    !isNonEmptyString(email) ||
    !isNonEmptyString(password) ||
    !isNonEmptyString(name)
  ) {
    return res.status(400).json({
      success: false,
      error: "email, password, and name are required",
    });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: "email is invalid" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = await prisma.users.create({
      data: { email: email.trim().toLowerCase(), password_hash: passwordHash, name: name.trim() },
      select: publicUserSelect,
    });
    return res.status(201).json({ success: true, user });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create user");
  }
});

usersRouter.get("/", async (_req, res) => {
  try {
    const users = await prisma.users.findMany({ select: publicUserSelect });
    return res.json({ success: true, users });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch users");
  }
});

usersRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id },
      select: { ...publicUserSelect, members: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, error: "user not found" });
    }
    return res.json({ success: true, user });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch user");
  }
});

usersRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { email, name, password } = req.body;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  if (
    (email !== undefined && !isNonEmptyString(email)) ||
    (name !== undefined && !isNonEmptyString(name)) ||
    (password !== undefined && !isNonEmptyString(password)) ||
    (email === undefined && name === undefined && password === undefined)
  ) {
    return res.status(400).json({ success: false, error: "provide a valid email, name, or password" });
  }
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: "email is invalid" });
  }

  try {
    const user = await prisma.users.update({
      where: { id },
      data: {
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(name !== undefined && { name: name.trim() }),
        ...(password !== undefined && { password_hash: await bcrypt.hash(password, saltRounds) }),
      },
      select: publicUserSelect,
    });
    return res.json({ success: true, user });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to update user");
  }
});

usersRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }

  try {
    await prisma.users.delete({ where: { id } });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error, "failed to delete user");
  }
});

export default usersRouter;
