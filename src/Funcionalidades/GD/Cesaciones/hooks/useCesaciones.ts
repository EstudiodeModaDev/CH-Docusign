import React from "react";
import type {  rsOption,} from "../../../../models/Commons";
import { useGraphServices } from "../../../../graph/graphContext";
import type { Cesacion, } from "../../../../models/Cesaciones";
import { useAuth } from "../../../../auth/authProvider";
import { buildCesacionCreatePayload } from "../utils/cesacionesPayload";
import { buildCesacionPatch } from "../utils/cesacionPatch";
import { useCesacionForm } from "./useCesacionForm";
import { useCesacionesTable } from "./useCesacionesTable";
import { convertCommonToOptions, convertToCommonDTO } from "../../../Common/parseOptions";
import { useRequestActions } from "../../UpdateRequest/hooks/useRequestActions";
import { detallePayloadFromCesacion } from "../../UpdateRequestDetails/utils/requestPayload";
import { notifyUpdateRequest } from "../../../../utils/mail";
import { toGraphDateTime } from "../../../../utils/Date";

export function useCesaciones() {
  const { account } = useAuth();
  const graph = useGraphServices()
  const formController = useCesacionForm(account?.username ?? "")
  const registerController = useCesacionesTable(graph.Cesaciones, account?.username)
  const requestController = useRequestActions()
  const [workers, setWorkers] = React.useState<Cesacion[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (): Promise<{ created: Cesacion | null; ok: boolean }> => {
    const validationErrors = formController.validate()

    if (!validationErrors) {
      alert("Hay campos sin rellenar");
      return { ok: false, created: null };
    }

    setLoading(true);

    try {
      const payload = buildCesacionCreatePayload(formController.state);
      const creado = await graph.Cesaciones.create(payload);
      registerController.loadFirstPage();
      alert("Se ha creado el registro con éxito");
      return { ok: true, created: creado };
    } catch {
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent, cesacionSeleccionada: Cesacion, canEdit: boolean) => {
    e.preventDefault();

    const validationErrors = formController.validate()

    if (!validationErrors) {
      alert("Hay algunos campos faltantes")
      return
    };
    if (!cesacionSeleccionada.Id) {
      alert("Registro sin Id");
      return;
    }

    setLoading(true);
    console.log(cesacionSeleccionada)

    try {
      const toEdit = await graph.Cesaciones.get(cesacionSeleccionada.Id!)
      const payload = buildCesacionPatch(toEdit, formController.state, );
      console.log(payload)

      if (Object.keys(payload).length === 0) {
        alert("No hay cambios para guardar");
        return;
      }

      
      if(!canEdit){
        await graph.Cesaciones.update(cesacionSeleccionada.Id, payload);
        alert("Se ha actualizado el registro con éxito");
      } else {

        const request = await requestController.createRequest("Cesacion", cesacionSeleccionada.Id)
        if(!request.created || !request.ok) return

        const realRegister = await graph.Cesaciones.get(cesacionSeleccionada.Id)

        const DetallesPayload = detallePayloadFromCesacion(realRegister, formController.state, request.created.Id!)

        console.log(DetallesPayload)

        requestController.genericProcess("Cesacion", DetallesPayload,)

        const groupMembers = await graph.graph.getAllGroupMembers("3dc57761-477f-4096-99c8-e533b6fd7423", {excludeEmail: "larendon@estudiodemoda.com.co"})
        await notifyUpdateRequest(graph.mail, "Cesacion", account?.name ?? "", cesacionSeleccionada.Title, groupMembers,)
        
        alert("Se ha enviado la solicitud, se te notificara el resultado")
        
      }
    } catch {
      alert("Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  const searchWorker = async (query: string): Promise<Cesacion[]> => {
    const resp = await graph.Cesaciones.getAll({filter: `fields/Title eq '${query}'`, top: 200,});

    const foundWorkers = resp.items ?? [];
    setWorkers(foundWorkers);

    const convertedToCommon = foundWorkers.map(worker => convertToCommonDTO(worker));
    setWorkersOptions(convertCommonToOptions(convertedToCommon));

    return foundWorkers;
  };

  const searchRegister = async (query: string): Promise<Cesacion | null> => {
    const resp = await graph.Cesaciones.findLastByTitle(query);

    return resp ? resp : null;
  };

  const handleCancelProcessbyId = React.useCallback(
    async (Id: string, RazonCancelacion: string) => {
      try {
        const proceso = await graph.Cesaciones.get(Id);

        if (proceso) {
          await graph.Cesaciones.update(Id, {
            CanceladoPor: account?.name,
            Estado: "Cancelado",
            RazonCancelacion,
          });
          alert("Se ha cancelado este proceso con éxito");
          registerController.loadFirstPage();
        }
      } catch {
        throw new Error("Ha ocurrido un error cancelando el proceso");
      }
    },
    [account?.name,]
  );

  const handleReactivateProcessById = React.useCallback(
    async (Id: string) => {
      try {
        const proceso = await graph.Cesaciones.get(Id);

        if (proceso) {
          await graph.Cesaciones.update(Id, { Estado: "En proceso" });
          alert("Se ha reactivado este proceso con éxito");
          registerController.loadFirstPage();
        }
      } catch {
        throw new Error("Ha ocurrido un error reactivando el proceso");
      }
    },
    []
  );

  const deleteCesacion = React.useCallback(async (Id: string) => {
      try {
        await graph.Cesaciones.delete(Id);
        await registerController.loadBase()
        alert("Se ha eliminado el registro con exito.")
      } catch {
        throw new Error("Ha ocurrido un error eliminando la cesación");
      }
    },
    []
  );

  const saveMedicalExams = React.useCallback(async (Id: string, fecha: string) => {
      try {
        if(!Id || !fecha ) return

        const spDate = toGraphDateTime(fecha)
        await graph.Cesaciones.update(Id, {FechaExamenesMedicos: spDate});
        await registerController.loadBase()
        alert("Se ha guardado la fecha de los examenes medicos con éxito.")
      } catch {
        throw new Error("Ha ocurrido un error eliminando la novedad");
      }
    },
    []
  )

  return {
    formController,
    workers,
    workersOptions,
    handleReactivateProcessById,
    handleCancelProcessbyId,
    saveMedicalExams,
    handleSubmit,
    searchRegister,
    handleEdit,
    searchWorker,
    deleteCesacion,
    ...formController,
    ...registerController,
    loading
  };
}