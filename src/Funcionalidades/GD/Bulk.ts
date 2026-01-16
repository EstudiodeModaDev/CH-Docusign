import type { DocGenFormFieldResponse, DocusignRecipient, PrefillTabsResponse } from "../../models/Docusign";
import { getEnvelopeDocGenFormFields, getEnvelopeDocumentTabs } from "../../Services/DocusignAPI.service";
import { downloadTextFile, sanitizeHeader, toCsvLine } from "../../utils/csv";


type CsvTemplateBuild = {
  headers: string[];
  exampleRow: string[];
  meta: {
    roleHeaders: string[];
    fieldHeaders: string[];
  };
};

function uniqKeepOrder(arr: string[]) {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const k = x.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function buildRoleHeaders(signers: DocusignRecipient[]) {
  const roles = uniqKeepOrder(signers.map((s) => sanitizeHeader(s.roleName || `Signer_${s.recipientId}`)).filter(Boolean));

  const cols: string[] = [];
  for (const role of roles) {
    cols.push(`${role}_Name`, `${role}_Email`);
  }
  return cols;
}

function buildFieldHeaders(tabs: PrefillTabsResponse, docGen: DocGenFormFieldResponse) {
  const prefill = (tabs.prefillTabs?.textTabs ?? [])
    .map((t) => sanitizeHeader(t.tabLabel ?? t.tabId ?? ""))
    .filter(Boolean);

  const docGenFields = (docGen.docGenFormFields ?? [])
    .flatMap((d) => d.docGenFormFieldList ?? [])
    .map((f) => sanitizeHeader(f.name ?? f.label ?? ""))
    .filter(Boolean);

  // Evita duplicados
  return uniqKeepOrder([...prefill, ...docGenFields]);
}

export async function generateCsvForTemplate(args: {templateId: string; templateName?: string; createdraft: (templateId: string) => Promise<{ envelopeId: string }>; getRecipients: (envelopeId: string) => Promise<DocusignRecipient[]>;}) : Promise<CsvTemplateBuild> {
  const { templateId, createdraft, getRecipients, } = args;

  // 1) Draft
  const draft = await createdraft(templateId);
  const envelopeId = draft.envelopeId;

  // 2) Roles (recipients)
  const signers = await getRecipients(envelopeId);

  // 3) Campos del documento
  const [tabs, docGen] = await Promise.all([
    getEnvelopeDocumentTabs(envelopeId, "1"),
    getEnvelopeDocGenFormFields(envelopeId),
  ]);

  const roleHeaders = buildRoleHeaders(signers);
  const fieldHeaders = buildFieldHeaders(tabs, docGen);

  const headers = uniqKeepOrder(["ReferenceId", ...roleHeaders, ...fieldHeaders]);

  // Fila ejemplo vacía (ReferenceId con un valor)
  const exampleRow = headers.map((h) => (h === "ReferenceId" ? "ROW-001" : ""));

  return {
    headers,
    exampleRow,
    meta: { roleHeaders, fieldHeaders },
  };
}

export function downloadCsvTemplate(build: CsvTemplateBuild, opts: { fileName: string }) {
  const csv = `${toCsvLine(build.headers)}\n${toCsvLine(build.exampleRow)}\n`;
  downloadTextFile(opts.fileName, csv);
}

