import * as React from "react";
import "../Contratos/Contratos.css";
import type { DateRange, SortDir, SortField } from "../../../../models/Commons";
import { useGraphServices } from "../../../../graph/graphContext";
import { useEnvios } from "../../../../Funcionalidades/GD/Envios";
import type { Cesacion } from "../../../../models/Cesaciones";
import { toISODateFlex } from "../../../../utils/Date";
import EditCesacion from "../Modals/Cesaciones/viewEditCesacion";
import { useCesacionesCanceladas } from "../../../../Funcionalidades/GD/Cesaciones";

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

export default function CesacionesTabla({rows, loading: loadingCesacion, error, pageSize: pageSizeCesacion, pageIndex: pageIndexCesacion, hasNext: hasNextCesacion, sorts, estado, setRange, setEstado, setPageSize, nextPage: nextPageCesacion, reloadAll: reloadAllCesacion, toggleSort, range, setSearch, search, loadFirstPage,}: Props) {
  const { Envios, DetallesPasosCesacion, CesacionCancelada } = useGraphServices();
  const { canEdit } = useEnvios(Envios);
  const {setPageSize: setPageSizeCesaciones, rows: rowsCanceladas, reloadAll: reloadAllCancelados, loading: loadingCancelados,  pageSize: pageSizeCancelados, pageIndex: pageIndexCancelados, hasNext: hasNextCancelados, nextPage: nextPageCancelados, } = useCesacionesCanceladas(CesacionCancelada);   
  const [visible, setVisible] = React.useState(false);
  const [novedadSeleccionada, setNovedadSeleccionada] = React.useState<Cesacion | null>(null);
  const [tipoFormulario, setTipoFormulario] = React.useState<string>("");
  const [pctById, setPctById] = React.useState<Record<string, number>>({});

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
  const activeRows: any[] = isCanceladas ? (rowsCanceladas ?? []) : (rows ?? []);
  const activeLoading = isCanceladas ? loadingCancelados : loadingCesacion;

  React.useEffect(() => {
    for (const c of activeRows) {
      const id = String(c?.Id ?? "");
      if (!id) continue;
      if (pctById[id] !== undefined) continue;
      fetchPctForNovedad(id);
    }
  }, [activeRows, pctById, fetchPctForNovedad]);

  const onRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, n: Cesacion) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRow(n);
    }
  };

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

            <th role="button" tabIndex={0} onClick={(e) => toggleSort('reporta', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('reporta', e.shiftKey); }} aria-label="Ordenar por quien reporta" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Información reportada por {renderSortIndicator('Temporal', sorts)}
            </th>

            <th style={{ textAlign: "center" }}>%</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((n) => (
            <tr key={n.Id} tabIndex={0} onClick={() => openRow(n)} onKeyDown={(e) => onRowKeyDown(e, n)}>
              <td>{n.Title}</td>
              <td><span title={n.Nombre}>{n.Nombre}</span></td>
              <td><span title={n.DescripcionCO}>{n.DescripcionCO}</span></td>
              <td>{toISODateFlex(n.FechaIngreso) || "–"}</td>
              <td><span title={n.Reportadopor}>{n.Reportadopor}</span></td>
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
            <th style={{ whiteSpace: "nowrap" }}>Fecha cancelación</th>
            <th>Motivo cancelación</th>
            <th>Cancelado por</th>
            <th style={{ textAlign: "center" }}>%</th>
          </tr>
        </thead>

        <tbody>
          {(rowsCanceladas ?? []).map((n: any) => (
            <tr key={n.Id} tabIndex={0}>
              <td>{n.Numeroidentificacion}</td>
              <td><span title={n.Nombre}>{n.Nombre}</span></td>
              <td>{toISODateFlex(n.Created) || "–"}</td>
              <td><span title={n.RazonCancelacion}>{n.RazonCancelacion || "–"}</span></td>
              <td><span title={n.Procesocanceladopor}>{n.Procesocanceladopor || "–"}</span></td>
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

      <Paginacion reloadAll={reloadAllCancelados} nextPage={nextPageCancelados} pageIndex={pageIndexCancelados} hasNext={hasNextCancelados} loading={loadingCancelados} pageSize={pageSizeCancelados} totalRows={(rowsCanceladas ?? []).length} setPageSize={setPageSizeCesaciones}/>
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

      {activeLoading && <p>Cargando registros...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!activeLoading && !error && activeRows.length === 0 && (
        <p>No hay registros para los filtros seleccionados.</p>
      )}

      <div className="novedades-wrap filas-novedades">
        {isCanceladas ? <TablaCanceladas /> : <TablaNormal />}
      </div>

      {visible && novedadSeleccionada ? (
        <EditCesacion selectedCesacion={novedadSeleccionada} tipo={tipoFormulario} onClose={onClose}/>
      ) : null}
    </div>
  );
}
