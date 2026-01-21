import React from "react";
import type { DateRange, GetAllOpts, SortDir, SortField, } from "../../models/Commons";
import { toGraphDateTime, toISODateFlex } from "../../utils/Date";
import type { EnviosService } from "../../Services/Envios.service";
import type { Envio, EnvioErrors } from "../../models/Envios";
import { useAuth } from "../../auth/authProvider";

export function useEnvios(EnviosSvc: EnviosService) {
  const [rows, setRows] = React.useState<Envio[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const today = React.useMemo(() => toISODateFlex(new Date()), []);
  const [range, setRange] = React.useState<DateRange>({ from: today, to: today });
  const [pageSize, setPageSize] = React.useState<number>(10); 
  const [pageIndex, setPageIndex] = React.useState<number>(1);
  const [nextLink, setNextLink] = React.useState<string | null>(null);
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [search, setSearch] = React.useState<string>("");
  const [errors, setErrors] = React.useState<EnvioErrors>({});
  const [state, setState] = React.useState<Envio>({
    Cedula: "",
    Compa_x00f1_ia: "",
    CorreoReceptor: "",
    Datos: "",
    EnviadoPor: "",
    Estado: "",
    Fechadeenvio: "",
    Fuente: "",    
    ID_Novedad: "No", 
    IdSobre: "",    
    Receptor: "",
    Recipients: "",
    Title: "",  
  });
  const {account} = useAuth()
  const setField = <K extends keyof Envio>(k: K, v: Envio[K]) => setState((s) => ({ ...s, [k]: v }));
  
  const canEdit = async (id: string, fuente: string): Promise<"view" | "edit"> => {
    const obtener = (await EnviosSvc?.getAll({top: 20000, filter: `fields/ID_Novedad eq '${id}' and fields/Fuente eq '${fuente}'`, orderby: "fields/Created desc"})).items;
    return obtener.length > 0 ? "view" : "edit";
  };

  const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if(search){
        filters.push(`(startswith(fields/Cedula, '${search}') or startswith(fields/CorreoReceptor, '${search}') or startswith(fields/Receptor, '${search}') or startswith(fields/EnviadoPor, '${search}') or startswith(fields/Title, '${search}'))`)
    }

    if (range.from && range.to && (range.from < range.to)) {
      if (range.from) filters.push(`fields/Created ge '${range.from}T00:00:00Z'`);
      if (range.to)   filters.push(`fields/Created le '${range.to}T23:59:59Z'`);
    }

    const orderParts: string[] = sorts
      .map(s => {
        const col = sortFieldToOData[s.field];
        return col ? `${col} ${s.dir}` : '';
      })
      .filter(Boolean);

    // Estabilidad de orden: si no incluiste 'id', agrega 'id desc' como desempate.
    if (!sorts.some(s => s.field === 'id')) {
      orderParts.push('ID desc');
    }
    return {
      filter: filters.join(" and "),
      orderby: orderParts.join(","),
      top: pageSize,
    };
  }, [range.from, range.to, pageSize, sorts, search,]); 

  const loadFirstPage = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { items, nextLink } = await EnviosSvc.getAll(buildFilter()); // debe devolver {items,nextLink}
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
  }, [EnviosSvc, buildFilter, sorts]);

  React.useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage, range, search]);

  const hasNext = !!nextLink;

  const nextPage = React.useCallback(async () => {
    if (!nextLink) return;
    setLoading(true); setError(null);
    try {
      const { items, nextLink: n2 } = await EnviosSvc.getByNextLink(nextLink);
      setRows(items);              // 👈 reemplaza la página visible
      setNextLink(n2 ?? null);     // null si no hay más
      setPageIndex(i => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, EnviosSvc]);

  const applyRange = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage]);
  const reloadAll  = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage, range, search]);

  const sortFieldToOData: Record<SortField, string> = {
    id: 'fields/Created',
    Cedula: 'fields/Cedula',
    Nombre: 'fields/Receptor',
    Correo: 'fields/CorreoReceptor',
    enviadoPor: 'fields/EnviadoPor',
    docSend: 'fields/Title',
    fecha: 'fields/Created',
  };

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

  const validate = () => {
    const e: EnvioErrors = {};
    if(!state.Cedula) e.Cedula = "Requerido"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { return};
    setLoading(true);
    try {
      const payload: Envio = {
        Cedula: state.Cedula,
        Compa_x00f1_ia: state.Compa_x00f1_ia,
        CorreoReceptor: state.CorreoReceptor,
        Datos: state.Datos,
        EnviadoPor: account?.name ?? "",
        Estado: state.Estado,
        Fechadeenvio: toGraphDateTime(today) ?? "",
        Fuente: state.Fuente,
        ID_Novedad: state.ID_Novedad,
        IdSobre: state.IdSobre,
        Receptor: state.Receptor,
        Recipients: state.Recipients,
        Title: state.Title,
      };
      await EnviosSvc.create(payload);
      alert("Se ha creado el registro con éxito")
    } finally {
        setLoading(false);
      }
  };

  const loadToReport = React.useCallback(async (from: string, to: string, EnviadoPor?: string, destinatario?: string, plantilla?: string) => {
    setLoading(true); setError(null);
    const filters: string[] = [];

    console.log(`from: ${from} to: ${to} enviadoPor: ${EnviadoPor} destinatario ${destinatario}`)

    filters.push(`fields/Created ge '${from}T00:00:00Z' and fields/Created le '${to}T23:59:59Z'`)

    if(EnviadoPor){
      filters.push(`fields/EnviadoPor ge '${EnviadoPor}'`)
    }

    if(destinatario){
      filters.push(`fields/Receptor ge '${destinatario}'`)
    }

    if(plantilla){
      filters.push(`fields/Title ge '${plantilla}'`)
    }

   const buildedFilter = filters.join(" and ")
    try {
      const { items, nextLink } = await EnviosSvc.getAll({filter: buildedFilter, top:2000}); // debe devolver {items,nextLink}
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
  }, [EnviosSvc]);


  return {
    rows, loading, error, pageSize, pageIndex, hasNext, range, search, errors, sorts, state, loadToReport,
    setRange, setPageSize, setSearch, setSorts, canEdit, nextPage, applyRange, reloadAll, toggleSort, handleSubmit, setField
  };
}



