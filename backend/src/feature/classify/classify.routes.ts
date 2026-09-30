import axios from "axios";
import express from "express";
import prisma from "../../config/prisma.js";
import { isUuid, sendDatabaseError } from "../api.helpers.js";

const classifyRoutes = express.Router();
const safetyServiceUrl = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8000";

classifyRoutes.post("/", async (req, res) => {
  const { text, policy_id } = req.body;
  if (typeof text !== "string" || text.trim() === "" || !isUuid(policy_id)) {
    return res.status(400).json({
      success: false,
      error: "non-empty text and a valid policy_id are required",
    });
  }

  try {
    const rules = await prisma.guardrail_detection_rules.findMany({
      where: { policy_id, enabled: true },
      orderBy: { priority: "asc" },
    });
    if (rules.length === 0) {
      return res.status(404).json({ success: false, error: "no enabled detection rules found" });
    }

    const result = await axios.post(`${safetyServiceUrl}/safety`, {
      prompt: text.trim(),
      rules,
    });
    return res.json({ success: true, result: result.data });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("safety service request failed", error);
      return res.status(error.response?.status ?? 502).json({
        success: false,
        error: "safety service request failed",
        details: error.response?.data,
      });
    }
    return sendDatabaseError(res, error, "failed to classify text");
  }
});

export default classifyRoutes;
