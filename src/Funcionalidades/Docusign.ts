import * as React from "react";
import { createEnvelopeFromTemplateDraft, getEnvelopeDocGenFormFields, getEnvelopeDocumentTabs, getEnvelopeInfo, getEnvelopeRecipientsWithTabs, listTemplates, type DocGenFormFieldResponse, type EnvelopeBasic, type PrefillTabsResponse } from "../Services/DocusignAPI.service";
import type { rsOption } from "../models/Commons";

export interface DocusignTemplateSummary {
  templateId: string;
  name: string;
  description?: string;
  lastModifiedDateTime?: string;
  [key: string]: any; // por si quieres acceder a más campos
}

type ListTemplatesResponse = {
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

type EnvelopeTabsResult = {
  tabs: PrefillTabsResponse;           // lo que devuelve getEnvelopeDocumentTabs
  documentGeneration: DocGenFormFieldResponse; // lo que devuelve docGenFormFields
};

export function useDocusignTemplates(options?: UseDocusignTemplatesOptions) {
  const { searchText, includeAdvanced, auto = true } = options || {};
  const [templates, setTemplates] = React.useState<DocusignTemplateSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [meta, setMeta] = React.useState<Pick<ListTemplatesResponse, "resultSetSize" | "totalSetSize">>({});
  const [templatesOptions, setTemplatesOptions] = React.useState<rsOption[]>([])

  const loadTemplates = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await listTemplates({
        searchText,
        includeAdvanced,
      })) as ListTemplatesResponse;

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

  // carga automática cuando cambian los filtros (a menos que auto=false)
  React.useEffect(() => {
    if (!auto) return;
    void loadTemplates();
  }, [auto, loadTemplates]);

  React.useEffect(() => {
    console.table(templates)
    const seen = new Set<string>();
    const next: rsOption[] = templates
        .map((item) => ({
          value: item.templateId,
          label: item.name ?? "",
        }))
        .filter((opt) => {
        if (seen.has(opt.value)) return false;
        seen.add(opt.value);
        return true;
        });
    setTemplatesOptions(next);
    }, [templates]);

  const createdraft = React.useCallback(async (templateId: string): Promise<EnvelopeBasic> => {
      setLoading(true);
      setError(null);
      try {
        const draft = await createEnvelopeFromTemplateDraft({
          templateId,
          emailSubject: "Firma de documento",
          emailBlurb: "Por favor revisa y firma.",
          roles: [
          ],
        });
        return draft;
      } catch (e) {
        const err =
          e instanceof Error ? e : new Error("Error desconocido al listar plantillas");
        setError(err);
        throw err;                 
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getRecipients = React.useCallback(async (envelopeId: string) => {
    const { signers } = await getEnvelopeRecipientsWithTabs(envelopeId);
    return signers
  }, [searchText, includeAdvanced]);

  const getTabsFromSendEnvelope = React.useCallback(
    async (envelopeId: string): Promise<EnvelopeTabsResult> => {
      const [tabs, documentGenerationsFields] = await Promise.all([
        getEnvelopeDocumentTabs(envelopeId, "1"),   // documento 1
        getEnvelopeDocGenFormFields(envelopeId),
      ]);

      return {
        tabs,
        documentGeneration: documentGenerationsFields,
      };
    },
    []
  );

  const getenvelopeInfo = React.useCallback(async (envelopeId: string) => {
    const info =await getEnvelopeInfo(envelopeId)
    return info;
  }, []);


  return {
    templates, loading, error, meta, templatesOptions,
    reload: loadTemplates, createdraft, getRecipients, getTabsFromSendEnvelope, getenvelopeInfo
  };
}
