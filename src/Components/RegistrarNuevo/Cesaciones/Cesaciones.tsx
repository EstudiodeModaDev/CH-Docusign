import * as React from "react";
import "../Contratos/Contratos.css";
import type { SortDir, SortField } from "../../../models/Commons";
import { useGraphServices } from "../../../graph/graphContext";
import { useCesaciones } from "../../../Funcionalidades/Cesaciones";
import { useEnvios } from "../../../Funcionalidades/Envios";
import type { Cesacion } from "../../../models/Cesaciones";
import { toISODateFlex } from "../../../utils/Date";
import EditCesacion from "../Modals/Cesaciones/viewEditCesacion";


function renderSortIndicator(field: SortField, sorts: Array<{field: SortField; dir: SortDir}>) {
  const idx = sorts.findIndex(s => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === 'asc' ? '▲' : '▼';
  return <span style={{ marginLeft: 6, opacity: 0.85 }}>{dir}{sorts.length > 1 ? ` ${idx+1}` : ''}</span>;
}


export default function CesacionesTabla() {
  const [visible, setVisible] = React.useState<boolean>(false)
  const { Cesaciones, Envios } = useGraphServices();
  const {rows, loading, error, pageSize, pageIndex, hasNext, sorts, setRange, setPageSize, nextPage, reloadAll,  toggleSort, range, setSearch, search, loadFirstPage} = useCesaciones(Cesaciones,);
  const {canEdit} = useEnvios(Envios);
  const [cesacionSeleccionada, setCesacionSeleccionada] = React.useState<Cesacion | null>(null);
  const [tipoFormulario, setTipoFormulario] = React.useState<string>("");

  const handleRowClick = async (cesacion: Cesacion) => {
    setCesacionSeleccionada(cesacion);
    const modo = await canEdit(String(cesacion.Id), "Cesaciones");
    setTipoFormulario(modo);
    setVisible(true);
    console.log(cesacionSeleccionada, tipoFormulario)
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
                  Fecha limite docs {renderSortIndicator('ingreso', sorts)}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((cesacion) => (
                <tr key={cesacion.Id} onClick={() => {setCesacionSeleccionada(cesacion); handleRowClick(cesacion); setVisible(true)}} tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setCesacionSeleccionada(cesacion)}>
                  <td>{cesacion.Title}</td>
                  <td><span title={cesacion.Nombre}>{cesacion.Nombre}</span></td>
                  <td><span title={cesacion.Temporal}>{cesacion.Temporal}</span></td>
                  <td><span title={cesacion.DescripcionCO}>{cesacion.DescripcionCO}</span></td>
                  <td>{toISODateFlex(cesacion.FechaLimiteDocumentos) || "–"}</td>
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

        {visible ? <EditCesacion onClose={() => onClose()} selectedCesacion={cesacionSeleccionada!} tipo={tipoFormulario}/> : null }
    </div>
  );


}