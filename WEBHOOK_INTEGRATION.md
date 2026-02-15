# OmniScope Intelligence Portal - Webhook Integration Guide

## Overview

This guide explains how to connect Plaud, Fathom, or other call recording services to the OmniScope Intelligence Portal using webhooks. The portal automatically processes incoming call recordings and generates structured intelligence reports.

---

## Webhook Endpoint

**URL:** `https://your-portal-domain.com/api/webhook/plaud`

**Method:** `POST`

**Content-Type:** `application/json`

**Authentication:** API Key (recommended to add in future)

---

## Payload Format

The webhook expects a JSON payload with the following structure:

```json
{
  "sourceId": "unique-recording-id",
  "sourceType": "plaud|fathom|manual",
  "meetingDate": "2026-02-15T14:30:00Z",
  "primaryLead": "Kyle",
  "participants": ["Kyle", "Obi", "Paul Martinez"],
  "organizations": ["Family Office XYZ", "Sovereign Wealth Fund ABC"],
  "jurisdictions": ["UAE", "USA", "GCC"],
  "executiveSummary": "Strategic discussion regarding $500M OTC Bitcoin transaction...",
  "strategicHighlights": [
    "Client has immediate liquidity needs",
    "Compliance framework already in place",
    "Timeline: 30-45 days to close"
  ],
  "opportunities": [
    "Potential for recurring monthly transactions",
    "Introduction to sister fund in Singapore",
    "Advisory mandate for tokenization project"
  ],
  "risks": [
    "Regulatory approval pending in jurisdiction",
    "Counterparty credit check required",
    "Market volatility exposure"
  ],
  "actionItems": [
    {
      "title": "Send term sheet to client",
      "description": "Prepare and send detailed term sheet with pricing structure",
      "priority": "high",
      "owner": "Kyle",
      "dueDate": "2026-02-20"
    },
    {
      "title": "Schedule compliance call",
      "description": "Coordinate with legal team for KYB review",
      "priority": "medium",
      "owner": "Junaid",
      "dueDate": "2026-02-18"
    }
  ],
  "keyQuotes": [
    "We need this executed before month-end for tax optimization",
    "Our board has already approved the allocation",
    "We're looking for a long-term partner, not just a one-time trade"
  ]
}
```

---

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceId` | string | Yes | Unique identifier from the recording service (prevents duplicates) |
| `sourceType` | string | Yes | Source of the recording: `plaud`, `fathom`, or `manual` |
| `meetingDate` | string (ISO 8601) | Yes | Date and time of the meeting |
| `primaryLead` | string | Yes | Main OmniScope team member on the call |
| `participants` | string[] | Yes | All participants including team members and clients |
| `organizations` | string[] | No | Companies or entities represented |
| `jurisdictions` | string[] | No | Relevant jurisdictions/countries |
| `executiveSummary` | string | Yes | 5-8 sentence strategic overview |
| `strategicHighlights` | string[] | No | Key deal structure, capital, liquidity, compliance points |
| `opportunities` | string[] | No | Monetization angles, partnership opportunities |
| `risks` | string[] | No | Regulatory, counterparty, timeline, reputation risks |
| `actionItems` | ActionItem[] | No | Tasks extracted from the meeting |
| `keyQuotes` | string[] | No | Important verbatim statements |

### ActionItem Structure

```typescript
{
  title: string;          // Brief task description
  description?: string;   // Detailed context
  priority: "high" | "medium" | "low";
  owner?: string;         // Team member name
  dueDate?: string;       // ISO 8601 date
}
```

---

## Integration Methods

### Option 1: Zapier (Recommended for Quick Setup)

**Setup Time:** ~30 minutes  
**Cost:** $20-50/month  
**Best For:** Non-technical users, rapid deployment

#### Steps:

1. **Create Zapier Account** at [zapier.com](https://zapier.com)

2. **Connect Plaud/Fathom:**
   - Search for "Plaud" or "Fathom" in Zapier triggers
   - Authenticate your account
   - Select trigger: "New Recording Completed"

3. **Add Formatter Step:**
   - Use "Code by Zapier" or "Formatter" to structure the JSON payload
   - Map fields from Plaud/Fathom to the required format above

4. **Add Webhook Action:**
   - Choose "Webhooks by Zapier"
   - Method: POST
   - URL: `https://your-portal-domain.com/api/webhook/plaud`
   - Data: Paste the JSON payload structure
   - Headers: `Content-Type: application/json`

5. **Test & Activate:**
   - Run a test with sample data
   - Verify the meeting appears in your portal
   - Turn on the Zap

---

### Option 2: n8n (Self-Hosted, More Control)

**Setup Time:** 1-2 hours  
**Cost:** $0 (self-hosted) or $20/month (cloud)  
**Best For:** Technical teams, complex workflows

#### Steps:

1. **Install n8n:**
   ```bash
   npx n8n
   # or
   docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
   ```

2. **Create Workflow:**
   - Trigger: Webhook (to receive Plaud/Fathom data)
   - HTTP Request node: Call Plaud/Fathom API to fetch transcript
   - Function node: Transform data to OmniScope format
   - HTTP Request node: POST to OmniScope webhook

3. **Deploy:**
   - Save workflow
   - Activate
   - Configure Plaud/Fathom to send webhooks to your n8n instance

---

### Option 3: Direct API Integration

**Setup Time:** 2-4 hours  
**Cost:** $0  
**Best For:** Developers, custom requirements

#### Example (Node.js):

```javascript
const axios = require('axios');

async function sendToOmniScope(recordingData) {
  const payload = {
    sourceId: recordingData.id,
    sourceType: 'plaud',
    meetingDate: recordingData.timestamp,
    primaryLead: extractLead(recordingData.participants),
    participants: recordingData.participants,
    organizations: extractOrganizations(recordingData.transcript),
    jurisdictions: extractJurisdictions(recordingData.transcript),
    executiveSummary: await generateSummary(recordingData.transcript),
    strategicHighlights: await extractHighlights(recordingData.transcript),
    opportunities: await extractOpportunities(recordingData.transcript),
    risks: await extractRisks(recordingData.transcript),
    actionItems: await extractActionItems(recordingData.transcript),
    keyQuotes: await extractQuotes(recordingData.transcript),
  };

  const response = await axios.post(
    'https://your-portal-domain.com/api/webhook/plaud',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_API_KEY' // Add when implemented
      }
    }
  );

  return response.data;
}
```

---

## Automatic Processing

Once a webhook is received, the portal automatically:

1. ✅ **Validates** the payload structure
2. ✅ **Checks for duplicates** using `sourceId`
3. ✅ **Creates meeting record** in the database
4. ✅ **Assigns tags** based on sectors and jurisdictions
5. ✅ **Generates tasks** from action items
6. ✅ **Assigns tasks** to team members based on `owner` field
7. ✅ **Updates analytics** (dashboard metrics, daily summaries)
8. ✅ **Makes searchable** via Ask OmniScope AI search

---

## Testing the Webhook

### Using cURL:

```bash
curl -X POST https://your-portal-domain.com/api/webhook/plaud \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "test-123",
    "sourceType": "manual",
    "meetingDate": "2026-02-15T14:30:00Z",
    "primaryLead": "Kyle",
    "participants": ["Kyle", "Test Client"],
    "organizations": ["Test Corp"],
    "jurisdictions": ["UAE"],
    "executiveSummary": "Test meeting for webhook integration",
    "strategicHighlights": ["Test highlight"],
    "opportunities": ["Test opportunity"],
    "risks": ["Test risk"],
    "actionItems": [
      {
        "title": "Test task",
        "priority": "high",
        "owner": "Kyle"
      }
    ],
    "keyQuotes": ["This is a test quote"]
  }'
```

### Using Postman:

1. Create new POST request
2. URL: `https://your-portal-domain.com/api/webhook/plaud`
3. Headers: `Content-Type: application/json`
4. Body: Raw JSON (use sample payload above)
5. Send

---

## Error Handling

The webhook returns standard HTTP status codes:

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Meeting created successfully |
| 400 | Bad Request | Check payload format |
| 409 | Conflict | Duplicate `sourceId` detected |
| 500 | Server Error | Contact support |

### Example Success Response:

```json
{
  "success": true,
  "meetingId": 42,
  "tasksCreated": 2,
  "message": "Meeting intelligence report created successfully"
}
```

### Example Error Response:

```json
{
  "success": false,
  "error": "Duplicate meeting: sourceId 'plaud-xyz-123' already exists",
  "code": "DUPLICATE_SOURCE_ID"
}
```

---

## Best Practices

### 1. **Use Unique Source IDs**
Always use the recording service's unique identifier to prevent duplicates.

### 2. **Include All Participants**
List both your team members and external contacts for accurate analytics.

### 3. **Be Specific with Action Items**
Include clear owners and due dates for automatic task assignment.

### 4. **Tag Sectors and Jurisdictions**
Proper tagging enables powerful filtering and analytics.

### 5. **Extract Quality Quotes**
Include verbatim statements that show commitment, urgency, or strategic intent.

---

## Security Recommendations

### Immediate (Before Production):

1. **Add API Key Authentication:**
   - Generate unique API key for webhook endpoint
   - Add `Authorization: Bearer YOUR_KEY` header requirement
   - Store keys securely in environment variables

2. **Enable HTTPS Only:**
   - Ensure portal is accessible via HTTPS
   - Reject HTTP requests

3. **Rate Limiting:**
   - Implement rate limits (e.g., 100 requests/hour)
   - Prevent abuse and accidental loops

### Future Enhancements:

- IP whitelisting for known services
- Webhook signature verification (HMAC)
- Audit logging for all webhook calls

---

## Troubleshooting

### Meeting Not Appearing in Portal

1. Check webhook response status code
2. Verify `sourceId` is unique
3. Ensure `meetingDate` is valid ISO 8601 format
4. Check browser console for errors

### Tasks Not Created

1. Verify `actionItems` array is properly formatted
2. Check `owner` matches a team member name
3. Ensure `priority` is one of: `high`, `medium`, `low`

### Duplicate Detection Not Working

1. Confirm `sourceId` is consistent across retries
2. Check database for existing records with same `sourceId`

---

## Support

For integration assistance:
- Email: support@omniscopex.ae
- Documentation: https://omniscopex.ae/docs
- Portal: https://intelligence.omniscopex.ae

---

**Last Updated:** February 15, 2026  
**Version:** 1.0
