import { invokeLLM } from "./_core/llm";
import { processIntelligenceData, type IntelligenceData } from "./ingestion";

const FATHOM_API_BASE = "https://api.fathom.ai/external/v1";

/**
 * Fathom webhook payload types
 */
interface FathomSpeaker {
  display_name: string;
  matched_calendar_invitee_email?: string;
}

interface FathomTranscriptEntry {
  speaker: FathomSpeaker;
  text: string;
  timestamp: string;
}

interface FathomActionItem {
  description: string;
  user_generated: boolean;
  completed: boolean;
  recording_timestamp?: string;
  recording_playback_url?: string;
  assignee?: {
    name: string;
    email?: string;
    team?: string;
  };
}

interface FathomCalendarInvitee {
  name: string;
  matched_speaker_display_name?: string;
  email: string;
  is_external: boolean;
  email_domain: string;
}

interface FathomWebhookPayload {
  title?: string;
  meeting_title?: string;
  url?: string;
  share_url?: string;
  created_at?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  recording_start_time?: string;
  recording_end_time?: string;
  recording_id?: number;
  calendar_invitees_domains_type?: string;
  transcript?: FathomTranscriptEntry[] | null;
  default_summary?: {
    template_name: string;
    markdown_formatted: string;
  } | null;
  action_items?: FathomActionItem[] | null;
  calendar_invitees?: FathomCalendarInvitee[];
  recorded_by?: {
    name: string;
    email: string;
    email_domain?: string;
    team?: string;
  };
  crm_matches?: any;
}

/**
 * Validate that a payload looks like a Fathom webhook
 */
export function isFathomWebhookPayload(data: any): data is FathomWebhookPayload {
  return Boolean(
    data &&
    typeof data === "object" &&
    (data.title || data.meeting_title) &&
    (data.recorded_by || data.calendar_invitees || data.share_url)
  );
}

/**
 * Build a flat transcript string from Fathom's structured transcript array
 */
function buildTranscriptText(transcript: FathomTranscriptEntry[]): string {
  return transcript
    .map((entry) => `[${entry.timestamp}] ${entry.speaker.display_name}: ${entry.text}`)
    .join("\n");
}

/**
 * Try to resolve a name from an email address using the meeting title as context.
 * E.g., meeting title "Hassan x Jake" + email "haskari189@gmail.com" → "Hassan"
 */
function resolveNameFromEmail(email: string, meetingTitle?: string): string {
  // Extract the local part of the email (before @)
  const localPart = email.split("@")[0] || email;
  
  // Try to match against names in the meeting title
  if (meetingTitle) {
    // Split title by common separators: "x", "X", "&", ",", "|", "with", "and"
    const titleParts = meetingTitle.split(/\s*(?:x|X|&|,|\||with|and|vs)\s*/).map(s => s.trim()).filter(Boolean);
    
    for (const part of titleParts) {
      // Check if the email local part starts with the first few chars of a name in the title
      const nameLower = part.toLowerCase();
      const emailLower = localPart.toLowerCase().replace(/[0-9]/g, '');
      
      // Match if email prefix contains the name or vice versa (e.g., "haskari" ↔ "Hassan")
      if (nameLower.startsWith(emailLower.substring(0, 3)) || emailLower.startsWith(nameLower.substring(0, 3))) {
        return part;
      }
    }
  }
  
  // Fallback: clean up the email prefix into a readable name
  // Remove numbers and special chars, capitalize
  const cleaned = localPart
    .replace(/[0-9._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
  
  return cleaned || localPart;
}

/**
 * Extract unique participant names from Fathom data
 * Includes ALL attendees, resolving email-only names from meeting title context
 */
function extractParticipants(payload: FathomWebhookPayload): string[] {
  const names = new Set<string>();
  const meetingTitle = payload.title || payload.meeting_title;

  // From calendar invitees - include ALL invitees
  if (payload.calendar_invitees) {
    for (const invitee of payload.calendar_invitees) {
      if (invitee.matched_speaker_display_name) {
        // Best: matched to a transcript speaker
        names.add(invitee.matched_speaker_display_name);
      } else if (invitee.name && invitee.name !== invitee.email) {
        // Good: has a proper name
        names.add(invitee.name);
      } else {
        // Email-only: resolve name from email + meeting title
        const resolvedName = resolveNameFromEmail(invitee.email, meetingTitle);
        names.add(resolvedName);
      }
    }
  }

  // From transcript speakers
  if (payload.transcript) {
    for (const entry of payload.transcript) {
      if (entry.speaker.display_name) {
        names.add(entry.speaker.display_name);
      }
    }
  }

  // From recorded_by
  if (payload.recorded_by?.name) {
    names.add(payload.recorded_by.name);
  }

  return Array.from(names);
}

/**
 * Extract organizations from email domains of external invitees
 */
function extractOrganizations(payload: FathomWebhookPayload): string[] {
  const orgs = new Set<string>();

  if (payload.calendar_invitees) {
    for (const invitee of payload.calendar_invitees) {
      if (invitee.is_external && invitee.email_domain) {
        // Skip common email providers
        const commonDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "protonmail.com"];
        if (!commonDomains.includes(invitee.email_domain.toLowerCase())) {
          // Capitalize domain name nicely
          const orgName = invitee.email_domain
            .replace(/\.(com|io|ae|co|org|net|ai)$/, "")
            .split(".")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ");
          orgs.add(orgName);
        }
      }
    }
  }

  return Array.from(orgs);
}

/**
 * Determine the primary lead (the OmniScope person who recorded)
 */
function determinePrimaryLead(payload: FathomWebhookPayload): string {
  if (payload.recorded_by?.name) {
    return payload.recorded_by.name;
  }

  // Fall back to first non-external invitee
  if (payload.calendar_invitees) {
    const internal = payload.calendar_invitees.find((i) => !i.is_external);
    if (internal?.name) return internal.name;
  }

  return "Unknown";
}

/**
 * Structured action item from LLM analysis
 */
interface AnalyzedActionItem {
  title: string;
  description: string;
  assignedTo: string;
  priority: "low" | "medium" | "high";
  dueDate: string | null; // ISO date string or null
}

/**
 * Use LLM to analyze the meeting transcript and extract OmniScope intelligence
 */
async function analyzeMeetingWithLLM(payload: FathomWebhookPayload): Promise<{
  executiveSummary: string;
  strategicHighlights: string[];
  opportunities: string[];
  risks: string[];
  keyQuotes: string[];
  sectors: string[];
  jurisdictions: string[];
  actionItems: AnalyzedActionItem[];
  meetingType: string;
}> {
  const title = payload.title || payload.meeting_title || "Untitled Meeting";
  const summary = payload.default_summary?.markdown_formatted || "";
  const transcript = payload.transcript ? buildTranscriptText(payload.transcript) : "";
  const participants = extractParticipants(payload);
  const rawActionItems = payload.action_items?.map((a) => {
    let text = a.description;
    if (a.assignee?.name) text += ` (Fathom assignee: ${a.assignee.name})`;
    return text;
  }).join("\n- ") || "";

  // Truncate transcript to avoid token limits (keep first ~8000 chars)
  const truncatedTranscript = transcript.length > 8000
    ? transcript.substring(0, 8000) + "\n\n[Transcript truncated for analysis...]"
    : transcript;

  // Calculate default due date (2 days from now)
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 2);
  const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

  const systemPrompt = `You are an intelligence analyst for OmniScope, a sovereign-grade financial infrastructure platform operating across OTC Brokerage, Bitcoin & Digital Asset OTC, Stablecoin Liquidity, Commodities, Real Estate Capital, and Payment Rails.

Your job is to analyze meeting transcripts and extract structured intelligence data. Be precise, institutional, and compliance-aware.

CRITICAL RULES FOR ACTION ITEMS:
1. SPLIT compound action items into separate, atomic tasks. Example: "Create group chat w/ Hassan & Jake; prompt Hassan for deck + visuals" becomes TWO tasks: one for creating the group chat, one for requesting the deck.
2. Each task gets a CLEAN, SHORT title (max 80 chars) — just the action, no assignee info in the title.
3. Put detailed context in the description field.
4. ASSIGN tasks to the correct person based on WHO should do the work, not who recorded the meeting. Read the transcript carefully to determine who volunteered or was asked to do each task.
5. If a specific date/deadline is mentioned in the meeting, use that as the due date. If no date is mentioned, use "${defaultDueDateStr}" (2 days from now).
6. Set priority based on urgency discussed in the meeting.

CRITICAL RULES FOR MEETING TYPE:
- "New Client" = first meeting with a new contact/company, introductory call, getting-to-know-you
- "Follow-Up" = continuing a previous conversation or deal
- "Internal" = team-only meeting, no external participants
- "Deal Review" = reviewing terms, contracts, or transaction details
- "Partnership" = exploring or formalizing a partnership
- "General" = doesn't fit other categories

CRITICAL RULES FOR SECTORS:
- Only tag sectors that are ACTUALLY discussed in the meeting content
- If the meeting is about AI, technology, or software → use "Technology" or "AI"
- If it's a new client intro where no specific OmniScope vertical is discussed → use the sector most relevant to what was discussed
- Do NOT default to "OTC Brokerage" unless OTC trading is explicitly discussed

OmniScope's core verticals: OTC Brokerage & Execution, Bitcoin & Digital Assets, Stablecoin Liquidity, Commodities (Gold, Oil, Energy), Real Estate Capital, Payment Rails, Technology, AI, Compliance, General.

Relevant jurisdictions: USA, UAE (Dubai/ADGM), GCC, Europe, Asia, Pakistan, Global.`;

  const userPrompt = `Analyze this meeting and extract intelligence data:

**Meeting Title:** ${title}
**Participants:** ${participants.join(", ")}

**Fathom Summary:**
${summary}

**Raw Action Items from Fathom (may need splitting/reassignment):**
- ${rawActionItems || "None recorded"}

**Transcript:**
${truncatedTranscript || "No transcript available"}

Return a JSON object with these fields:
- executiveSummary: A 2-4 sentence institutional-grade summary of the meeting's key outcomes and significance
- strategicHighlights: Array of 3-5 key strategic points discussed (empty array if none)
- opportunities: Array of business opportunities identified (empty array if none)
- risks: Array of risks, red flags, or compliance concerns (empty array if none)
- keyQuotes: Array of notable direct quotes from participants (empty array if none)
- sectors: Array of relevant sectors from the list above — be accurate based on actual content discussed
- jurisdictions: Array of jurisdictions discussed or relevant
- meetingType: One of "New Client", "Follow-Up", "Internal", "Deal Review", "Partnership", "General"
- actionItems: Array of structured action items, each with:
  - title: Short, clean task title (max 80 chars, NO assignee info)
  - description: Detailed context about what needs to be done
  - assignedTo: Name of the person who should do this task (from participants list)
  - priority: "low", "medium", or "high"
  - dueDate: ISO date string (YYYY-MM-DD) if a deadline was mentioned, or "${defaultDueDateStr}" if not`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meeting_intelligence",
          strict: true,
          schema: {
            type: "object",
            properties: {
              executiveSummary: { type: "string", description: "2-4 sentence institutional summary" },
              strategicHighlights: { type: "array", items: { type: "string" }, description: "Key strategic points" },
              opportunities: { type: "array", items: { type: "string" }, description: "Business opportunities" },
              risks: { type: "array", items: { type: "string" }, description: "Risks and red flags" },
              keyQuotes: { type: "array", items: { type: "string" }, description: "Notable direct quotes" },
              sectors: { type: "array", items: { type: "string" }, description: "Relevant sectors" },
              jurisdictions: { type: "array", items: { type: "string" }, description: "Relevant jurisdictions" },
              meetingType: { type: "string", description: "Type of meeting" },
              actionItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Short clean task title" },
                    description: { type: "string", description: "Detailed task description" },
                    assignedTo: { type: "string", description: "Person responsible" },
                    priority: { type: "string", description: "low, medium, or high" },
                    dueDate: { type: ["string", "null"], description: "ISO date or null" },
                  },
                  required: ["title", "description", "assignedTo", "priority", "dueDate"],
                  additionalProperties: false,
                },
                description: "Structured action items",
              },
            },
            required: ["executiveSummary", "strategicHighlights", "opportunities", "risks", "keyQuotes", "sectors", "jurisdictions", "meetingType", "actionItems"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);
      // Normalize action items
      parsed.actionItems = (parsed.actionItems || []).map((item: any) => ({
        title: (item.title || "").substring(0, 80),
        description: item.description || "",
        assignedTo: item.assignedTo || "Unassigned",
        priority: ["low", "medium", "high"].includes(item.priority) ? item.priority : "medium",
        dueDate: item.dueDate || defaultDueDateStr,
      }));
      return parsed;
    }

    throw new Error("Unexpected LLM response format");
  } catch (error) {
    console.error("[Fathom] LLM analysis failed:", error);

    // Fallback: use Fathom's own summary and raw action items
    const fallbackItems: AnalyzedActionItem[] = (payload.action_items || []).map(a => ({
      title: a.description.substring(0, 80),
      description: a.description,
      assignedTo: a.assignee?.name || "Unassigned",
      priority: "medium" as const,
      dueDate: defaultDueDateStr,
    }));

    return {
      executiveSummary: summary || `Meeting "${title}" with ${participants.join(", ")}.`,
      strategicHighlights: [],
      opportunities: [],
      risks: [],
      keyQuotes: [],
      sectors: ["General"],
      jurisdictions: [],
      actionItems: fallbackItems,
      meetingType: "General",
    };
  }
}

/**
 * Transform a Fathom webhook payload into OmniScope intelligence data and ingest it
 */
export async function processFathomWebhook(payload: FathomWebhookPayload, orgId?: number): Promise<{
  success: boolean;
  meetingId?: number;
  reason?: string;
  brandedReportUrl?: string | null;
}> {
  const title = payload.title || payload.meeting_title || "Untitled Meeting";
  const sourceId = payload.recording_id
    ? `fathom-${payload.recording_id}`
    : payload.url
    ? `fathom-${payload.url}`
    : `fathom-${Date.now()}`;

  console.log(`[Fathom] Processing meeting: "${title}" (sourceId: ${sourceId})`);

  // Extract basic metadata
  const participants = extractParticipants(payload);
  const organizations = extractOrganizations(payload);
  const primaryLead = determinePrimaryLead(payload);

  // Determine meeting date
  const meetingDate = payload.recording_start_time
    || payload.scheduled_start_time
    || payload.created_at
    || new Date().toISOString();

  // Build full transcript text
  const fullTranscript = payload.transcript
    ? buildTranscriptText(payload.transcript)
    : null;

  // Action items will come from LLM analysis (structured format)
  // We keep raw items as fallback only

  // Use LLM to analyze the meeting and extract intelligence
  console.log(`[Fathom] Running LLM analysis for "${title}"...`);
  const analysis = await analyzeMeetingWithLLM(payload);
  console.log(`[Fathom] LLM analysis complete. Summary: ${analysis.executiveSummary.substring(0, 100)}...`);

  // Use LLM-analyzed structured action items (properly split, assigned, with due dates)
  const structuredActionItems = analysis.actionItems || [];
  console.log(`[Fathom] LLM produced ${structuredActionItems.length} structured action items for "${title}"`);

  // Build the intelligence data object
  const intelligenceData: IntelligenceData = {
    meetingTitle: title !== "Untitled Meeting" ? title : undefined,
    meetingDate,
    primaryLead,
    participants,
    organizations,
    jurisdictions: analysis.jurisdictions,
    executiveSummary: analysis.executiveSummary,
    strategicHighlights: analysis.strategicHighlights,
    opportunities: analysis.opportunities,
    risks: analysis.risks,
    keyQuotes: analysis.keyQuotes,
    actionItems: structuredActionItems as any, // Pass structured items (ingestion handles both string and object)
    intelligenceData: {
      fathomUrl: payload.url,
      fathomShareUrl: payload.share_url,
      fathomTitle: title,
      fathomSummary: payload.default_summary?.markdown_formatted,
      recordingStartTime: payload.recording_start_time,
      recordingEndTime: payload.recording_end_time,
      meetingType: analysis.meetingType,
    },
    fullTranscript: fullTranscript ?? undefined,
    sourceType: "fathom",
    sourceId,
    tags: [],
    sectors: analysis.sectors,
    jurisdictionTags: analysis.jurisdictions,
  };

  // Process through the standard ingestion pipeline
  const result = await processIntelligenceData(intelligenceData, undefined, orgId);

  if (result.success) {
    console.log(`[Fathom] Successfully ingested meeting ${result.meetingId}: "${title}"`);
  } else {
    console.log(`[Fathom] Meeting not ingested (${result.reason}): "${title}"`);
  }

  return result;
}

/**
 * Fetch meetings from Fathom API and import them
 */
export async function importFathomMeetings(options?: {
  limit?: number;
  cursor?: string;
  orgId?: number;
}): Promise<{
  imported: number;
  skipped: number;
  errors: number;
  nextCursor?: string;
}> {
  const apiKey = process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY not configured");
  }

  const limit = options?.limit || 10;
  let url = `${FATHOM_API_BASE}/meetings?limit=${limit}&include_transcript=true&include_summary=true&include_action_items=true`;
  if (options?.cursor) {
    url += `&cursor=${options.cursor}`;
  }

  console.log(`[Fathom] Fetching ${limit} meetings from Fathom API...`);

  const response = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Fathom API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const meetings = data.items || [];

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const meeting of meetings) {
    try {
      const result = await processFathomWebhook(meeting, options?.orgId);
      if (result.success) {
        imported++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`[Fathom] Error importing meeting "${meeting.title}":`, error);
      errors++;
    }
  }

  console.log(`[Fathom] Import complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);

  return {
    imported,
    skipped,
    errors,
    nextCursor: data.next_cursor,
  };
}

/**
 * Register a webhook with Fathom API
 */
export async function registerFathomWebhook(destinationUrl: string): Promise<{
  id: string;
  url: string;
  webhook_secret: string;
}> {
  const apiKey = process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY not configured");
  }

  console.log(`[Fathom] Registering webhook to: ${destinationUrl}`);

  const response = await fetch(`${FATHOM_API_BASE}/webhooks`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: destinationUrl,
      triggers: ["my_recordings"],
      include_transcript: true,
      include_summary: true,
      include_action_items: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fathom webhook registration failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`[Fathom] Webhook registered successfully: ${result.id}`);

  return result;
}

/**
 * List existing Fathom webhooks
 */
export async function listFathomWebhooks(): Promise<any[]> {
  const apiKey = process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY not configured");
  }

  const response = await fetch(`${FATHOM_API_BASE}/webhooks`, {
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fathom webhook list failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Delete a Fathom webhook
 */
export async function deleteFathomWebhook(webhookId: string): Promise<void> {
  const apiKey = process.env.FATHOM_API_KEY;
  if (!apiKey) {
    throw new Error("FATHOM_API_KEY not configured");
  }

  const response = await fetch(`${FATHOM_API_BASE}/webhooks/${webhookId}`, {
    method: "DELETE",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fathom webhook deletion failed: ${response.status} - ${errorText}`);
  }

  console.log(`[Fathom] Webhook ${webhookId} deleted`);
}
