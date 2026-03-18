import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import type { Envio,} from "../../../../models/Envios";
import { buildEnviosReportFilter } from "../utils/enviosFilters";
import { enviosPayload } from "../utils/enviosPayload";

export function useEnviosActions() {
  const graph = useGraphServices()

  const canEdit = async (id: string, fuente: string): Promise<"view" | "edit"> => {
    const obtener = (await graph.Envios.getAll({top: 1, filter: `fields/ID_Novedad eq '${id}' and fields/Fuente eq '${fuente}'`, orderby: "fields/Created desc"})).items;
    return obtener.length > 0 ? "view" : "edit";
  };

  const handleSubmitBd = async (state: Envio) => {
    try {
      const payload = enviosPayload(state)
      await graph.Envios.create(payload);
      alert("Se ha creado el registro con éxito")
    } catch {
      throw new Error("Algo ha salido mal")
    }
  };

  const loadToReport = React.useCallback(async (from: string, to: string, EnviadoPor?: string, destinatario?: string, plantilla?: string): Promise<{ok: boolean, data: Envio[], message: string | null}> => {
    try {
      const { items, } = await graph.Envios.getAll(buildEnviosReportFilter(from, to, EnviadoPor, destinatario, plantilla),); 
      return {
        data: items,
        message: null,
        ok: true
      }
    } catch (e: any) {
      return {
        data: [],
        message: "Algo ha salido mal, " + e,
        ok: false
      }
    } 
  }, []);

  return {
    loadToReport, canEdit, handleSubmitBd,

  };
}



