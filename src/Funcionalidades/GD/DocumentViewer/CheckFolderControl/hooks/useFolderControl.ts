import React from "react";
import { useFolderControlForm } from "./userControlForm";
import { useFolderControlActions } from "./useControlBdACtions";
import { useSpecificFolderSearch } from "./useControlSearcher";
import type { ControlRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { buildFirstTimeControlRevisionPayload } from "../utils/controlRevisionPayload";
import { notify } from '../../../../../utils/notify';

export function useFolderControl(folderInfo: {cedula: string, nombre: string, fullname: string, path: string}, empresa: string) {
  const formController = useFolderControlForm(folderInfo, empresa)
  const actionsController = useFolderControlActions()
  //const listController = useHabeasList(paginationController.pageSize, auth.account?.name ?? "")
  const searchesController = useSpecificFolderSearch()

  const [loading, setLoading] = React.useState(false);

  const createEntity = React.useCallback(async (state: ControlRevisionCarpetas): Promise<{ created: ControlRevisionCarpetas | null; ok: boolean }> => {
    setLoading(true);

    try {
      const payload = buildFirstTimeControlRevisionPayload(state)
      const creado = await actionsController.handleSubmitBd(payload);
      return { ok: true, created: creado };
    } catch {
      notify.auto("Algo ha salido mal creando el registro");
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  }, [actionsController]);

  return {
    createEntity,
    ...searchesController,
    ...formController,
    ...actionsController,
    loading
  };
}


