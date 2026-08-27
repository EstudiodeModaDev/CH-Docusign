import { useEncuestaPeriodoPruebaMetrics } from "../../../../Funcionalidades/Requisiciones/EncuestaPeriodoPrueba/useEncuestaPeriodoPruebaMetrics";
import EncuestaSatisfaccionMesChart from "../Charts/EncuestaSatisfaccionMesChart";
import EncuestaSatisfaccionResumenCard from "../EncuestaSatisfaccionResumenCard";

export default function EncuestaPeriodoPruebaPage() {
  const { resumen, porMes, availableYears, year, setYear, loading, error } = useEncuestaPeriodoPruebaMetrics();

  return (
    <div className="rqm-shell">
      {(loading || error) && (
        <section className="rqm-feedback">{loading ? "Cargando encuestas de periodo de prueba..." : error}</section>
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
        totalAprobadas={resumen.totalAprobadas} title={"Aprobación de encuestas de periodo de prueba"}      />

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