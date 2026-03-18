import * as React from "react";
import "../Contratos/Contratos.css";
import type { DateRange, SortDir, SortField } from "../../../../models/Commons";
import type { HabeasData, HabeasErrors } from "../../../../models/HabeasData";
import { toISODateFlex } from "../../../../utils/Date";
import FormHabeas from "../Modals/HabeasData/addHabeasData";
import type { SetField } from "../Modals/Contrato/addContrato";
import type { desplegablesOption } from "../../../../models/Desplegables";
import { usePermissions } from "../../../../Funcionalidades/Permisos";
import { useEnvios } from "../../../../Funcionalidades/GD/Envios/hooks/useEnvios";

function renderSortIndicator(field: SortField, sorts: Array<{field: SortField; dir: SortDir}>) {
  const idx = sorts.findIndex(s => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === 'asc' ? '▲' : '▼';
  return <span style={{ marginLeft: 6, opacity: 0.85 }}>{dir}{sorts.length > 1 ? ` ${idx+1}` : ''}</span>;
}

type Props = {
  rows: HabeasData[];
  loading: boolean;
  error: string | null;
  pageSize: number;
  pageIndex: number;
  hasNext: boolean;
  sorts: Array<{field: SortField; dir: SortDir}>;
  setRange: React.Dispatch<React.SetStateAction<DateRange>>;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  reloadAll: () => void;
  toggleSort: (field: SortField, multi?: boolean) => void;
  range: DateRange;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  search: string;
  loadFirstPage: () => Promise<void>;

  state: HabeasData
  setField: SetField<HabeasData>;
  handleSubmit: (e: React.FormEvent) => Promise<{ created: HabeasData | null; ok: boolean }>;
  handleEdit: (e: React.FormEvent, NovedadSeleccionada: HabeasData) => void;
  errors: HabeasErrors
  setState: (n: HabeasData) => void

  //Desplegables
  empresaOptions: desplegablesOption[]
  loadingEmp: boolean
  tipoDocOptions: desplegablesOption[], 
  loadingTipo: boolean 

  deptoOptions: desplegablesOption[], 
  loadingDepto: boolean, 
  deleteHabeas: (id: string) => void
}

export default function TablaHabeas({deleteHabeas, empresaOptions, loadingEmp, tipoDocOptions, loadingTipo, deptoOptions, loadingDepto, setState, errors, handleSubmit, handleEdit, setField, state, rows, loading, error, pageSize, pageIndex, hasNext, sorts, setRange, setPageSize, nextPage, reloadAll, toggleSort, range, setSearch, search, loadFirstPage}: Props) {
  const {canEdit} = useEnvios();
  const [habeasSeleccionado, setHabeasSeleccionado] = React.useState<HabeasData | null>(null);
  const [visible, setVisible] = React.useState<boolean>(false);
  const [tipoFormulario, setTipoFormulario] = React.useState<"new" | "edit" | "view">("edit");
  const { engine } = usePermissions();

  const handleRowClick = async (habeas: HabeasData) => {
    setHabeasSeleccionado(habeas);
    const modo = await canEdit(String(habeas.Id), "Habeas"); 
    setTipoFormulario(modo);
    setVisible(true);
  };

  const canDeleteRegister = React.useMemo(() => {
    const requiredPermission = "habeas.delete";
    if (!requiredPermission) return false;
    return engine.can(requiredPermission);
  }, [engine]);

  return (
    <div className="tabla-novedades">
      <div className="rn-toolbar tabla-filters">
        <div className="rn-toolbar__left">
            <input className="rn-input" onChange={(e) => {setSearch(e.target.value)}} value={search} placeholder="Buscador..."/>
            <input type= "date" className="rn-input rn-date" onChange={(e) => {setRange({ ...range, from: e.target.value })}} value={range.from}/>
            <input type= "date" className="rn-input rn-date" onChange={(e) => {setRange({ ...range, to: e.target.value })}} value={range.to}/>
        </div>
      </div>
      
      {/* Estados */}
      {loading && <p>Cargando registros</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loading && !error && rows.length === 0 && <p>No hay registros para los filtros seleccionados.</p>}

        <div className="novedades-wrap habeas-wrap">
          <table>
            <thead>
              <tr>
                <th role="button" tabIndex={0} onClick={(e) => toggleSort('Cedula', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Cedula', e.shiftKey); }} aria-label="Ordenar por Cedula" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Cedula {renderSortIndicator('Cedula', sorts)}
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('Ciudad', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Ciudad', e.shiftKey); }} aria-label="Ordenar por Ciudad" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Ciudad de expedición {renderSortIndicator('Ciudad', sorts)}
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('Nombre', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Nombre', e.shiftKey); }} aria-label="Ordenar por Nombre" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Nombre {renderSortIndicator('Nombre', sorts)}
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('reporta', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('reporta', e.shiftKey); }} aria-label="Ordenar por fecha de inscripción" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Fecha de inscripción {renderSortIndicator('reporta', sorts)}
                </th>

                <th>Reportado por</th>
                {canDeleteRegister ? <th style={{ textAlign: "center" }}>Eliminar</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((habeas) => (
                <tr key={habeas.Id} onClick={() => handleRowClick(habeas)} tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setHabeasSeleccionado(habeas)}>
                  <td>{habeas.NumeroDocumento}</td>
                  <td><span title={habeas.Ciudad}>{habeas.Ciudad}</span></td>
                  <td><span title={habeas.Title}>{habeas.Title}</span></td>
                  <td><span title={habeas.Fechaenlaquesereporta!}>{toISODateFlex(habeas.Fechaenlaquesereporta)}</span></td>
                  <td><span title={habeas.Informacionreportadapor}>{habeas.Informacionreportadapor}</span></td>
                  {canDeleteRegister ?
                    <td style={{ textAlign: "center" }}>
                      <span title="Elimar proceso">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 26 26" onClick={(e) => {e.stopPropagation(); deleteHabeas(habeas.Id!)}}>
                          <path fill="#e53434" d="M11.5-.031c-1.958 0-3.531 1.627-3.531 3.594V4H4c-.551 0-1 .449-1 1v1H2v2h2v15c0 1.645 1.355 3 3 3h12c1.645 0 3-1.355 3-3V8h2V6h-1V5c0-.551-.449-1-1-1h-3.969v-.438c0-1.966-1.573-3.593-3.531-3.593h-3zm0 2.062h3c.804 0 1.469.656 1.469 1.531V4H10.03v-.438c0-.875.665-1.53 1.469-1.53zM6 8h5.125c.124.013.247.031.375.031h3c.128 0 .25-.018.375-.031H20v15c0 .563-.437 1-1 1H7c-.563 0-1-.437-1-1V8zm2 2v12h2V10H8zm4 0v12h2V10h-2zm4 0v12h2V10h-2z"/>
                        </svg>
                      </span>
                    </td> : null
                  }
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación servidor: Anterior = volver a primera página (loadFirstPage), Siguiente = nextLink */}
          {rows.length > 0 && (
            <div className="paginacion">
              <button onClick={reloadAll} disabled={loading || pageIndex <= 1}>
                Anterior
              </button>
              <span>Página {pageIndex}</span>
              <button onClick={nextPage} disabled={loading || !hasNext}>
                Siguiente
              </button>
            <label htmlFor="page-size" style={{ marginLeft: 12, marginRight: 8 }}>
                    Tickets por página:
                  </label>
                  <select id="page-size" value={pageSize} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageSize(parseInt(e.target.value, 10))} disabled={loading}>
                    {[10, 15, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
            </div>
          )}
        </div>
      {visible ? 
        <FormHabeas 
          onClose={() => setVisible(false)}
          state={state}
          setField={setField}
          handleSubmit={handleSubmit}
          handleEdit={handleEdit}
          errors={errors}
          loadFirstPage={loadFirstPage}
          tipo={tipoFormulario}
          setState={setState}
          title={"Editar contratación de: " + habeasSeleccionado?.Title}
          empresaOptions={empresaOptions}
          loadingEmp={loadingEmp}
          tipoDocOptions={tipoDocOptions}
          loadingTipo={loadingTipo}
          deptoOptions={deptoOptions}
          loadingDepto={loadingDepto} sending={loading} selectedHabeasData={habeasSeleccionado!}/> : null}
    </div>
  );
}