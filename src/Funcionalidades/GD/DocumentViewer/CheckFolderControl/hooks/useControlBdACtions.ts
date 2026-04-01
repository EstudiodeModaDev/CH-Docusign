import React from "react";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { ControlRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { buildControlRevisionReportFilter } from "../utils/controlRevisionReport";

export function useFolderControlActions() {
  const graph = useGraphServices()

  const handleSubmitBd = async (state: Partial<ControlRevisionCarpetas>): Promise<ControlRevisionCarpetas> => {
    try {
      console.log("Enviando a creación con estado:", state);
      const created = await graph.controlRevisionCarpetas.create(state);
      console.log("Se ha creado la entidad de la carpeta con éxito", created)
      return created
    } catch {
      throw new Error("Algo ha salido mal")
    }
  };

  const loadToReport = React.useCallback(async (from: string, to: string, empresa?: string, estado?: string): Promise<{ok: boolean, data: ControlRevisionCarpetas[], message: string | null}> => {
    try {
      const res = await graph.controlRevisionCarpetas.getAll(buildControlRevisionReportFilter(from, to, empresa, estado),); 
      return {
        data: res ?? [],
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
    loadToReport, handleSubmitBd,

  };
}



