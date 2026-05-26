import React from "react";
import { useAuth } from "../../../../auth/authProvider";
import { useRequestForm } from "./useRequestForm";
import type { detalle, solicitud } from "../../../../models/solicitudCambio";
import { requestPayload } from "../utils/requestPayload";
import { isAdmin } from "../../../Common/groups";
import { buildUpdatePayloadFromDetails } from "../../UpdateRequestDetails/utils/convertToSPObject";
import { notifyAceptedRequest, } from "../../../../utils/mail";
import { getServiceByModulo, isModulo, type Modulo } from "../../../Common/allTablesSearches";
import { useRequestDetailsActions } from "../../UpdateRequestDetails/hooks/useRequestDetailsActions";
import { useCoreGraphServices, useGestorServices } from "../../../../graph/graphContext";
import { notify } from '../../../../utils/notify';

export function useRequestActions() {
  const { account } = useAuth();
  const {solicitud, detalle} = useGestorServices()
  const {graph, mail} = useCoreGraphServices()
  const gestor = useGestorServices()
  const formController = useRequestForm(account?.name ?? "", account?.username ?? "")
  const requestDetailController = useRequestDetailsActions()
  const [loading, setLoading] = React.useState(false);

  const createRequest = async (modulo: string, Id: string): Promise<{ created: solicitud | null; ok: boolean }> => {
    const validationErrors = formController.validate()

    if (Object.keys(validationErrors).length > 0) {
      notify.auto("Hay campos sin rellenar");
      return { ok: false, created: null };
    }

    setLoading(true);

    try {
      const payload = requestPayload({...formController.state, Title: modulo, IdRegistro: Id});
      const creado = await solicitud.create(payload);
      return { ok: true, created: creado };
    } catch {
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  const onApproveRequest = async (solicitudObj: solicitud, comentario: string,) => {
    try {
      const fresh = await solicitud.get(solicitudObj.Id ?? "");

      if (!fresh || fresh.Estado !== "Pendiente") {
        notify.auto("La solicitud ya fue procesada");
        return;
      }

      // 2. Validar permisos
      const canContinue = isAdmin(graph, account!)

      if(!canContinue){
        return
      }

      // 3. Traer detalles
      const detalles = await detalle.getBySolicitudId(solicitudObj.Id!);

      if (!detalles || detalles.length === 0) {
        notify.auto("La solicitud no tiene detalles");
        return;
      }

      // 4. Construir payload dinámico
      const payload = buildUpdatePayloadFromDetails(detalles);
      console.log(payload)

      if(!isModulo(solicitudObj.Title)) return

      const updated = await getServiceByModulo(solicitudObj.Title, gestor)?.update(solicitudObj.IdRegistro!, payload)
      console.log(updated)

      // 6. Marcar solicitud como aprobada
      await solicitud.update(solicitudObj.Id!, {
        Estado: "Aprobada",
        Aprobador: account?.name ?? "",
        fechaAprobacion: new Date().toISOString(),
        comentarioAprobador: comentario ?? "",
      });
      await notifyAceptedRequest(mail, "Contrato", solicitudObj,)
      notify.auto("Solicitud aprobada correctamente");

    } catch (error) {
      console.error(error);
      notify.auto("Error al aprobar la solicitud");
    }
  };

  const onRejectRequest = async (solicitudObj: solicitud, comentario: string, ) => {
    try {
      const fresh = await solicitud.get(solicitudObj.Id ?? "");

      if (!fresh || fresh.Estado !== "Pendiente") {
        notify.auto("La solicitud ya fue procesada");
        return;
      }

      // 2. Validar permisos
      isAdmin(graph, account!)

      // 3. Marcar solicitud como aprobada
      await solicitud.update(solicitudObj.Id!, {
        Estado: "Rechazada",
        Aprobador: account?.name ?? "",
        fechaAprobacion: new Date().toISOString(),
        comentarioAprobador: comentario ?? "",
      });
      
      notify.auto("Solicitud rechazada correctamente");

    } catch (error) {
      console.error(error);
      notify.auto("Error al aprobar la solicitud");
    }
  };

  const genericProcess = async ( modulo: Modulo, DetallesPayload: detalle[],) => {
    try {
      const service = getServiceByModulo(modulo, gestor)

      if(!service) return

  
      for(const detalle of DetallesPayload){
        await requestDetailController.createDetails(detalle)
      }

    } catch {
      notify.auto("Ha ocurrido un error");
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

