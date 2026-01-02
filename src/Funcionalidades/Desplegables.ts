// src/Funcionalidades/Desplegables.ts
import * as React from "react";
import type {desplegablesOption, dobleCampo, maestro,} from "../models/Desplegables";
import type { DeptosYMunicipiosService } from "../Services/DeptosYMunicipios.service";
import type { MaestrosService } from "../Services/Maestros.service";

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

export function useDesplegable<T>(config: DesplegableConfig<T>): UseDesplegableResult<T> {
  const {load, getId, getLabel, includeIdInLabel = true, fallbackIfEmptyTitle = "(Sin título)", idPrefix = "#", addItem, deleteItem, editItem,} = config;
  const [items, setItems] = React.useState<T[]>([]);
  const [options, setOptions] = React.useState<desplegablesOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
    items, options, loading, error, reload, add: addItem ? add : undefined, remove: deleteItem ? remove : undefined, editItem,};
}

/* ================== Hooks concretos ================== */
/* ====== CAMPO ÚNICO ====== */

// Empresas con filtro por search en memoria
export function useEmpresasSelect(EmpresaSvc: MaestrosService) {
  const load = React.useCallback(
    async (search?: string) => {
      const items = await EmpresaSvc.getAll({filter: "fields/Title eq 'Empresas'"}); // back completo
      if (!search) return items;

      const term = search.toLowerCase();
      return items.filter((e:maestro) =>
        (e.T_x00ed_tulo1 ?? "").toLowerCase().includes(term)
      );
    },
    [EmpresaSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => EmpresaSvc.create(payload),
    [EmpresaSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => EmpresaSvc.update(id, payload),
    [EmpresaSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => EmpresaSvc.delete(String(id)),
    [EmpresaSvc]
  );

  return useDesplegable<maestro>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Id ?? e.T_x00ed_tulo1, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

// El resto ignora el search (pero el tipo lo acepta)
export function useCargo(CargoSvc: MaestrosService) {
  const load = React.useCallback(
    (_search?: string) => CargoSvc.getAll({filter: "fields/Title eq 'Cargos'"}),
    [CargoSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => CargoSvc.create(payload),
    [CargoSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => CargoSvc.update(id, payload),
    [CargoSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => CargoSvc.delete(String(id)),
    [CargoSvc]
  );

  return useDesplegable<maestro>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Id ?? e.T_x00ed_tulo1, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useModalidadTrabajo(modalidadSvc: MaestrosService) {
  const load = React.useCallback(
    () => modalidadSvc.getAll({filter: "fields/Title eq 'Modalidades teletrabajo'"}),
    [modalidadSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => modalidadSvc.create(payload),
    [modalidadSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => modalidadSvc.update(id, payload),
    [modalidadSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => modalidadSvc.delete(String(id)),
    [modalidadSvc]
  );

  return useDesplegable<maestro>({
    load, addItem, deleteItem, editItem, getId: (e) => e.Id ?? e.T_x00ed_tulo1, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useEspecificidadCargo(espeficidadSvc: MaestrosService) {
  const load = React.useCallback(
    () => espeficidadSvc.getAll({filter: "fields/Title eq 'Especifidad de cargos'"}),
    [espeficidadSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => espeficidadSvc.create(payload),
    [espeficidadSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => espeficidadSvc.update(id, payload),
    [espeficidadSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => espeficidadSvc.delete(String(id)),
    [espeficidadSvc]
  );

  return useDesplegable<maestro>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Id ?? e.T_x00ed_tulo1, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useEtapa(etapasSvc: MaestrosService) {
  const load = React.useCallback(
    () => etapasSvc.getAll({filter: "fields/Title eq 'Etapas'"}),
    [etapasSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => etapasSvc.create(payload),
    [etapasSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => etapasSvc.update(id, payload),
    [etapasSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => etapasSvc.delete(String(id)),
    [etapasSvc]
  );

  return useDesplegable<maestro>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Id ?? e.T_x00ed_tulo1, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useNivelCargo(nivelSvc: MaestrosService) {
  const load = React.useCallback(
    () => nivelSvc.getAll({filter: "fields/Title eq 'Nivel de cargos'"}),
    [nivelSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => nivelSvc.create(payload),
    [nivelSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => nivelSvc.update(id, payload),
    [nivelSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => nivelSvc.delete(String(id)),
    [nivelSvc]
  );

  return useDesplegable<maestro>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Id ?? e.T_x00ed_tulo1, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useOrigenSeleccion(origenSeleccionSvc: MaestrosService) {
  const load = React.useCallback(
    () => origenSeleccionSvc.getAll({filter: "fields/Title eq 'Origenes selecciones'"}),
    [origenSeleccionSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => origenSeleccionSvc.create(payload),
    [origenSeleccionSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => origenSeleccionSvc.update(id, payload),
    [origenSeleccionSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => origenSeleccionSvc.delete(String(id)),
    [origenSeleccionSvc]
  );

  return useDesplegable<maestro>({
    load, deleteItem, addItem, editItem, getId: (e) => e.Id ?? e.T_x00ed_tulo1, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useTipoContrato(tipoContratoSvc: MaestrosService) {
  const load = React.useCallback(
    (_search?: string) => tipoContratoSvc.getAll({filter: "fields/Title eq 'Tipo de contrato'"}),
    [tipoContratoSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => tipoContratoSvc.create(payload),
    [tipoContratoSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => tipoContratoSvc.update(id, payload),
    [tipoContratoSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => tipoContratoSvc.delete(String(id)),
    [tipoContratoSvc]
  );

  return useDesplegable<maestro>({
    load, getId: (e) => e.Id ?? e.T_x00ed_tulo1, getLabel: (e) => e.T_x00ed_tulo1 ?? "", addItem, deleteItem, editItem,
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useTipoVacante(tipoVacante: MaestrosService) {
  const load = React.useCallback(
    (_search?: string) => tipoVacante.getAll({filter: "fields/Title eq 'Tipo vacante'"}),
    [tipoVacante]
  );

  const addItem = React.useCallback(
    (payload: maestro) => tipoVacante.create(payload),
    [tipoVacante]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => tipoVacante.update(id, payload),
    [tipoVacante]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => tipoVacante.delete(String(id)),
    [tipoVacante]
  );

  return useDesplegable<maestro>({
    load, addItem, editItem, deleteItem,  getId: (e) => e.Id ?? e.T_x00ed_tulo1, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

/* ====== DOBLE CAMPO ====== */

export function useTipoDocumentoSelect(tipoDocumentoSvc: MaestrosService) {
  const load = React.useCallback(
    (_search?: string) => tipoDocumentoSvc.getAll({filter: "fields/Title eq 'Tipos de documentos'"}),
    [tipoDocumentoSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => tipoDocumentoSvc.create(payload),
    [tipoDocumentoSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => tipoDocumentoSvc.update(id, payload),
    [tipoDocumentoSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => tipoDocumentoSvc.delete(String(id)),
    [tipoDocumentoSvc]
  );

  return useDesplegable<maestro>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Abreviacion, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useCentroCostos(centroCostosSvc: MaestrosService) {
  const load = React.useCallback(
    (_search?: string) => centroCostosSvc.getAll({filter: "fields/Title eq 'Centro de costos'"}),
    [centroCostosSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => centroCostosSvc.create(payload),
    [centroCostosSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => centroCostosSvc.update(id, payload),
    [centroCostosSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => centroCostosSvc.delete(String(id)),
    [centroCostosSvc]
  );

  return useDesplegable<maestro>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Codigo, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useCentroOperativo(centroOperativoSvc: MaestrosService) {
  const load = React.useCallback(
    () => centroOperativoSvc.getAll({filter: "fields/Title eq 'Centros operativos'"}),
    [centroOperativoSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => centroOperativoSvc.create(payload),
    [centroOperativoSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => centroOperativoSvc.update(id, payload),
    [centroOperativoSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => centroOperativoSvc.delete(String(id)),
    [centroOperativoSvc]
  );

  return useDesplegable<maestro>({
    load, addItem, editItem, deleteItem, getId: (e) => e.Codigo, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useUnidadNegocio(unidadNegocioSvc: MaestrosService) {
  const load = React.useCallback(
    () => unidadNegocioSvc.getAll({filter: "fields/Title eq 'Unidad de negocio'"}),
    [unidadNegocioSvc]
  );

  const addItem = React.useCallback(
    (payload: maestro) => unidadNegocioSvc.create(payload),
    [unidadNegocioSvc]
  );

  const editItem = React.useCallback(
    (payload: maestro, id: string) => unidadNegocioSvc.update(id, payload),
    [unidadNegocioSvc]
  );

  const deleteItem = React.useCallback(
    (id: string | number) => unidadNegocioSvc.delete(String(id)),
    [unidadNegocioSvc]
  );

  return useDesplegable<maestro>({
    load, deleteItem, editItem, addItem, getId: (e) => e.Codigo, getLabel: (e) => e.T_x00ed_tulo1 ?? "",
    includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",
  });
}

export function useDeptosMunicipios(DeptosSvc: DeptosYMunicipiosService) {
  const load = React.useCallback(
    (_search?: string) => DeptosSvc.getAll({top: 2000}),
    [DeptosSvc]
  );

  return useDesplegable<dobleCampo>({
    load, getId: (e) => e.Abreviacion, getLabel: (e) => e.Title ?? "", includeIdInLabel: false, fallbackIfEmptyTitle: "(Sin nombre)", idPrefix: "#",});
} 
