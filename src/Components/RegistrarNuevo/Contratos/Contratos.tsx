import * as React from "react";
import "./Contratos.css";
import type { DateRange, SortDir, SortField } from "../../../models/Commons";
import type { Novedad } from "../../../models/Novedades";
import { useGraphServices } from "../../../graph/graphContext";
import { toISODateFlex } from "../../../utils/Date";
import { formatPesosEsCO } from "../../../utils/Number";
import ViewContracts from "../Modals/Contrato/viewEditContrato";
import { useEnvios } from "../../../Funcionalidades/Envios";

function renderSortIndicator(field: SortField, sorts: Array<{field: SortField; dir: SortDir}>) {
  const idx = sorts.findIndex(s => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === 'asc' ? '▲' : '▼';
  return <span style={{ marginLeft: 6, opacity: 0.85 }}>{dir}{sorts.length > 1 ? ` ${idx+1}` : ''}</span>;
}

export type Props = {
  rows: Novedad[];
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

export default function TablaContratos({rows, loading, error, pageSize, pageIndex, hasNext, sorts, estado, setRange, setEstado, setPageSize, nextPage, reloadAll, toggleSort, range, setSearch, search, loadFirstPage}: Props) {
  const [visible, setVisible] = React.useState<boolean>(false)
  const { Envios, DetallesPasosNovedades } = useGraphServices();
  const {canEdit} = useEnvios(Envios);
  const [novedadSeleccionada, setNovedadSeleccionada] = React.useState<Novedad | null>(null);
  const [tipoFormulario, setTipoFormulario] = React.useState<string>("");
  const [pctById, setPctById] = React.useState<Record<string, number>>({});

  const handleRowClick = async (novedad: Novedad) => {
    setNovedadSeleccionada(novedad);
    const modo = await canEdit(String(novedad.Id), "Novedades"); // asegúrate de que tenga Id
    setTipoFormulario(modo);
    setVisible(true);
  };

  const onClose = async () => {
    await loadFirstPage()
    setVisible(false);
  };

  const fetchPctForContrataciones = React.useCallback(
    async (cesacionId: string) => {
      if (!cesacionId) return;

      const safeId = cesacionId.replace(/'/g, "''"); // escapar comillas para OData

      const items = await DetallesPasosNovedades.getAll({
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
    [DetallesPasosNovedades]
  );
  

  React.useEffect(() => {
    rows.forEach((c) => {
      const id = String(c.Id ?? "");
      if (!id) return;

      // si ya lo tengo en cache, no vuelvo a pedirlo
      if (pctById[id] !== undefined) return;

      fetchPctForContrataciones(id);
    });
  }, [rows, pctById, fetchPctForContrataciones]);

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

                <th role="button" tabIndex={0} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Cargo 
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('Salario', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Salario', e.shiftKey); }} aria-label="Ordenar por Salario" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Salario {renderSortIndicator('Salario', sorts)}
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('inicio', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('inicio', e.shiftKey); }} aria-label="Ordenar por fecha de inicio" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Fecha de inicio {renderSortIndicator('inicio', sorts)}
                </th>

                <th>Reportado por</th>

                <th style={{ textAlign: "center" }}>%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((novedad) => (
                <tr key={novedad.Id} onClick={() => {setNovedadSeleccionada(novedad); handleRowClick(novedad); setVisible(true)}} tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setNovedadSeleccionada(novedad)}>
                  <td>{novedad.Numero_x0020_identificaci_x00f3_}</td>
                  <td><span title={novedad.NombreSeleccionado}>{novedad.NombreSeleccionado}</span></td>
                  <td><span title={novedad.CARGO}>{novedad.CARGO}</span></td>
                  <td><span title={novedad.SALARIO}>{formatPesosEsCO(novedad.SALARIO)}</span></td>
                  <td>{toISODateFlex(novedad.FECHA_x0020_REQUERIDA_x0020_PARA0) || "–"}</td>
                  <td><span title={novedad.Informaci_x00f3_n_x0020_enviada_}>{novedad.Informaci_x00f3_n_x0020_enviada_}</span></td>
                  <td style={{ textAlign: "center" }}>
                    {(() => {
                      const id = String(novedad.Id ?? "");
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

        {visible ? <ViewContracts selectedNovedad={novedadSeleccionada!} tipo={tipoFormulario} onClose={() => onClose()}/> : null }
    </div>
  );


}