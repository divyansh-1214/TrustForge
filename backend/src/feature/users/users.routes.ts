import express from "express";
import { prisma } from "../../config/prisma.js";
import bcrypt from "bcrypt";
const usersRouter = express.Router();

const saltRounds = 10;
// for creating the user
usersRouter.post(
  "/",
  (req, res, next) => {
    try {
      const { password } = req.body;
      if (password === undefined) {
        res.status(400).json({ success: false, error: "password is required" });
        return;
      }
      const hashedPassword = bcrypt.hashSync(password, saltRounds);
      req.body.password = hashedPassword;
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: error });
    }
  },
  async (req, res) => {
    try {
      const { maill, password } = req.body;
      if (maill === undefined) {
        res.status(400).json({ success: false, error: "maill is required" });
        return;
      }
      const user = await prisma.user.create({
        data: {
          maill: maill,
          password: password,
        },
      });
      res.status(200).json({ success: true, user: user });
    } catch (error) {
      res.status(500).json({ success: false, error: error });
    }
  },
);

// for geting the user by there id
usersRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (id === undefined) {
      res.status(400).json({ success: false, error: "id is required" });
      return;
    }
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    if (user === null) {
      res.status(404).json({ success: false, error: "user not found" });
      return;
    }
    res.status(200).json({ success: true, user: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

export default usersRouter;
