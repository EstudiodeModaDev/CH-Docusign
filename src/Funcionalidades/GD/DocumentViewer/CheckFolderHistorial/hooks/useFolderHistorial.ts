import React from "react";
import { useFolderControlForm } from "./userControlForm";
import type { HistorialRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { buildSendRevisionPayload } from "../utils/controlRevisionPayload";
import { useFolderHistorialActions } from "./useControlBdACtions";
import { useSpecificFolderHistorialSearch } from "./useControlSearcher";
import { useAuth } from "../../../../../auth/authProvider";
import { useFolderControlActions } from "../../CheckFolderControl/hooks/useControlBdACtions";
import { notifyApprovedFolder, notifyFolderReady, notifyReturnedFolder } from "../utils/notifications";
import { toISODateFlex } from "../../../../../utils/Date";
import { useCoreGraphServices, } from "../../../../../graph/graphContext";
import { notify } from '../../../../../utils/notify';
import { useAuditLog } from "../../../../Common/useAuditLog";

export function useFolderHistorial(folderInfo: {cedula: string, nombre: string, fullname: string, path: string},) {
  const formController = useFolderControlForm(folderInfo,)
  const actionsController = useFolderHistorialActions()
  const searchesController = useSpecificFolderHistorialSearch()
  const integration = useFolderControlActions()
  const auth = useAuth()
  const {mail, graph} = useCoreGraphServices()
  const { audit } = useAuditLog("Documentos")

  const [loading, setLoading] = React.useState(false);

  const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

  const sendFolderToRevision = async (folderInfo: {cedula: string, nombre: string, fullname: string, path: string}): Promise<{ created: HistorialRevisionCarpetas | null; ok: boolean }> => {
    setLoading(true);
    let registrado = false;

    try {
      const entityUpdated = await integration.handleUpdateSendRevision(folderInfo.cedula.trim());
      const state: HistorialRevisionCarpetas = {
        Accion: "Envío a revisión",
        Cedula: folderInfo.cedula,
        Comentario: formController.state.Comentario,
        ControlRevisionId: entityUpdated.data?.Id ?? "",
        FolderPath: folderInfo.path,
        NombreColaborador: folderInfo.fullname,
        CorreoRealizadoPor: auth.account?.username ?? "Desconocido",
        EstadoAnterior: "En construcción",
        EstadoResultante: entityUpdated.data?.Estado ?? "",
        Title: `Control de revisión: ${folderInfo.cedula} - ${folderInfo.fullname}`,
        FechaAccion: toISODateFlex(new Date()),
        RealizadoPor: auth.account?.name ?? "Desconocido"
      }

      if(entityUpdated.ok && entityUpdated.data) {
        const historialCreado = await actionsController.handleSubmitBd(state);
        await audit({
          accion: "Edicion",
          descripcion: "Se envió a revisión la carpeta de un colaborador",
          id_item_afectado: entityUpdated.data.Id,
          detalle: { carpeta: folderInfo.path, estado_anterior: state.EstadoAnterior, estado_resultante: state.EstadoResultante, historial_id: historialCreado?.Id ?? "" },
          resultado: "Exito",
        });
        registrado = true;

        await notifyFolderReady(mail, folderInfo)
        notify.auto("Se ha enviado la carpeta a revisión con éxito")
        return { ok: true, created: historialCreado };
      }

      await audit({
        accion: "Edicion",
        descripcion: "Falló el envío a revisión de la carpeta de un colaborador",
        detalle: { carpeta: folderInfo.path, error: entityUpdated.message ?? "No se encontró la carpeta" },
        resultado: "Error",
      });
      notify.auto("No se encontró la carpeta para enviar a revisión");
      return { ok: false, created: null };

    } catch (e) {
      if (!registrado) {
        await audit({
          accion: "Edicion",
          descripcion: "Falló el envío a revisión de la carpeta de un colaborador",
          detalle: { carpeta: folderInfo.path, error: errorMessage(e) },
          resultado: "Error",
        });
      }
      notify.auto("Algo ha salido mal creando el registro");
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  const returnFolder = async (folderInfo: {cedula: string, nombre: string, fullname: string, path: string}, motivo: string): Promise<{ created: HistorialRevisionCarpetas | null; ok: boolean }> => {
    setLoading(true);
    let registrado = false;

    try {
      const entityUpdated = await integration.handleUpdateReturned(folderInfo.cedula.trim());
      
      const state: HistorialRevisionCarpetas = {
        Accion: "Devolución de carpeta",
        Cedula: folderInfo.cedula,
        Comentario: motivo,
        ControlRevisionId: entityUpdated.data?.Id ?? "",
        FolderPath: folderInfo.path,
        NombreColaborador: folderInfo.fullname,
        CorreoRealizadoPor: auth.account?.username ?? "Desconocido",
        EstadoAnterior: "En revisión",
        EstadoResultante: "En construcción",
        Title: `Control de revisión: ${folderInfo.cedula} - ${folderInfo.fullname}`,
        FechaAccion: new Date().toISOString(),
        RealizadoPor: auth.account?.name ?? "Desconocido"
      }

      if(entityUpdated.ok && entityUpdated.data) {
        const Historialpayload = buildSendRevisionPayload(state,auth.account, "Devolución de carpeta");
        const historialCreado = await actionsController.handleSubmitBd(Historialpayload);
        await audit({
          accion: "Rechazo",
          descripcion: "Se devolvió la carpeta de un colaborador",
          id_item_afectado: entityUpdated.data.Id,
          detalle: { carpeta: folderInfo.path, motivo, estado_anterior: state.EstadoAnterior, estado_resultante: state.EstadoResultante, historial_id: historialCreado?.Id ?? "" },
          resultado: "Exito",
        });
        registrado = true;
        const groupMembers = await graph.getAllGroupMembers("8ba50c1e-ffd3-4906-b50a-3db33b69b868",)
        await notifyReturnedFolder(mail, folderInfo, motivo, groupMembers)
        notify.auto("Se ha devuelto la carpeta correctamente")
        return { ok: true, created: historialCreado };
      }

      await audit({
        accion: "Rechazo",
        descripcion: "Falló la devolución de la carpeta de un colaborador",
        detalle: { carpeta: folderInfo.path, motivo, error: entityUpdated.message ?? "No se encontró la carpeta" },
        resultado: "Error",
      });
      notify.auto("No se encontró la carpeta para enviar a devolver");
      return { ok: false, created: null };

    } catch (e) {
      if (!registrado) {
        await audit({
          accion: "Rechazo",
          descripcion: "Falló la devolución de la carpeta de un colaborador",
          detalle: { carpeta: folderInfo.path, motivo, error: errorMessage(e) },
          resultado: "Error",
        });
      }
      notify.auto("Algo ha salido mal creando el registro");
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  const approveFolder = async (folderInfo: {cedula: string, nombre: string, fullname: string, path: string},): Promise<{ created: HistorialRevisionCarpetas | null; ok: boolean }> => {
    setLoading(true);
    let registrado = false;

    try {
      const entityUpdated = await integration.handleUpdateApprove(folderInfo.cedula.trim());
      
      const state: HistorialRevisionCarpetas = {
        Accion: "Aprobación de carpeta",
        Comentario: "Aprobada sin comentarios",
        Cedula: folderInfo.cedula,
        ControlRevisionId: entityUpdated.data?.Id ?? "",
        FolderPath: folderInfo.path,
        NombreColaborador: folderInfo.fullname,
        CorreoRealizadoPor: auth.account?.username ?? "Desconocido",
        EstadoAnterior:  "En construcción",
        EstadoResultante: "Aprobado",
        Title: `Control de revisión: ${folderInfo.cedula} - ${folderInfo.fullname}`,
        FechaAccion: toISODateFlex(new Date()),
        RealizadoPor: auth.account?.name ?? "Desconocido"
      }

      if(entityUpdated.ok && entityUpdated.data) {
        const Historialpayload = state;
        const historialCreado = await actionsController.handleSubmitBd(Historialpayload);
        await audit({
          accion: "Aprobacion",
          descripcion: "Se aprobó la carpeta de un colaborador",
          id_item_afectado: entityUpdated.data.Id,
          detalle: { carpeta: folderInfo.path, estado_anterior: state.EstadoAnterior, estado_resultante: state.EstadoResultante, historial_id: historialCreado?.Id ?? "" },
          resultado: "Exito",
        });
        registrado = true;
        const groupMembers = await graph.getAllGroupMembers("8ba50c1e-ffd3-4906-b50a-3db33b69b868",)
        await notifyApprovedFolder(mail, folderInfo, historialCreado.RealizadoPor!, groupMembers)
        notify.auto("Se ha aprobado la carpeta correctamente")
        return { ok: true, created: historialCreado };
      }

      await audit({
        accion: "Aprobacion",
        descripcion: "Falló la aprobación de la carpeta de un colaborador",
        detalle: { carpeta: folderInfo.path, error: entityUpdated.message ?? "No se encontró la carpeta" },
        resultado: "Error",
      });
      notify.auto("No se encontró la carpeta para enviar a aprobar");
      return { ok: false, created: null };

    } catch (e) {
      if (!registrado) {
        await audit({
          accion: "Aprobacion",
          descripcion: "Falló la aprobación de la carpeta de un colaborador",
          detalle: { carpeta: folderInfo.path, error: errorMessage(e) },
          resultado: "Error",
        });
      }
      notify.auto("Algo ha salido mal aprobando el registro");
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

