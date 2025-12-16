import {getStoredAuth, isAuthValid, type DocusignAuthState,} from "../auth/authDocusign";

const ACCOUNT_ID = "a028a3df-f534-4117-b15e-c20aa614e9b1";
const BASE_URL = /*"https://na4.docusign.net/restapi";*/  "https://demo.docusign.net/restapi"


async function getAuthOrThrow(): Promise<DocusignAuthState> {
  const auth = getStoredAuth();
  if (!isAuthValid(auth)) {
    throw new Error("Token de DocuSign no disponible o expirado");
  }
  return auth!;
}

/** Listar plantillas del account */
export async function listTemplates(params?: {searchText?: string; includeAdvanced?: boolean;}) {
  const auth = await getAuthOrThrow();

  const url = new URL(
    `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/templates`
  );

  if (params?.searchText) {
    url.searchParams.set("search_text", params.searchText);
  }
  if (params?.includeAdvanced) {
    url.searchParams.set("include_advanced_templates", "true");
  }

  const resp = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
    },
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Error listando plantillas:", data);
    throw new Error("DocuSign devolvió error al listar plantillas");
  }

  return data; // viene algo como { envelopeTemplates: [ ... ], resultSetSize, ... }
}

// Tipos auxiliares para sobres

export interface DsTemplateRoleInput {
  roleName: string;
  name: string;
  email: string;
}

export interface CreateDraftFromTemplateInput {
  templateId: string;
  emailSubject: string;
  emailBlurb?: string;
  roles: DsTemplateRoleInput[];
}

export interface EnvelopeBasic {
  envelopeId: string;
  status: string;
}

export interface DocusignRecipientTabs {
  textTabs?: Array<{
    tabId: string;
    tabLabel?: string;
    value?: string;
  }>;
  // Si en el futuro usas más tipos, los agregas aquí:
  // dateTabs?: Array<{ tabId: string; tabLabel?: string; value?: string }>;
  // checkboxTabs?: Array<{ tabId: string; tabLabel?: string; selected?: 'true' | 'false' }>;
}

export interface DocusignRecipient {
  recipientId: string;
  email: string;
  name: string;
  roleName?: string;
  tabs?: DocusignRecipientTabs;
  routingOrder?: string;
  status?: string;
}

export interface EnvelopeRecipients {
  signers: DocusignRecipient[];
}

export interface UpdateRecipientTabsPayload {
  textTabs?: Array<{ tabId: string; value: string }>;
}

export interface PrefillTabsResponse {
  prefillTabs?: {
    textTabs?: Array<{
      tabId?: string;
      tabLabel?: string;
      value?: string;
      documentId?: string;
      pageNumber?: string;
      [k: string]: any;
    }>;
    [k: string]: any;
  };
  [k: string]: any;
}

export interface DocGenFormField {
  name: string;
  label?: string;
  type?: string;
  required?: string;
  value?: string;
  [k: string]: any;
}

export interface DocGenFormFieldsByDoc {
  documentId: string;
  docGenFormFieldList: DocGenFormField[];
}

export interface DocGenFormFieldResponse {
  docGenFormFields: DocGenFormFieldsByDoc[];
}

export interface UpdatePrefillTextTabPayload {
  tabId: string;
  value: string;
}

export interface UpdateDocumentTabsResponse {
  [k: string]: any;
}

export interface DocGenUpdateDocPayload {
  documentId: string;
  fields: Array<{
    name: string;
    value: string;
  }>;
}


//Crear sobre desde plantilla en estado draft
export async function createEnvelopeFromTemplateDraft(input: CreateDraftFromTemplateInput ): Promise<EnvelopeBasic> {
  const auth = await getAuthOrThrow();

  const body = {
    templateId: input.templateId,
    emailSubject: input.emailSubject,
    emailBlurb: input.emailBlurb,
    templateRoles: input.roles.map(r => ({
      email: r.email,
      name: r.name,
      roleName: r.roleName,
    })),
    status: "created", // 👈 importante: se queda como borrador
  };

  const resp = await fetch(
    `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/envelopes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Error creando envelope desde plantilla:", data);
    throw new Error("DocuSign devolvió error al crear el sobre");
  }

  return {
    envelopeId: data.envelopeId,
    status: data.status,
  };
}

//Obtener recipients
export async function getEnvelopeRecipientsWithTabs(envelopeId: string): Promise<EnvelopeRecipients> {
  const auth = await getAuthOrThrow();

  const url = `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}/recipients`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
    },
  });

  const data = await resp.json();

  if (!resp.ok) {
    console.error("Error obteniendo recipients del envelope:", data);
    throw new Error("DocuSign devolvió error al obtener los recipients");
  }

  
  const allRecipients = [
    ...(data.signers ?? []),
    ...(data.certifiedDeliveries ?? []),
  ] as DocusignRecipient[];

  return {
    signers: allRecipients as DocusignRecipient[],
  };
}

//Actualizar tabs de un recipient (llenar campos)
export async function updateRecipientTabs(
  envelopeId: string,
  recipientId: string,
  tabs: UpdateRecipientTabsPayload
): Promise<void> {
  const auth = await getAuthOrThrow();

  const url = `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}/recipients/${recipientId}/tabs`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tabs),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    console.error("Error actualizando tabs del recipient:", data);
    throw new Error("DocuSign devolvió error al actualizar los tabs");
  }
}

// 4) Enviar el sobre (cambiar estado a sent)
export async function sendEnvelope(envelopeId: string): Promise<void> {
  const auth = await getAuthOrThrow();

  const url = `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "sent" }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    console.error("Error enviando envelope:", data);
    throw new Error("DocuSign devolvió error al enviar el sobre");
  }
}

export async function getEnvelopeDocumentTabs(envelopeId: string, documentId: string ): Promise<PrefillTabsResponse> {
  const auth = await getAuthOrThrow();

  const resp = await fetch(
    `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}/documents/${documentId}/tabs`,
    {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    }
  );

  if(resp.status === 404) {
    alert("El sobre no tiene campos de prefill tabs.");
    return { prefillTabs: { textTabs: [] } };
  }

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Error obteniendo document tabs:", data);
    throw new Error("DocuSign devolvió error al obtener los document tabs");
  }

  return data as PrefillTabsResponse;
}

export async function getEnvelopeDocGenFormFields(envelopeId: string): Promise<DocGenFormFieldResponse> {
  const auth = await getAuthOrThrow();

  const resp = await fetch(
    `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}/docGenFormFields`,
    {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    }
  );

  if(resp.status === 400) {
    alert("El sobre no tiene campos de generación de documentos.");
    return { docGenFormFields: [] };
  }

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Error obteniendo docGenFormFields:", data);
    throw new Error("DocuSign devolvió error al obtener los docGenFormFields");
  }

  return data as DocGenFormFieldResponse;
}

export async function updateEnvelopePrefillTextTabs(envelopeId: string, documentId: string, tabs: UpdatePrefillTextTabPayload[]): Promise<UpdateDocumentTabsResponse> {
  const auth = await getAuthOrThrow();

  const payload = {
    prefillTabs: {
      textTabs: tabs.map(t => ({
        tabId: t.tabId,
        value: t.value,
        documentId,
      })),
    },
  };

  const resp = await fetch(
    `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}/documents/${documentId}/tabs`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    console.error("Error actualizando prefill tabs:", data);
    throw new Error("DocuSign devolvió error al actualizar los prefill tabs");
  }

  return data as UpdateDocumentTabsResponse;
}

// DOC GEN — ACTUALIZAR
export async function updateEnvelopeDocGenFormFields(envelopeId: string, docs: DocGenUpdateDocPayload[]): Promise<DocGenFormFieldResponse> {
  const auth = await getAuthOrThrow();

  const payload: DocGenFormFieldResponse = {
    docGenFormFields: docs.map(d => ({
      documentId: d.documentId,
      docGenFormFieldList: d.fields.map(f => ({
        name: f.name,
        value: f.value,
      })),
    })),
  };

  const resp = await fetch(
    `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}/docGenFormFields`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    console.error("Error actualizando DocGen form fields:", data);
    throw new Error("DocuSign devolvió error al actualizar los DocGen form fields");
  }

  return data as DocGenFormFieldResponse;
}

export async function updateEnvelopeRecipients(envelopeId: string, recipients: EnvelopeRecipients, options?: { resendEnvelope?: boolean }): Promise<EnvelopeRecipients> {
  const auth = await getAuthOrThrow();

  const resend = options?.resendEnvelope ? "true" : "false";

  const url = `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}/recipients?resend_envelope=${resend}`;

  const resp = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(recipients),
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Error actualizando recipients del envelope:", data);
    throw new Error("DocuSign devolvió error al actualizar los recipients");
  }

  // DocuSign responde con la estructura de recipients resultante
  return {
    signers: (data.signers ?? []) as DocusignRecipient[],
    // agrega otros tipos si los manejas
  };
}

export async function getEnvelopeInfo(envelopeId: string) {
  const auth = await getAuthOrThrow();

  const url = `${BASE_URL}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeId}`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Error obteniendo envelope info:", data);
    throw new Error("DocuSign devolvió error al obtener info del sobre");
  }

  return data;
}
