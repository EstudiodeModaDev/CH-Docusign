import * as React from "react";
import "../RegistrarNuevo/Contratos/Contratos.css";
import "./ConsultarDocumentos.css"
import type { SortDir, SortField } from "../../models/Commons";
import type { Envio,} from "../../models/Envios";
import { useGraphServices } from "../../graph/graphContext";
import { useEnvios } from "../../Funcionalidades/Envios";
import { PreviewEnvioModal } from "./ModalCampos/ModalCampos";

function renderSortIndicator(field: SortField, sorts: Array<{field: SortField; dir: SortDir}>) {
  const idx = sorts.findIndex(s => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === 'asc' ? '▲' : '▼';
  return <span style={{ marginLeft: 6, opacity: 0.85 }}>{dir}{sorts.length > 1 ? ` ${idx+1}` : ''}</span>;
}


export default function TablaEnvios() {
  const [visible, setVisible] = React.useState<boolean>(false)
  const { Envios } = useGraphServices();
  const {reloadAll, pageIndex, nextPage, hasNext, pageSize, setPageSize, rows, setSearch, setRange, range, search, loading, error, toggleSort, sorts} = useEnvios(Envios);
  const [envioSeleccionado, setEnvioSeleccionado] = React.useState<Envio | null>(null);

  return (
    <div className="rn-page">
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

            <div className="novedades-wrap filas-novedades filas-envios">
            <table>
                <thead>
                <tr>
                    <th role="button" tabIndex={0} onClick={(e) => toggleSort('Cedula', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Cedula', e.shiftKey); }} aria-label="Ordenar por Cedula" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Cedula {renderSortIndicator('Cedula', sorts)}
                    </th>

                    <th role="button" tabIndex={0} onClick={(e) => toggleSort('Nombre', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Nombre', e.shiftKey); }} aria-label="Ordenar por Nombre" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Destinatario {renderSortIndicator('Nombre', sorts)}
                    </th>

                    <th role="button" tabIndex={0} onClick={(e) => toggleSort('Correo', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('Correo', e.shiftKey); }} aria-label="Ordenar por Correo" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Correo destinatario {renderSortIndicator('Correo', sorts)}
                    </th>

                    <th role="button" tabIndex={0} onClick={(e) => toggleSort('enviadoPor', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('enviadoPor', e.shiftKey); }} aria-label="Ordenar por enviadoPor" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Enviado Por {renderSortIndicator('enviadoPor', sorts)}
                    </th>

                    <th role="button" tabIndex={0} onClick={(e) => toggleSort('docSend', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('docSend', e.shiftKey); }} aria-label="Ordenar por Documento enviado" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Documento {renderSortIndicator('docSend', sorts)}
                    </th>

                    <th role="button" tabIndex={0} onClick={(e) => toggleSort('fecha', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('fecha', e.shiftKey); }} aria-label="Ordenar por fecha de envio" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Fecha de envio {renderSortIndicator('fecha', sorts)}
                    </th>

                    <th style={{textAlign: 'center'}}>Estado</th>
                </tr>
                </thead>
                <tbody>
                {rows.map((envio: Envio) => (
                    <tr key={envio.Id} onClick={() => {setEnvioSeleccionado(envio); setVisible(true)}} tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setEnvioSeleccionado(envio)}>
                    <td>{envio.Cedula}</td>
                    <td><span title={envio.Receptor}>{envio.Receptor}</span></td>
                    <td><span title={envio.CorreoReceptor}>{envio.CorreoReceptor}</span></td>
                    <td><span title={envio.EnviadoPor}>{envio.EnviadoPor}</span></td>
                    <td><span title={envio.Title}>{envio.Title}</span></td>
                    <td>{envio.Fechadeenvio || "–"}</td>
                    <td><EstadoCircle rawEstado={envio.Estado}/></td>
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

          <PreviewEnvioModal open={visible} onClose={() => { setVisible(false)} } envelopeId={envioSeleccionado?.IdSobre!}></PreviewEnvioModal>
        </div>
    </div>
  );


}

type EstadoProps = {
  rawEstado?: string | null;
};

const EstadoCircle: React.FC<EstadoProps> = ({ rawEstado }) => {
  const getEstadoInfo = () => {
    const key = rawEstado?.toLowerCase() ?? "";
    switch (key) {
      case "completed":
      case "completado":
        return { label: "Completado", color: "#16a34a" }; // verde
      case "sent":
      case "enviado":
        return { label: "Enviado", color: "#dc2626" }; // rojo
      case "declined":
      case "rechazado":
        return { label: "Rechazado", color: "#ca8a04" }; // amarillo
      default:
        return { label: rawEstado || "–", color: "#9ca3af" }; // gris
    }

    
  };

  const info = getEstadoInfo();

  return (
    <span className="estado-badge" title={info.label}>
      <span className="estado-dot" style={{ backgroundColor: info.color}}/>
    </span>
  );
};
