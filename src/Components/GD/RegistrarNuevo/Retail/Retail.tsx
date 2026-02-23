import * as React from "react";
import "../Contratos/Contratos.css";
import type { DateRange, SortDir, SortField } from "../../../../models/Commons";
import { useGraphServices } from "../../../../graph/graphContext";
import { useEnvios } from "../../../../Funcionalidades/GD/Envios";
import { toISODateFlex } from "../../../../utils/Date";
import type { Retail, RetailErrors } from "../../../../models/Retail";
import FormRetail from "../Modals/Retail/addRetail";
import type { SetField } from "../Modals/Contrato/addContrato";
import type { desplegablesOption } from "../../../../models/Desplegables";

function renderSortIndicator(field: SortField, sorts: Array<{field: SortField; dir: SortDir}>) {
  const idx = sorts.findIndex(s => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === 'asc' ? '▲' : '▼';
  return <span style={{ marginLeft: 6, opacity: 0.85 }}>{dir}{sorts.length > 1 ? ` ${idx+1}` : ''}</span>;
}

export type Props = {
  rows: Retail[];
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
  loadFirstPage: () => Promise<void>
  setEstado: React.Dispatch<React.SetStateAction<string>>;
  estado: string

  state: Retail
  setField: SetField<Retail>;
  handleSubmit: () => Promise<{ok: boolean; created: string | null;}>;
  handleEdit: (e: React.FormEvent, NovedadSeleccionada: Retail) => void;
  errors: RetailErrors
  searchRegister: (cedula: string) => Promise<Retail | null>
  selectedRetail?: Retail
  setState: (n: Retail) => void
  handleCancelProcessbyId: (id: string, r: string) => void
  handleReactivateProcessById: (id: string) => void
  submitting: boolean

  //Desplegables
  empresaOptions: desplegablesOption[]
  loadingEmp: boolean
  tipoDocOptions: desplegablesOption[], 
  loadingTipo: boolean
  cargoOptions: desplegablesOption[], 
  loadingCargo: boolean, 
  nivelCargoOptions: desplegablesOption[], 
  loadinNivelCargo: boolean, 
  CentroCostosOptions: desplegablesOption[]
  loadingCC: boolean
  COOptions: desplegablesOption[]
  loadingCO: boolean, 
  UNOptions: desplegablesOption[]
  loadingUN: boolean,
  origenOptions: desplegablesOption[], 
  loadingOrigen: boolean
  deptoOptions: desplegablesOption[], 
  loadingDepto: boolean, 
  dependenciaOptions: desplegablesOption[], 
  loadingDependencias: boolean
};

export type PropsPagination = {
  reloadAll: () => void;
  nextPage: () => void;
  pageIndex: number;
  hasNext: boolean;
  loading: boolean;
  pageSize: number;
  totalRows: number;
};

export default function RetailTabla({dependenciaOptions, loadingDependencias, deptoOptions, loadingDepto, origenOptions, loadingOrigen, CentroCostosOptions, loadingCC, UNOptions, loadingUN, COOptions, loadingCO, nivelCargoOptions, loadinNivelCargo, cargoOptions, loadingCargo, tipoDocOptions, loadingTipo, empresaOptions, loadingEmp, submitting, handleCancelProcessbyId, handleReactivateProcessById, setState, searchRegister, errors, handleSubmit, handleEdit, setField, state, rows, loading: loadingRetail, error, pageSize: pageSizeRetail, pageIndex: pageIndexRetail, hasNext: hasNextRetail, sorts, estado, setRange, setEstado, setPageSize, nextPage: nextPageRetail, reloadAll: reloadAllRetail, toggleSort, range, setSearch, search, loadFirstPage,}: Props) {
  const { Envios, detallesPasosRetail, } = useGraphServices();
  const { canEdit } = useEnvios(Envios);
  const [visible, setVisible] = React.useState(false);
  const [novedadSeleccionada, setNovedadSeleccionada] = React.useState<Retail | null>(null);
  const [tipoFormulario, setTipoFormulario] = React.useState<"edit" | "new" | "view">("edit");
  const [pctById, setPctById] = React.useState<Record<string, number>>({});

  const openRow = React.useCallback(
    async (novedad: Retail) => {
      setNovedadSeleccionada(novedad);
      const modo = await canEdit(String(novedad.Id ?? ""), "Retail");
      setTipoFormulario(modo);
      setVisible(true);
    },
    [canEdit]
  );

  const onClose = React.useCallback(async () => {
    await loadFirstPage();
    setVisible(false);
  }, [loadFirstPage]);

  const fetchPctForRetail= React.useCallback(
    async (novedadId: string) => {
      if (!novedadId) return;

      const safeId = novedadId.replace(/'/g, "''");
      const items = await detallesPasosRetail.getAll({
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
    [detallesPasosRetail]
  );

  const isCanceladas = estado === "Cancelado";

  React.useEffect(() => {
    for (const c of rows) {
      const id = String(c?.Id ?? "");
      if (!id) continue;
      if (pctById[id] !== undefined) continue;
      fetchPctForRetail(id);
    }
  }, [rows, pctById, fetchPctForRetail]);


  const onRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, n: Retail) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRow(n);
    }
  };

  const Paginacion = ({reloadAll, loading, pageIndex, pageSize, hasNext,  nextPage, totalRows,}: PropsPagination) =>
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

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('Temporal', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Temporal', e.shiftKey); }} aria-label="Ordenar por Temporal" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Temporal {renderSortIndicator('Temporal', sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('Tienda', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Tienda', e.shiftKey); }} aria-label="Ordenar por Tienda" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Tienda {renderSortIndicator('Tienda', sorts)}
            </th>

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('inicio', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('inicio', e.shiftKey); }} aria-label="Ordenar por ingreso" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Fecha Ingreso {renderSortIndicator('inicio', sorts)}
            </th>

            <th style={{ textAlign: "center" }}>%</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((n) => (
            <tr key={n.Id} tabIndex={0} onClick={() => openRow(n)} onKeyDown={(e) => onRowKeyDown(e, n)}>
              <td>{n.Title}</td>
              <td><span title={n.Nombre}>{n.Nombre}</span></td>
              <td><span title={n.Temporal}>{n.Temporal}</span></td>
              <td><span title={n.CentroCostos}>{n.CentroCostos}</span></td>
              <td>{toISODateFlex(n.FechaIngreso) || "–"}</td>
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

      <Paginacion reloadAll={reloadAllRetail} nextPage={nextPageRetail} pageIndex={pageIndexRetail} hasNext={hasNextRetail} loading={loadingRetail} pageSize={pageSizeRetail} totalRows={rows.length}/>
    </>
  );

  const TablaCanceladas = () => (
    <>
      <table>
        <thead>
          <tr>
            <th style={{ whiteSpace: "nowrap" }}>Cedula</th>
            <th style={{ whiteSpace: "nowrap" }}>Nombre</th>
            <th style={{ whiteSpace: "nowrap" }}>Fecha Inicio</th>
            <th>Motivo cancelación</th>
            <th>Cancelado por</th>
            <th style={{ textAlign: "center" }}>%</th>
          </tr>
        </thead>

        <tbody>
          {(rows ?? []).map((n: Retail) => (
            <tr key={n.Id} tabIndex={0}>
              <td>{n.Title}</td>
              <td><span title={n.Nombre}>{n.Nombre}</span></td>
              <td>{toISODateFlex(n.FechaIngreso) || "–"}</td>
              <td><span title={n.razonCancelacion}>{n.razonCancelacion || "–"}</span></td>
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

      <Paginacion reloadAll={reloadAllRetail} nextPage={nextPageRetail} pageIndex={pageIndexRetail} hasNext={hasNextRetail} loading={loadingRetail} pageSize={pageSizeRetail} totalRows={(rows ?? []).length}/>
    </>
  );

  return (
    <div className="tabla-novedades">
      <div className="rn-toolbar tabla-filters">
        <div className="rn-toolbar__left">
          <input className="rn-input" onChange={(e) => setSearch(e.target.value)} value={search} placeholder="Buscador..."/>

          <select name="estado" id="estado" onChange={(e) => setEstado(e.target.value)} value={estado} className="rn-input">
            <option value="En proceso">En proceso</option>
            <option value="Finalizado">Finalizados</option>
            <option value="Cancelado">Cancelado</option>
            <option value="todos">Todos</option>
          </select>

          <input type="date" className="rn-input rn-date" onChange={(e) => setRange({ ...range, from: e.target.value })} value={range.from}/>
          <input type="date" className="rn-input rn-date" onChange={(e) => setRange({ ...range, to: e.target.value })} value={range.to}/>
        </div>
      </div>

      {loadingRetail && <p>Cargando registros...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loadingRetail && !error && rows.length === 0 && (
        <p>No hay registros para los filtros seleccionados.</p>
      )}

      <div className="novedades-wrap filas-novedades">
        {isCanceladas ? <TablaCanceladas /> : <TablaNormal />}
      </div>

      {visible && novedadSeleccionada ? (
        <FormRetail 
          onClose={onClose} 
          state={state} 
          setField={setField} 
          handleSubmit={handleSubmit} 
          handleEdit={handleEdit} 
          errors={errors} 
          searchRegister={searchRegister} 
          loadFirstPage={loadFirstPage} 
          tipo={tipoFormulario} 
          setState={setState} 
          handleCancelProcessbyId={handleCancelProcessbyId} 
          handleReactivateProcessById={handleReactivateProcessById} 
          title={"Editar contratación de: " + novedadSeleccionada.Nombre} 
          submitting={submitting} 
          empresaOptions={empresaOptions} 
          loadingEmp={loadingEmp} 
          tipoDocOptions={tipoDocOptions} 
          loadingTipo={loadingTipo} 
          cargoOptions={cargoOptions} 
          loadingCargo={loadingCargo} 
          nivelCargoOptions={nivelCargoOptions} 
          loadinNivelCargo={loadinNivelCargo} 
          CentroCostosOptions={CentroCostosOptions} 
          loadingCC={loadingCC} 
          COOptions={COOptions} 
          loadingCO={loadingCO} 
          UNOptions={UNOptions} 
          loadingUN={loadingUN} 
          origenOptions={origenOptions} 
          loadingOrigen={loadingOrigen} 
          deptoOptions={deptoOptions} 
          loadingDepto={loadingDepto} 
          dependenciaOptions={dependenciaOptions} 
          loadingDependencias={loadingDependencias}
          selectedRetail={novedadSeleccionada}/>
      ) : null}
    </div>
  );
}
