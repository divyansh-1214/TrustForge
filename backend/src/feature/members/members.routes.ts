import express from "express";

const membersRouter = express.Router();



membersRouter.get("/", async (req, res) => {
  try {
    res.status(200).json({success: true})
  } catch (error) {
    res.status(500).json({success: false, error: error})
  }
});

export default membersRouter;
