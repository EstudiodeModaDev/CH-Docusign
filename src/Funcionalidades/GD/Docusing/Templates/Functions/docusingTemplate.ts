import type { EnvelopeBasic, EnvelopeTabsResult, ListTemplatesResponse } from "../../../../../models/Docusign";
import { createEnvelopeFromTemplateDraft, getEnvelopeDocGenFormFields, getEnvelopeDocumentTabs, getEnvelopeInfo, getEnvelopeRecipientsWithTabs, listTemplates } from "../../../../../Services/DocusignAPI.service";

export async function fetchTemplates(args: {
  searchText?: string;
  includeAdvanced?: boolean;
}) {
  return (await listTemplates({
    searchText: args.searchText,
    includeAdvanced: args.includeAdvanced,
  })) as ListTemplatesResponse;
}

export async function createTemplateDraft(templateId: string): Promise<EnvelopeBasic> {
  return createEnvelopeFromTemplateDraft({
    templateId,
    emailSubject: "Firma de documento",
    emailBlurb: "Por favor revisa y firma.",
    roles: [],
  });
}

export async function fetchEnvelopeRecipients(envelopeId: string) {
  const { signers } = await getEnvelopeRecipientsWithTabs(envelopeId);
  return signers;
}

export async function fetchEnvelopeTabs(
  envelopeId: string
): Promise<EnvelopeTabsResult> {
  const [tabs, documentGeneration] = await Promise.all([
    getEnvelopeDocumentTabs(envelopeId, "1"),
    getEnvelopeDocGenFormFields(envelopeId),
  ]);

  return {
    tabs,
    documentGeneration,
  };
}

export async function fetchEnvelopeInfo(envelopeId: string) {
  return getEnvelopeInfo(envelopeId);
}