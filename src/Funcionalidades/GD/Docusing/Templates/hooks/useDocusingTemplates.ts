import * as React from "react";
import { mapTemplatesToOptions } from "../utils/templateOptions";
import type { DocusignTemplateSummary, EnvelopeBasic, ListTemplatesResponse, UseDocusignTemplatesOptions } from "../../../../../models/Docusign";
import type { rsOption } from "../../../../../models/Commons";
import { createTemplateDraft, fetchEnvelopeInfo, fetchEnvelopeRecipients, fetchEnvelopeTabs, fetchTemplates } from "../Functions/docusingTemplate";

export function useDocusignTemplates(options?: UseDocusignTemplatesOptions) {
  const { searchText, includeAdvanced, auto = true } = options || {};

  const [templates, setTemplates] = React.useState<DocusignTemplateSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [meta, setMeta] = React.useState<Pick<ListTemplatesResponse, "resultSetSize" | "totalSetSize">  >({});
  const [templatesOptions, setTemplatesOptions] = React.useState<rsOption[]>([]);

  const loadTemplates = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTemplates({ searchText, includeAdvanced });

      setTemplates(data.envelopeTemplates ?? []);
      setMeta({
        resultSetSize: data.resultSetSize,
        totalSetSize: data.totalSetSize,
      });
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("Error desconocido al listar plantillas");

      setError(err);
      setTemplates([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, [searchText, includeAdvanced]);

  React.useEffect(() => {
    if (!auto) return;
    void loadTemplates();
  }, [auto, loadTemplates]);

  React.useEffect(() => {
    setTemplatesOptions(mapTemplatesToOptions(templates));
  }, [templates]);

  const createdraft = React.useCallback(async (templateId: string, asunto: string): Promise<EnvelopeBasic> => {
    setLoading(true);
    setError(null);

    try {
      return await createTemplateDraft(templateId, asunto);
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("Error desconocido creando draft");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRecipients = React.useCallback(async (envelopeId: string) => {
    return fetchEnvelopeRecipients(envelopeId);
  }, []);

  const getTabsFromSendEnvelope = React.useCallback(async (envelopeId: string) => {
    return fetchEnvelopeTabs(envelopeId);
  }, []);

  const getenvelopeInfo = React.useCallback(async (envelopeId: string) => {
    return fetchEnvelopeInfo(envelopeId);
  }, []);

  return {
    templates,
    loading,
    error,
    meta,
    templatesOptions,
    reload: loadTemplates,
    createdraft,
    getRecipients,
    getTabsFromSendEnvelope,
    getenvelopeInfo,
  };
}