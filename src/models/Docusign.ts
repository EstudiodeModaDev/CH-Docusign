export type DsUserInfoAccount = {
  account_id: string;
  base_uri: string; // ej: https://na4.docusign.net
  is_default?: boolean;
  account_name?: string;
};

export type DsUserInfo = {
  sub: string;
  name?: string;
  email?: string;
  accounts: DsUserInfoAccount[];
};

export type DsContext = {
  env: "prod" | "demo";
  accountId: string;
  baseUrl: string; // base_uri + "/restapi"
  accountName?: string;
};

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
  fields: Array<{ name: string; value: string }>;
}

export type BulkRole = { roleName: string; name: string; email: string };

export type BulkCopy = {
  recipients: BulkRole[];
  tabs?: { textTabs?: Array<{ tabLabel: string; value: string }> };
  customFields: [{ name: string, value: string, show: "false" }],
};

export type BulkSendSendResponse = {
  bulkSendBatchId?: string;
  batchId?: string;
  [k: string]: any;
};

export type CreateBulkSendListInput = {
  name: string;
  bulkCopies: BulkCopy[];
};

export type BulkSendListResponse = {
  bulkSendListId: string;
  name?: string;
  totalCopies?: number;
  [k: string]: any;
};

export type CreateBulkSendRequestInput = {
  templateId: string;
  bulkSendListId: string;
};

export type BulkSendRequestResponse = {
  bulkSendBatchId?: string; // algunas cuentas lo retornan así
  batchId?: string;         // otras así
  bulkSendRequestId?: string;
  [k: string]: any;
};

export type BulkSendBatchEnvelopesResponse = {
  envelopes?: Array<{
    envelopeId: string;
    status?: string;
    // según configuración puede venir customFields
    customFields?: {
      textCustomFields?: Array<{ name: string; value: string }>;
    };
    errorDetails?: any;
    [k: string]: any;
  }>;
  [k: string]: any;
};

export interface DocusignTemplateSummary {
  templateId: string;
  name: string;
  description?: string;
  lastModifiedDateTime?: string;
  [key: string]: any; // por si quieres acceder a más campos
}

export type ListTemplatesResponse = {
  envelopeTemplates?: DocusignTemplateSummary[];
  resultSetSize?: string;
  totalSetSize?: string;
  [key: string]: any;
};

export type UseDocusignTemplatesOptions = {
  searchText?: string;
  includeAdvanced?: boolean;
  auto?: boolean; // si false, no carga automáticamente
};

export type EnvelopeTabsResult = {
  tabs: PrefillTabsResponse;           // lo que devuelve getEnvelopeDocumentTabs
  documentGeneration: DocGenFormFieldResponse; // lo que devuelve docGenFormFields
};