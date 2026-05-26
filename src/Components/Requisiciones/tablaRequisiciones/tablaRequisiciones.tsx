import * as React from "react";
import { useRequisicion } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicion";
import type { desplegablesOption } from "../../../models/Desplegables";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";
import { spDateToDDMMYYYY, toISODateFlex } from "../../../utils/Date";
import ProcesoRequisicionModal from "./Proceso/ProcesoRequisicionModal";
import FiltersRequisicionesTable from "./filtersRequisicionesTable";
import "./tablaRequisiciones.css";

type Props = {
  cargoOptions: desplegablesOption[];
  onOpenRow: (row: requisiciones) => void;
  className?: string;
  emptyText?: string;
};

type RowTone = "active" | "closed" | "cancel" | "neutral";

type RowViewModel = {
  urgencyTone: "danger" | "warn" | "muted" | "ok";
};

type seguimiento = {
  urgencyLabel: string;
  urgencyTone: "danger" | "warn" | "muted" | "ok";
  tone: RowTone;
};

export default function RequisicionesBoard(props: Props) {
  const { cargoOptions, onOpenRow, className, emptyText = "No hay requisiciones para los filtros seleccionados." } = props;
  const requisicionesController = useRequisicion();
  const [selectedProcessRow, setSelectedProcessRow] = React.useState<requisiciones | null>(null);

  const stats = React.useMemo(() => {
    let active = 0;
    let closed = 0;
    let cancel = 0;
    let overdue = 0;

    for (const item of requisicionesController.rows) {
      const seguimiento = calcDayDifference(item);
      if (seguimiento.tone === "active") active += 1;
      if (seguimiento.tone === "closed") closed += 1;
      if (seguimiento.tone === "cancel") cancel += 1;
      if (seguimiento.urgencyTone === "danger") overdue += 1;
    }

    return { total: requisicionesController.rows.length, active, closed, cancel, overdue };
  }, [requisicionesController.rows]);

  return (
    <div className={`rb-shell ${className ?? ""}`.trim()}>
      <section className="rb-toolbar" aria-label="Resumen y filtros">
        <div className="rb-toolbar__top">
          <div>
            <span className="rb-section-tag">Listado</span>
            <h2 className="rb-section-title">Requisiciones</h2>
            <p className="rb-section-copy">Vista tabular para seguimiento operativo con filtros compactos y lectura rapida.</p>
          </div>

          <div className="rb-stats-inline" role="list" aria-label="Metricas rapidas">
            <StatPill label="Total" value={stats.total} tone="neutral" />
            <StatPill label="Activas" value={stats.active} tone="success" />
            <StatPill label="Retraso" value={stats.overdue} tone="danger" />
            <StatPill label="Cerradas" value={stats.closed} tone="info" />
            <StatPill label="Canceladas" value={stats.cancel} tone="warn" />
          </div>
        </div>

        <FiltersRequisicionesTable
          cargoOptions={cargoOptions}
          rows={requisicionesController.rows}
          setSearch={requisicionesController.setSearch}
          setEstado={requisicionesController.setEstado}
          setCargo={requisicionesController.setCargo}
          setCiudad={requisicionesController.setCiudad}
          setAnalista={requisicionesController.setAnalista}
          setMes={requisicionesController.setMes}
          search={requisicionesController.search}
          estado={requisicionesController.estado}
          cargo={requisicionesController.cargo}
          ciudad={requisicionesController.ciudad}
          analista={requisicionesController.analista}
          mes={requisicionesController.mes}
        />
      </section>

      <section className="rb-table-wrap" aria-label="Tabla de requisiciones">
        {requisicionesController.rows.length === 0 ? (
          <div className="rb-empty">
            <strong>Sin coincidencias</strong>
            <p>{emptyText}</p>
          </div>
        ) : (
          <div className="rb-table-scroll">
            <table className="rb-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cargo</th>
                  <th>Analista</th>
                  <th>Solicitante</th>
                  <th>Fecha hasta</th>
                  <th>Seguimiento</th>
                  <th>Porcetanje</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requisicionesController.rows.map((item) => {
                  const seguimiento = calcDayDifference(item);

                  return (
                    <tr key={item.Id} className={`rb-tr rb-tr--${seguimiento.tone}`} onClick={() => onOpenRow(item)}>
                      <td data-label="ID">
                        <span className="rb-id">#{item.Id || "-"}</span>
                      </td>
                      <td data-label="Cargo">
                        <div className="rb-cell-main">{item.Title}</div>
                      </td>
                      <td data-label="Analista">{item.nombreProfesional || "Sin asignar"}</td>
                      <td data-label="Solicitante" className="rb-break">{item.solicitante || "-"}</td>
                      <td data-label="Fecha hasta">{spDateToDDMMYYYY(item.fechaLimite)}</td>
                      <td data-label="Seguimiento">
                        <span className={`rb-chip rb-chip--${seguimiento.urgencyTone}`}>
                          {item.Estado === "Completada" ? "Finalizada" :seguimiento.urgencyLabel}
                        </span>
                      </td>
                      <td data-label="Porcentaje">{item.porceranje ?? 0}%</td>
                      <td data-label="Acciones">
                        <div className="rq-actions-cell">
                          <button
                            type="button"
                            className="rq-action-btn rq-action-btn--ghost"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenRow(item);
                            }}
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            className="rq-action-btn rq-action-btn--primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedProcessRow(item);
                            }}
                          >
                            Checklist
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ProcesoRequisicionModal
        open={Boolean(selectedProcessRow)}
        row={selectedProcessRow}
        onClose={() => setSelectedProcessRow(null)}
      />
    </div>
  );
}

function StatPill({ label, value, tone }: { label: string; value: number; tone: "neutral" | "success" | "danger" | "info" | "warn" }) {
  return (
    <div className={`rb-stat-pill rb-stat-pill--${tone}`} role="listitem">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function calcDayDifference(row: requisiciones): seguimiento {
  const estado = String(row.Estado ?? "").trim();
  const tone = getToneByEstado(estado);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const limite = new Date(toISODateFlex(row.fechaLimite));
  limite.setHours(0, 0, 0, 0);

  const msPorDia = 1000 * 60 * 60 * 24;
  const diffDias = Number.isNaN(limite.getTime()) ? null : Math.round((+limite - +hoy) / msPorDia);

  let urgencyLabel = "Sin fecha limite";
  let urgencyTone: RowViewModel["urgencyTone"] = "muted";

  if (tone !== "cancel" && tone !== "closed" && diffDias !== null) {
    if (diffDias < 0) {
      urgencyLabel = `${Math.abs(diffDias)} dias retraso`;
      urgencyTone = "danger";
    } else if (diffDias <= 2) {
      urgencyLabel = diffDias === 0 ? "Vence hoy" : `Vence en ${diffDias} dias`;
      urgencyTone = "warn";
    } else {
      urgencyLabel = `${diffDias} dias restantes`;
      urgencyTone = "ok";
    }
  } else if (tone === "closed") {
    urgencyLabel = "Cerrada";
  } else if (tone === "cancel") {
    urgencyLabel = "Cancelada";
  }

  return {
    urgencyLabel,
    urgencyTone,
    tone,
  };
}

function getToneByEstado(estado: string): RowTone {
  const s = String(estado ?? "").trim().toLowerCase();
  if (s.includes("cancel")) return "cancel";
  if (s.includes("completa")) return "closed";
  if (s.includes("activo") || s.includes("abiert")) return "active";
  return "neutral";
}
