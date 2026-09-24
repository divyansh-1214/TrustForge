import express from "express";
import  prisma  from "../../config/prisma.js";
const membersRouter = express.Router();

membersRouter.post("/", async (req, res) => {
  try {
    const { organization_id, user_id, role } = req.body;

    const member = await prisma.members.create({
      data: {
        organization_id,
        user_id,
        role,
      },
    });
    res.status(201).json({ success: true, member });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

membersRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id === undefined) {
      res.status(400).json({ success: false, error: "id is required" });
      return;
    }
    const member = await prisma.members.findUnique({
      where: { id: id },
    });
    if (member === null) {
      res.status(404).json({ success: false, error: "member not found" });
      return;
    }
    res.status(200).json({ success: true, member });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

membersRouter.get("/", async (req, res) => {
  try {
    const members = await prisma.members.findMany();
    res.status(200).json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

export default membersRouter;
