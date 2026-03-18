import React from "react";

import { buildEditANSPayload } from "../utils/ansPayloads";
import { ANS_MESSAGES } from "../utils/ansMessages";
import type { AnsRequisicionService } from "../../../../Services/Ans.service";
import type { ansRequisicion } from "../../../../models/requisiciones";

type UseANSActionsParams = {
  service: AnsRequisicionService;
  state: ansRequisicion;
  validate: () => boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useANSActions({service, state, validate, setLoading,}: UseANSActionsParams) {

  //Crear un nuevo ANS
  const handleCreateForPosition = React.useCallback(async (payload: ansRequisicion): Promise<{ created: string | null; ok: boolean }> => {
      if (!validate()) {
        alert(ANS_MESSAGES.requiredFields);
        return { created: null, ok: false };
      }

      setLoading(true);
      try {
        const created = await service.create(payload);
        alert(ANS_MESSAGES.createSuccess);
        return {
          created: created.Id ?? "",
          ok: true,
        };
      } catch(e) {
        alert(ANS_MESSAGES.deleteError)
        return {
          created: null,
          ok: false,
        };
      } finally {
        setLoading(false);
      }
    },
    [service, validate, setLoading]
  );

  const handleEdit = React.useCallback(
    async (e: React.FormEvent, cargoSeleccionado: ansRequisicion) => {
      e.preventDefault();

      if (!validate()) return;

      setLoading(true);
      try {
        const payload = buildEditANSPayload(cargoSeleccionado, state);
        await service.update(cargoSeleccionado.Id!, payload);
        alert(ANS_MESSAGES.updateSuccess);
      } finally {
        setLoading(false);
      }
    },
    [service, state, validate, setLoading]
  );

  const handleDelete = React.useCallback(
    async (e: React.FormEvent, id: string) => {
      e.preventDefault();

      const ok = window.confirm(ANS_MESSAGES.deleteConfirm);
      if (!ok) return;

      setLoading(true);
      try {
        await service.delete(id);
        alert(ANS_MESSAGES.deleteSuccess);
      } catch (err) {
        console.error(err);
        alert(ANS_MESSAGES.deleteError);
      } finally {
        setLoading(false);
      }
    },
    [service, setLoading]
  );

  return {
    handleCreateForPosition,
    handleEdit,
    handleDelete,
  };
}