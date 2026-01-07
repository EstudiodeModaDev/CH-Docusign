import * as React from "react";
import "../Contratos/Contratos.css";
import type { DateRange, SortDir, SortField } from "../../../models/Commons";
import { useGraphServices } from "../../../graph/graphContext";
import { useEnvios } from "../../../Funcionalidades/Envios";
import { toISODateFlex } from "../../../utils/Date";
import type { Retail } from "../../../models/Retail";
import EditRetail from "../Modals/Retail/viewEditRetail";

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
  loadFirstPage: () => void;
  setEstado: React.Dispatch<React.SetStateAction<string>>;
  estado: string
};


export default function RetailTabla({rows, loading, error, pageSize, pageIndex, hasNext, sorts, setRange, setPageSize, nextPage, reloadAll, toggleSort, range, setSearch, search, loadFirstPage, estado, setEstado}: Props) {
  const [visible, setVisible] = React.useState<boolean>(false)
  const [pctById, setPctById] = React.useState<Record<string, number>>({});
  const { Envios, detallesPasosRetail } = useGraphServices();
  const {canEdit} = useEnvios(Envios);
  const [retailSeleccionado, setRetailSeleccionado] = React.useState<Retail | null>(null);
  const [tipoFormulario, setTipoFormulario] = React.useState<string>("");

  const handleRowClick = async (retail: Retail) => {
    setRetailSeleccionado(retail);
    const modo = await canEdit(String(retail.Id), "Retail");
    setTipoFormulario(modo);
    setVisible(true);
  };

  const onClose = async () => {
    await loadFirstPage()
    setVisible(false);
  };

  const fetchPctForCesacion = React.useCallback(
    async (cesacionId: string) => {
      if (!cesacionId) return;

      const safeId = cesacionId.replace(/'/g, "''"); // escapar comillas para OData

      const items = await detallesPasosRetail.getAll({
        filter: `fields/Title eq '${safeId}'`,
        orderby: "fields/NumeroPaso asc",
      });

      const pct =
        items.length > 0
          ? (items.filter((i) => i.EstadoPaso === "Completado").length / items.length) * 100
          : 0;

      setPctById((prev) => ({
        ...prev,
        [cesacionId]: Math.round(pct * 100) / 100, // 2 decimales como number
      }));
    },
    [detallesPasosRetail]
  );

  React.useEffect(() => {
    rows.forEach((c) => {
      const id = String(c.Id ?? "");
      if (!id) return;

      // si ya lo tengo en cache, no vuelvo a pedirlo
      if (pctById[id] !== undefined) return;

      fetchPctForCesacion(id);
    });
  }, [rows, pctById, fetchPctForCesacion]);


  return (
    <div className="tabla-novedades">
      <div className="rn-toolbar tabla-filters">

        <div className="rn-toolbar__left">
            <input className="rn-input" onChange={(e) => {setSearch(e.target.value)}} value={search} placeholder="Buscador..."/>

            <select name="estado" id="estado" onChange={(e) => {setEstado(e.target.value)}} value={estado} className="rn-input">
              <option value="proceso">En proceso</option>
              <option value="finalizado">Finalizados</option>
              <option value="todos">Todos</option>
            </select>
            <input type= "date" className="rn-input rn-date" onChange={(e) => {setRange({ ...range, from: e.target.value })}} value={range.from}/>
            <input type= "date" className="rn-input rn-date" onChange={(e) => {setRange({ ...range, to: e.target.value })}} value={range.to}/>
        </div>
      </div>
      
      {/* Estados */}
      {loading && <p>Cargando registros...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {!loading && !error && rows.length === 0 && <p>No hay registros para los filtros seleccionados.</p>}

        <div className="novedades-wrap filas-novedades">
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

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('ingreso', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('ingreso', e.shiftKey); }} aria-label="Ordenar por ingreso" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Fecha Ingreso {renderSortIndicator('ingreso', sorts)}
                </th>

                <th style={{ textAlign: "center" }}>%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((retail) => (
                <tr key={retail.Id} onClick={() => {setRetailSeleccionado(retail); handleRowClick(retail); setVisible(true)}} tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setRetailSeleccionado(retail)}>
                  <td>{retail.Title}</td>
                  <td><span title={retail.Nombre}>{retail.Nombre}</span></td>
                  <td><span title={retail.Temporal}>{retail.Temporal}</span></td>
                  <td><span title={retail.CentroOperativo}>{retail.CentroOperativo}</span></td>
                  <td>{toISODateFlex(retail.FechaIngreso) || "–"}</td>
                  <td style={{ textAlign: "center" }}>
                    {(() => {
                      const id = String(retail.Id ?? "");
                      const pct = pctById[id];
                      return pct === undefined ? "…" : `${pct.toFixed(2)}%`;
                    })()}
                  </td>
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

        {visible ? <EditRetail onClose={() => onClose()} selectedRetail={retailSeleccionado!} tipo={tipoFormulario}/> : null }
    </div>
  );


}