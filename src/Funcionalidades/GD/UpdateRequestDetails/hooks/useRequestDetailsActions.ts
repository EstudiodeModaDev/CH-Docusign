import { useGestorServices, } from "../../../../graph/graphContext";
import { useRequestDetailsForm, } from "./useRequestForm";
import type { detalle, } from "../../../../models/solicitudCambio";
import { notify } from '../../../../utils/notify';

export function useRequestDetailsActions() {
  const {detalle} = useGestorServices()
  const formController = useRequestDetailsForm()

  const createDetails = async (payload: detalle): Promise<{ created: detalle | null; ok: boolean }> => {

    if(!payload) {
      notify.auto("No se ha enviado la solicitud")
      return{
        created: null,
        ok: false
      }
    }
    
    try {
      const creado = await detalle.create(payload);
      return { ok: true, created: creado };
    } catch {
      return { ok: false, created: null };
    } finally {
    }
  };

  return {
    formController,
    ...formController,
    createDetails
  };
}

