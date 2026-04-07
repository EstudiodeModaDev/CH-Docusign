import React from "react";
import { useFolderControlForm } from "./userControlForm";
import { useFolderControlActions } from "./useControlBdACtions";
import { useSpecificFolderSearch } from "./useControlSearcher";
import type { ControlRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { buildFirstTimeControlRevisionPayload } from "../utils/controlRevisionPayload";

export function useFolderControl(folderInfo: {cedula: string, nombre: string, fullname: string, path: string}, empresa: string) {
  const formController = useFolderControlForm(folderInfo, empresa)
  const actionsController = useFolderControlActions()
  //const listController = useHabeasList(paginationController.pageSize, auth.account?.name ?? "")
  const searchesController = useSpecificFolderSearch()

  const [loading, setLoading] = React.useState(false);

  const createEntity = async (state: ControlRevisionCarpetas): Promise<{ created: ControlRevisionCarpetas | null; ok: boolean }> => {
    setLoading(true);

    try {
      console.log("Creando entidad con estado:", state);
      const payload = buildFirstTimeControlRevisionPayload(state)
      console.log("Payload después de conversión:", payload);
      const creado = await actionsController.handleSubmitBd(payload);
      return { ok: true, created: creado };
    } catch {
      alert("Algo ha salido mal creando el registro");
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  };

  return {
    createEntity,
    ...searchesController,
    ...formController,
    ...actionsController,
    loading
  };
}