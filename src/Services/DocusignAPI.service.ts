// src/services/docusignContext.ts
import { getStoredAuth, isAuthValid, type DocusignAuthState } from "../auth/authDocusign";
import type { BulkSendBatchEnvelopesResponse, BulkSendListResponse, BulkSendRequestResponse, CreateBulkSendListInput, CreateBulkSendRequestInput, CreateDraftFromTemplateInput, DocGenFormFieldResponse, DocGenUpdateDocPayload, DocusignRecipient, DsContext, DsUserInfo, EnvelopeBasic, EnvelopeRecipients, PrefillTabsResponse, UpdateDocumentTabsResponse, UpdatePrefillTextTabPayload, UpdateRecipientTabsPayload } from "../models/Docusign";


const CTX_CACHE_KEY = "ds_ctx_v1";

/** AUTH server por ambiente */
function getAuthServer() {
  return "https://account.docusign.com";
}

async function readAuthOrThrow(): Promise<DocusignAuthState> {
  const auth = getStoredAuth();
  if (!isAuthValid(auth)) throw new Error("Token de DocuSign no disponible o expirado");
  return auth!;
}

export async function fetchUserInfo(accessToken: string, ): Promise<DsUserInfo> {
  const host = getAuthServer();

  const resp = await fetch(`${host}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}`,  "Content-Type": "application/json",},
  });

  const data = (await resp.json()) as DsUserInfo;

  if (!resp.ok) {
    throw new Error(`userinfo error ${resp.status}: ${JSON.stringify(data)}`);
  }
  if (!data?.accounts?.length) {
    throw new Error("userinfo no devolvió accounts (no hay cuentas asociadas al token)");
  }
  return data;
}


export async function getDocusignContext(forceRefresh = false): Promise<DsContext> {
  const auth = await readAuthOrThrow();

  if (!forceRefresh) {
    const raw = localStorage.getItem(CTX_CACHE_KEY);
    if (raw) {
      try {
        const cached = JSON.parse(raw) as DsContext;
        // si cambia el env, refrescamos
        if (cached?.accountId && cached?.baseUrl && cached?.env === auth.env) return cached;
      } catch {
        // ignore
      }
    }
  }

  const ui = await fetchUserInfo(auth.accessToken, );

  const acct =
    ui.accounts.find((a) => a.is_default) ??
    ui.accounts[0];

  if (!acct?.account_id || !acct?.base_uri) {
    throw new Error("No pude obtener account_id/base_uri desde userinfo");
  }

  const ctx: DsContext = {
    env: auth.env,
    accountId: acct.account_id,
    baseUrl: `${acct.base_uri}/restapi`,
    accountName: acct.account_name,
  };

  localStorage.setItem(CTX_CACHE_KEY, JSON.stringify(ctx));
  return ctx;
}

export function clearDocusignContextCache() {
  localStorage.removeItem(CTX_CACHE_KEY);
}

async function getAuthOrThrow(): Promise<DocusignAuthState> {
  const auth = getStoredAuth();
  if (!isAuthValid(auth)) throw new Error("Token de DocuSign no disponible o expirado");
  return auth!;
}

/** =========================
 * Listar plantillas
 * ========================= */
export async function listTemplates(params?: { searchText?: string; includeAdvanced?: boolean }) {
  const auth = await getAuthOrThrow();

  const url = new URL(`https://na4.docusign.net/restapi/v2.1/accounts/ad6ccb06-405a-421e-a436-22bf93803154/templates`);

  if (params?.searchText) url.searchParams.set("search_text", params.searchText);
  if (params?.includeAdvanced) url.searchParams.set("include_advanced_templates", "true");

  const resp = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      Accept: "application/json",
    },
  });

  const text = await resp.text();
  const data = text ? JSON.parse(text) : null;

  if (!resp.ok) {
    console.error("URL:", url.toString());
    console.error("Status:", resp.status, resp.statusText);
    console.error("Body:", data);
    throw new Error(`DocuSign error listTemplates: ${resp.status}`);
  }

  return data; // { envelopeTemplates: [...], resultSetSize, ... }
}

/** =========================
 * Crear sobre draft desde plantilla
 * ========================= */
export async function createEnvelopeFromTemplateDraft(input: CreateDraftFromTemplateInput): Promise<EnvelopeBasic> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const body = {
    templateId: input.templateId,
    emailSubject: input.emailSubject,
    emailBlurb: input.emailBlurb,
    templateRoles: input.roles.map((r) => ({
      email: r.email,
      name: r.name,
      roleName: r.roleName,
    })),
    status: "created", // draft
  };

  const resp = await fetch(`${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/envelopes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    console.error("Error creando envelope desde plantilla:", data);
    throw new Error(`DocuSign error createEnvelopeFromTemplateDraft: ${resp.status}`);
  }

  return { envelopeId: data.envelopeId, status: data.status };
}

/** =========================
 * Obtener recipients
 * ========================= */
export async function getEnvelopeRecipientsWithTabs(envelopeId: string): Promise<EnvelopeRecipients> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const url = `${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/envelopes/${envelopeId}/recipients`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      Accept: "application/json",
    },
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    console.error("Error obteniendo recipients del envelope:", data);
    throw new Error(`DocuSign error getEnvelopeRecipientsWithTabs: ${resp.status}`);
  }

  const allRecipients = [
    ...(data.signers ?? []),
    ...(data.certifiedDeliveries ?? []),
  ] as DocusignRecipient[];

  return { signers: allRecipients };
}

/** =========================
 * Actualizar tabs de recipient
 * ========================= */
export async function updateRecipientTabs(envelopeId: string, recipientId: string, tabs: UpdateRecipientTabsPayload): Promise<void> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const url = `${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(tabs),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    console.error("Error actualizando tabs del recipient:", data);
    throw new Error(`DocuSign error updateRecipientTabs: ${resp.status}`);
  }
}

/** =========================
 * Enviar sobre (status sent)
 * ========================= */
export async function sendEnvelope(envelopeId: string): Promise<void> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const url = `${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/envelopes/${envelopeId}`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status: "sent" }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    console.error("Error enviando envelope:", data);
    throw new Error(`DocuSign error sendEnvelope: ${resp.status}`);
  }
}

/** =========================
 * Tabs de documento
 * ========================= */
export async function getEnvelopeDocumentTabs(envelopeId: string, documentId: string): Promise<PrefillTabsResponse> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const resp = await fetch(
    `${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/envelopes/${envelopeId}/documents/${documentId}/tabs`,
    { headers: { Authorization: `Bearer ${auth.accessToken}`, Accept: "application/json" } }
  );

  if (resp.status === 404) {
    return { prefillTabs: { textTabs: [] } };
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Error obteniendo document tabs:", data);
    throw new Error(`DocuSign error getEnvelopeDocumentTabs: ${resp.status}`);
  }

  return data as PrefillTabsResponse;
}

/** =========================
 * DocGen form fields (GET)
 * ========================= */
export async function getEnvelopeDocGenFormFields(envelopeId: string): Promise<DocGenFormFieldResponse> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const resp = await fetch(
    `${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/envelopes/${envelopeId}/docGenFormFields`,
    { headers: { Authorization: `Bearer ${auth.accessToken}`, Accept: "application/json" } }
  );

  if (resp.status === 400) {
    return { docGenFormFields: [] };
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Error obteniendo docGenFormFields:", data);
    throw new Error(`DocuSign error getEnvelopeDocGenFormFields: ${resp.status}`);
  }

  return data as DocGenFormFieldResponse;
}

/** =========================
 * Prefill text tabs (PUT)
 * ========================= */
export async function updateEnvelopePrefillTextTabs(envelopeId: string, documentId: string, tabs: UpdatePrefillTextTabPayload[]): Promise<UpdateDocumentTabsResponse> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const payload = {
    prefillTabs: {
      textTabs: tabs.map((t) => ({
        tabId: t.tabId,
        value: t.value,
        documentId,
      })),
    },
  };

  const resp = await fetch(
    `${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/envelopes/${envelopeId}/documents/${documentId}/tabs`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Error actualizando prefill tabs:", data);
    throw new Error(`DocuSign error updateEnvelopePrefillTextTabs: ${resp.status}`);
  }

  return data as UpdateDocumentTabsResponse;
}

/** =========================
 * DocGen update (PUT)
 * ========================= */
export async function updateEnvelopeDocGenFormFields(envelopeId: string, docs: DocGenUpdateDocPayload[]): Promise<DocGenFormFieldResponse> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const payload: DocGenFormFieldResponse = {
    docGenFormFields: docs.map((d) => ({
      documentId: d.documentId,
      docGenFormFieldList: d.fields.map((f) => ({ name: f.name, value: f.value })),
    })),
  };

  const resp = await fetch(
    `${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/envelopes/${envelopeId}/docGenFormFields`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Error actualizando DocGen form fields:", data);
    throw new Error(`DocuSign error updateEnvelopeDocGenFormFields: ${resp.status}`);
  }

  return data as DocGenFormFieldResponse;
}

/** =========================
 * Update recipients (PUT)
 * ========================= */
export async function updateEnvelopeRecipients(envelopeId: string, recipients: EnvelopeRecipients, options?: { resendEnvelope?: boolean }): Promise<EnvelopeRecipients> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const resend = options?.resendEnvelope ? "true" : "false";

  const url = `${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/envelopes/${envelopeId}/recipients?resend_envelope=${resend}`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(recipients),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Error actualizando recipients del envelope:", data);
    throw new Error(`DocuSign error updateEnvelopeRecipients: ${resp.status}`);
  }

  return { signers: (data.signers ?? []) as DocusignRecipient[] };
}

/** =========================
 * Envelope info (GET)
 * ========================= */
export async function getEnvelopeInfo(envelopeId: string) {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const url = `${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/envelopes/${envelopeId}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${auth.accessToken}`, Accept: "application/json" },
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Error obteniendo envelope info:", data);
    throw new Error(`DocuSign error getEnvelopeInfo: ${resp.status}`);
  }

  return data;
}

export async function createBulkSendList(input: CreateBulkSendListInput): Promise<BulkSendListResponse> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const resp = await fetch(`${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/bulk_send_lists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Error createBulkSendList:", data);
    throw new Error(`DocuSign error createBulkSendList: ${resp.status}`);
  }

  return data as BulkSendListResponse;
}

export async function createBulkSendRequest(input: CreateBulkSendRequestInput): Promise<BulkSendRequestResponse> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const resp = await fetch(`${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/bulk_send_requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Error createBulkSendRequest:", data);
    throw new Error(`DocuSign error createBulkSendRequest: ${resp.status}`);
  }

  return data as BulkSendRequestResponse;
}

export async function getBulkSendBatchEnvelopes(batchId: string): Promise<BulkSendBatchEnvelopesResponse> {
  const auth = await getAuthOrThrow();
  const ctx = await getDocusignContext();

  const resp = await fetch(
    `${ctx.baseUrl}/v2.1/accounts/${ctx.accountId}/bulk_send_batches/${batchId}/envelopes`,
    { headers: { Authorization: `Bearer ${auth.accessToken}`, Accept: "application/json" } }
  );

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("Error getBulkSendBatchEnvelopes:", data);
    throw new Error(`DocuSign error getBulkSendBatchEnvelopes: ${resp.status}`);
  }

  return data as BulkSendBatchEnvelopesResponse;
}


