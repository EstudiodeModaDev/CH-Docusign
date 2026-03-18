import type { DocGenFormFieldResponse, DocusignRecipient, PrefillTabsResponse } from "../../../../../models/Docusign";
import { sanitizeHeader } from "../../../../../utils/csv";


export function uniqKeepOrder(arr: string[]) {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const k = x.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function buildRoleHeaders(signers: DocusignRecipient[]) {
  const roles = uniqKeepOrder(
    signers
      .map((s) => sanitizeHeader(s.roleName || `Signer_${s.recipientId}`))
      .filter(Boolean)
  );

  const cols: string[] = [];
  for (const role of roles) {
    cols.push(`${role}_Name`, `${role}_Email`);
  }

  return cols;
}

export function buildFieldHeaders(tabs: PrefillTabsResponse, docGen: DocGenFormFieldResponse) {
  const prefill = (tabs.prefillTabs?.textTabs ?? [])
    .map((t) => sanitizeHeader(t.tabLabel ?? t.tabId ?? ""))
    .filter(Boolean);

  const docGenFields = (docGen.docGenFormFields ?? [])
    .flatMap((d) => d.docGenFormFieldList ?? [])
    .map((f) => sanitizeHeader(f.name ?? f.label ?? ""))
    .filter(Boolean);

  return uniqKeepOrder([...prefill, ...docGenFields]);
}