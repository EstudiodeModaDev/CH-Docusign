import React from "react";
import type {  rsOption,} from "../../../../models/Commons";
import { useAuth } from "../../../../auth/authProvider";
import { convertCommonToOptions, convertToCommonDTO } from "../../../Common/parseOptions";
import { contratosPayload } from "../utils/contratosPayload";
import type { Novedad } from "../../../../models/Novedades";
import { useContratosTable } from "./useContratosTable";
import { useContratosForm } from "./useContratosForm";
import { buildContratosPatch } from "../utils/contratosPatch";
import { useRequestActions } from "../../UpdateRequest/hooks/useRequestActions";
import { useRequestDetailsActions } from "../../UpdateRequestDetails/hooks/useRequestDetailsActions";
import { detallePayloadFromContrato } from "../../UpdateRequestDetails/utils/requestPayload";
import { notifyUpdateRequest } from "../../../../utils/mail";
import { toGraphDateTime } from "../../../../utils/Date";
import { useCoreGraphServices, useGestorServices } from "../../../../graph/graphContext";
import { notify } from '../../../../utils/notify';

export function useContratos() {
  const { account } = useAuth();
  const {Contratos} = useGestorServices()
  const {graph, mail} = useCoreGraphServices()
  const formController = useContratosForm(account?.name ?? "")
  const registerController = useContratosTable(Contratos, account?.username)
  const requestController = useRequestActions()
  const requestDetailsController = useRequestDetailsActions()
  const [workers, setWorkers] = React.useState<Novedad[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (): Promise<{ created: Novedad | null; ok: boolean }> => {
    const validationErrors = formController.validate()

    if (!validationErrors) {
      notify.auto("Hay campos sin rellenar");
      return { ok: false, created: null };
    }

    setLoading(true);

    try {
      const payload = contratosPayload(formController.state);
      const creado = await Contratos.create(payload);
      registerController.loadFirstPage();
      notify.auto("Se ha creado el registro con éxito");
      return { ok: true, created: creado };
    } catch {
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent, contratoToEdit: Novedad, canEdit: boolean) => {
    e.preventDefault();

    const validationErrors = formController.validate()

    if (!validationErrors) {
      notify.auto("Hay algunos campos faltantes")
      return
    };
    if (!contratoToEdit.Id) {
      notify.auto("Registro sin Id");
      return;
    }

    setLoading(true);

    try {
      const toEdit = await Contratos.get(contratoToEdit.Id!)
      const payload = buildContratosPatch(contratoToEdit, toEdit,);

      if (Object.keys(payload).length === 0) {
        notify.auto("No hay cambios para guardar");
        return;
      }

      
      if(!canEdit){
        await Contratos.update(contratoToEdit.Id, payload);
        notify.auto("Se ha actualizado el registro con éxito");
      } else {

        const request = await requestController.createRequest("Contratacion", contratoToEdit.Id)
        if(!request.created || !request.ok) return
        const realRegister = await Contratos.get(contratoToEdit.Id)
        
        const DetallesPayload = detallePayloadFromContrato(realRegister, formController.state, request.created?.Id ?? "", )

        for(const detalle of DetallesPayload){
          await requestDetailsController.createDetails(detalle)
        }
        const groupMembers = await graph.getAllGroupMembers("3dc57761-477f-4096-99c8-e533b6fd7423", {excludeEmail: "larendon@estudiodemoda.com.co"})
        await notifyUpdateRequest(mail, "Contrato", account?.name ?? "", contratoToEdit.Numero_x0020_identificaci_x00f3_, groupMembers,)
        notify.auto("Se ha enviado la solicitud, se te notificara el resultado")
        
      }

    } catch {
      notify.auto("Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  const searchWorker = async (query: string): Promise<Novedad[]> => {
    const resp = await Contratos.getAll({filter: `fields/Numero_x0020_identificaci_x00f3_ eq '${query}'`, top: 200,});

    const foundWorkers = resp.items ?? [];
    setWorkers(foundWorkers);

    const convertedToCommon = foundWorkers.map(worker => convertToCommonDTO(worker));
    setWorkersOptions(convertCommonToOptions(convertedToCommon));

    return foundWorkers;
  };

  const searchRegister = async (query: string): Promise<Novedad | null> => {
    const resp = await Contratos.findLastByDoc(query);

    return resp ? resp : null;
  };

  const handleCancelProcessbyId = React.useCallback(
    async (Id: string, RazonCancelacion: string) => {
      try {
        const proceso = await Contratos.get(Id);

        if (proceso) {
          await Contratos.update(Id, {
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
        const proceso = await Contratos.get(Id);

        if (proceso) {
          await Contratos.update(Id, { Estado: "En proceso" });
          notify.auto("Se ha reactivado este proceso con éxito");
          registerController.loadFirstPage();
        }
      } catch {
        throw new Error("Ha ocurrido un error reactivando el proceso");
      }
    },
    []
  );

  const deleteContrato = React.useCallback(async (Id: string) => {
      try {
        await Contratos.delete(Id);
        await registerController.loadBase()
        notify.auto("Se ha eliminado el registro con exito.")
      } catch {
        throw new Error("Ha ocurrido un error eliminando la novedad");
      }
    },
    []
  );

  const saveMedicalExams = React.useCallback(async (Id: string, fecha: string) => {
      try {
        if(!Id || !fecha ) return

        const spDate = toGraphDateTime(fecha)
        await Contratos.update(Id, {FechaExamenesMedicos: spDate});
        await registerController.loadBase()
        notify.auto("Se ha guardado la fecha de los examenes medicos con éxito.")
      } catch {
        throw new Error("Ha ocurrido un error eliminando la novedad");
      }
    },
    []
  );

  return {
    formController,
    workers,
    workersOptions,
    handleReactivateProcessById,
    handleCancelProcessbyId,
    handleSubmit,
    searchRegister,
    handleEdit,
    searchWorker,
    deleteContrato,
    saveMedicalExams,
    ...formController,
    ...registerController,
    loading
  };
}

