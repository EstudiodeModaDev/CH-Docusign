import * as React from "react";
import "../Contratos/Contratos.css";
import type { DateRange, SortDir, SortField } from "../../../../models/Commons";
import { useGraphServices } from "../../../../graph/graphContext";
import type { Cesacion, CesacionErrors } from "../../../../models/Cesaciones";
import { toISODateFlex } from "../../../../utils/Date";
import FormCesacion from "../Modals/Cesaciones/addCesacion";
import type { SetField } from "../Modals/Contrato/addContrato";
import type { desplegablesOption } from "../../../../models/Desplegables";
import { usePermissions } from "../../../../Funcionalidades/Permisos";
import { useEnvios } from "../../../../Funcionalidades/GD/Envios/hooks/useEnvios";
import MedicalExamDateModal from "../Modals/Common/SetFechaExamenes/MedicalExam";
//import { id } from "date-fns/locale";

function renderSortIndicator(field: SortField, sorts: Array<{field: SortField; dir: SortDir}>) {
  const idx = sorts.findIndex(s => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === 'asc' ? '▲' : '▼';
  return <span style={{ marginLeft: 6, opacity: 0.85 }}>{dir}{sorts.length > 1 ? ` ${idx+1}` : ''}</span>;
}

export type Props = {
  rows: Cesacion[];
  loading: boolean;
  error: string | null;
  pageSize: number;
  pageIndex: number;
  hasNext: boolean;
  sorts: Array<{ field: SortField; dir: SortDir }>;
  setRange: React.Dispatch<React.SetStateAction<DateRange>>;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  reloadAll: () => void;
  toggleSort: (field: SortField, multi?: boolean) => void;
  range: DateRange;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  search: string;
  loadFirstPage: () => void;
  setEstado: React.Dispatch<React.SetStateAction<string>>;
  estado: string

  state: Cesacion
  setField: SetField<Cesacion>;
  handleSubmit: () => Promise<{ok: boolean; created: Cesacion | null;}>;
  handleEdit: (e: React.FormEvent, NovedadSeleccionada: Cesacion, canEdit: boolean) => void;
  errors: CesacionErrors
  searchRegister: (cedula: string) => Promise<Cesacion | null>
  selectedCesacion?: Cesacion
  setState: (n: Cesacion) => void
  handleCancelProcessbyId: (id: string, r: string) => void
  handleReactivateProcessById: (id: string) => void
  deleteCesacion: (id: string) => void
  saveMedicalExams: (Id: string, fecha: string) => void
  sending: boolean

  //Desplegables
  empresaOptions: desplegablesOption[]
  loadingEmp: boolean
  cargoOptions: desplegablesOption[], 
  loadingCargo: boolean,   
  tipoDocOptions: desplegablesOption[], 
  loadingTipo: boolean
  nivelCargoOptions: desplegablesOption[], 
  loadinNivelCargo: boolean, 
  dependenciaOptions: desplegablesOption[], 
  loadingDependencias: boolean
  CentroCostosOptions: desplegablesOption[]
  loadingCC: boolean
  COOptions: desplegablesOption[]
  loadingCO: boolean, 
  UNOptions: desplegablesOption[]
  loadingUN: boolean,
  temporalOption: desplegablesOption[]
  temporalLoading: boolean
  deptoOptions: desplegablesOption[]
  loadingDeptos: boolean
};


export type PropsPagination = {
  reloadAll: () => void;
  nextPage: () => void;
  setPageSize: (n: number) => void
  pageIndex: number;
  hasNext: boolean;
  loading: boolean;
  pageSize: number;
  totalRows: number;
};

export default function CesacionesTabla({saveMedicalExams, deleteCesacion, deptoOptions, loadingDeptos, temporalLoading, temporalOption, UNOptions, loadingUN, COOptions, loadingCO, CentroCostosOptions, loadingCC, dependenciaOptions, loadingDependencias, nivelCargoOptions, loadinNivelCargo, tipoDocOptions, loadingTipo, cargoOptions, loadingCargo, empresaOptions, loadingEmp, sending, handleReactivateProcessById, handleCancelProcessbyId, setState, searchRegister, errors, handleEdit, handleSubmit, setField, state, rows, loading: loadingCesacion, error, pageSize: pageSizeCesacion, pageIndex: pageIndexCesacion, hasNext: hasNextCesacion, sorts, estado, setRange, setEstado, setPageSize, nextPage: nextPageCesacion, reloadAll: reloadAllCesacion, toggleSort, range, setSearch, search, loadFirstPage,}: Props) {
  const { DetallesPasosCesacion, } = useGraphServices();
  const { canEdit } = useEnvios();
  const [visible, setVisible] = React.useState(false);
  const [novedadSeleccionada, setNovedadSeleccionada] = React.useState<Cesacion | null>(null);
  const [tipoFormulario, setTipoFormulario] = React.useState<"new" | "edit" | "view">("edit");
  const [pctById, setPctById] = React.useState<Record<string, number>>({});
  const [examenesMedicos, setExamenesMedicos] = React.useState<boolean>(false)
  const { engine } = usePermissions();

  const openRow = React.useCallback(
    async (novedad: Cesacion) => {
      setNovedadSeleccionada(novedad);
      const modo = await canEdit(String(novedad.Id ?? ""), "Novedades");
      setTipoFormulario(modo);
      setVisible(true);
    },
    [canEdit]
  );

  const onClose = React.useCallback(async () => {
    await loadFirstPage();
    setVisible(false);
  }, [loadFirstPage]);

  const fetchPctForNovedad = React.useCallback(
    async (novedadId: string) => {
      if (!novedadId) return;

      const safeId = novedadId.replace(/'/g, "''");
      const items = await DetallesPasosCesacion.getAll({
        filter: `fields/Title eq '${safeId}'`,
        orderby: "fields/NumeroPaso asc",
      });

      const pct =
        items.length > 0
          ? (items.filter((i) => i.EstadoPaso === "Completado").length / items.length) *
            100
          : 0;

      setPctById((prev) => {
        const rounded = Math.round(pct * 100) / 100;
        if (prev[novedadId] === rounded) return prev;
        return { ...prev, [novedadId]: rounded };
      });
    },
    [DetallesPasosCesacion]
  );

  const isCanceladas = estado === "cancelado";

  const canDeleteRegister = React.useMemo(() => {
    const requiredPermission = "cesaciones.delete";
    if (!requiredPermission) return false;
    return engine.can(requiredPermission);
  }, [engine]);

  React.useEffect(() => {
    for (const c of rows) {
      const id = String(c?.Id ?? "");
      if (!id) continue;
      if (pctById[id] !== undefined) continue;
      fetchPctForNovedad(id);
    }
  }, [rows, pctById, fetchPctForNovedad]);

  const onRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, n: Cesacion) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRow(n);
    }
  };

  const setExamenes = React.useCallback(async (c: Cesacion) => {
    setNovedadSeleccionada(c)
    setExamenesMedicos(true)
  }, []);


  const Paginacion = ({reloadAll, loading, pageIndex, pageSize, hasNext,  nextPage, totalRows, setPageSize}: PropsPagination) =>
    totalRows > 0 ? (
      <div className="paginacion">
        <button onClick={reloadAll} disabled={loading || pageIndex <= 1}>
          Anterior
        </button>

        <span>Página {pageIndex}</span>

        <button onClick={nextPage} disabled={loading || !hasNext}>
          Siguiente
        </button>

        <label htmlFor="page-size" style={{ marginLeft: 12, marginRight: 8 }}>
          Registros por página:
        </label>

        <select id="page-size" value={pageSize} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPageSize(parseInt(e.target.value, 10))} disabled={loading}>
          {[10, 15, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    ) : null;

  const TablaNormal = () => (
    <>
      <table>
        <thead>
          <tr>
            <th role="button" tabIndex={0} onClick={(e) => toggleSort('Cedula', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Cedula', e.shiftKey); }} aria-label="Ordenar por Cedula" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Cedula {renderSortIndicator('Cedula', sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('Nombre', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Nombre', e.shiftKey); }} aria-label="Ordenar por Nombre" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Nombre {renderSortIndicator('Nombre', sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('Tienda', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Tienda', e.shiftKey); }} aria-label="Ordenar por Tienda" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Tienda {renderSortIndicator('Tienda', sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('ingreso', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('ingreso', e.shiftKey); }} aria-label="Ordenar por ingreso" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Fecha ingreso {renderSortIndicator('ingreso', sorts)}
            </th>
            <th role="button" tabIndex={0} onClick={(e) => toggleSort('ingreso', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('ingreso', e.shiftKey); }} aria-label="Ordenar por ingreso" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Fecha de examenes medicos {renderSortIndicator('ingreso', sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('reporta', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('reporta', e.shiftKey); }} aria-label="Ordenar por quien reporta" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Información reportada por {renderSortIndicator('Temporal', sorts)}
            </th>

            <th style={{ textAlign: "center" }}>%</th>
            <th style={{ textAlign: "center" }}>Acciones</th>
            
          </tr>
        </thead>

        <tbody>
          {rows.map((n) => (
            <tr key={n.Id} tabIndex={0} onClick={() => openRow(n)} onKeyDown={(e) => onRowKeyDown(e,n)}>
              <td>{n.Title}</td>
              <td><span title={n.Nombre}>{n.Nombre}</span></td>
              <td><span title={n.DescripcionCO}>{n.DescripcionCO}</span></td>
              <td>{toISODateFlex(n.FechaIngreso) || "–"}</td>
              <td>{toISODateFlex(n.FechaExamenesMedicos) || "No se han programado"}</td>
              <td><span title={n.Reportadopor}>{n.Reportadopor}</span></td>
              <td style={{ textAlign: "center" }}>
                {(() => {
                  const id = String(n.Id ?? "");
                  const pct = pctById[id];
                  return pct === undefined ? "…" : `${pct.toFixed(2)}%`;
                })()}
              </td>
              <td style={{ textAlign: "center" }}>
                <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",}}>
                  <button type="button" title="Fecha de exámenes médicos" onClick={(e) => {e.stopPropagation(); setExamenes(n);}}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50">
                      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                        <path stroke="#306CFE" d="M15.708 39.583H8.333A2.083 2.083 0 0 1 6.25 37.5V10.417a2.083 2.083 0 0 1 2.083-2.084h33.334a2.083 2.083 0 0 1 2.083 2.084V37.5a2.083 2.083 0 0 1-2.083 2.083h-7.375"/>
                        <path stroke="#306CFE" d="M6.25 18.75h37.5m-18.75 0a12.5 12.5 0 1 0 0 25a12.5 12.5 0 0 0 0-25"/>
                        <path stroke="#344054" d="M16.667 6.25v6.25m16.666-6.25v6.25zm-12.5 27.083l2.084 2.084l6.25-6.25"/>
                      </g>
                    </svg>
                  </button>

                  {canDeleteRegister && (
                    <button type="button" title="Eliminar proceso" onClick={(e) => {e.stopPropagation(); deleteCesacion(n.Id!);}}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 26 26">
                        <path
                          fill="#e53434"
                          d="M11.5-.031c-1.958 0-3.531 1.627-3.531 3.594V4H4c-.551 0-1 .449-1 1v1H2v2h2v15c0 1.645 1.355 3 3 3h12c1.645 0 3-1.355 3-3V8h2V6h-1V5c0-.551-.449-1-1-1h-3.969v-.438c0-1.966-1.573-3.593-3.531-3.593h-3zm0 2.062h3c.804 0 1.469.656 1.469 1.531V4H10.03v-.438c0-.875.665-1.53 1.469-1.53zM6 8h5.125c.124.013.247.031.375.031h3c.128 0 .25-.018.375-.031H20v15c0 .563-.437 1-1 1H7c-.563 0-1-.437-1-1V8zm2 2v12h2V10H8zm4 0v12h2V10h-2zm4 0v12h2V10h-2z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Paginacion reloadAll={reloadAllCesacion} nextPage={nextPageCesacion}  pageIndex={pageIndexCesacion} hasNext={hasNextCesacion} loading={loadingCesacion} pageSize={pageSizeCesacion} totalRows={rows.length} setPageSize={setPageSize}/>
    </>
  );

  const TablaCanceladas = () => (
    <>
      <table>
        <thead>
          <tr>
            <th style={{ whiteSpace: "nowrap" }}>Cedula</th>
            <th style={{ whiteSpace: "nowrap" }}>Nombre</th>
            <th style={{ whiteSpace: "nowrap" }}>Fecha inicio</th>
            <th>Motivo cancelación</th>
            <th>Cancelado por</th>
            <th style={{ textAlign: "center" }}>%</th>
          </tr>
        </thead>

        <tbody>
          {(rows ?? []).map((n: Cesacion) => (
            <tr key={n.Id} tabIndex={0} onClick={() => openRow(n)}>
              <td>{n.Title}</td>
              <td><span title={n.Nombre}>{n.Nombre}</span></td>
              <td>{toISODateFlex(n.FechaIngreso) || "–"}</td>
              <td><span title={n.RazonCancelacion}>{n.RazonCancelacion || "–"}</span></td>
              <td><span title={n.CanceladoPor}>{n.CanceladoPor || "–"}</span></td>
              <td style={{ textAlign: "center" }}>
                {(() => {
                  const id = String(n.Id ?? "");
                  const pct = pctById[id];
                  return pct === undefined ? "…" : `${pct.toFixed(2)}%`;
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Paginacion reloadAll={reloadAllCesacion} nextPage={nextPageCesacion} pageIndex={pageIndexCesacion} hasNext={hasNextCesacion} loading={loadingCesacion} pageSize={pageSizeCesacion} totalRows={(rows ?? []).length} setPageSize={setPageSize}/>
    </>
  );

  return (
    <div className="tabla-novedades">
      <div className="rn-toolbar tabla-filters">
        <div className="rn-toolbar__left">
          <input className="rn-input" onChange={(e) => setSearch(e.target.value)} value={search} placeholder="Buscador..."/>

          <select name="estado" id="estado" onChange={(e) => setEstado(e.target.value)} value={estado} className="rn-input">
            <option value="proceso">En proceso</option>
            <option value="finalizado">Finalizados</option>
            <option value="cancelado">Cancelado</option>
            <option value="todos">Todos</option>
          </select>

          <input type="date" className="rn-input rn-date" onChange={(e) => setRange({ ...range, from: e.target.value })} value={range.from}/>
          <input type="date" className="rn-input rn-date" onChange={(e) => setRange({ ...range, to: e.target.value })} value={range.to}/>
        </div>
      </div>

      {loadingCesacion && <p>Cargando registros...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loadingCesacion && !error && rows.length === 0 && (
        <p>No hay registros para los filtros seleccionados.</p>
      )}

      <div className="novedades-wrap filas-novedades">
        {isCanceladas ? <TablaCanceladas /> : <TablaNormal />}
      </div>

      <MedicalExamDateModal 
        isOpen={examenesMedicos}
        onClose={() => setExamenesMedicos(false)}
        onSaveDate={saveMedicalExams} 
        Id={novedadSeleccionada?.Id!}/>

      {visible && novedadSeleccionada ? (
        <FormCesacion 
          onClose={() => onClose()} 
          state={state} 
          setField={setField} 
          handleSubmit={handleSubmit} 
          handleEdit={handleEdit} 
          errors={errors} 
          selectedCesacion={novedadSeleccionada}
          searchRegister={searchRegister} 
          tipo={tipoFormulario} 
          setState={setState} 
          handleCancelProcessbyId={handleCancelProcessbyId} 
          handleReactivateProcessById={handleReactivateProcessById} 
          title={"Editar cesación de: " + novedadSeleccionada.Nombre} 
          sending={sending} 
          empresaOptions={empresaOptions} 
          loadingEmp={loadingEmp} 
          cargoOptions={cargoOptions} 
          loadingCargo={loadingCargo} 
          tipoDocOptions={tipoDocOptions} 
          loadingTipo={loadingTipo} 
          nivelCargoOptions={nivelCargoOptions} 
          loadinNivelCargo={loadinNivelCargo} 
          dependenciaOptions={dependenciaOptions} 
          loadingDependencias={loadingDependencias} 
          CentroCostosOptions={CentroCostosOptions} 
          loadingCC={loadingCC} 
          COOptions={COOptions} 
          loadingCO={loadingCO} 
          UNOptions={UNOptions} 
          loadingUN={loadingUN} 
          temporalOption={temporalOption} 
          temporalLoading={temporalLoading} 
          deptoOptions={deptoOptions} 
          loadingDeptos={loadingDeptos}/>
      ) : null}
    </div>
  );
}
