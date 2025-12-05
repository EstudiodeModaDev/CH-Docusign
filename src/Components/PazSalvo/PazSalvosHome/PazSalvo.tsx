import * as React from "react";
import "./PazSalvo.css";
import { useGraphServices } from "../../../graph/graphContext";
import { usePazSalvo } from "../../../Funcionalidades/PazSalvos/PazSalvos";
import { parseDateFlex } from "../../../utils/Date";
import type { PazSalvo } from "../../../models/PazSalvo";
import { useRespuestasPazSalvos } from "../../../Funcionalidades/PazSalvos/Respuesta";
import { useAuth } from "../../../auth/authProvider";

type Props = {
  onNew: () => void;
  onSelectRow: (p: PazSalvo) => void;
  changeView: (a: string) => void
  isAdmin: boolean;
};

export const PazSalvosEnviados: React.FC<Props> = ({onNew, isAdmin, onSelectRow, changeView}) => {

  const {PazSalvos, Respuesta} = useGraphServices()
  const {visibleRows, range, year, search, estado, setEstado, setYear, setSearch, setRange, toggleSort, } = usePazSalvo(PazSalvos, isAdmin);
  const {account} = useAuth()
  const {loadUserRespuestas} = useRespuestasPazSalvos(Respuesta)
  const years = ["2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"];

  const handleSelect = async (e: React.FormEvent, PazSalvo: PazSalvo) => {
    e.preventDefault()
    onSelectRow(PazSalvo)
    const respuestaFromUser = await loadUserRespuestas(PazSalvo.Id ?? "")
    const solicitante = PazSalvo.Solicitados.find(s => s.correo === account?.username);
    if(solicitante ){
      if(respuestaFromUser?.length ?? 0 > 0){
        changeView("verRespuestas")
      } else {
        changeView("respuesta")
      }
    } else {
      changeView("verRespuestas")
    }

  };

  return (
    <div className="ps-page">
      <div className="ps-filters">
        <div className="ps-filter-field">
          <button className="btn btn-primary btn-xs" onClick={() => onNew()}>Solicitar</button>
        </div>

        <div className="ps-filter-field">
          <label className="ps-label">Desde</label>
          <input type="date" className="ps-input ps-input--date" value={range.from} onChange={(e) => setRange({...range, from: e.target.value})}/>
        </div>

        <div className="ps-filter-field">
          <label className="ps-label">Hasta</label>
          <input type="date" className="ps-input ps-input--date" value={range.to} onChange={(e) => setRange({...range, to: e.target.value})}/>
        </div>

        <div className="ps-filter-field ps-filter-field--year">
          <label className="ps-label">Filtro por año:</label>
          <select className="ps-select" value={year}  onChange={(e) => setYear(e.target.value)}>
            <option value="">Todos</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="ps-filter-field ps-filter-field--search">
          <input type="search" className="ps-input ps-input--search"  placeholder="Buscar . . ." value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="ps-table-wrapper">
        <table className="ps-table">
          <thead>
            <tr>
              <th className="ps-th" tabIndex={0} role="button" onClick={(e) => toggleSort('Nombre', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('id', e.shiftKey); }} aria-label="Ordenar por nombre">
                Nombre
              </th>
              <th className="ps-th" tabIndex={0} role="button" onClick={(e) => toggleSort('Cedula', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('id', e.shiftKey); }} aria-label="Ordenar por cedula">Cédula</th>
              <th className="ps-th" tabIndex={0} role="button" onClick={(e) => toggleSort('FechaIngreso', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('id', e.shiftKey); }} aria-label="Ordenar por fecha de ingreso">Fecha Ingreso</th>
              <th className="ps-th" tabIndex={0} role="button" onClick={(e) => toggleSort('FechaSalida', e.shiftKey)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSort('id', e.shiftKey); }} aria-label="Ordenar por fecha de salida">Fecha de retiro</th>
              <th className="ps-th">Cargo</th>
              <th className="ps-th">Empresa</th>
              <th className="ps-th">Jefe directo</th>
              <th className="ps-th">CO</th>
              <th className="ps-th ps-th--estado">
                <div className="ps-estado-header">
                  <select className="ps-select ps-select--estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
                    <option value="Todos">Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>
            </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={10} className="ps-empty">
                  No hay registros para los filtros seleccionados.
                </td>
              </tr>
            )}

            {visibleRows.map((row) => (
              <tr key={row.Id} onClick={(e) => {handleSelect(e, row)}}>
                <td>{row.Nombre}</td>
                <td>{row.Title}</td>
                <td>{parseDateFlex(row.FechaIngreso ?? "")?.toLocaleDateString()}</td>
                <td>{parseDateFlex(row.FechaSalida ?? "")?.toLocaleDateString()}</td>
                <td>{row.Cargo}</td>
                <td>{row.Empresa}</td>
                <td>{row.Jefe}</td>
                <td>{row.CO}</td>
                <td>
                  <span className={`ps-pill ps-pill--${row.Estado}`}>
                    {row.Estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
