import express from "express";
import  prisma from "../../config/prisma.js";

const organizationsRouter = express.Router();

//create the organization
organizationsRouter.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (name === undefined) {
      res.status(400).json({ success: false, error: "name is required" });
      return;
    }
    const slug = name.toLowerCase().replace(/ /g, "-");
    const organizations = await prisma.organizations.create({
      data: {
        name,
        slug,
      },
    });
    res.status(200).json({ success: true, organizations });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

//get the organization based qon the id
organizationsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id === undefined) {
      res.status(400).json({ success: false, error: "id is required" });
      return;
    }
    const organization = await prisma.organizations.findUnique({
      where: { id },
    });
    res.status(200).json({ success: true, organization: organization });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});


export default organizationsRouter;
