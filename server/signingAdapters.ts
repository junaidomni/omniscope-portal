/**
 * E-Signature Provider Adapters
 * 
 * Common interface for all signing providers. OmniScope owns the intelligence layer
 * (templates, CRM data, filing, audit trail) — the signing platform is a commodity pipe.
 * 
 * Supported providers:
 * - Firma.dev ($0.029/envelope) — cheapest
 * - SignatureAPI ($0.25/envelope)
 * - DocuSeal (open-source / cloud)
 * - PandaDocs ($49/user/month)
 * - DocuSign (enterprise)
 * - BoldSign ($0.10/envelope)
 * - eSignly (flat rate)
 */

import { ENV } from "./_core/env";

// ============================================================================
// COMMON INTERFACE
// ============================================================================

export interface SigningRecipient {
  name: string;
  email: string;
  role: string; // "signer", "cc", "approver"
  order?: number; // signing order (1-based)
}

export interface CreateEnvelopeRequest {
  documentUrl: string; // S3 URL or Google Drive export URL
  documentName: string;
  recipients: SigningRecipient[];
  subject?: string;
  message?: string;
  callbackUrl?: string; // webhook URL for status updates
  metadata?: Record<string, string>; // pass-through data
}

export interface EnvelopeResponse {
  providerEnvelopeId: string;
  status: "draft" | "sent" | "viewed" | "completed" | "declined" | "voided" | "expired";
  recipients: Array<SigningRecipient & { status: string; signedAt?: string }>;
  signedDocumentUrl?: string;
  rawResponse?: any;
}

export interface WebhookPayload {
  envelopeId: string;
  status: string;
  recipientEmail?: string;
  signedDocumentUrl?: string;
  timestamp: string;
  rawPayload: any;
}

export interface SigningProviderAdapter {
  name: string;
  displayName: string;
  pricePerEnvelope: string;
  
  /** Create and send an envelope for signing */
  createEnvelope(req: CreateEnvelopeRequest, config: ProviderConfig): Promise<EnvelopeResponse>;
  
  /** Get current status of an envelope */
  getStatus(envelopeId: string, config: ProviderConfig): Promise<EnvelopeResponse>;
  
  /** Download the signed document as a Buffer */
  downloadSigned(envelopeId: string, config: ProviderConfig): Promise<{ buffer: Buffer; mimeType: string; fileName: string } | null>;
  
  /** Parse an incoming webhook payload */
  parseWebhook(payload: any, headers: Record<string, string>, config: ProviderConfig): WebhookPayload | null;
  
  /** Void/cancel an envelope */
  voidEnvelope(envelopeId: string, reason: string, config: ProviderConfig): Promise<boolean>;
}

export interface ProviderConfig {
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
  webhookSecret?: string;
  extra?: Record<string, string>;
}

// ============================================================================
// HELPER: Generic HTTP client for provider APIs
// ============================================================================

async function providerFetch(url: string, options: {
  method: string;
  headers: Record<string, string>;
  body?: any;
  isJson?: boolean;
}): Promise<any> {
  const { method, headers, body, isJson = true } = options;
  const fetchOptions: RequestInit = {
    method,
    headers: { ...headers, ...(isJson && body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: isJson ? JSON.stringify(body) : body } : {}),
  };
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Provider API error (${response.status}): ${errorText}`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  return response.text();
}

// ============================================================================
// FIRMA.DEV ADAPTER — $0.029/envelope
// ============================================================================

const firmaAdapter: SigningProviderAdapter = {
  name: "firma",
  displayName: "Firma.dev",
  pricePerEnvelope: "$0.029",

  async createEnvelope(req, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.firma.dev"}/v1/envelopes`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
      body: {
        document_url: req.documentUrl,
        document_name: req.documentName,
        subject: req.subject || `Please sign: ${req.documentName}`,
        message: req.message || "You have been requested to sign a document from OmniScope.",
        signers: req.recipients.filter(r => r.role === "signer").map((r, i) => ({
          name: r.name,
          email: r.email,
          order: r.order || i + 1,
        })),
        cc: req.recipients.filter(r => r.role === "cc").map(r => ({ email: r.email })),
        webhook_url: req.callbackUrl,
        metadata: req.metadata,
      },
    });
    return {
      providerEnvelopeId: response.id || response.envelope_id,
      status: mapFirmaStatus(response.status),
      recipients: req.recipients.map(r => ({ ...r, status: "pending" })),
      rawResponse: response,
    };
  },

  async getStatus(envelopeId, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.firma.dev"}/v1/envelopes/${envelopeId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
    });
    return {
      providerEnvelopeId: envelopeId,
      status: mapFirmaStatus(response.status),
      recipients: (response.signers || []).map((s: any) => ({
        name: s.name, email: s.email, role: "signer",
        status: s.status, signedAt: s.signed_at,
      })),
      signedDocumentUrl: response.signed_document_url,
      rawResponse: response,
    };
  },

  async downloadSigned(envelopeId, config) {
    try {
      const buffer = await providerFetch(`${config.baseUrl || "https://api.firma.dev"}/v1/envelopes/${envelopeId}/download`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${config.apiKey}` },
        isJson: false,
      });
      return { buffer, mimeType: "application/pdf", fileName: `signed-${envelopeId}.pdf` };
    } catch { return null; }
  },

  parseWebhook(payload, headers, config) {
    return {
      envelopeId: payload.envelope_id || payload.id,
      status: mapFirmaStatus(payload.status || payload.event_type),
      recipientEmail: payload.signer_email,
      signedDocumentUrl: payload.signed_document_url,
      timestamp: payload.timestamp || new Date().toISOString(),
      rawPayload: payload,
    };
  },

  async voidEnvelope(envelopeId, reason, config) {
    try {
      await providerFetch(`${config.baseUrl || "https://api.firma.dev"}/v1/envelopes/${envelopeId}/void`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.apiKey}` },
        body: { reason },
      });
      return true;
    } catch { return false; }
  },
};

function mapFirmaStatus(status: string): EnvelopeResponse["status"] {
  const map: Record<string, EnvelopeResponse["status"]> = {
    draft: "draft", sent: "sent", viewed: "viewed", completed: "completed",
    signed: "completed", declined: "declined", voided: "voided", expired: "expired",
    "envelope.completed": "completed", "envelope.sent": "sent", "envelope.viewed": "viewed",
    "envelope.declined": "declined", "envelope.voided": "voided",
  };
  return map[status?.toLowerCase()] || "sent";
}

// ============================================================================
// SIGNATUREAPI ADAPTER — $0.25/envelope
// ============================================================================

const signatureApiAdapter: SigningProviderAdapter = {
  name: "signatureapi",
  displayName: "SignatureAPI",
  pricePerEnvelope: "$0.25",

  async createEnvelope(req, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.signatureapi.com"}/v1/envelopes`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
      body: {
        title: req.subject || req.documentName,
        message: req.message,
        documents: [{ url: req.documentUrl, name: req.documentName }],
        recipients: req.recipients.map((r, i) => ({
          name: r.name, email: r.email, role: r.role === "cc" ? "cc" : "signer", order: r.order || i + 1,
        })),
        webhook_url: req.callbackUrl,
        metadata: req.metadata,
      },
    });
    return {
      providerEnvelopeId: response.id,
      status: mapGenericStatus(response.status),
      recipients: req.recipients.map(r => ({ ...r, status: "pending" })),
      rawResponse: response,
    };
  },

  async getStatus(envelopeId, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.signatureapi.com"}/v1/envelopes/${envelopeId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
    });
    return {
      providerEnvelopeId: envelopeId,
      status: mapGenericStatus(response.status),
      recipients: (response.recipients || []).map((r: any) => ({
        name: r.name, email: r.email, role: r.role, status: r.status, signedAt: r.signed_at,
      })),
      signedDocumentUrl: response.signed_document_url,
      rawResponse: response,
    };
  },

  async downloadSigned(envelopeId, config) {
    try {
      const buffer = await providerFetch(`${config.baseUrl || "https://api.signatureapi.com"}/v1/envelopes/${envelopeId}/documents/download`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${config.apiKey}` },
        isJson: false,
      });
      return { buffer, mimeType: "application/pdf", fileName: `signed-${envelopeId}.pdf` };
    } catch { return null; }
  },

  parseWebhook(payload, headers, config) {
    return {
      envelopeId: payload.envelope_id || payload.data?.id,
      status: mapGenericStatus(payload.event || payload.status),
      recipientEmail: payload.recipient_email,
      signedDocumentUrl: payload.signed_document_url,
      timestamp: payload.created_at || new Date().toISOString(),
      rawPayload: payload,
    };
  },

  async voidEnvelope(envelopeId, reason, config) {
    try {
      await providerFetch(`${config.baseUrl || "https://api.signatureapi.com"}/v1/envelopes/${envelopeId}/void`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.apiKey}` },
        body: { reason },
      });
      return true;
    } catch { return false; }
  },
};

// ============================================================================
// DOCUSEAL ADAPTER — Open source / cloud
// ============================================================================

const docuSealAdapter: SigningProviderAdapter = {
  name: "docuseal",
  displayName: "DocuSeal",
  pricePerEnvelope: "Free (self-hosted) / $0.10",

  async createEnvelope(req, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.docuseal.com"}/submissions`, {
      method: "POST",
      headers: { "X-Auth-Token": config.apiKey },
      body: {
        template_id: req.metadata?.templateId,
        send_email: true,
        submitters: req.recipients.filter(r => r.role !== "cc").map((r, i) => ({
          name: r.name, email: r.email, role: r.role === "signer" ? "First Party" : r.role,
          order: r.order || i + 1,
        })),
        message: { subject: req.subject || req.documentName, body: req.message },
      },
    });
    const submissionId = Array.isArray(response) ? response[0]?.submission_id : response.id;
    return {
      providerEnvelopeId: String(submissionId),
      status: "sent",
      recipients: req.recipients.map(r => ({ ...r, status: "pending" })),
      rawResponse: response,
    };
  },

  async getStatus(envelopeId, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.docuseal.com"}/submissions/${envelopeId}`, {
      method: "GET",
      headers: { "X-Auth-Token": config.apiKey },
    });
    return {
      providerEnvelopeId: envelopeId,
      status: mapGenericStatus(response.status),
      recipients: (response.submitters || []).map((s: any) => ({
        name: s.name, email: s.email, role: "signer",
        status: s.status, signedAt: s.completed_at,
      })),
      signedDocumentUrl: response.documents?.[0]?.url,
      rawResponse: response,
    };
  },

  async downloadSigned(envelopeId, config) {
    try {
      const status = await this.getStatus(envelopeId, config);
      if (status.signedDocumentUrl) {
        const buffer = await providerFetch(status.signedDocumentUrl, {
          method: "GET", headers: {}, isJson: false,
        });
        return { buffer, mimeType: "application/pdf", fileName: `signed-${envelopeId}.pdf` };
      }
      return null;
    } catch { return null; }
  },

  parseWebhook(payload, headers, config) {
    return {
      envelopeId: String(payload.data?.submission_id || payload.submission_id),
      status: mapGenericStatus(payload.event_type || payload.data?.status),
      recipientEmail: payload.data?.email,
      signedDocumentUrl: payload.data?.documents?.[0]?.url,
      timestamp: payload.timestamp || new Date().toISOString(),
      rawPayload: payload,
    };
  },

  async voidEnvelope(envelopeId, reason, config) {
    try {
      await providerFetch(`${config.baseUrl || "https://api.docuseal.com"}/submissions/${envelopeId}`, {
        method: "DELETE",
        headers: { "X-Auth-Token": config.apiKey },
      });
      return true;
    } catch { return false; }
  },
};

// ============================================================================
// PANDADOCS ADAPTER — $49/user/month
// ============================================================================

const pandaDocsAdapter: SigningProviderAdapter = {
  name: "pandadocs",
  displayName: "PandaDocs",
  pricePerEnvelope: "$49/user/month",

  async createEnvelope(req, config) {
    // Step 1: Create document from URL
    const createResponse = await providerFetch(`${config.baseUrl || "https://api.pandadoc.com"}/public/v1/documents`, {
      method: "POST",
      headers: { "Authorization": `API-Key ${config.apiKey}` },
      body: {
        name: req.documentName,
        url: req.documentUrl,
        recipients: req.recipients.map((r, i) => ({
          email: r.email, first_name: r.name.split(" ")[0], last_name: r.name.split(" ").slice(1).join(" ") || "",
          role: r.role === "cc" ? "CC" : "Signer", signing_order: r.order || i + 1,
        })),
        parse_form_fields: true,
        metadata: req.metadata,
      },
    });
    // Step 2: Send for signing
    const docId = createResponse.id;
    // Wait briefly for document processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    try {
      await providerFetch(`${config.baseUrl || "https://api.pandadoc.com"}/public/v1/documents/${docId}/send`, {
        method: "POST",
        headers: { "Authorization": `API-Key ${config.apiKey}` },
        body: { message: req.message || "Please review and sign this document.", subject: req.subject },
      });
    } catch {
      // Document may still be processing — status will update via webhook
    }
    return {
      providerEnvelopeId: docId,
      status: "sent",
      recipients: req.recipients.map(r => ({ ...r, status: "pending" })),
      rawResponse: createResponse,
    };
  },

  async getStatus(envelopeId, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.pandadoc.com"}/public/v1/documents/${envelopeId}`, {
      method: "GET",
      headers: { "Authorization": `API-Key ${config.apiKey}` },
    });
    const statusMap: Record<string, EnvelopeResponse["status"]> = {
      "document.draft": "draft", "document.sent": "sent", "document.viewed": "viewed",
      "document.completed": "completed", "document.voided": "voided", "document.declined": "declined",
    };
    return {
      providerEnvelopeId: envelopeId,
      status: statusMap[response.status] || mapGenericStatus(response.status),
      recipients: (response.recipients || []).map((r: any) => ({
        name: `${r.first_name} ${r.last_name}`.trim(), email: r.email, role: r.role?.toLowerCase() || "signer",
        status: r.has_completed ? "completed" : "pending", signedAt: r.completed_at,
      })),
      signedDocumentUrl: response.status === "document.completed" ? `https://api.pandadoc.com/public/v1/documents/${envelopeId}/download` : undefined,
      rawResponse: response,
    };
  },

  async downloadSigned(envelopeId, config) {
    try {
      const buffer = await providerFetch(`${config.baseUrl || "https://api.pandadoc.com"}/public/v1/documents/${envelopeId}/download`, {
        method: "GET",
        headers: { "Authorization": `API-Key ${config.apiKey}` },
        isJson: false,
      });
      return { buffer, mimeType: "application/pdf", fileName: `signed-${envelopeId}.pdf` };
    } catch { return null; }
  },

  parseWebhook(payload, headers, config) {
    const data = Array.isArray(payload) ? payload[0] : payload;
    return {
      envelopeId: data.data?.id || data.document_id,
      status: mapGenericStatus(data.event || data.status),
      recipientEmail: data.data?.recipient?.email,
      timestamp: data.data?.date_created || new Date().toISOString(),
      rawPayload: payload,
    };
  },

  async voidEnvelope(envelopeId, reason, config) {
    try {
      await providerFetch(`${config.baseUrl || "https://api.pandadoc.com"}/public/v1/documents/${envelopeId}`, {
        method: "DELETE",
        headers: { "Authorization": `API-Key ${config.apiKey}` },
      });
      return true;
    } catch { return false; }
  },
};

// ============================================================================
// DOCUSIGN ADAPTER — Enterprise
// ============================================================================

const docuSignAdapter: SigningProviderAdapter = {
  name: "docusign",
  displayName: "DocuSign",
  pricePerEnvelope: "$15-45/user/month",

  async createEnvelope(req, config) {
    const accountId = config.extra?.accountId || "";
    const response = await providerFetch(`${config.baseUrl || "https://demo.docusign.net/restapi"}/v2.1/accounts/${accountId}/envelopes`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
      body: {
        emailSubject: req.subject || `Please sign: ${req.documentName}`,
        emailBlurb: req.message,
        documents: [{ documentBase64: "", documentId: "1", name: req.documentName, remoteUrl: req.documentUrl }],
        recipients: {
          signers: req.recipients.filter(r => r.role === "signer").map((r, i) => ({
            email: r.email, name: r.name, recipientId: String(i + 1), routingOrder: String(r.order || i + 1),
          })),
          carbonCopies: req.recipients.filter(r => r.role === "cc").map((r, i) => ({
            email: r.email, name: r.name, recipientId: String(100 + i), routingOrder: "99",
          })),
        },
        status: "sent",
      },
    });
    return {
      providerEnvelopeId: response.envelopeId,
      status: "sent",
      recipients: req.recipients.map(r => ({ ...r, status: "pending" })),
      rawResponse: response,
    };
  },

  async getStatus(envelopeId, config) {
    const accountId = config.extra?.accountId || "";
    const response = await providerFetch(`${config.baseUrl || "https://demo.docusign.net/restapi"}/v2.1/accounts/${accountId}/envelopes/${envelopeId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
    });
    return {
      providerEnvelopeId: envelopeId,
      status: mapGenericStatus(response.status),
      recipients: [],
      rawResponse: response,
    };
  },

  async downloadSigned(envelopeId, config) {
    try {
      const accountId = config.extra?.accountId || "";
      const buffer = await providerFetch(`${config.baseUrl || "https://demo.docusign.net/restapi"}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${config.apiKey}` },
        isJson: false,
      });
      return { buffer, mimeType: "application/pdf", fileName: `signed-${envelopeId}.pdf` };
    } catch { return null; }
  },

  parseWebhook(payload, headers, config) {
    return {
      envelopeId: payload.data?.envelopeId || payload.envelopeId,
      status: mapGenericStatus(payload.event || payload.status),
      recipientEmail: payload.data?.recipientEmail,
      timestamp: payload.generatedDateTime || new Date().toISOString(),
      rawPayload: payload,
    };
  },

  async voidEnvelope(envelopeId, reason, config) {
    try {
      const accountId = config.extra?.accountId || "";
      await providerFetch(`${config.baseUrl || "https://demo.docusign.net/restapi"}/v2.1/accounts/${accountId}/envelopes/${envelopeId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${config.apiKey}` },
        body: { status: "voided", voidedReason: reason },
      });
      return true;
    } catch { return false; }
  },
};

// ============================================================================
// BOLDSIGN ADAPTER — $0.10/envelope
// ============================================================================

const boldSignAdapter: SigningProviderAdapter = {
  name: "boldsign",
  displayName: "BoldSign",
  pricePerEnvelope: "$0.10",

  async createEnvelope(req, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.boldsign.com"}/v1/document/send`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
      body: {
        title: req.documentName,
        message: req.message,
        fileUrls: [req.documentUrl],
        signers: req.recipients.filter(r => r.role === "signer").map((r, i) => ({
          name: r.name, emailAddress: r.email, signerOrder: r.order || i + 1, signerType: "Signer",
        })),
        cc: req.recipients.filter(r => r.role === "cc").map(r => ({ emailAddress: r.email })),
        enableSigningOrder: true,
      },
    });
    return {
      providerEnvelopeId: response.documentId,
      status: "sent",
      recipients: req.recipients.map(r => ({ ...r, status: "pending" })),
      rawResponse: response,
    };
  },

  async getStatus(envelopeId, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.boldsign.com"}/v1/document/properties?documentId=${envelopeId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
    });
    return {
      providerEnvelopeId: envelopeId,
      status: mapGenericStatus(response.status),
      recipients: (response.signerDetails || []).map((s: any) => ({
        name: s.signerName, email: s.signerEmail, role: "signer",
        status: s.status?.toLowerCase(), signedAt: s.signedDate,
      })),
      rawResponse: response,
    };
  },

  async downloadSigned(envelopeId, config) {
    try {
      const buffer = await providerFetch(`${config.baseUrl || "https://api.boldsign.com"}/v1/document/download?documentId=${envelopeId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${config.apiKey}` },
        isJson: false,
      });
      return { buffer, mimeType: "application/pdf", fileName: `signed-${envelopeId}.pdf` };
    } catch { return null; }
  },

  parseWebhook(payload, headers, config) {
    return {
      envelopeId: payload.documentId,
      status: mapGenericStatus(payload.event?.eventType || payload.status),
      recipientEmail: payload.event?.signerDetail?.signerEmail,
      timestamp: payload.event?.eventDateTime || new Date().toISOString(),
      rawPayload: payload,
    };
  },

  async voidEnvelope(envelopeId, reason, config) {
    try {
      await providerFetch(`${config.baseUrl || "https://api.boldsign.com"}/v1/document/void?documentId=${envelopeId}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${config.apiKey}` },
        body: { reason },
      });
      return true;
    } catch { return false; }
  },
};

// ============================================================================
// ESIGNLY ADAPTER — Flat rate
// ============================================================================

const eSignlyAdapter: SigningProviderAdapter = {
  name: "esignly",
  displayName: "eSignly",
  pricePerEnvelope: "Flat rate plan",

  async createEnvelope(req, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.esignly.com"}/api/v1/envelopes`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
      body: {
        name: req.documentName,
        document_url: req.documentUrl,
        subject: req.subject,
        message: req.message,
        signers: req.recipients.filter(r => r.role === "signer").map((r, i) => ({
          name: r.name, email: r.email, order: r.order || i + 1,
        })),
        webhook_url: req.callbackUrl,
      },
    });
    return {
      providerEnvelopeId: response.id || response.envelope_id,
      status: "sent",
      recipients: req.recipients.map(r => ({ ...r, status: "pending" })),
      rawResponse: response,
    };
  },

  async getStatus(envelopeId, config) {
    const response = await providerFetch(`${config.baseUrl || "https://api.esignly.com"}/api/v1/envelopes/${envelopeId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${config.apiKey}` },
    });
    return {
      providerEnvelopeId: envelopeId,
      status: mapGenericStatus(response.status),
      recipients: (response.signers || []).map((s: any) => ({
        name: s.name, email: s.email, role: "signer", status: s.status, signedAt: s.signed_at,
      })),
      signedDocumentUrl: response.signed_document_url,
      rawResponse: response,
    };
  },

  async downloadSigned(envelopeId, config) {
    try {
      const status = await this.getStatus(envelopeId, config);
      if (status.signedDocumentUrl) {
        const buffer = await providerFetch(status.signedDocumentUrl, {
          method: "GET", headers: {}, isJson: false,
        });
        return { buffer, mimeType: "application/pdf", fileName: `signed-${envelopeId}.pdf` };
      }
      return null;
    } catch { return null; }
  },

  parseWebhook(payload, headers, config) {
    return {
      envelopeId: payload.envelope_id || payload.id,
      status: mapGenericStatus(payload.event || payload.status),
      recipientEmail: payload.signer_email,
      signedDocumentUrl: payload.signed_document_url,
      timestamp: payload.timestamp || new Date().toISOString(),
      rawPayload: payload,
    };
  },

  async voidEnvelope(envelopeId, reason, config) {
    try {
      await providerFetch(`${config.baseUrl || "https://api.esignly.com"}/api/v1/envelopes/${envelopeId}/void`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.apiKey}` },
        body: { reason },
      });
      return true;
    } catch { return false; }
  },
};

// ============================================================================
// GENERIC STATUS MAPPER
// ============================================================================

function mapGenericStatus(status: string): EnvelopeResponse["status"] {
  if (!status) return "sent";
  const s = status.toLowerCase().replace(/[._-]/g, "");
  if (s.includes("draft")) return "draft";
  if (s.includes("sent") || s.includes("created") || s.includes("pending")) return "sent";
  if (s.includes("viewed") || s.includes("opened")) return "viewed";
  if (s.includes("completed") || s.includes("signed") || s.includes("finished")) return "completed";
  if (s.includes("declined") || s.includes("rejected")) return "declined";
  if (s.includes("voided") || s.includes("cancelled") || s.includes("canceled")) return "voided";
  if (s.includes("expired")) return "expired";
  return "sent";
}

// ============================================================================
// ADAPTER REGISTRY
// ============================================================================

const adapters: Record<string, SigningProviderAdapter> = {
  firma: firmaAdapter,
  signatureapi: signatureApiAdapter,
  docuseal: docuSealAdapter,
  pandadocs: pandaDocsAdapter,
  docusign: docuSignAdapter,
  boldsign: boldSignAdapter,
  esignly: eSignlyAdapter,
};

export function getSigningAdapter(providerName: string): SigningProviderAdapter | null {
  return adapters[providerName.toLowerCase()] || null;
}

export function getAllAdapters(): SigningProviderAdapter[] {
  return Object.values(adapters);
}

export function getAdapterInfo() {
  return Object.values(adapters).map(a => ({
    name: a.name,
    displayName: a.displayName,
    pricePerEnvelope: a.pricePerEnvelope,
  }));
}
