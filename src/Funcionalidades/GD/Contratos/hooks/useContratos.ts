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

export function useContratos() {
  const { account } = useAuth();
  const graph = useGraphServices()
  const formController = useContratosForm()
  const registerController = useContratosTable(graph.Contratos, account?.username)
  const [workers, setWorkers] = React.useState<Novedad[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (): Promise<{ created: Novedad | null; ok: boolean }> => {
    const validationErrors = formController.validate()

    if (Object.keys(validationErrors).length > 0) {
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

  const handleEdit = async (e: React.FormEvent, contratoToEdit: Novedad) => {
    e.preventDefault();

    const validationErrors = formController.validate()

    if (validationErrors) {
      alert("Hay algunos campos faltantes")
      return
    };
    if (!contratoToEdit.Id) {
      alert("Registro sin Id");
      return;
    }

    setLoading(true);

    try {
      const payload = buildContratosPatch(contratoToEdit, formController.state);

      if (Object.keys(payload).length === 0) {
        alert("No hay cambios para guardar");
        return;
      }

      await graph.Contratos.update(contratoToEdit.Id, payload);
      alert("Se ha actualizado el registro con éxito");
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
    ...formController,
    ...registerController,
    loading
  };
}