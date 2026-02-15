import * as db from "./db";

export interface MeetingRecap {
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  attachments?: Array<{
    filename: string;
    content: string;
  }>;
}

/**
 * Generate a branded meeting recap for external distribution
 */
export async function generateMeetingRecap(meetingId: number, recipientName?: string): Promise<MeetingRecap> {
  const meeting = await db.getMeetingById(meetingId);
  if (!meeting) {
    throw new Error("Meeting not found");
  }

  const participants = JSON.parse(meeting.participants || '[]');
  const organizations = JSON.parse(meeting.organizations || '[]');
  const highlights = JSON.parse(meeting.strategicHighlights || '[]');
  const opportunities = JSON.parse(meeting.opportunities || '[]');
  const risks = JSON.parse(meeting.risks || '[]');
  const keyQuotes = JSON.parse(meeting.keyQuotes || '[]');

  // Get tasks for this meeting
  const tasks = await db.getTasksForMeeting(meetingId);
  
  const meetingDate = new Date(meeting.meetingDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `Meeting Recap: ${participants.join(', ')} - ${new Date(meeting.meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  // Generate HTML email body
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OmniScope Meeting Recap</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #e4e4e7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; border-bottom: 1px solid #27272a;">
              <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #ffffff;">OmniScope</h1>
              <p style="margin: 0; font-size: 14px; color: #ca8a04; font-weight: 500; letter-spacing: 0.5px;">ALL MARKETS. ONE SCOPE.</p>
            </td>
          </tr>

          <!-- Greeting -->
          ${recipientName ? `
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; font-size: 16px; color: #e4e4e7;">Dear ${recipientName},</p>
            </td>
          </tr>
          ` : ''}

          <!-- Meeting Details -->
          <tr>
            <td style="padding: ${recipientName ? '10px' : '30px'} 40px 20px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #ffffff;">Meeting Summary</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #a1a1aa;">
                    <strong style="color: #e4e4e7;">Date:</strong> ${meetingDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #a1a1aa;">
                    <strong style="color: #e4e4e7;">Participants:</strong> ${participants.join(', ')}
                  </td>
                </tr>
                ${organizations.length > 0 ? `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #a1a1aa;">
                    <strong style="color: #e4e4e7;">Organizations:</strong> ${organizations.join(', ')}
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Executive Summary -->
          <tr>
            <td style="padding: 20px 40px;">
              <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #ca8a04;">Executive Summary</h3>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e4e4e7;">${meeting.executiveSummary}</p>
            </td>
          </tr>

          <!-- Strategic Highlights -->
          ${highlights.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #ca8a04;">Key Highlights</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #e4e4e7;">
                ${highlights.map((h: string) => `<li style="margin-bottom: 8px;">${h}</li>`).join('')}
              </ul>
            </td>
          </tr>
          ` : ''}

          <!-- Opportunities -->
          ${opportunities.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #22c55e;">Opportunities Identified</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #e4e4e7;">
                ${opportunities.map((o: string) => `<li style="margin-bottom: 8px;">${o}</li>`).join('')}
              </ul>
            </td>
          </tr>
          ` : ''}

          <!-- Risks -->
          ${risks.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #ef4444;">Risk Considerations</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #e4e4e7;">
                ${risks.map((r: string) => `<li style="margin-bottom: 8px;">${r}</li>`).join('')}
              </ul>
            </td>
          </tr>
          ` : ''}

          <!-- Action Items -->
          ${tasks.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #ca8a04;">Action Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #27272a; border-radius: 6px;">
                ${tasks.map((task: any, idx: number) => `
                  <tr>
                    <td style="padding: 16px; ${idx < tasks.length - 1 ? 'border-bottom: 1px solid #3f3f46;' : ''}">
                      <div style="display: flex; align-items: flex-start;">
                        <div style="flex-shrink: 0; width: 6px; height: 6px; background-color: ${task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#ca8a04' : '#71717a'}; border-radius: 50%; margin-top: 6px; margin-right: 12px;"></div>
                        <div style="flex: 1;">
                          <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #ffffff;">${task.title}</p>
                          ${task.description ? `<p style="margin: 0; font-size: 13px; color: #a1a1aa;">${task.description}</p>` : ''}
                          ${task.dueDate ? `<p style="margin: 8px 0 0; font-size: 12px; color: #71717a;">Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>` : ''}
                        </div>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Key Quotes -->
          ${keyQuotes.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #ca8a04;">Key Quotes</h3>
              ${keyQuotes.map((q: string) => `
                <blockquote style="margin: 0 0 12px; padding: 12px 16px; background-color: #27272a; border-left: 3px solid #ca8a04; border-radius: 4px; font-size: 14px; font-style: italic; color: #e4e4e7;">
                  "${q}"
                </blockquote>
              `).join('')}
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px 40px; border-top: 1px solid #27272a;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #71717a;">This recap was generated by OmniScope Intelligence Portal.</p>
              <p style="margin: 0; font-size: 13px; color: #71717a;">For questions or clarifications, please contact your OmniScope representative.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Generate plain text version
  const plainTextBody = `
OMNISCOPE
All Markets. One Scope.

${recipientName ? `Dear ${recipientName},\n\n` : ''}MEETING SUMMARY
================

Date: ${meetingDate}
Participants: ${participants.join(', ')}
${organizations.length > 0 ? `Organizations: ${organizations.join(', ')}\n` : ''}

EXECUTIVE SUMMARY
-----------------
${meeting.executiveSummary}

${highlights.length > 0 ? `
KEY HIGHLIGHTS
--------------
${highlights.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n')}
` : ''}
${opportunities.length > 0 ? `
OPPORTUNITIES IDENTIFIED
------------------------
${opportunities.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}
` : ''}
${risks.length > 0 ? `
RISK CONSIDERATIONS
-------------------
${risks.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}
` : ''}
${tasks.length > 0 ? `
ACTION ITEMS
------------
${tasks.map((task: any, i: number) => `
${i + 1}. ${task.title}${task.priority ? ` [${task.priority.toUpperCase()} PRIORITY]` : ''}
   ${task.description || ''}${task.dueDate ? `\n   Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
`).join('\n')}
` : ''}
${keyQuotes.length > 0 ? `
KEY QUOTES
----------
${keyQuotes.map((q: string) => `"${q}"`).join('\n\n')}
` : ''}

---
This recap was generated by OmniScope Intelligence Portal.
For questions or clarifications, please contact your OmniScope representative.
  `.trim();

  return {
    subject,
    htmlBody,
    plainTextBody,
  };
}
