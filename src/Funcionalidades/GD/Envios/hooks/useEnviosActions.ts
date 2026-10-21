import React from "react";
import type { Envio,} from "../../../../models/Envios";
import { buildEnviosReportFilter } from "../utils/enviosFilters";
import { enviosPayload } from "../utils/enviosPayload";
import { useGestorServices } from "../../../../graph/graphContext";
import { notify } from '../../../../utils/notify';
import { useAuditLog } from "../../../Common/useAuditLog";

export function useEnviosActions() {
  const {Envios} = useGestorServices()
  const { audit } = useAuditLog("Documentos")

  const canEdit = async (id: string, fuente: string): Promise<"view" | "edit"> => {
    const obtener = (await Envios.getAll({top: 1, filter: `fields/ID_Novedad eq '${id}' and fields/Fuente eq '${fuente}'`, orderby: "fields/Created desc"})).items;
    return obtener.length > 0 ? "view" : "edit";
  };

  const handleSubmitBd = async (state: Envio) => {
    try {
      const payload = enviosPayload(state)
      await Envios.create(payload);
      notify.auto("Se ha creado el registro con éxito")
    } catch (e) {
      // El éxito queda registrado con el envío del sobre; aquí solo se registra el fallo del registro en la lista de envíos.
      await audit({
        accion: "Creacion",
        descripcion: "Falló el registro de un envío de documento",
        id_item_afectado: state.IdSobre ?? "",
        detalle: { plantilla: state.Title ?? "", fuente: state.Fuente ?? "", error: e instanceof Error ? e.message : String(e) },
        resultado: "Error",
      })
      throw new Error("Algo ha salido mal")
    }
  };

  const loadToReport = React.useCallback(async (from: string, to: string, EnviadoPor?: string, destinatario?: string, plantilla?: string): Promise<{ok: boolean, data: Envio[], message: string | null}> => {
    try {
      const { items, } = await Envios.getAll(buildEnviosReportFilter(from, to, EnviadoPor, destinatario, plantilla),); 
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





