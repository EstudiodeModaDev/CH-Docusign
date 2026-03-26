import { useGraphServices } from "../../../../graph/graphContext";
import { useRequestDetailsForm, } from "./useRequestForm";
import type { detalle, } from "../../../../models/solicitudCambio";

export function useRequestDetailsActions() {
  const graph = useGraphServices()
  const formController = useRequestDetailsForm()

  const createDetails = async (payload: detalle): Promise<{ created: detalle | null; ok: boolean }> => {

    if(!payload) {
      alert("No se ha enviado la solicitud")
      return{
        created: null,
        ok: false
      }
    }
    
    try {
      const creado = await graph.detalle.create(payload);
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