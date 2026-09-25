import prisma from "../../config/prisma.js";
import { Router } from "express";

const projectsRouter = Router();

projectsRouter.get("/", async (req, res) => {
  try {
    const projects = await prisma.projects.findMany();
    res.json({ success: true, projects: projects });
  } catch (error) {
    res.json({ success: false, error: error })
  }
});


projectsRouter.post("/", async (req, res) => {
  try {
    const { organization_id, name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const project = await prisma.projects.create({
      data: {
        organization_id: organization_id,
        name: name,
        slug: slug,
      },
    });
    res.json({ success: true, project: project });
  } catch (error) {
    console.log(error)
    res.json({ success: false, error: error })
  }
});

export default projectsRouter;
