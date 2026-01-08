import React from "react";
import type { PazSalvosService } from "../../Services/PazSalvos.service";
import type { PazSalvo, PazSalvoErrors } from "../../models/PazSalvo";
import type { DateRange, GetAllOpts, SortDir, SortField } from "../../models/Commons";
import { parseDateFlex, toGraphDateTime } from "../../utils/Date";
import { useAuth } from "../../auth/authProvider";
import type { FirmaInline } from "../../models/Imagenes";
import type { MailService } from "../../Services/Mail.service";

export function usePazSalvo(pazSalvoSvc: PazSalvosService,  mail: MailService, isAdmin?: boolean,) {
  const [rows, setRows] = React.useState<PazSalvo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });
  const [year, setYear] = React.useState<string>(""); 
  const [estado, setEstado] = React.useState<string>(""); 
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(20000);
  const [nextLink, setNextLink] = React.useState<string | null>(null);
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [search, setSearch] = React.useState<string>("");
  const [state, setState] = React.useState<PazSalvo>({
    Cargo: "",
    Title: "",
    CO: "",
    Nombre: "",
    Consecutivo: "",
    Empresa: "",
    CorreoJefe: "",
    Jefe: "",
    FechaIngreso: "",
    FechaSalida: "",
    Estado: "",
    Solicitados: [],
    Solicitante: ""
  });
  const [errors, setErrors] = React.useState<PazSalvoErrors>({});
  const setField = <K extends keyof PazSalvo>(k: K, v: PazSalvo[K]) => setState((s) => ({ ...s, [k]: v }));
  const {account} = useAuth();
  
  // construir filtro OData
  const buildFilter = React.useCallback((): GetAllOpts => {
    const filters: string[] = [];

    if(search){
        filters.push(`((startswith(fields/Title, '${search}') or startswith(fields/Nombre, '${search}')) or startswith(fields/Cargo, '${search}'))`)
    }

    if (range.from && range.to && (range.from < range.to)) {
      if (range.from) filters.push(`fields/Created ge '${year}-01-01T00:00:00Z'`);
      if (range.to)   filters.push(`fields/Created le '${year}-12-31T00:00:00Z'`);
    }

    if (year) {
      filters.push(`fields/Created ge '${year}-01-01T00:00:00Z' and fields/Created le '${year}-12-31T23:59:59Z'`);
    }

    if(estado){
      if(estado !== "Todos"){
        filters.push(`fields/Estado eq '${estado}'`)
      }
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
  }, [range.from, range.to, pageSize, sorts, search, year, estado]); 

  const loadFirstPage = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { items, nextLink } = await pazSalvoSvc.getAll(buildFilter()); 
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
  }, [pazSalvoSvc, buildFilter, sorts]);

  React.useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage, range, search, estado]);

  // siguiente página: seguir el nextLink tal cual
  const hasNext = !!nextLink;

  const nextPage = React.useCallback(async () => {
    if (!nextLink) return;
    setLoading(true); setError(null);
    try {
      const { items, nextLink: n2 } = await pazSalvoSvc.getByNextLink(nextLink);
      setRows(items);             
      setNextLink(n2 ?? null);    
      setPageIndex(i => i + 1);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando más tickets");
    } finally {
      setLoading(false);
    }
  }, [nextLink, pazSalvoSvc]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage]);
  const reloadAll  = React.useCallback(() => { loadFirstPage(); }, [loadFirstPage, range, search]);

  const sortFieldToOData: Record<SortField, string> = {
    id: 'fields/Created',
    Consecutivo: 'fields/Consecutivo',
    Nombre: 'fields/Nombre',
    Cedula: 'fields/Title',
    FechaIngreso: 'fields/FechaIngreso',
    FechaSalida: 'fields/FechaSalida',
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
    const e: PazSalvoErrors = {};
    if(!state.CO) e.CO = "Obligatorio";
    if(!state.Cargo) e.Cargo = "Obligatorio"
    if(!state.CorreoJefe) e.CorreoJefe = "Obligatorio"
    if(!state.Empresa) e.Empresa = "Obligatorio"
    if(!state.FechaIngreso) e.FechaIngreso = "Obligatorio"
    if(!state.FechaSalida) e.FechaSalida = "Obligatorio"
    if(!state.Jefe) e.Jefe = "Obligatorio"
    if(!state.Nombre) e.Nombre = "Obligatorio"
    if(!state.Solicitados) e.Solicitados = "Seleccione al menos un solicitado"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const cleanState = () => {
    setState({
        Cargo: "",
        Consecutivo: "",
        CO: "",
        CorreoJefe: "",
        Empresa: "",
        Estado: "",
        FechaIngreso: "",
        FechaSalida: "",    
        Jefe: "No", 
        Nombre: "",    
        Solicitados: [],
        Title: "",
        Solicitante: account?.username ?? ""
    })
  };

  const handleSubmit = async (e: React.FormEvent, firma: FirmaInline) => {
    e.preventDefault();
    if (!validate()) {
      alert("Hay campos sin llenar")
      return};
    setLoading(true);
    try {
      console.warn(firma)
      const cantidad = await pazSalvoSvc.getAll({top:20000});
      const consecutivo = (cantidad.items.length + 1).toString().padStart(5, '0');
      setState((s) => ({...s, Consecutivo: consecutivo}));
          
      // Objeto de creación
      const payload: PazSalvo = {
        Cargo: state.Cargo,
        CO: state.CO,
        Consecutivo: state.Consecutivo,
        CorreoJefe: state.CorreoJefe,
        Empresa: state.Empresa,
        Estado: "Pendiente",
        FechaIngreso:toGraphDateTime(state.FechaIngreso) ?? null,
        FechaSalida: toGraphDateTime(state.FechaSalida) ?? null,
        Jefe: state.Jefe,
        Nombre: state.Nombre,
        Solicitados: state.Solicitados,
        Title: state.Title,
        Solicitante: account?.username ?? ""
      };
      const created = await pazSalvoSvc.create(payload);
      
      const toRecipients = [
        ...state.Solicitados.map(s => ({
          emailAddress: { address: s.correo },
        })),
        { emailAddress: { address: state.CorreoJefe } },
      ];

      const htmlBody = `
        <p> Buen dia,</p>
        <p>Se solicitan los paz y salvo de la siguiente persona.
        <strong>Paz y salvo con ID: ${created.Id}</strong>

        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 8px;">Cedula: </th>
            <th style="padding: 8px;">Nombre:</th>
            <th style="padding: 8px;">Fecha de ingreso</th>
            <th style="padding: 8px;">Fecha de retiro</th>
            <th style="padding: 8px;">Cargo</th>
            <th style="padding: 8px;">Empresa</th>
            <th style="padding: 8px;">Jefe</th>
            <th style="padding: 8px;">C.O</th>
          </tr>
          <tr>
            <td style="padding: 8px;">${created.Title}</td>
            <td style="padding: 8px;">${created.Nombre}</td>
            <td style="padding: 8px;">${parseDateFlex(created.FechaIngreso)}</td>
            <td style="padding: 8px;">${parseDateFlex(created.FechaSalida)}</td>
            <td style="padding: 8px;">${created.Cargo}</td>
            <td style="padding: 8px;">${created.Empresa}</td>
            <td style="padding: 8px;">${created.Jefe}</td>
            <td style="padding: 8px;">${created.CO}</td>
          </tr>
        </table>

        <p>Por favor emitir esta información en los siguientes cinco <strong>(5) dias hábiles</strong> a partir de la fecha de este correo</p> 
        <br>
        <p>No responder a este correo ya que fue enviado automaticamente</p>
        <br>
        <p>Para responder el paz y salvo debe ingresar a la siguiente ruta (Recuerde que si esta fuera de 35 palms debe usar la VPN): https://gestordocumentalch.estudiodemoda.com.co/</p>
        <br>

          ${firma ? `
          <br/>
          <p>Firma del solicitante:</p>
          <img src="cid:firma-usuario"
              alt="Firma del solicitante"
              style="max-width: 200px; max-height: 80px; object-fit: contain;" />
        `
        : ""
      }
      `;

      await mail.sendEmail({
        message: {
          subject: `Nueva solicitud Paz y Salvo - ${state.Nombre}`,
          body: {
            contentType: "HTML",
            content: htmlBody,
          },
          toRecipients,
        },
        saveToSentItems: true,
      });

      alert("Se ha creado el registro con éxito y se enviaron las notificaciones.");
      cleanState();
    } finally {
        setLoading(false);
      }
  };

  const updatePazSalvo = async (e: React.FormEvent, IdPazSalvo: string) => {
    e.preventDefault();
    if (!validate()) {return};
    setLoading(true);
    try {

      await pazSalvoSvc.update(IdPazSalvo, {Estado: "Finalizado"});
    
      alert("Se ha finalizado el paz y salvo con éxito");
      cleanState();
    } finally {
        setLoading(false);
      }
  };

  const visibleRows = React.useMemo(() => {

    if(rows.length === 0) return [];
    // 1) Si es admin, ve todo
    if (isAdmin) return rows;
    // 2) Si no tenemos account o username, no filtramos (o podrías devolver [])
    const email = account?.username?.trim().toLowerCase();
    if (!email) return rows;

    // 3) Filtrar por solicitados
    return rows.filter(row => {
      if (!Array.isArray(row.Solicitados) || row.Solicitados.length === 0) {
        return false;
      }

      return row.Solicitados.some((s) => {
        if (!s.correo) return false;
        return s.correo.trim().toLowerCase() === email;
      });
    });
  }, [rows, account?.username, isAdmin, estado, search, year]);


  /*const loadToReport = React.useCallback(async (from: string, to: string, EnviadoPor?: string, cargo?: string, empresa?: string, ciudad?: string) => {
    setLoading(true); setError(null);
    const filters: string[] = [];
    filters.push(`fields/Created ge '${from}T00:00:00Z' and fields/Created le '${to}T23:59:59Z'`)

    if(EnviadoPor){
      filters.push(`fields/Informaci_x00f3_n_x0020_enviada_ ge '${EnviadoPor}'`)
    }

    if(cargo){
      filters.push(`fields/CARGO ge '${cargo}'`)
    }

    if(empresa){
      filters.push(`fields/Empresa_x0020_que_x0020_solicita ge '${empresa}'`)
    }

    if(ciudad){
      filters.push(`fields/CIUDAD ge '${ciudad}'`)
    }

   const buildedFilter = filters.join(" and ")
    try {
      const { items, nextLink } = await ContratosSvc.getAll({filter: buildedFilter, top:2000}); // debe devolver {items,nextLink}
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
  }, []);*/

  return {
    rows, loading, error, pageSize, pageIndex, hasNext, range, search, errors, sorts, state, year, estado, visibleRows,
    nextPage, applyRange, reloadAll, toggleSort, setRange, setPageSize, setSearch, setSorts, setField, handleSubmit, cleanState, loadFirstPage, setYear, setEstado, updatePazSalvo
  };
}


