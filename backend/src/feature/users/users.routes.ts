import express from "express";
import { prisma } from "../../config/prisma.js";
import bcrypt from "bcrypt";
const usersRouter = express.Router();

const saltRounds = 10;

usersRouter.post("/", (req, res, next) => {
  const { password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  req.body.password = hashedPassword;
  next();
}, async (req, res) => {
  try {
    const { maill, password } = req.body;
    // console.log(maill, password);
    res.status(200).json({success: true})
  } catch (error) {
    res.status(500).json({success: false, error: error})
  }
});

export default usersRouter;
