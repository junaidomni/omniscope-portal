import { invokeLLM } from "./_core/llm";
import * as db from "./db";

export interface AskOmniScopeResult {
  answer: string;
  meetings: Array<{
    id: number;
    meetingDate: Date;
    participants: string[];
    organizations: string[];
    executiveSummary: string;
    relevanceScore: number;
  }>;
  suggestedQuestions: string[];
}

/**
 * Process natural language queries about meetings and intelligence data
 */
export async function askOmniScope(query: string): Promise<AskOmniScopeResult> {
  // Get all meetings
  const allMeetings = await db.getAllMeetings();
  
  // Build context for LLM
  const meetingContext = allMeetings.map(m => ({
    id: m.id,
    date: new Date(m.meetingDate).toISOString(),
    participants: JSON.parse(m.participants || '[]'),
    organizations: JSON.parse(m.organizations || '[]'),
    summary: m.executiveSummary,
    highlights: JSON.parse(m.strategicHighlights || '[]'),
    opportunities: JSON.parse(m.opportunities || '[]'),
    risks: JSON.parse(m.risks || '[]'),
  }));

  // Use LLM to understand the query and find relevant meetings
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are OmniScope's intelligent assistant. You help users find and understand meeting intelligence data.

You have access to a database of meeting records. Each meeting includes:
- Participants and organizations
- Executive summaries
- Strategic highlights
- Opportunities and risks identified

When a user asks a question:
1. Identify which meetings are relevant
2. Provide a clear, concise answer
3. Return the IDs of relevant meetings (as a JSON array)
4. Suggest 2-3 related follow-up questions

Available meetings:
${JSON.stringify(meetingContext, null, 2)}

Respond in JSON format:
{
  "answer": "Clear answer to the user's question",
  "relevantMeetingIds": [1, 2, 3],
  "suggestedQuestions": ["Question 1?", "Question 2?", "Question 3?"]
}`
      },
      {
        role: "user",
        content: query
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "omniscope_search_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            answer: {
              type: "string",
              description: "Clear, concise answer to the user's question"
            },
            relevantMeetingIds: {
              type: "array",
              items: { type: "number" },
              description: "Array of meeting IDs that are relevant to the query"
            },
            suggestedQuestions: {
              type: "array",
              items: { type: "string" },
              description: "2-3 follow-up questions the user might want to ask"
            }
          },
          required: ["answer", "relevantMeetingIds", "suggestedQuestions"],
          additionalProperties: false
        }
      }
    }
  });

  const messageContent = response.choices[0]?.message?.content;
  const contentString = typeof messageContent === 'string' ? messageContent : '{}';
  const result = JSON.parse(contentString);

  // Get full meeting details for relevant meetings
  const relevantMeetings = allMeetings
    .filter(m => result.relevantMeetingIds.includes(m.id))
    .map(m => ({
      id: m.id,
      meetingDate: m.meetingDate,
      participants: JSON.parse(m.participants || '[]'),
      organizations: JSON.parse(m.organizations || '[]'),
      executiveSummary: m.executiveSummary,
      relevanceScore: 1.0, // Could implement more sophisticated scoring
    }));

  return {
    answer: result.answer,
    meetings: relevantMeetings,
    suggestedQuestions: result.suggestedQuestions || [],
  };
}

/**
 * Find meetings by participant name (simple search)
 */
export async function findMeetingsByParticipant(participantName: string) {
  const allMeetings = await db.getAllMeetings();
  
  const matches = allMeetings.filter(m => {
    const participants = JSON.parse(m.participants || '[]');
    return participants.some((p: string) => 
      p.toLowerCase().includes(participantName.toLowerCase())
    );
  });

  return matches.map(m => ({
    id: m.id,
    meetingDate: m.meetingDate,
    participants: JSON.parse(m.participants || '[]'),
    organizations: JSON.parse(m.organizations || '[]'),
    executiveSummary: m.executiveSummary,
  }));
}

/**
 * Find meetings by organization name
 */
export async function findMeetingsByOrganization(organizationName: string) {
  const allMeetings = await db.getAllMeetings();
  
  const matches = allMeetings.filter(m => {
    const organizations = JSON.parse(m.organizations || '[]');
    return organizations.some((o: string) => 
      o.toLowerCase().includes(organizationName.toLowerCase())
    );
  });

  return matches.map(m => ({
    id: m.id,
    meetingDate: m.meetingDate,
    participants: JSON.parse(m.participants || '[]'),
    organizations: JSON.parse(m.organizations || '[]'),
    executiveSummary: m.executiveSummary,
  }));
}
