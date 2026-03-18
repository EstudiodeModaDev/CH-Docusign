import type { rsOption } from "../../../../../models/Commons";
import type { DocusignTemplateSummary } from "../../../../../models/Docusign";

export function mapTemplatesToOptions(templates: DocusignTemplateSummary[]): rsOption[] {
  const seen = new Set<string>();

  return templates
    .map((item) => ({
      value: item.templateId,
      label: item.name ?? "",
    }))
    .filter((opt) => {
      if (seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
}