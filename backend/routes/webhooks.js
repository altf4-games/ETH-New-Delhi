import express from "express";
import { processActivity } from "../services/activityProcessor.js";

const router = express.Router();

// GET /api/webhook/strava - Strava webhook verification challenge
router.get("/strava", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.STRAVA_WEBHOOK_TOKEN) {
    console.log("Strava webhook verified");
    res.json({ "hub.challenge": challenge });
  } else {
    console.log("Webhook verification failed");
    res.status(403).json({ error: "Verification failed" });
  }
});

// POST /api/webhook/strava - Receive Strava webhook events
router.post("/strava", async (req, res) => {
  const event = req.body;

  console.log("Received Strava webhook:", event);

  try {
    // Only process activity create/update events
    if (
      event.object_type === "activity" &&
      (event.aspect_type === "create" || event.aspect_type === "update")
    ) {
      // Queue the activity for processing
      await processActivity({
        athleteId: event.owner_id,
        activityId: event.object_id,
        aspectType: event.aspect_type,
        eventTime: event.event_time,
      });
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Processing failed" });
  }
});

export default router;
