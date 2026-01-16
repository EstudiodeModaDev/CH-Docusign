import type { BulkCopy, DocGenFormFieldResponse, DocusignRecipient, PrefillTabsResponse } from "../../models/Docusign";
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

type Row = Record<string, string>;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email ?? "").trim());
}

export function buildBulkCopiesFromGrid(columns: string[], rows: Row[]): BulkCopy[] {
  const roleMap = new Map<string, { nameCol: string; emailCol: string }>();

  for (const col of columns) {
    const mName = col.match(/^(.*)_Name$/);
    const mEmail = col.match(/^(.*)_Email$/);
    if (mName?.[1]) {
      const role = mName[1];
      const prev = roleMap.get(role) ?? { nameCol: "", emailCol: "" };
      roleMap.set(role, { ...prev, nameCol: col });
    }
    if (mEmail?.[1]) {
      const role = mEmail[1];
      const prev = roleMap.get(role) ?? { nameCol: "", emailCol: "" };
      roleMap.set(role, { ...prev, emailCol: col });
    }
  }

  const roles = Array.from(roleMap.entries()).map(([roleName, cols]) => ({
    roleName,
    nameCol: cols.nameCol,
    emailCol: cols.emailCol,
  }));

  if (!roles.length) {
    throw new Error("No detecté roles. Asegúrate de tener columnas como COLABORADOR_Name y COLABORADOR_Email.");
  }

  const roleCols = new Set<string>();
  roles.forEach(r => { if (r.nameCol) roleCols.add(r.nameCol); if (r.emailCol) roleCols.add(r.emailCol); });

  const tabCols = columns.filter(c => c !== "ReferenceId" && !roleCols.has(c));

  // Validaciones
  const refSeen = new Set<string>();

  rows.forEach((r, idx) => {
    const rowNum = idx + 1;
    const ref = (r["ReferenceId"] ?? "").trim();
    if (!ref) throw new Error(`Fila ${rowNum}: ReferenceId vacío`);
    if (refSeen.has(ref)) throw new Error(`Fila ${rowNum}: ReferenceId duplicado (${ref})`);
    refSeen.add(ref);

    for (const role of roles) {
      const name = (r[role.nameCol] ?? "").trim();
      const email = (r[role.emailCol] ?? "").trim();
      if (!name) throw new Error(`Fila ${rowNum}: falta ${role.nameCol}`);
      if (!email) throw new Error(`Fila ${rowNum}: falta ${role.emailCol}`);
      if (!isValidEmail(email)) throw new Error(`Fila ${rowNum}: email inválido (${email})`);
    }
  });

  // Construcción
  return rows.map((r) => {
    const referenceId = (r["ReferenceId"] ?? "").trim();

    const recipients = roles.map((role) => ({
      roleName: role.roleName,
      name: (r[role.nameCol] ?? "").trim(),
      email: (r[role.emailCol] ?? "").trim(),
    }));

    const textTabs = tabCols
      .map((tabLabel) => {
        const value = (r[tabLabel] ?? "").trim();
        return value ? { tabLabel, value } : null;
      })
      .filter((x): x is { tabLabel: string; value: string } => x !== null);

    return {
      recipients,
      tabs: textTabs.length ? { textTabs } : undefined,
      customFields: {
        textCustomFields: [{ name: "ReferenceId", value: referenceId, show: "false" }],
      },
    };
  });
}

