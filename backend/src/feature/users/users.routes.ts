import express from "express";
import  prisma  from "../../config/prisma.js";
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
      const { email, password, name } = req.body;
      if (email === undefined) {
        res.status(400).json({ success: false, error: "email is required" });
        return;
      }
      if (name === undefined) {
        res.status(400).json({ success: false, error: "name is required" });
        return;
      }
      const user = await prisma.users.create({
        data: {
          email: email,
          password_hash: password,
          name: name,
        },
      });
      res.status(200).json({ success: true, user: user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: error });
    }
  },
);

usersRouter.get("/", async (req, res) => {
  try {
    const users = await prisma.users.findMany();
    res.status(200).json({ success: true, users: users });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error });
  }
})

// for geting the user by there id
usersRouter.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (id === undefined) {
      res.status(400).json({ success: false, error: "id is required" });
      return;
    }
    const user = await prisma.users.findUnique({
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
