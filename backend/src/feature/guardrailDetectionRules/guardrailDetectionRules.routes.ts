import express from "express";
import prisma from "../../config/prisma.js";

const guardrailDetectionRulesRoutes = express.Router();

guardrailDetectionRulesRoutes.get("/", async (req, res) => {
  try {
    const policy_id = req.query.policy_id
    if(!policy_id) return res.status(400).json({ error: "policy_id is required" })
    const rules = await prisma.guardrail_detection_rules.findMany({
      where: {
        policy_id: policy_id as string,
      },
    })
    console.log(rules)
    if(rules.length === 0) return res.json({"success": false, "rules": []})
    return res.json({"success": true, "rules": rules})
  } catch (error) {
    console.error(error)
    return res.status(500).json({ "success": false, error: "Internal server error" })
  }
})

export default guardrailDetectionRulesRoutes
