import React from "react";
import { useGraphServices } from "../../../../../graph/graphContext";
import type { ControlRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { buildControlRevisionReportFilter } from "../utils/controlRevisionReport";
import { buildApprovePayload, buildReturnedPayload, buildSendRevisionPayload } from "../utils/controlRevisionPayload";
import { useAuth } from "../../../../../auth/authProvider";

export function useFolderControlActions() {
  const graph = useGraphServices()
  const auth = useAuth()

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

  const handleUpdateSendRevision = async (cedula: string): Promise<{ ok: boolean; data: ControlRevisionCarpetas | null; message: string | null }> => {
    try {
      console.log("Buscando carpeta con cédula:", cedula);
      const carpetas = await graph.controlRevisionCarpetas.getAll({ filter: `fields/Cedula eq '${cedula}'`, top: 1 })
      console.log(carpetas)
      const carpeta = carpetas[0]
      if(carpeta.Id){
        console.log(carpeta.Id)
        const created = await graph.controlRevisionCarpetas.update(carpeta.Id, buildSendRevisionPayload(auth.account));
        console.log("Se ha actualizado la entidad de la carpeta con éxito", created)
        return { ok: true, data: created, message: null }
      }
      
      return { ok: false, data: null, message: "No se encontró la carpeta" }

    } catch(e) {
      return { ok: false, data: null, message: "Algo ha salido mal" + e }
    }
  };

  const handleUpdateReturned = async (cedula: string): Promise<{ ok: boolean; data: ControlRevisionCarpetas | null; message: string | null }> => {
    try {
      console.log("Buscando carpeta con cédula:", cedula);
      const carpetas = await graph.controlRevisionCarpetas.getAll({ filter: `fields/Cedula eq '${cedula}'`, top: 1 })
      console.log(carpetas)
      const carpeta = carpetas[0]
      if(carpeta.Id){
        const created = await graph.controlRevisionCarpetas.update(carpeta.Id, buildReturnedPayload(carpeta, auth.account));
        console.log("Se ha actualizado la entidad de la carpeta con éxito", created)
        return { ok: true, data: created, message: null }
      }
      
      return { ok: false, data: null, message: "No se encontró la carpeta" }

    } catch(e) {
      return { ok: false, data: null, message: "Algo ha salido mal" + e }
    }
  };

  const handleUpdateApprove = async (cedula: string): Promise<{ ok: boolean; data: ControlRevisionCarpetas | null; message: string | null }> => {
    try {
      console.log("Buscando carpeta con cédula:", cedula);
      const carpetas = await graph.controlRevisionCarpetas.getAll({ filter: `fields/Cedula eq '${cedula}'`, top: 1 })
      console.log(carpetas)
      const carpeta = carpetas[0]
      if(carpeta.Id){
        const created = await graph.controlRevisionCarpetas.update(carpeta.Id, buildApprovePayload(carpeta, auth.account));
        console.log("Se ha actualizado la entidad de la carpeta con éxito", created)
        return { ok: true, data: created, message: null }
      }
      
      return { ok: false, data: null, message: "No se encontró la carpeta" }

    } catch(e) {
      return { ok: false, data: null, message: "Algo ha salido mal" + e }
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
    loadToReport, handleSubmitBd, handleUpdateSendRevision, handleUpdateReturned, handleUpdateApprove

  };
}



