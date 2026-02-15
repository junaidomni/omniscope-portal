import { Router } from "express";
import { validateIntelligenceData, processIntelligenceData } from "./ingestion";

export const webhookRouter = Router();

/**
 * Webhook endpoint for Plaud/Fathom integration
 * This is a raw Express route (not tRPC) to handle simple POST requests from Zapier/n8n
 */
webhookRouter.post("/webhook/plaud", async (req, res) => {
  try {
    console.log("[Webhook] Received request:", JSON.stringify(req.body, null, 2));
    
    const data = validateIntelligenceData(req.body);
    
    if (!data) {
      console.error("[Webhook] Invalid data format");
      return res.status(400).json({
        success: false,
        error: "Invalid intelligence data format"
      });
    }

    const result = await processIntelligenceData(data);
    
    console.log("[Webhook] Successfully processed:", result);
    
    return res.status(200).json({
      success: true,
      meetingId: result.meetingId
    });
    
  } catch (error) {
    console.error("[Webhook] Error processing request:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
