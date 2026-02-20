import React from "react";
import type { DateRange, GetAllOpts, rsOption, SortDir, SortField, } from "../../models/Commons";
import { normalize, toGraphDateTime, toISODateFlex } from "../../utils/Date";
import type { HabeasDataService } from "../../Services/HabeasData.service";
import type { HabeasData, HabeasErrors } from "../../models/HabeasData";
import { useAuth } from "../../auth/authProvider";
import { norm } from "../../utils/text";
import { useDebouncedValue } from "./Contratos";

function includesSearch(row: HabeasData, q: string) {
  const qq = norm(q);
  if (!qq) return true;

  return (
    norm(row.Title).includes(qq) ||
    norm(row.NumeroDocumento).includes(qq) 
  );
}

function compareRows(a: HabeasData, b: HabeasData, field: SortField, dir: SortDir) {
  const mul = dir === "asc" ? 1 : -1;

  const toTime = (v: any) => {
    if (!v) return 0;

    // Caso: ya viene ISO (2026-01-23T00:00:00Z) o Date
    const d1 = new Date(v);
    if (!Number.isNaN(d1.getTime())) return d1.getTime();

    // Caso: viene como "YYYY-MM-DD" sin hora
    const s = String(v).trim();
    const isoTry = new Date(`${s}T00:00:00Z`);
    if (!Number.isNaN(isoTry.getTime())) return isoTry.getTime();

    // Caso: viene como "DD/MM/YYYY"
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      const yyyy = Number(m[3]);
      const d = new Date(Date.UTC(yyyy, mm - 1, dd));
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    }

    return 0;
  };

  const get = (r: HabeasData) => {
    switch (field) {
      case "Cedula":
        return norm(r.NumeroDocumento);
      case "Nombre":
        return norm(r.Title);
      case "Ciudad":
        return norm(r.Ciudad);
      case "reporta":
        return toTime(r.Informacionreportadapor);
    }
  };

  const av = get(a);
  const bv = get(b);

  if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
  return String(av).localeCompare(String(bv), "es", { numeric: true }) * mul;
}

export function useHabeasData(HabeasDataSvc: HabeasDataService) {
  const [rows, setRows] = React.useState<HabeasData[]>([]);
  const [baseRows, setBaseRows] = React.useState<HabeasData[]>([]);
  const [workers, setWorkers] = React.useState<HabeasData[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const today = React.useMemo(() => toISODateFlex(new Date()), []);
  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });
  const [pageSize, setPageSize] = React.useState<number>(10); 
  const [pageIndex, setPageIndex] = React.useState<number>(1);
  const [nextLink, setNextLink] = React.useState<string | null>(null);
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [search, setSearch] = React.useState<string>("");
  const {account} = useAuth()
  const [state, setState] = React.useState<HabeasData>({
    AbreviacionTipoDoc: "",
    Ciudad: "",
    Fechaenlaquesereporta: toGraphDateTime(today) ?? null,
    Informacionreportadapor: account?.name ?? "",
    NumeroDocumento: "",
    Tipodoc: "",
    Title: "",
    Correo: "",
    Empresa: ""
  });
  const [errors, setErrors] = React.useState<HabeasErrors>({});
  const debouncedSearch = useDebouncedValue(search, 250);
  
 const buildServerFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if (range.from && range.to && range.from <= range.to) {
      filters.push(`fields/Created ge '${range.from}T00:00:00Z'`);
      filters.push(`fields/Created le '${range.to}T23:59:59Z'`);
    }

    return {
      filter: filters.length ? filters.join(" and ") : undefined,
      orderby: "fields/Created desc",
      top: 2000,
    };
  }, [range.from, range.to]);

  const loadBase = React.useCallback(async () => {
    if (!account?.username) return;

    setLoading(true);
    setError(null);

    try {
      const { items } = await HabeasDataSvc.getAll(buildServerFilter());
      setBaseRows(items ?? []);
      setPageIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setBaseRows([]);
      setRows([]);
      setNextLink(null);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [account?.username, HabeasDataSvc, buildServerFilter]);

  // Traer de Graph SOLO cuando cambie estado/rango (o cuando auth esté listo)
  React.useEffect(() => {
    loadBase();
  }, [loadBase, range.from, range.to, pageSize]);

  // Cuando cambie search (debounced) volvemos a la primera página CSR
  React.useEffect(() => {
    setPageIndex(1);
  }, [debouncedSearch]);

  // =========================
  // CSR pipeline: search contains + sort multi + pagination
  // =========================
  React.useEffect(() => {
    // 1) filter contains (CSR)
    let data = baseRows;
    if (debouncedSearch?.trim()) {
      data = baseRows.filter((r) => includesSearch(r, debouncedSearch));
    }

    // 2) sort multi-col
    if (sorts?.length) {
      data = [...data].sort((a, b) => {
        for (const s of sorts) {
          const c = compareRows(a, b, s.field, s.dir);
          if (c !== 0) return c;
        }
        return 0;
      });
    }

    // 3) paginate local
    const start = (pageIndex - 1) * pageSize;
    const page = data.slice(start, start + pageSize);

    setRows(page);

    const hasMore = data.length > start + pageSize;
    setNextLink(hasMore ? "local" : null);
  }, [baseRows, debouncedSearch, sorts, pageIndex, pageSize]);

  // =========================
  // API-compatible: loadFirstPage / paging
  // =========================
  const loadFirstPage = React.useCallback(async () => {
    // CSR: recarga base del server y vuelve a page 1
    await loadBase();
    setPageIndex(1);
  }, [loadBase]);

  const hasNext = !!nextLink;

  const nextPage = React.useCallback(async () => {
    if (!nextLink) return;
    setLoading(true); setError(null);
    try {
      const { items, nextLink: n2 } = await HabeasDataSvc.getByNextLink(nextLink);
      setRows(items);             
      setNextLink(n2 ?? null); 
      setPageIndex(i => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, HabeasDataSvc]);
  

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage]);
  const reloadAll  = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage, range, search]);


  const toggleSort = React.useCallback((field: SortField, additive = false) => {
    setSorts(prev => {
      const idx = prev.findIndex(s => s.field === field);
      if (!additive) {
        // clic normal: solo esta columna; alterna asc/desc
        if (idx >= 0) {
          const dir: SortDir = prev[idx].dir === 'desc' ? 'asc' : 'desc';
          return [{ field, dir }];
        }
        return [{ field, dir: 'asc' }];
      }
      // Shift+clic: multi-columna
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { field, dir: copy[idx].dir === 'desc' ? 'asc' : 'desc' };
        return copy;
      }
      return [...prev, { field, dir: 'asc' }];
    });
  }, []);

 const setField = <K extends keyof HabeasData>(k: K, v: HabeasData[K]) => setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: HabeasErrors = {};
    if(!state.Ciudad) e.Ciudad = "Seleccione un departamento y ciudad"
    if(!state.Fechaenlaquesereporta) e.Fechaenlaquesereporta = "Seleccione una fecha de expedición"
    if(!state.NumeroDocumento) e.NumeroDocumento = "Ingrese el numero de identificación"
    if(!state.Title) e.Title = "Ingrese el nombre del seleccionado"
    if(!state.Correo) e.Correo = "Ingrese el correo del seleccionado"
    if(!state.Empresa) e.Empresa = "Ingrese la empresa del seleccionado"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { return};
    setLoading(true);
    try {
      // Objeto de creación
      const payload: HabeasData = {
        AbreviacionTipoDoc: state.AbreviacionTipoDoc,
        Ciudad: state.Ciudad,
        Correo: state.Correo,
        Fechaenlaquesereporta: state.Fechaenlaquesereporta,
        Informacionreportadapor: state.Informacionreportadapor,
        NumeroDocumento: state.NumeroDocumento,
        Tipodoc: state.Tipodoc,
        Title: state.Title,
        Empresa: state.Empresa
      };
      await HabeasDataSvc.create(payload);
      cleanState()
      alert("Se ha creado el registro con éxito");
      loadFirstPage()
    } finally {
        setLoading(false);
      }
  };

  const fields: (keyof HabeasData)[] = [
    "Title", "Tipodoc", "AbreviacionTipoDoc", "Ciudad", "NumeroDocumento", "Correo", "Empresa",];

  const buildPatch = (original: HabeasData, next: HabeasData) => {
    const patch: Record<string, any> = {};

    for (const k of fields) {
      const a = normalize(original[k]);
      const b = normalize(next[k]);
      if (a !== b) patch[k] = b;
    }

    return patch;
  };

  const handleEdit = async (e: React.FormEvent, CesacionSeleccionada: HabeasData) => {
    e.preventDefault();
    if (!validate()) return;
    if (!CesacionSeleccionada.Id) { alert("Registro sin Id"); return; }

    setLoading(true);
    try {
      const payload = buildPatch(CesacionSeleccionada, state);

      // opcional: si no hay cambios, no pegues al servidor
      if (Object.keys(payload).length === 0) {
        alert("No hay cambios para guardar");
        return;
      }

      await HabeasDataSvc.update(CesacionSeleccionada.Id, payload);
      alert("Se ha actualizado el registro con éxito");
    } catch {
      alert("Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  const searchWorker = async (query: string): Promise<HabeasData[]> => {
    const resp = await HabeasDataSvc.getAll({
      filter: `fields/NumeroDocumento eq '${query}'`,
      top: 200,
    });

    const workers: HabeasData[] = resp.items ?? [];
    setWorkers(workers);

    const seen = new Set<string>();

    const next: rsOption[] = workers
      .map(item => ({
        value: item.Id!, // solo el Id
        label: `Nombre: ${item.Title} - Habeas Data - Fecha: ${toISODateFlex(item.Fechaenlaquesereporta)}.`,
      }))
      .filter(opt => {
        if (!opt.value) return false;
        if (seen.has(opt.value)) return false;
        seen.add(opt.value);
        return true;
      });

    setWorkersOptions(next);
    console.log("options armadas:", next);

    return workers;
  };

  const loadToReport = React.useCallback(async (from: string, to: string, EnviadoPor?: string, ciudad?: string) => {
    setLoading(true); setError(null);
    const filters: string[] = [];
    filters.push(`fields/Created ge '${from}T00:00:00Z' and fields/Created le '${to}T23:59:59Z'`)

    if(EnviadoPor){
      filters.push(`fields/Informacionreportadapor ge '${EnviadoPor}'`)
    }

    if(ciudad){
      filters.push(`fields/Ciudad ge '${ciudad}'`)
    }

   const buildedFilter = filters.join(" and ")
    try {
      const { items, nextLink } = await HabeasDataSvc.getAll({filter: buildedFilter, top:2000}); // debe devolver {items,nextLink}
      setRows(items);
      setNextLink(nextLink ?? null);
      setPageIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setRows([]);
      setNextLink(null);
      setPageIndex(1);
    } finally {
      setLoading(false);
    }
  }, [HabeasDataSvc]);

  const cleanState = React.useCallback( () => {
    setState({
      AbreviacionTipoDoc: "",
      Ciudad: "",
      Fechaenlaquesereporta: toGraphDateTime(today) ?? null,
      Informacionreportadapor: account?.name ?? "",
      NumeroDocumento: "",
      Tipodoc: "",
      Title: "",
      Correo: "",
      Empresa: ""
    })
  }, [HabeasDataSvc]);

  const searchRegister = async (query: string): Promise<HabeasData | null> => {
    const resp = await HabeasDataSvc.getAll({filter: `fields/NumeroDocumento eq '${query}'`, top: 1, orderby: "fields/Created desc"});

    if(resp.items.length > 0) {
      const retorno = resp.items[0]
      return retorno
    } else {
      return null
    }
  }


  return {
    rows, loading, error, pageSize, pageIndex, hasNext, range, search, sorts, state, errors, workers, workersOptions,
    setState, nextPage, applyRange, reloadAll, searchRegister, toggleSort, setRange, setPageSize, setSearch, setSorts, setField, handleSubmit, handleEdit, searchWorker, loadToReport, cleanState, loadFirstPage
  };
}

