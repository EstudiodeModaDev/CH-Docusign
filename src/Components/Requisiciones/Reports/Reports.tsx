import React from "react";
import "./Reports.css";
import type { desplegablesOption } from "../../../models/Desplegables";
import type { requisiciones } from "../../../models/requisiciones";
import { norm } from "../../../utils/text";
import { toDateSafe } from "../../../utils/Date";

type Props = {
  // opciones
  years: desplegablesOption[];
  cargos: desplegablesOption[];
  ciudades: desplegablesOption[];
  profesionales: desplegablesOption[];

  // estado/control de filtros (controlado desde el padre)
  cargo: string;
  setCargo: (v: string) => void;
  año: string;
  setAño: (v: string) => void;
  ciudad: string;
  setCiudad: (v: string) => void;
  profesional: string;
  setProfesional: (v: string) => void;

  // data
  rows: requisiciones[];

  // (opcionales) si algún día quieres sobre-escribir desde afuera
  monthlyTotal?: number[];
  monthlyOk?: number[];
  monthlyFactor?: number[];
};

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/** interpreta "cumpleANS" en varias formas: "Sí", "SI", "Cumple", true, 1, etc */
function isYes(v: any) {
  const x = norm(v).toLowerCase();
  return x === "si" || x === "sí" || x === "true" || x === "1" || x === "cumple" || x === "ok";
}

/** toma una fecha confiable de la requisición (SharePoint a veces trae strings raros) */
function pickDate(r: requisiciones): Date | null {
  const raw = (r.fechaInicioProceso ?? r.Created ?? "").toString().trim();
  if (!raw) return null;

  // 1) helper del proyecto
  const d1 = toDateSafe(raw);
  if (d1 && !Number.isNaN(d1.getTime())) return d1;

  // 2) fallback nativo
  const d2 = new Date(raw);
  if (!Number.isNaN(d2.getTime())) return d2;

  return null;
}

export function RequisicionesDashboard({
  years,
  cargos,
  ciudades,
  profesionales,
  cargo,
  setCargo,
  año,
  setAño,
  ciudad,
  setCiudad,
  profesional,
  setProfesional,
  rows,
  monthlyTotal: monthlyTotalProp,
  monthlyOk: monthlyOkProp,
  monthlyFactor: monthlyFactorProp,
}: Props) {
  // =========================
  // Filtrado basado en selects
  // =========================
  const filtered = React.useMemo(() => {
    const yNum = Number(año);

    const cargoSel = norm(cargo);
    const ciudadSel = norm(ciudad);
    const profSel = norm(profesional);

    return (rows ?? []).filter((r) => {
      // AÑO: si es número válido, filtra por getFullYear()
      if (!Number.isNaN(yNum) && yNum > 0 && año !== "*Todos*" && año !== "all") {
        const d = pickDate(r);

        // ✅ decisión: si no hay fecha, NO lo excluyas (para no matar todo)
        // Si prefieres excluirlos, cambia a: if (!d) return false;
        if (d && d.getFullYear() !== yNum) return false;
      }

      // CARGO
      if (cargo && cargo !== "*Todos*" && cargo !== "all") {
        if (norm(r.Title) !== cargoSel) return false;
      }

      // CIUDAD
      if (ciudad && ciudad !== "*Todas*" && ciudad !== "all") {
        if (norm(r.Ciudad) !== ciudadSel) return false;
      }

      // PROFESIONAL (por nombre o correo)
      if (profesional && profesional !== "*Todos*" && profesional !== "all") {
        const p = norm(r.nombreProfesional || r.correoProfesional);
        if (p !== profSel) return false;
      }

      return true;
    });
  }, [rows, año, cargo, ciudad, profesional]);

  // =========================
  // Series mensuales calculadas
  // =========================
  const computed = React.useMemo(() => {
    const monthlyTotal = Array(12).fill(0) as number[];
    const monthlyOk = Array(12).fill(0) as number[];

    filtered.forEach((r) => {
      const d = pickDate(r);
      if (!d) return;

      const m = d.getMonth(); // 0..11
      monthlyTotal[m] += 1;

      if (isYes(r.cumpleANS)) monthlyOk[m] += 1;
    });

    const monthlyFactor = monthlyTotal.map((t, i) => (t > 0 ? monthlyOk[i] / t : 0));

    return { monthlyTotal, monthlyOk, monthlyFactor };
  }, [filtered]);

  const monthlyTotal = monthlyTotalProp ?? computed.monthlyTotal;
  const monthlyOk = monthlyOkProp ?? computed.monthlyOk;
  const monthlyFactor = monthlyFactorProp ?? computed.monthlyFactor;

  const maxBar = React.useMemo(() => Math.max(1, ...monthlyTotal), [monthlyTotal]);
  const maxLine = React.useMemo(() => Math.max(1, ...monthlyFactor), [monthlyFactor]);

  return (
    <div className="rqv-page">
      <div className="rqv-shell">
        <main className="rqv-main">
          {/* Filters */}
          <section className="rqv-filters" aria-label="Filtros">
            <div className="rqv-field">
              <label className="rqv-label">Año</label>
              <select className="rqv-select rqv-año" value={año} onChange={(e) => setAño(e.target.value)}>
                {years.map((y) => (
                  <option key={String(y.value)} value={String(y.value)}>
                    {y.label ?? y.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="rqv-field">
              <label className="rqv-label">Cargo</label>
              <select className="rqv-select" value={cargo} onChange={(e) => setCargo(e.target.value)}>
                {cargos.map((c) => (
                  <option key={String(c.value)} value={String(c.value)}>
                    {c.label ?? c.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="rqv-field">
              <label className="rqv-label">Ciudad</label>
              <select className="rqv-select" value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
                {ciudades.map((c) => (
                  <option key={String(c.value)} value={String(c.value)}>
                    {c.label ?? c.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="rqv-field">
              <label className="rqv-label">Profesional</label>
              <select className="rqv-select" value={profesional} onChange={(e) => setProfesional(e.target.value)}>
                {profesionales.map((p) => (
                  <option key={String(p.value)} value={String(p.value)}>
                    {p.label ?? p.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="rqv-filter-actions" aria-label="Acciones filtros">
              <button className="rqv-iconbtn" type="button" title="Ver gráfica">
                📈
              </button>
            </div>
          </section>

          {/* Charts */}
          <section className="rqv-charts" aria-label="Gráficas">
            {/* Bar chart */}
            <div className="rqv-card">
              <div className="rqv-card__title">Requisiciones que cumplen ANS vs Todas las requisiciones</div>

              <div className="rqv-chart rqv-bars" role="img" aria-label="Barras por mes">
                {MONTHS.map((m, i) => {
                  const t = monthlyTotal[i] ?? 0;
                  const ok = monthlyOk[i] ?? 0;

                  const ht = Math.round((t / maxBar) * 140);
                  const hok = Math.round((ok / maxBar) * 140);

                  return (
                    <div key={m} className="rqv-bars__col">
                      <div className="rqv-bars__stack" title={`${m}: total ${t}, cumplen ${ok}`}>
                        <div className="rqv-bars__bar rqv-bars__bar--total" style={{ height: `${ht}px` }} />
                        <div className="rqv-bars__bar rqv-bars__bar--ok" style={{ height: `${hok}px` }} />
                      </div>
                      <div className="rqv-bars__month">{m}</div>
                    </div>
                  );
                })}
              </div>

              <div className="rqv-legend">
                <div className="rqv-legend__item">
                  <span className="rqv-dot rqv-dot--total" /> Total requisiciones
                </div>
                <div className="rqv-legend__item">
                  <span className="rqv-dot rqv-dot--ok" /> Requisiciones que cumplen ANS
                </div>
              </div>
            </div>

            {/* Line chart */}
            <div className="rqv-card">
              <div className="rqv-card__title">Cumplimiento de ANS</div>

              <div className="rqv-chart rqv-line" role="img" aria-label="Línea por mes">
                <div className="rqv-line__grid" aria-hidden="true">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rqv-line__gridline" />
                  ))}
                </div>

                <svg className="rqv-line__svg" viewBox="0 0 600 180" preserveAspectRatio="none">
                  {(() => {
                    const pts = MONTHS.map((_, i) => {
                      const x = (i / 11) * 580 + 10;
                      const v = monthlyFactor[i] ?? 0;
                      const y = 165 - (v / maxLine) * 145;
                      return { x, y };
                    });

                    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
                    return <path d={d} className="rqv-line__path" />;
                  })()}

                  {MONTHS.map((m, i) => {
                    const x = (i / 11) * 580 + 10;
                    const v = monthlyFactor[i] ?? 0;
                    const y = 165 - (v / maxLine) * 145;
                    return <circle key={m} cx={x} cy={y} r="3.2" className="rqv-line__dot" />;
                  })}
                </svg>

                <div className="rqv-line__months" aria-hidden="true">
                  {MONTHS.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>

              <div className="rqv-legend">
                <div className="rqv-legend__item">
                  <span className="rqv-dot rqv-dot--line" /> Factor de cumplimiento de ANS
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
