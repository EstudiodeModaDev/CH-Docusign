import React from "react";
import { useFolderControlForm } from "./userControlForm";
import { useFolderControlActions } from "./useControlBdACtions";
import { useSpecificFolderSearch } from "./useControlSearcher";
import type { ControlRevisionCarpetas } from "../../../../../models/DocumentViewer";
import { buildFirstTimeControlRevisionPayload } from "../utils/controlRevisionPayload";
import { notify } from '../../../../../utils/notify';
import { useAuditLog } from "../../../../Common/useAuditLog";

export function useFolderControl(folderInfo: {cedula: string, nombre: string, fullname: string, path: string}, empresa: string) {
  const formController = useFolderControlForm(folderInfo, empresa)
  const actionsController = useFolderControlActions()
  //const listController = useHabeasList(paginationController.pageSize, auth.account?.name ?? "")
  const searchesController = useSpecificFolderSearch()
  const { withAudit } = useAuditLog("Documentos")

  const [loading, setLoading] = React.useState(false);

  const createEntity = React.useCallback(async (state: ControlRevisionCarpetas): Promise<{ created: ControlRevisionCarpetas | null; ok: boolean }> => {
    setLoading(true);

    try {
      const payload = buildFirstTimeControlRevisionPayload(state)
      const creado = await withAudit(
        {
          accion: "Creacion",
          descripcion: "Se creó el control de revisión de la carpeta de un colaborador",
          descripcionError: "Falló la creación del control de revisión de la carpeta de un colaborador",
          detalle: { empresa, carpeta: state.FolderPath ?? "", campos_enviados: Object.keys(payload) },
          idFromResult: (res) => res?.Id,
        },
        () => actionsController.handleSubmitBd(payload)
      );
      return { ok: true, created: creado };
    } catch {
      notify.auto("Algo ha salido mal creando el registro");
      return { ok: false, created: null };
    } finally {
      setLoading(false);
    }
  }, [actionsController, withAudit, empresa]);

  return {
    createEntity,
    ...searchesController,
    ...formController,
    ...actionsController,
    loading
  };
}


