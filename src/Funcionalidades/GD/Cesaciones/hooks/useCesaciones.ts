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

export function useCesaciones() {
  const { account } = useAuth();
  const graph = useGraphServices()
  const formController = useCesacionForm()
  const registerController = useCesacionesTable(graph.Cesaciones, account?.username)
  const [workers, setWorkers] = React.useState<Cesacion[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (): Promise<{ created: Cesacion | null; ok: boolean }> => {
    const validationErrors = formController.validate()

    if (Object.keys(validationErrors).length > 0) {
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

  const handleEdit = async (e: React.FormEvent, cesacionSeleccionada: Cesacion) => {
    e.preventDefault();

    const validationErrors = formController.validate()

    if (validationErrors) {
      alert("Hay algunos campos faltantes")
      return
    };
    if (!cesacionSeleccionada.Id) {
      alert("Registro sin Id");
      return;
    }

    setLoading(true);

    try {
      const payload = buildCesacionPatch(cesacionSeleccionada, formController.state);

      if (Object.keys(payload).length === 0) {
        alert("No hay cambios para guardar");
        return;
      }

      await graph.Cesaciones.update(cesacionSeleccionada.Id, payload);
      alert("Se ha actualizado el registro con éxito");
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
      } catch {
        throw new Error("Ha ocurrido un error eliminando la cesación");
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
    deleteCesacion,
    ...formController,
    ...registerController,
    loading
  };
}