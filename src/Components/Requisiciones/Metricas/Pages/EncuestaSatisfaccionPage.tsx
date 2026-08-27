import "../RequisicionesMetricas.css";
import EncuestaSatisfaccionResumenCard from "../EncuestaSatisfaccionResumenCard";
import EncuestaSatisfaccionMesChart from "../Charts/EncuestaSatisfaccionMesChart";
import { useEncuestaSatisfaccionMetrics } from "../../../../Funcionalidades/Requisiciones/EncuestaSatisfaccion/useEncuestaSatisfaccionMetrics";

export default function EncuestaSatisfaccionPage() {
  const { resumen, porMes, availableYears, year, setYear, loading, error } = useEncuestaSatisfaccionMetrics();

  return (
    <div className="rqm-shell">
      {(loading || error) && (
        <section className="rqm-feedback">{loading ? "Cargando encuesta de satisfacción..." : error}</section>
      )}

      {availableYears.length > 0 && (
        <section className="rqm-filters" aria-label="Filtros de la encuesta">
          <label className="rqm-filter-field">
            <span>Año</span>
            <select value={year ?? ""} onChange={(e) => setYear(Number(e.target.value))}>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      <EncuestaSatisfaccionResumenCard
        totalEncuestas={resumen.totalEncuestas}
        totalAprobadas={resumen.totalAprobadas} title={"Aprobación de encuestas de satisfacción"}      />

      <article className="rqm-card">
        <div className="rqm-card__header">
          <div>
            <h2>Encuestas por mes</h2>
          </div>
        </div>
        <EncuestaSatisfaccionMesChart data={porMes} />
      </article>
    </div>
  );
}
