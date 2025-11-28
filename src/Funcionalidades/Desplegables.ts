// src/Funcionalidades/Desplegables.ts
import * as React from "react";
import type {
  desplegablesOption,
  campoUnico,
  dobleCampo,
} from "../models/Desplegables";

import type { EmpresaService } from "../Services/Empresas.service";
import type { tipoDocumentoService } from "../Services/TipoDocumento.service";
import type { CargoService } from "../Services/Cargo.service";
import type { ModalidadTrabajoService } from "../Services/ModalidadTrabajo.service";
import type { EspecificidadCargoService } from "../Services/EspecificidadCargo.service";
import type { NivelCargoService } from "../Services/NivelCargo.service";
import type { centroCostosService } from "../Services/CentroCostos.service";
import type { centroOperativoService } from "../Services/CentroOperativo.service";
import type { unidadNegocioService } from "../Services/UnidadNegocio.service";
import type { OrigenSeleccionService } from "../Services/OrigenSeleccion.service";
import type { TipoContratoService } from "../Services/TipoContrato.Service";
import type { TipoVacanteService } from "../Services/TipoVacante.service";
import type { DeptosYMunicipiosService } from "../Services/DeptosYMunicipios.service";
import type { TipoDocumento, withCode } from "../models/Maestros";

/* ================== Tipos genéricos ================== */

type DesplegableConfig<T> = {
  // puede recibir un "search" opcional
  load: (search?: string) => Promise<T[]>;
  getId: (item: T) => string | number;
  getLabel: (item: T) => string;
  includeIdInLabel?: boolean;
  fallbackIfEmptyTitle?: string;
  idPrefix?: string;

  // CRUD opcional
  addItem?: (payload: any) => Promise<T>;
  deleteItem?: (id: string | number) => Promise<void>;
  editItem?: (payload: any, id: string) => Promise<T>;
};

type UseDesplegableResult<T> = {
  items: T[];
  options: desplegablesOption[];
  loading: boolean;
  error: string | null;
  // puedes pasar search aquí
  reload: (search?: string) => Promise<void>;
  add?: (payload: any) => Promise<T | null>;
  remove?: (id: string | number) => Promise<boolean>;
  editItem?: (payload: any, id: string) => Promise<T>;
};

/* ================== Hook genérico ================== */

export function useDesplegable<T>(
  config: DesplegableConfig<T>
): UseDesplegableResult<T> {
  const {
    load,
    getId,
    getLabel,
    includeIdInLabel = true,
    fallbackIfEmptyTitle = "(Sin título)",
    idPrefix = "#",
    addItem,
    deleteItem,
    editItem,
  } = config;

  const [items, setItems] = React.useState<T[]>([]);
  const [options, setOptions] = React.useState<desplegablesOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastSearch, setLastSearch] = React.useState<string | undefined>(
    undefined
  );

  const reload = React.useCallback(
    async (search?: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await load(search);
        setItems(data ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Error cargando datos");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [load]
  );

  const add = React.useCallback(
    async (payload: any): Promise<T | null> => {
      if (!addItem) {
        console.warn("addItem no está definido en este desplegable");
      return null;
      }
      setLoading(true);
      setError(null);
      try {
        const created = await addItem(payload);
        setItems((prev) => [...prev, created]);
        return created;
      } catch (e: any) {
        setError(e?.message ?? "Error creando elemento");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [addItem]
  );

  const remove = React.useCallback(
    async (id: string | number): Promise<boolean> => {
      if (!deleteItem) {
        console.warn("deleteItem no está definido en este desplegable");
        return false;
      }
      setLoading(true);
      setError(null);
      try {
        await deleteItem(id);
        setItems((prev) =>
          prev.filter((it) => String(getId(it)) !== String(id))
        );
        return true;
      } catch (e: any) {
        setError(e?.message ?? "Error eliminando elemento");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [deleteItem, getId]
  );

  React.useEffect(() => {
    const seen = new Set<string>();
    const next: desplegablesOption[] = items
      .map((item) => {
        const rawId = getId(item);
        const id = String(rawId);
        const base = (getLabel(item) ?? "").trim() || fallbackIfEmptyTitle;
        const label = includeIdInLabel ? `${base} — ID: ${idPrefix}${id}` : base;
        return { value: id, label };
      })
      .filter((opt) => {
        if (seen.has(opt.value)) return false;
        seen.add(opt.value);
        return true;
      });

    setOptions(next);
  }, [items, includeIdInLabel, fallbackIfEmptyTitle, idPrefix]);

  return {
    items,
    options,
    loading,
    error,
    reload,
    add: addItem ? add : undefined,
    remove: deleteItem ? remove : undefined,
    editItem,
  };
}

/* ================== Hooks concretos ================== */
/* ====== CAMPO ÚNICO ====== */

// Empresas con filtro por search en memoria
export function useEmpresasSelect(EmpresaSvc: EmpresaService) {
  const load = React.useCallback(
    async (search?: string) => {
      const items = await EmpresaSvc.getAll(); // back completo
      if (!search) return items;

      const term = search.toLowerCase();
      return items.filter((e:campoUnico) =>
        (e.Title ?? "").toLowerCase().includes(term)
      );
    },
    [EmpresaSvc]
  );

  const addItem = React.useCallback(
    (payload: campoUnico) => EmpresaSvc.create(payload),
    [EmpresaSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => EmpresaSvc.update(id, payload),
    [EmpresaSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => EmpresaSvc.delete(String(id)),
    [EmpresaSvc]
  );

  return useDesplegable<campoUnico>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Id ?? e.Title, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

// El resto ignora el search (pero el tipo lo acepta)
export function useCargo(CargoSvc: CargoService) {
  const load = React.useCallback(
    (_search?: string) => CargoSvc.getAll(),
    [CargoSvc]
  );

  const addItem = React.useCallback(
    (payload: campoUnico) => CargoSvc.create(payload),
    [CargoSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => CargoSvc.update(id, payload),
    [CargoSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => CargoSvc.delete(String(id)),
    [CargoSvc]
  );

  return useDesplegable<campoUnico>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Id ?? e.Title, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useModalidadTrabajo(modalidadSvc: ModalidadTrabajoService) {
  const load = React.useCallback(
    () => modalidadSvc.getAll(),
    [modalidadSvc]
  );

  const addItem = React.useCallback(
    (payload: campoUnico) => modalidadSvc.create(payload),
    [modalidadSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => modalidadSvc.update(id, payload),
    [modalidadSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => modalidadSvc.delete(String(id)),
    [modalidadSvc]
  );

  return useDesplegable<campoUnico>({
    load, addItem, deleteItem, editItem, getId: (e) => e.Id ?? e.Title, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useEspecificidadCargo(espeficidadSvc: EspecificidadCargoService) {
  const load = React.useCallback(
    () => espeficidadSvc.getAll(),
    [espeficidadSvc]
  );

  const addItem = React.useCallback(
    (payload: campoUnico) => espeficidadSvc.create(payload),
    [espeficidadSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => espeficidadSvc.update(id, payload),
    [espeficidadSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => espeficidadSvc.delete(String(id)),
    [espeficidadSvc]
  );

  return useDesplegable<campoUnico>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Id ?? e.Title, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useNivelCargo(nivelSvc: NivelCargoService) {
  const load = React.useCallback(
    () => nivelSvc.getAll(),
    [nivelSvc]
  );

  const addItem = React.useCallback(
    (payload: campoUnico) => nivelSvc.create(payload),
    [nivelSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => nivelSvc.update(id, payload),
    [nivelSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => nivelSvc.delete(String(id)),
    [nivelSvc]
  );

  return useDesplegable<campoUnico>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Id ?? e.Title, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useOrigenSeleccion(origenSeleccionSvc: OrigenSeleccionService) {
  const load = React.useCallback(
    () => origenSeleccionSvc.getAll(),
    [origenSeleccionSvc]
  );

  const addItem = React.useCallback(
    (payload: campoUnico) => origenSeleccionSvc.create(payload),
    [origenSeleccionSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => origenSeleccionSvc.update(id, payload),
    [origenSeleccionSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => origenSeleccionSvc.delete(String(id)),
    [origenSeleccionSvc]
  );

  return useDesplegable<campoUnico>({
    load, deleteItem, addItem, editItem, getId: (e) => e.Id ?? e.Title, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useTipoContrato(tipoContratoSvc: TipoContratoService) {
  const load = React.useCallback(
    (_search?: string) => tipoContratoSvc.getAll(),
    [tipoContratoSvc]
  );

  const addItem = React.useCallback(
    (payload: TipoDocumento) => tipoContratoSvc.create(payload),
    [tipoContratoSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => tipoContratoSvc.update(id, payload),
    [tipoContratoSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => tipoContratoSvc.delete(String(id)),
    [tipoContratoSvc]
  );

  return useDesplegable<campoUnico>({
    load, getId: (e) => e.Id ?? e.Title, getLabel: (e) => e.Title ?? "", addItem, deleteItem, editItem,
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useTipoVacante(tipoVacante: TipoVacanteService) {
  const load = React.useCallback(
    (_search?: string) => tipoVacante.getAll(),
    [tipoVacante]
  );

  const addItem = React.useCallback(
    (payload: TipoDocumento) => tipoVacante.create(payload),
    [tipoVacante]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => tipoVacante.update(id, payload),
    [tipoVacante]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => tipoVacante.delete(String(id)),
    [tipoVacante]
  );

  return useDesplegable<campoUnico>({
    load, addItem, editItem, deleteItem,  getId: (e) => e.Id ?? e.Title, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

/* ====== DOBLE CAMPO ====== */

export function useTipoDocumentoSelect(tipoDocumentoSvc: tipoDocumentoService) {
  const load = React.useCallback(
    (_search?: string) => tipoDocumentoSvc.getAll(),
    [tipoDocumentoSvc]
  );

  const addItem = React.useCallback(
    (payload: TipoDocumento) => tipoDocumentoSvc.create(payload),
    [tipoDocumentoSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => tipoDocumentoSvc.update(id, payload),
    [tipoDocumentoSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => tipoDocumentoSvc.delete(String(id)),
    [tipoDocumentoSvc]
  );

  return useDesplegable<dobleCampo>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Abreviacion, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useCentroCostos(centroCostosSvc: centroCostosService) {
  const load = React.useCallback(
    (_search?: string) => centroCostosSvc.getAll(),
    [centroCostosSvc]
  );

  const addItem = React.useCallback(
    (payload: withCode) => centroCostosSvc.create(payload),
    [centroCostosSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => centroCostosSvc.update(id, payload),
    [centroCostosSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => centroCostosSvc.delete(String(id)),
    [centroCostosSvc]
  );

  return useDesplegable<dobleCampo>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Abreviacion, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useCentroOperativo(centroOperativoSvc: centroOperativoService) {
  const load = React.useCallback(
    () => centroOperativoSvc.getAll(),
    [centroOperativoSvc]
  );

  const addItem = React.useCallback(
    (payload: campoUnico) => centroOperativoSvc.create(payload),
    [centroOperativoSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => centroOperativoSvc.update(id, payload),
    [centroOperativoSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => centroOperativoSvc.delete(String(id)),
    [centroOperativoSvc]
  );

  return useDesplegable<dobleCampo>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Abreviacion, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useUnidadNegocio(unidadNegocioSvc: unidadNegocioService) {
  const load = React.useCallback(
    () => unidadNegocioSvc.getAll(),
    [unidadNegocioSvc]
  );

  const addItem = React.useCallback(
    (payload: campoUnico) => unidadNegocioSvc.create(payload),
    [unidadNegocioSvc]
  );

  const editItem = React.useCallback(
    (payload: campoUnico, id: string) => unidadNegocioSvc.update(id, payload),
    [unidadNegocioSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => unidadNegocioSvc.delete(String(id)),
    [unidadNegocioSvc]
  );

  return useDesplegable<dobleCampo>({
    load, deleteItem, editItem, addItem, getId: (e) => e.Abreviacion, getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useDeptosMunicipios(DeptosSvc: DeptosYMunicipiosService) {
  const load = React.useCallback(
    (_search?: string) => DeptosSvc.getAll(),
    [DeptosSvc]
  );

  return useDesplegable<dobleCampo>({
    load,
    getId: (e) => e.Abreviacion,
    getLabel: (e) => e.Title ?? "",
    includeIdInLabel: false,
    fallbackIfEmptyTitle: "(Sin nombre)",
    idPrefix: "#",
  });
}
