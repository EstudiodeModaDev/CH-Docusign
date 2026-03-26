import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import { useAuth } from "../../../../auth/authProvider";
import { useRequestForm } from "./useRequestForm";
import type { detalle, solicitud } from "../../../../models/solicitudCambio";
import { requestPayload } from "../utils/requestPayload";
import { isAdmin } from "../../../Common/groups";
import { buildUpdatePayloadFromDetails } from "../../UpdateRequestDetails/utils/convertToSPObject";
import { notifyAceptedRequest, } from "../../../../utils/mail";
import { getServiceByModulo, isModulo, type Modulo } from "../../../Common/allTablesSearches";
import { useRequestDetailsActions } from "../../UpdateRequestDetails/hooks/useRequestDetailsActions";

export function useRequestActions() {
  const { account } = useAuth();
  const graph = useGraphServices()
  const formController = useRequestForm(account?.name ?? "", account?.username ?? "")
  const requestDetailController = useRequestDetailsActions()
  const [loading, setLoading] = React.useState(false);

  const createRequest = async (modulo: string, Id: string): Promise<{ created: solicitud | null; ok: boolean }> => {
    const validationErrors = formController.validate()

    if (Object.keys(validationErrors).length > 0) {
      alert("Hay campos sin rellenar");
      return { ok: false, created: null };
    }

    setLoading(true);

    try {
      const payload = requestPayload({...formController.state, Title: modulo, IdRegistro: Id});
      const creado = await graph.solicitud.create(payload);
      return { ok: true, created: creado };
    } catch {
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  const onApproveRequest = async (solicitud: solicitud, comentario: string,) => {
    try {
      const fresh = await graph.solicitud.get(solicitud.Id ?? "");

      if (!fresh || fresh.Estado !== "Pendiente") {
        alert("La solicitud ya fue procesada");
        return;
      }

      // 2. Validar permisos
      const canContinue = isAdmin(graph.graph, account!)

      if(!canContinue){
        return
      }

      // 3. Traer detalles
      const detalles = await graph.detalle.getBySolicitudId(solicitud.Id!);

      if (!detalles || detalles.length === 0) {
        alert("La solicitud no tiene detalles");
        return;
      }

      // 4. Construir payload dinámico
      const payload = buildUpdatePayloadFromDetails(detalles);
      console.log(payload)

      if(!isModulo(solicitud.Title)) return

      const updated = await getServiceByModulo(solicitud.Title, graph)?.update(solicitud.IdRegistro!, payload)
      console.log(updated)

      // 6. Marcar solicitud como aprobada
      await graph.solicitud.update(solicitud.Id!, {
        Estado: "Aprobada",
        Aprobador: account?.name ?? "",
        fechaAprobacion: new Date().toISOString(),
        comentarioAprobador: comentario ?? "",
      });
      await notifyAceptedRequest(graph.mail, "Contrato", solicitud,)
      alert("Solicitud aprobada correctamente");

    } catch (error) {
      console.error(error);
      alert("Error al aprobar la solicitud");
    }
  };

  const onRejectRequest = async (solicitud: solicitud, comentario: string, ) => {
    try {
      const fresh = await graph.solicitud.get(solicitud.Id ?? "");

      if (!fresh || fresh.Estado !== "Pendiente") {
        alert("La solicitud ya fue procesada");
        return;
      }

      // 2. Validar permisos
      isAdmin(graph.graph, account!)

      // 3. Marcar solicitud como aprobada
      await graph.solicitud.update(solicitud.Id!, {
        Estado: "Rechazada",
        Aprobador: account?.name ?? "",
        fechaAprobacion: new Date().toISOString(),
        comentarioAprobador: comentario ?? "",
      });
      
      alert("Solicitud rechazada correctamente");

    } catch (error) {
      console.error(error);
      alert("Error al aprobar la solicitud");
    }
  };

  const genericProcess = async ( modulo: Modulo, DetallesPayload: detalle[],) => {
    try {
      const service = getServiceByModulo(modulo, graph)

      if(!service) return

  
      for(const detalle of DetallesPayload){
        await requestDetailController.createDetails(detalle)
      }

    } catch {
      alert("Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  return {
    formController,
    ...formController,
    loading,
    createRequest,
    onApproveRequest,
    onRejectRequest,
    genericProcess
  };
}