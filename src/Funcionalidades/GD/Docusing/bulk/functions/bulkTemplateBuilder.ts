import type { CsvTemplateBuild } from "../../../../../models/csv";
import type { DocusignRecipient } from "../../../../../models/Docusign";
import { getEnvelopeDocGenFormFields, getEnvelopeDocumentTabs } from "../../../../../Services/DocusignAPI.service";
import { buildFieldHeaders, buildRoleHeaders, uniqKeepOrder } from "../utils/bulkHeader";

export async function generateCsvForTemplate(args: {templateId: string; templateName?: string; createdraft: (templateId: string, asunto: string) => Promise<{ envelopeId: string }>; getRecipients: (envelopeId: string) => Promise<DocusignRecipient[]>;}): Promise<CsvTemplateBuild> {
  const { templateId, createdraft, getRecipients } = args;

  const draft = await createdraft(templateId, "");
  const envelopeId = draft.envelopeId;

  const signers = await getRecipients(envelopeId);

  const [tabs, docGen] = await Promise.all([
    getEnvelopeDocumentTabs(envelopeId, "1"),
    getEnvelopeDocGenFormFields(envelopeId),
  ]);

  const roleHeaders = buildRoleHeaders(signers);
  const fieldHeaders = buildFieldHeaders(tabs, docGen);
  const headers = uniqKeepOrder(["ReferenceId", ...roleHeaders, ...fieldHeaders]);

  const exampleRow = headers.map((h) => (h === "ReferenceId" ? "ROW-001" : ""));

  return {
    headers,
    exampleRow,
    meta: { roleHeaders, fieldHeaders },
  };
}