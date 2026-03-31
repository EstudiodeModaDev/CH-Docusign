import React from "react";
import "../AproveModal/UpdateRequest.css";
import type { solicitud } from "../../../../../models/solicitudCambio";
import { DDMMYYYY } from "../../../../../utils/Date";
import { useRequestSearches } from "../../../../../Funcionalidades/GD/UpdateRequest/hooks/useRequestSearches";
import { useRequestDetailsSearches } from "../../../../../Funcionalidades/GD/UpdateRequestDetails/hooks/useRequestDetailsSearches";
import SolicitudesDetails from "../AproveModal/UpdateRequest";
import type { CommonRegister } from "../../../../../models/Commons";
import { getRegistroReal } from "../../../../../Funcionalidades/Common/allTablesSearches";
import { useGraphServices } from "../../../../../graph/graphContext";

function getEstadoClass(estado: string) {
  const normalized = estado.toLowerCase();
  if (normalized === "aprobada") return "sa-chip sa-chip--success";
  if (normalized === "rechazada") return "sa-chip sa-chip--danger";
  return "sa-chip sa-chip--warning";
}

export default function SolicitudesAprobacion() {
  const [search, setSearch] = React.useState("");
  const [estadoFilter, setEstadoFilter] = React.useState("Pendiente");
  const [selectedRequest, setSelectedRequest] = React.useState<solicitud | null>(null)
  const [showDetails, setShowDetails] = React.useState<boolean>(false)
  const [registrosMap, setRegistrosMap] = React.useState<Record<string, CommonRegister>>({});
  const graph = useGraphServices()

  const requestController = useRequestSearches()
  const requestDetailsController = useRequestDetailsSearches()
  const loading = requestController.loading || requestDetailsController.loading


  React.useEffect(() => {
    requestController.getRequests()
  }, [selectedRequest]);

  React.useEffect(() => {
    const loadRegistros = async () => {
      const nuevos: Record<string, CommonRegister> = {};

      for (const s of requestController.request) {
        if (!s.Id) continue;

        const reg = await getRegistroReal(s, graph);
        console.log(reg)
        if (reg) {
          nuevos[String(s.Id)] = reg;
        }
      }
      console.log(nuevos)
      setRegistrosMap(nuevos);
    };

    if (requestController.request.length > 0) {
      loadRegistros();
    }
  }, [requestController.request, graph]);

  const filteredSolicitudes = React.useMemo(() => {
    return requestController.request.filter((s) => {
      const matchesEstado =
        estadoFilter === "Todos" ? true : s.Estado === estadoFilter;

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.Title.toLowerCase().includes(q) ||
        s.IdRegistro.toLowerCase().includes(q) ||
        s.NombreSolicitante.toLowerCase().includes(q)

      return matchesEstado && matchesSearch;
    });
  }, [requestController.request, search, estadoFilter]);

  return (
    <div className="sa-page">
      <div className="sa-header">
        <div>
          <h1 className="sa-title">Solicitudes de actualización</h1>
          <p className="sa-subtitle">
            Revise, apruebe o rechace las solicitudes pendientes.
          </p>
        </div>
      </div>

      <div className="sa-toolbar">
        <input className="sa-input" type="text" placeholder="Buscar por proceso, registro, solicitante o razón" value={search} onChange={(e) => setSearch(e.target.value)}/>

        <select className="sa-select" value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
          <option value="Pendiente">Pendiente</option>
          <option value="Aprobada">Aprobada</option>
          <option value="Rechazada">Rechazada</option>
          <option value="Todos">Todos</option>
        </select>
      </div>

      <div className="sa-card">
        <div className="sa-tableWrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Proceso</th>
                <th>Registro</th>
                <th>Solicitante</th>
                <th>Fecha</th>
                <th>Aprobador</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="sa-empty">
                    Cargando solicitudes...
                  </td>
                </tr>
              ) : filteredSolicitudes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="sa-empty">
                    No hay solicitudes para mostrar.
                  </td>
                </tr>
              ) : (
                filteredSolicitudes.map((solicitud) => (
                  <tr key={solicitud.Id}>
                    <td>
                      <span className={getEstadoClass(solicitud.Estado)}>
                        {solicitud.Estado}
                      </span>
                    </td>
                    <td>{solicitud.Title}</td>
                    <td>{registrosMap[String(solicitud.Id)]?.Cedula}</td>
                    <td>{solicitud.NombreSolicitante}</td>
                    <td>{DDMMYYYY(solicitud.fechaSolicitud)}</td>
                    <td>{solicitud.Aprobador || "No ha sido aprobado aun"}</td>
                    <td>
                      <button className="sa-btn sa-btn--ghost" onClick={() => {setSelectedRequest(solicitud); setShowDetails(true)}}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetails && selectedRequest && (
        <SolicitudesDetails 
          selectedSolicitud={selectedRequest} 
          onCloseDetail={() => {setShowDetails(false); setSelectedRequest(null)} }
        />
      )}
    </div>
  );
}