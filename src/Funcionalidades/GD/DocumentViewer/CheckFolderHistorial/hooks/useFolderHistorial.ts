import React from "react";
import { useFolderControlForm } from "./userControlForm";
import type { HistorialRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { buildSendRevisionPayload } from "../utils/controlRevisionPayload";
import { useFolderHistorialActions } from "./useControlBdACtions";
import { useSpecificFolderHistorialSearch } from "./useControlSearcher";
import { useAuth } from "../../../../../auth/authProvider";
import { useFolderControlActions } from "../../CheckFolderControl/hooks/useControlBdACtions";
import { useGraphServices } from "../../../../../graph/graphContext";
import { notifyApprovedFolder, notifyFolderReady, notifyReturnedFolder } from "../utils/notifications";

export function useFolderHistorial(folderInfo: {cedula: string, nombre: string, fullname: string, path: string},) {
  const formController = useFolderControlForm(folderInfo,)
  const actionsController = useFolderHistorialActions()
  const searchesController = useSpecificFolderHistorialSearch()
  const integration = useFolderControlActions()
  const auth = useAuth()
  const graph = useGraphServices()

  const [loading, setLoading] = React.useState(false);

  const sendFolderToRevision = async (folderInfo: {cedula: string, nombre: string, fullname: string, path: string}): Promise<{ created: HistorialRevisionCarpetas | null; ok: boolean }> => {
    setLoading(true);

    try {
      console.log("Actualizando la entidad con path:", folderInfo.path);
      console.log(folderInfo)
      const entityUpdated = await integration.handleUpdateSendRevision(folderInfo.cedula.trim());
      
      const state: HistorialRevisionCarpetas = {
        Accion: "Envío a revisión",
        Cedula: folderInfo.cedula,
        Comentario: formController.state.Comentario,
        ControlRevisionId: entityUpdated.data?.Id ?? "",
        FolderPath: folderInfo.path,
        NombreColaborador: folderInfo.fullname,
        CorreoRealizadoPor: auth.account?.username ?? "Desconocido",
        EstadoAnterior: entityUpdated.data?.Estado ?? "",
        EstadoResultante: "En revisión",
        Title: `Control de revisión: ${folderInfo.cedula} - ${folderInfo.fullname}`,
        FechaAccion: new Date().toISOString(),
        RealizadoPor: auth.account?.name ?? "Desconocido"
      }

      if(entityUpdated.ok && entityUpdated.data) {
        const Historialpayload = buildSendRevisionPayload(state,auth.account, "Envío a revisión");
        console.log("Payload: ", Historialpayload)
        const historialCreado = await actionsController.handleSubmitBd(Historialpayload);

        await notifyFolderReady(graph.mail, folderInfo)

        return { ok: true, created: historialCreado };
      }
      
      alert("No se encontró la carpeta para enviar a revisión");
      return { ok: false, created: null };
      
    } catch {
      alert("Algo ha salido mal creando el registro");
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  const returnFolder = async (folderInfo: {cedula: string, nombre: string, fullname: string, path: string}, motivo: string): Promise<{ created: HistorialRevisionCarpetas | null; ok: boolean }> => {
    setLoading(true);

    try {
      console.log("Actualizando la entidad con path:", folderInfo.path);
      console.log(folderInfo)
      const entityUpdated = await integration.handleUpdateReturned(folderInfo.cedula.trim());
      
      const state: HistorialRevisionCarpetas = {
        Accion: "Devolución de carpeta",
        Cedula: folderInfo.cedula,
        Comentario: motivo,
        ControlRevisionId: entityUpdated.data?.Id ?? "",
        FolderPath: folderInfo.path,
        NombreColaborador: folderInfo.fullname,
        CorreoRealizadoPor: auth.account?.username ?? "Desconocido",
        EstadoAnterior: entityUpdated.data?.Estado ?? "",
        EstadoResultante: "En construcción",
        Title: `Control de revisión: ${folderInfo.cedula} - ${folderInfo.fullname}`,
        FechaAccion: new Date().toISOString(),
        RealizadoPor: auth.account?.name ?? "Desconocido"
      }

      if(entityUpdated.ok && entityUpdated.data) {
        const Historialpayload = buildSendRevisionPayload(state,auth.account, "Devolución de carpeta");
        console.log("Payload: ", Historialpayload)
        const historialCreado = await actionsController.handleSubmitBd(Historialpayload);

        await notifyReturnedFolder(graph.mail, folderInfo, motivo)
        alert("Se ha devuelto la carpeta correctamente")
        return { ok: true, created: historialCreado };
      }
      
      alert("No se encontró la carpeta para enviar a devolver");
      return { ok: false, created: null };
      
    } catch {
      alert("Algo ha salido mal creando el registro");
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  const approveFolder = async (folderInfo: {cedula: string, nombre: string, fullname: string, path: string},): Promise<{ created: HistorialRevisionCarpetas | null; ok: boolean }> => {
    setLoading(true);

    try {
      console.log("Actualizando la entidad con path:", folderInfo.path);
      console.log(folderInfo)
      const entityUpdated = await integration.handleUpdateApprove(folderInfo.cedula.trim());
      
      const state: HistorialRevisionCarpetas = {
        Accion: "Aprobación de carpeta",
        Comentario: "Aprobada sin comentarios",
        Cedula: folderInfo.cedula,
        ControlRevisionId: entityUpdated.data?.Id ?? "",
        FolderPath: folderInfo.path,
        NombreColaborador: folderInfo.fullname,
        CorreoRealizadoPor: auth.account?.username ?? "Desconocido",
        EstadoAnterior: entityUpdated.data?.Estado ?? "",
        EstadoResultante: "Aprobado",
        Title: `Control de revisión: ${folderInfo.cedula} - ${folderInfo.fullname}`,
        FechaAccion: new Date().toISOString(),
        RealizadoPor: auth.account?.name ?? "Desconocido"
      }

      if(entityUpdated.ok && entityUpdated.data) {
        const Historialpayload = buildSendRevisionPayload(state,auth.account, "Aprobación de carpeta");
        console.log("Payload: ", Historialpayload)
        const historialCreado = await actionsController.handleSubmitBd(Historialpayload);

        await notifyApprovedFolder(graph.mail, folderInfo, historialCreado.RealizadoPor!)
        alert("Se ha aprobado la carpeta correctamente")
        return { ok: true, created: historialCreado };
      }
      
      alert("No se encontró la carpeta para enviar a aprobar");
      return { ok: false, created: null };
      
    } catch {
      alert("Algo ha salido mal aprobando el registro");
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendFolderToRevision,
    returnFolder,
    approveFolder,
    ...searchesController,
    ...formController,
    ...actionsController,
    loading
  };
}