import { Router } from "express";
import { validateIntelligenceData, processIntelligenceData } from "./ingestion";
import { isFathomWebhookPayload, processFathomWebhook } from "./fathomIntegration";
import { generateMeetingPDF, generateDailyBriefPDF } from "./pdfGenerator";
import * as db from "./db";

export const webhookRouter = Router();

/**
 * PDF download endpoint for meeting reports
 * GET /api/meeting/:id/pdf
 */
webhookRouter.get("/meeting/:id/pdf", async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    if (isNaN(meetingId)) {
      return res.status(400).json({ error: "Invalid meeting ID" });
    }

    const pdfBuffer = await generateMeetingPDF(meetingId);
    
    // Build descriptive filename: "OmniScope Intelligence Report - [Meeting Name] - [Date].pdf"
    const meeting = await db.getMeetingById(meetingId);
    const meetingName = (meeting?.meetingTitle || "Meeting").trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, ' ').trim();
    const meetingDate = meeting?.meetingDate 
      ? new Date(meeting.meetingDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];
    const filename = `OmniScope Intelligence Report - ${meetingName} - ${meetingDate}.pdf`;
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[PDF] Error generating PDF:", error);
    if (error instanceof Error && error.message === "Meeting not found") {
      return res.status(404).json({ error: "Meeting not found" });
    }
    return res.status(500).json({ error: "Failed to generate PDF" });
  }
});

/**
 * PDF download endpoint for daily brief
 * GET /api/daily-brief/pdf?date=YYYY-MM-DD
 */
webhookRouter.get("/daily-brief/pdf", async (req, res) => {
  try {
    const dateStr = req.query.date as string;
    const date = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    const pdfBuffer = await generateDailyBriefPDF(date);
    const filename = `omniscope-daily-brief-${date.toISOString().split("T")[0]}.pdf`;
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[PDF] Error generating daily brief PDF:", error);
    return res.status(500).json({ error: "Failed to generate daily brief PDF" });
  }
});

/**
 * Webhook endpoint for Plaud integration via Zapier
 * Receives Plaud recording data: sourceId, meetingDate, primaryLead, participants, executiveSummary, transcript, tags
 */
webhookRouter.post("/webhook/plaud", async (req, res) => {
  try {
    console.log("[Webhook:Plaud] Received payload:", JSON.stringify(req.body, null, 2));
    
    const payload = req.body;
    
    // Validate required fields from Zapier Plaud format
    if (!payload.sourceId || !payload.meetingDate || !payload.executiveSummary) {
      console.error("[Webhook:Plaud] Missing required fields");
      return res.status(400).json({
        success: false,
        error: "Missing required fields: sourceId, meetingDate, executiveSummary"
      });
    }

    // Extract meeting title from Plaud title field or generate from participants
    const meetingTitle = payload.plaud?.title || 
                        (payload.participants ? `Meeting with ${payload.participants}` : "Plaud Recording");

    // Transform Zapier Plaud format to OmniScope intelligence format
    const intelligenceData = {
      sourceId: payload.sourceId,
      sourceType: "plaud" as const,
      meetingTitle,
      meetingDate: payload.meetingDate,
      primaryLead: payload.primaryLead || "Unknown",
      participants: payload.participants || [],
      executiveSummary: payload.executiveSummary,
      transcript: payload.transcript || "",
      tags: payload.tags || ["plaud"],
      // Optional fields
      strategicHighlights: [],
      opportunities: [],
      risks: [],
      keyQuotes: [],
      actionItems: [],
      organizations: [],
      jurisdictions: [],
    };

    // Process through standard ingestion pipeline
    const result = await processIntelligenceData(intelligenceData);
    
    return res.status(200).json({
      success: true,
      meetingId: result.meetingId,
      message: "Plaud recording imported successfully"
    });
    
  } catch (error) {
    console.error("[Webhook:Plaud] Error processing request:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Webhook endpoint for Fathom integration
 * Receives raw Fathom meeting data, processes it through LLM analysis,
 * and ingests it into the OmniScope intelligence database
 */
webhookRouter.post("/webhook/fathom", async (req, res) => {
  try {
    // Validate it looks like a Fathom payload
    if (!isFathomWebhookPayload(req.body)) {
      console.error("[Webhook:Fathom] Invalid Fathom payload");
      return res.status(400).json({
        success: false,
        error: "Invalid Fathom webhook payload"
      });
    }

    // Process through the Fathom integration pipeline (LLM analysis + ingestion)
    const result = await processFathomWebhook(req.body);
    
    return res.status(200).json({
      success: result.success,
      meetingId: result.meetingId,
      reason: result.reason,
    });
    
  } catch (error) {
    console.error("[Webhook:Fathom] Error processing request:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Universal webhook endpoint - auto-detects source
 * Tries Fathom first, falls back to standard intelligence data format
 */
webhookRouter.post("/webhook/ingest", async (req, res) => {
  try {
    // Try Fathom format first
    if (isFathomWebhookPayload(req.body)) {

      const result = await processFathomWebhook(req.body);
      return res.status(200).json({
        success: result.success,
        meetingId: result.meetingId,
        source: "fathom",
      });
    }

    // Fall back to standard intelligence data format
    const data = validateIntelligenceData(req.body);
    if (data) {

      const result = await processIntelligenceData(data);
      return res.status(200).json({
        success: result.success,
        meetingId: result.meetingId,
        source: "standard",
      });
    }

    return res.status(400).json({
      success: false,
      error: "Unrecognized webhook payload format"
    });
    
  } catch (error) {
    console.error("[Webhook:Ingest] Error processing request:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Health check endpoint for webhook verification
 */
webhookRouter.get("/webhook/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "OmniScope Intelligence Portal",
    webhooks: {
      plaud: "/api/webhook/plaud",
      fathom: "/api/webhook/fathom",
      universal: "/api/webhook/ingest",
    },
    timestamp: new Date().toISOString(),
  });
});
