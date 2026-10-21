import React from "react";

import { buildEditANSPayload } from "../utils/ansPayloads";
import { ANS_MESSAGES } from "../utils/ansMessages";
import type { AnsRequisicionService } from "../../../../Services/Ans.service";
import type { ansRequisicion } from "../../../../models/Requisiciones/requisiciones";
import { notify } from '../../../../utils/notify';
import { useAuditLog } from "../../../Common/useAuditLog";

type UseANSActionsParams = {
  service: AnsRequisicionService;
  state: ansRequisicion;
  validate: () => boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useANSActions({service, state, validate, setLoading,}: UseANSActionsParams) {
  const { withAudit } = useAuditLog("Requisiciones");

  //Crear un nuevo ANS
  const handleCreateForPosition = React.useCallback(async (payload: ansRequisicion): Promise<{ created: string | null; ok: boolean }> => {
      if (!validate()) {
        notify.auto(ANS_MESSAGES.requiredFields);
        return { created: null, ok: false };
      }

      setLoading(true);
      try {
        const created = await withAudit(
          {
            accion: "Creacion",
            descripcion: "Se creó una configuración de ANS para un cargo",
            descripcionError: "Falló la creación de una configuración de ANS para un cargo",
            detalle: { nivel_cargo: payload.NivelCargo, campos_enviados: Object.keys(payload) },
            idFromResult: (r) => r?.Id,
          },
          () => service.create(payload)
        );
        notify.auto(ANS_MESSAGES.createSuccess);
        return {
          created: created.Id ?? "",
          ok: true,
        };
      } catch {
        notify.auto(ANS_MESSAGES.deleteError)
        return {
          created: null,
          ok: false,
        };
      } finally {
        setLoading(false);
      }
    },
    [service, validate, setLoading, withAudit]
  );

  const handleEdit = React.useCallback(
    async (e: React.FormEvent, cargoSeleccionado: ansRequisicion) => {
      e.preventDefault();

      if (!validate()) return;

      setLoading(true);
      try {
        const payload = buildEditANSPayload(cargoSeleccionado, state);
        await withAudit(
          {
            accion: "Edicion",
            descripcion: "Se editó una configuración de ANS para un cargo",
            descripcionError: "Falló la edición de una configuración de ANS para un cargo",
            id_item_afectado: cargoSeleccionado.Id,
            detalle: {
              nivel_cargo: cargoSeleccionado.NivelCargo,
              campos_modificados: (Object.keys(payload) as Array<keyof ansRequisicion>).filter((k) => payload[k] !== cargoSeleccionado[k]),
            },
          },
          () => service.update(cargoSeleccionado.Id!, payload)
        );
        notify.auto(ANS_MESSAGES.updateSuccess);
      } finally {
        setLoading(false);
      }
    },
    [service, state, validate, setLoading, withAudit]
  );

  const handleDelete = React.useCallback(
    async (e: React.FormEvent, id: string) => {
      e.preventDefault();

      const ok = window.confirm(ANS_MESSAGES.deleteConfirm);
      if (!ok) return;

      setLoading(true);
      try {
        await withAudit(
          {
            accion: "Eliminacion",
            descripcion: "Se eliminó una configuración de ANS para un cargo",
            descripcionError: "Falló la eliminación de una configuración de ANS para un cargo",
            id_item_afectado: id,
          },
          () => service.delete(id)
        );
        notify.auto(ANS_MESSAGES.deleteSuccess);
      } catch (err) {
        console.error(err);
        notify.auto(ANS_MESSAGES.deleteError);
      } finally {
        setLoading(false);
      }
    },
    [service, setLoading, withAudit]
  );

  return {
    handleCreateForPosition,
    handleEdit,
    handleDelete,
  };
}

