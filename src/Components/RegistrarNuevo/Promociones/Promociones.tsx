import * as React from "react";
import "../Contratos/Contratos.css";
import type { DateRange, SortDir, SortField } from "../../../models/Commons";
import { useGraphServices } from "../../../graph/graphContext";
import { toISODateFlex } from "../../../utils/Date";
import type { Promocion } from "../../../models/Promociones";
import { formatPesosEsCO } from "../../../utils/Number";
import ViewPromociones from "../Modals/Promociones/viewEditPromociones";
import { useEnvios } from "../../../Funcionalidades/Envios";

function renderSortIndicator(field: SortField, sorts: Array<{field: SortField; dir: SortDir}>) {
  const idx = sorts.findIndex(s => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === 'asc' ? '▲' : '▼';
  return <span style={{ marginLeft: 6, opacity: 0.85 }}>{dir}{sorts.length > 1 ? ` ${idx+1}` : ''}</span>;
}

type Props = {
  rows: Promocion[];
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
  loadFirstPage: () => void;
  estado: string,
  setEstado: React.Dispatch<React.SetStateAction<string>>;
}

export default function TablaPromociones({rows, loading, error, pageSize, pageIndex, hasNext, sorts, setRange, setPageSize, nextPage, loadFirstPage, toggleSort, range, reloadAll, setSearch, search, estado, setEstado}: Props) {
  const { Envios } = useGraphServices();
  const [promocionSeleccionada, setPromocionSeleccionada] = React.useState<Promocion | null>(null);
  const [visible, setVisible] = React.useState<boolean>(false);
  const [tipoFormulario, setTipoFormulario] = React.useState<string>("");
  const {canEdit} = useEnvios(Envios);

  const handleRowClick = async (promocion: Promocion) => {
    setPromocionSeleccionada(promocion);
    const modo = await canEdit(String(promocion.Id), "Promocion"); // asegúrate de que tenga Id
    setTipoFormulario(modo);
    setVisible(true);
  };

  const onClose = async () => {
    await loadFirstPage()
    setVisible(false);
  };

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
                  Ciudad {renderSortIndicator('Ciudad', sorts)}
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('Nombre', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Nombre', e.shiftKey); }} aria-label="Ordenar por Nombre" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Nombre {renderSortIndicator('Nombre', sorts)}
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('Salario', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Salario', e.shiftKey); }} aria-label="Ordenar por Salario" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Salario {renderSortIndicator('Salario', sorts)}
                </th>

                <th role="button" tabIndex={0} onClick={(e) => toggleSort('promocion', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('reporta', e.shiftKey); }} aria-label="Ordenar por fecha de promocion" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Fecha de la promoción {renderSortIndicator('promocion', sorts)}
                </th>

                <th>Reportado por</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((promocion) => (
                <tr key={promocion.Id} onClick={() => handleRowClick(promocion)} tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setPromocionSeleccionada(promocion)}>
                  <td>{promocion.NumeroDoc}</td>
                  <td><span title={promocion.Ciudad}>{promocion.Ciudad}</span></td>
                  <td><span title={promocion.NombreSeleccionado}>{promocion.NombreSeleccionado}</span></td>
                  <td className="salario"><span title={promocion.Salario}>{formatPesosEsCO(promocion.Salario)}</span></td>
                  <td><span title={promocion.FechaIngreso!}>{toISODateFlex(promocion.FechaIngreso)}</span></td>
                  <td><span title={promocion.InformacionEnviadaPor}>{promocion.InformacionEnviadaPor}</span></td>
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

        {visible ? <ViewPromociones onClose={() => onClose()} selectedPromocion={promocionSeleccionada!} tipo={tipoFormulario}/> : null}
    </div>
  );
}