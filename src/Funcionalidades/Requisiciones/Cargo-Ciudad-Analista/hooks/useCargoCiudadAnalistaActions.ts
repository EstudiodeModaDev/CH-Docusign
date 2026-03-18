import React from "react";
import { buildEditCargoCiudadAnalistaPayload } from "../utils/cargoCiudadAnalistaPayloads";
import { CARGO_CIUDAD_ANALISTA_MESSAGES } from "../utils/cargoCiudadAnalistaMessages";
import type { cargoCiudadAnalistaService } from "../../../../Services/cargoCiudadAnalista.service";
import type { cargoCiudadAnalista } from "../../../../models/requisiciones";

type UseCargoCiudadAnalistaActionsParams = {
  service: cargoCiudadAnalistaService;
  state: cargoCiudadAnalista;
  validate: () => boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  existsCargoCiudad: (cargo: string, ciudad: string, excludeId?: string) => Promise<boolean>;
};

export function useCargoCiudadAnalistaActions({service, state, validate, setLoading, existsCargoCiudad,}: UseCargoCiudadAnalistaActionsParams) {

  const handleCreate = React.useCallback(async (): Promise<{ created: string | null; ok: boolean }> => {
    if (!validate()) {
      alert(CARGO_CIUDAD_ANALISTA_MESSAGES.requiredFields);
      return { created: null, ok: false };
    }

    setLoading(true);
    try {
      const exists = await existsCargoCiudad(state.Cargo, state.Ciudad);

      if (exists) {
        alert(CARGO_CIUDAD_ANALISTA_MESSAGES.duplicate);
        return { created: null, ok: false };
      }

      const created = await service.create(state);

      alert(CARGO_CIUDAD_ANALISTA_MESSAGES.createSuccess);
      return {
        created: created.Id ?? "",
        ok: true,
      };
    } catch {
      return {
        created: null,
        ok: false,
      };
    } finally {
      setLoading(false);
    }
  },[existsCargoCiudad, service, setLoading, state, validate]);

  const handleEdit = React.useCallback(async (e: React.FormEvent, itemSeleccionado: cargoCiudadAnalista): Promise<{ ok: boolean }> => {
      e.preventDefault();

      if (!validate()) return { ok: false };

      setLoading(true);
      try {
        const payload = buildEditCargoCiudadAnalistaPayload(itemSeleccionado, state);

        const exists = await existsCargoCiudad(
          payload.Cargo,
          payload.Ciudad,
          itemSeleccionado.Id
        );

        if (exists) {
          alert(CARGO_CIUDAD_ANALISTA_MESSAGES.duplicate);
          return { ok: false };
        }

        await service.update(itemSeleccionado.Id!, payload);
        alert(CARGO_CIUDAD_ANALISTA_MESSAGES.updateSuccess);

        return { ok: true };
      } catch {
        return { ok: false };
      } finally {
        setLoading(false);
      }
    },
    [existsCargoCiudad, service, setLoading, state, validate]
  );

  const handleDelete = React.useCallback(
    async (e: React.FormEvent, id: string) => {
      e.preventDefault();

      const ok = window.confirm(CARGO_CIUDAD_ANALISTA_MESSAGES.deleteConfirm);
      if (!ok) return;

      setLoading(true);
      try {
        await service.delete(id);
        alert(CARGO_CIUDAD_ANALISTA_MESSAGES.deleteSuccess);
      } catch (err) {
        console.error(err);
        alert(CARGO_CIUDAD_ANALISTA_MESSAGES.deleteError);
      } finally {
        setLoading(false);
      }
    },
    [service, setLoading]
  );

  return {
    handleCreate,
    handleEdit,
    handleDelete,
  };
}