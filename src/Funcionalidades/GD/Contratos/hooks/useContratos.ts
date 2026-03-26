import React from "react";
import type {  rsOption,} from "../../../../models/Commons";
import { useGraphServices } from "../../../../graph/graphContext";
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

export function useContratos() {
  const { account } = useAuth();
  const graph = useGraphServices()
  const formController = useContratosForm(account?.name ?? "")
  const registerController = useContratosTable(graph.Contratos, account?.username)
  const requestController = useRequestActions()
  const requestDetailsController = useRequestDetailsActions()
  const [workers, setWorkers] = React.useState<Novedad[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (): Promise<{ created: Novedad | null; ok: boolean }> => {
    const validationErrors = formController.validate()

    if (!validationErrors) {
      alert("Hay campos sin rellenar");
      return { ok: false, created: null };
    }

    setLoading(true);

    try {
      const payload = contratosPayload(formController.state);
      const creado = await graph.Contratos.create(payload);
      registerController.loadFirstPage();
      alert("Se ha creado el registro con éxito");
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
      alert("Hay algunos campos faltantes")
      return
    };
    if (!contratoToEdit.Id) {
      alert("Registro sin Id");
      return;
    }

    setLoading(true);

    try {
      const toEdit = await graph.Contratos.get(contratoToEdit.Id!)
      const payload = buildContratosPatch(contratoToEdit, toEdit,);

      if (Object.keys(payload).length === 0) {
        alert("No hay cambios para guardar");
        return;
      }

      
      if(!canEdit){
        await graph.Contratos.update(contratoToEdit.Id, payload);
        alert("Se ha actualizado el registro con éxito");
      } else {

        const request = await requestController.createRequest("Contratacion", contratoToEdit.Id)
        if(!request.created || !request.ok) return
        const realRegister = await graph.Contratos.get(contratoToEdit.Id)
        
        const DetallesPayload = detallePayloadFromContrato(realRegister, formController.state, request.created?.Id ?? "", )

        for(const detalle of DetallesPayload){
          await requestDetailsController.createDetails(detalle)
        }
        const groupMembers = await graph.graph.getAllGroupMembers("3dc57761-477f-4096-99c8-e533b6fd7423", {excludeEmail: "larendon@estudiodemoda.com.co"})
        await notifyUpdateRequest(graph.mail, "Contrato", account?.name ?? "", contratoToEdit.Numero_x0020_identificaci_x00f3_, groupMembers,)
        alert("Se ha enviado la solicitud, se te notificara el resultado")
        
      }

    } catch {
      alert("Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  const searchWorker = async (query: string): Promise<Novedad[]> => {
    const resp = await graph.Contratos.getAll({filter: `fields/Numero_x0020_identificaci_x00f3_ eq '${query}'`, top: 200,});

    const foundWorkers = resp.items ?? [];
    setWorkers(foundWorkers);

    const convertedToCommon = foundWorkers.map(worker => convertToCommonDTO(worker));
    setWorkersOptions(convertCommonToOptions(convertedToCommon));

    return foundWorkers;
  };

  const searchRegister = async (query: string): Promise<Novedad | null> => {
    const resp = await graph.Contratos.findLastByDoc(query);

    return resp ? resp : null;
  };

  const handleCancelProcessbyId = React.useCallback(
    async (Id: string, RazonCancelacion: string) => {
      try {
        const proceso = await graph.Contratos.get(Id);

        if (proceso) {
          await graph.Contratos.update(Id, {
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
        const proceso = await graph.Contratos.get(Id);

        if (proceso) {
          await graph.Contratos.update(Id, { Estado: "En proceso" });
          alert("Se ha reactivado este proceso con éxito");
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
        await graph.Contratos.delete(Id);
        await registerController.loadBase()
        alert("Se ha eliminado el registro con exito.")
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
        await graph.Contratos.update(Id, {FechaExamenesMedicos: spDate});
        await registerController.loadBase()
        alert("Se ha guardado la fecha de los examenes medicos con éxito.")
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