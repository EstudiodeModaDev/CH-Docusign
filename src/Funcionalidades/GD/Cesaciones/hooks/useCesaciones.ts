import React from "react";
import type {  rsOption,} from "../../../../models/Commons";
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
import { useCoreGraphServices, useGestorServices } from "../../../../graph/graphContext";
import { notify } from '../../../../utils/notify';

export function useCesaciones() {
  const { account } = useAuth();
  const {Cesaciones} = useGestorServices()
  const {mail, graph} = useCoreGraphServices()
  const formController = useCesacionForm(account?.username ?? "")
  const registerController = useCesacionesTable(Cesaciones, account?.username)
  const requestController = useRequestActions()
  const [workers, setWorkers] = React.useState<Cesacion[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (): Promise<{ created: Cesacion | null; ok: boolean }> => {
    const validationErrors = formController.validate()

    if (!validationErrors) {
      notify.auto("Hay campos sin rellenar");
      return { ok: false, created: null };
    }

    setLoading(true);

    try {
      const payload = buildCesacionCreatePayload(formController.state);
      const creado = await Cesaciones.create(payload);
      registerController.loadFirstPage();
      notify.auto("Se ha creado el registro con éxito");
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
      notify.auto("Hay algunos campos faltantes")
      return
    };
    if (!cesacionSeleccionada.Id) {
      notify.auto("Registro sin Id");
      return;
    }

    setLoading(true);
    console.log(cesacionSeleccionada)

    try {
      const toEdit = await Cesaciones.get(cesacionSeleccionada.Id!)
      const payload = buildCesacionPatch(toEdit, formController.state, );
      console.log(payload)

      if (Object.keys(payload).length === 0) {
        notify.auto("No hay cambios para guardar");
        return;
      }

      
      if(!canEdit){
        await Cesaciones.update(cesacionSeleccionada.Id, payload);
        notify.auto("Se ha actualizado el registro con éxito");
      } else {

        const request = await requestController.createRequest("Cesacion", cesacionSeleccionada.Id)
        if(!request.created || !request.ok) return

        const realRegister = await Cesaciones.get(cesacionSeleccionada.Id)

        const DetallesPayload = detallePayloadFromCesacion(realRegister, formController.state, request.created.Id!)

        console.log(DetallesPayload)

        requestController.genericProcess("Cesacion", DetallesPayload,)

        const groupMembers = await graph.getAllGroupMembers("3dc57761-477f-4096-99c8-e533b6fd7423", {excludeEmail: "larendon@estudiodemoda.com.co"})
        await notifyUpdateRequest(mail, "Cesacion", account?.name ?? "", cesacionSeleccionada.Title, groupMembers,)
        
        notify.auto("Se ha enviado la solicitud, se te notificara el resultado")
        
      }
    } catch {
      notify.auto("Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  const searchWorker = async (query: string): Promise<Cesacion[]> => {
    const resp = await Cesaciones.getAll({filter: `fields/Title eq '${query}'`, top: 200,});

    const foundWorkers = resp.items ?? [];
    setWorkers(foundWorkers);

    const convertedToCommon = foundWorkers.map(worker => convertToCommonDTO(worker));
    setWorkersOptions(convertCommonToOptions(convertedToCommon));

    return foundWorkers;
  };

  const searchRegister = async (query: string): Promise<Cesacion | null> => {
    const resp = await Cesaciones.findLastByTitle(query);

    return resp ? resp : null;
  };

  const handleCancelProcessbyId = React.useCallback(
    async (Id: string, RazonCancelacion: string) => {
      try {
        const proceso = await Cesaciones.get(Id);

        if (proceso) {
          await Cesaciones.update(Id, {
            CanceladoPor: account?.name,
            Estado: "Cancelado",
            RazonCancelacion,
          });
          notify.auto("Se ha cancelado este proceso con éxito");
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
        const proceso = await Cesaciones.get(Id);

        if (proceso) {
          await Cesaciones.update(Id, { Estado: "En proceso" });
          notify.auto("Se ha reactivado este proceso con éxito");
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
        await Cesaciones.delete(Id);
        await registerController.loadBase()
        notify.auto("Se ha eliminado el registro con exito.")
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
        await Cesaciones.update(Id, {FechaExamenesMedicos: spDate});
        await registerController.loadBase()
        notify.auto("Se ha guardado la fecha de los examenes medicos con éxito.")
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

