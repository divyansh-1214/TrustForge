import express from "express";

const organizationsRouter = express.Router();

organizationsRouter.get("/", async (req, res) => {
  try {
    res.status(200).json({success: true})
  } catch (error) {
    res.status(500).json({success: false, error: error})
  }
});

export default organizationsRouter;
