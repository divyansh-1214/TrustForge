import express from "express";
import prisma from "../../config/prisma.js";
import { isJsonObject, isUuid, sendDatabaseError } from "../api.helpers.js";

const guardrailEventsRouter = express.Router();
const actions = ["allow", "block", "redact", "flag"] as const;

guardrailEventsRouter.post("/", async (req, res) => {
  const {
    request_id,
    guardrail_policy_id = null,
    stage,
    rule_triggered,
    action,
    detail = {},
  } = req.body;
  if (
    !isUuid(request_id) ||
    (guardrail_policy_id !== null && !isUuid(guardrail_policy_id)) ||
    typeof stage !== "string" ||
    stage.trim() === "" ||
    typeof rule_triggered !== "string" ||
    rule_triggered.trim() === "" ||
    !actions.includes(action) ||
    !isJsonObject(detail)
  ) {
    return res.status(400).json({ success: false, error: "invalid guardrail event fields" });
  }
  try {
    const event = await prisma.guardrail_events.create({
      data: {
        request_id,
        guardrail_policy_id,
        stage: stage.trim(),
        rule_triggered: rule_triggered.trim(),
        action,
        detail,
      },
      include: { guardrail_policies: true },
    });
    return res.status(201).json({ success: true, event });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to create guardrail event");
  }
});

guardrailEventsRouter.get("/", async (req, res) => {
  const { request_id, guardrail_policy_id, action } = req.query;
  if (
    (request_id !== undefined && !isUuid(request_id)) ||
    (guardrail_policy_id !== undefined && !isUuid(guardrail_policy_id)) ||
    (action !== undefined && !actions.includes(action as (typeof actions)[number]))
  ) {
    return res.status(400).json({ success: false, error: "invalid guardrail event filters" });
  }
  try {
    const events = await prisma.guardrail_events.findMany({
      where: {
        ...(request_id && { request_id: request_id as string }),
        ...(guardrail_policy_id && { guardrail_policy_id: guardrail_policy_id as string }),
        ...(action && { action: action as (typeof actions)[number] }),
      },
      include: { guardrail_policies: true },
      orderBy: { created_at: "desc" },
      take: 500,
    });
    return res.json({ success: true, events });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch guardrail events");
  }
});

guardrailEventsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!isUuid(id)) {
    return res.status(400).json({ success: false, error: "id must be a valid UUID" });
  }
  try {
    const event = await prisma.guardrail_events.findUnique({
      where: { id },
      include: { guardrail_policies: true },
    });
    if (!event) {
      return res.status(404).json({ success: false, error: "guardrail event not found" });
    }
    return res.json({ success: true, event });
  } catch (error) {
    return sendDatabaseError(res, error, "failed to fetch guardrail event");
  }
});

export default guardrailEventsRouter;
