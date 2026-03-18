import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import { buildHabeasCreatePayload } from "../utils/habeasPayload";
import type { HabeasData } from "../../../../models/HabeasData";
import { buildHabeasReportFilter } from "../utils/habeasFilters";
import { buildHabeasPatch } from "../utils/habeasPatch";

export function useHabeasActions() {
  const graph = useGraphServices()

  const handleSubmitBd = async (state: HabeasData): Promise<HabeasData> => {
    try {
      const payload = buildHabeasCreatePayload(state)
      const created = await graph.HabeasData.create(payload);
      alert("Se ha creado el registro con éxito")
      return created
    } catch {
      throw new Error("Algo ha salido mal")
    }
  };

  const loadToReport = React.useCallback(async (from: string, to: string, EnviadoPor?: string, destinatario?: string, plantilla?: string): Promise<{ok: boolean, data: HabeasData[], message: string | null}> => {
    try {
      const { items, } = await graph.HabeasData.getAll(buildHabeasReportFilter(from, to, EnviadoPor, destinatario, plantilla),); 
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

  const handleEditBd = async (habeasSeleccionado: HabeasData, state: HabeasData): Promise<{data: HabeasData | null, ok: boolean, message: string | null}> => {
    try {
      const payload = buildHabeasPatch(habeasSeleccionado, state);

      if (Object.keys(payload).length === 0) {
        alert("No hay cambios para guardar");
        return{
          data: null,
          message: "Exitoso",
          ok: true,
        }
      }
      const updated = await graph.HabeasData.update(habeasSeleccionado.Id!, payload);
      alert("Se ha actualizado el registro con éxito")
      return {
        data: updated,
        message: "Exitoso",
        ok: true
      }
    } catch {
      throw new Error("Algo ha salido mal")
    }
  };

  const deleteHabeasDataBd = React.useCallback(async (Id: string) => {
      try {
        await graph.HabeasData.delete(Id);
      } catch {
        throw new Error("Ha ocurrido un error eliminando la cesación");
      }
    },
    []
  );

  return {
    loadToReport, handleSubmitBd, handleEditBd, deleteHabeasDataBd

  };
}



