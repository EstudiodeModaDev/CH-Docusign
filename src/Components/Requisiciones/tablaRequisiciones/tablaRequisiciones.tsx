import * as React from "react";
import type { desplegablesOption } from "../../../models/Desplegables";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";
import { spDateToDDMMYYYY, toISODateFlex } from "../../../utils/Date";
import ProcesoRequisicionModal from "./Proceso/ProcesoRequisicionModal";
import FiltersRequisicionesTable from "./filtersRequisicionesTable";
import "./tablaRequisiciones.css";
import { usePermissions } from "../../../Funcionalidades/Permisos";
import { useRequisicionesContext } from "../../../Funcionalidades/Requisiciones/RequisicionesContext";
import { IconAlertTriangle, IconCheckCircle, IconLayers, IconXCircle } from "./icons";

type Props = {
  cargoOptions: desplegablesOption[];
  ciudadOptions: desplegablesOption[];
  onOpenRow: (row: requisiciones) => void;
  className?: string;
  emptyText?: string;
  onEditRow: (row: requisiciones) => void
  reloadRequisiciones: () => void
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

type SortKey =
  | "id"
  | "cargo"
  | "analista"
  | "solicitante"
  | "fechaLimite"
  | "seguimiento"
  | "fechaCierre"
  | "porcentaje";

export default function RequisicionesBoard(props: Props) {
  const { 
    cargoOptions, 
    ciudadOptions, 
    onOpenRow, 
    className, 
    emptyText = "No hay requisiciones para los filtros seleccionados." , 
    onEditRow,
    reloadRequisiciones
  } = props;
  const requisicionesController = useRequisicionesContext();
  const [selectedProcessRow, setSelectedProcessRow] = React.useState<requisiciones | null>(null);
  const { engine } = usePermissions();

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

  const canManageRequisicion = React.useMemo(() => {
    const requiredPermission = "requisiciones.manage";
    if (!requiredPermission) return false;
    return engine.can(requiredPermission);
  }, [engine]);

  const canEditRequisiciones = React.useMemo(() => {
    const requiredPermission = "requisiciones.edit";
    if (!requiredPermission) return false;
    return engine.can(requiredPermission);
  }, [engine]);

  // Traer de Graph cuando cambien filtros, búsqueda o tamaño de página.
  const activeSort = React.useMemo(() => {
    const current = requisicionesController.sorts?.[0];
    return {
      key: (current?.field as SortKey | undefined) ?? "id",
      direction: current?.dir ?? "desc",
    };
  }, [requisicionesController.sorts]);

  const handleSort = React.useCallback((key: SortKey) => {
    requisicionesController.setSorts((current) => {
      const currentSort = current?.[0];
      const nextDirection = currentSort?.field === key && currentSort.dir === "asc" ? "desc" : "asc";
      return [{ field: key, dir: nextDirection }];
    });
  }, [requisicionesController]);

  return (
    <div className={`rb-shell ${className ?? ""}`.trim()}>
      <section className="rb-toolbar" aria-label="Resumen y filtros">
        <div className="rb-toolbar__top">
          <div>
            <span className="rb-section-tag">Listado</span>
            <h2 className="rb-section-title">Requisiciones</h2>
            <p className="rb-section-copy">Vista tabular para seguimiento operativo con filtros compactos y lectura rapida.</p>
          </div>

          <div className="rb-stats-grid" role="list" aria-label="Metricas rapidas">
            <StatCard label="Total" value={stats.total} tone="neutral" icon={<IconLayers size={17} />} />
            <StatCard label="Activas" value={stats.active} tone="success" icon={<IconCheckCircle size={17} />} />
            <StatCard label="Retraso" value={stats.overdue} tone="danger" icon={<IconAlertTriangle size={17} />} />
            <StatCard label="Cerradas" value={stats.closed} tone="info" icon={<IconCheckCircle size={17} />} />
            <StatCard label="Canceladas" value={stats.cancel} tone="warn" icon={<IconXCircle size={17} />} />
          </div>
        </div>

        <FiltersRequisicionesTable
          cargoOptions={cargoOptions}
          ciudadOptions={ciudadOptions}
          rows={requisicionesController.rows}
          setSearch={requisicionesController.setSearch}
          setEstado={requisicionesController.setEstado}
          setCargo={requisicionesController.setCargo}
          setCiudad={requisicionesController.setCiudad}
          setAnalista={requisicionesController.setAnalista}
          setSolicitante={requisicionesController.setSolicitante}
          setMes={requisicionesController.setMes}
          search={requisicionesController.search}
          estado={requisicionesController.estado}
          cargo={requisicionesController.cargo}
          ciudad={requisicionesController.ciudad}
          analista={requisicionesController.analista}
          solicitante={requisicionesController.solicitante}
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
                  <SortableHeader label="ID" columnKey="id" sortConfig={activeSort} onSort={handleSort} />
                  <SortableHeader label="Cargo" columnKey="cargo" sortConfig={activeSort} onSort={handleSort} />
                  <SortableHeader label="Profesional" columnKey="analista" sortConfig={activeSort} onSort={handleSort} />
                  <SortableHeader label="Solicitante" columnKey="solicitante" sortConfig={activeSort} onSort={handleSort} />
                  <SortableHeader label="Fecha hasta" columnKey="fechaLimite" sortConfig={activeSort} onSort={handleSort} />
                  <SortableHeader label="Seguimiento" columnKey="seguimiento" sortConfig={activeSort} onSort={handleSort} />
                  <SortableHeader label="Fecha de cierre" columnKey="fechaCierre" sortConfig={activeSort} onSort={handleSort} />
                  <SortableHeader label="Porcentaje" columnKey="porcentaje" sortConfig={activeSort} onSort={handleSort} />
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requisicionesController.rows.map((item) => {
                  const seguimiento = calcDayDifference(item);

                  return (
                    <tr key={item.Id} className={`rb-tr rb-tr--${seguimiento.tone}`}>
                      <td data-label="ID">
                        <span className="rb-id">#{item.Id || "-"}</span>
                      </td>
                      <td data-label="Cargo">
                        <div className="rb-cell-main">{item.Title}</div>
                        {item.Ciudad ? <div className="rb-cell-sub">{item.Ciudad}</div> : null}
                      </td>
                      <td data-label="Profesional">
                        <div className="rb-person">
                          <span className="rb-avatar" aria-hidden="true">{getInitials(item.nombreProfesional)}</span>
                          <span>{item.nombreProfesional || "Sin asignar"}</span>
                        </div>
                      </td>
                      <td data-label="Solicitante" className="rb-break">{item.solicitante || "-"}</td>
                      <td data-label="Fecha hasta">{spDateToDDMMYYYY(item.fechaLimite)}</td>
                      <td data-label="Seguimiento">
                        <span className={`rb-chip rb-chip--${seguimiento.urgencyTone}`}>
                          {item.Estado === "Completada" ? "Finalizada" :seguimiento.urgencyLabel}
                        </span>
                      </td>
                      <td data-label="fecha de cierre">{item.fechaCierre ? spDateToDDMMYYYY(item.fechaCierre) : "No se ha cerrado"}</td>
                      <td data-label="Porcentaje">
                        <div className="rb-progress" title={`${item.porceranje ?? 0}%`}>
                          <div className="rb-progress__track">
                            <div
                              className={`rb-progress__fill rb-progress__fill--${progressTone(item.porceranje ?? 0)}`}
                              style={{ width: `${Math.min(100, Math.max(0, item.porceranje ?? 0))}%` }}
                            />
                          </div>
                          <span className="rb-progress__label">{item.porceranje ?? 0}%</span>
                        </div>
                      </td>
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
                          {canEditRequisiciones ?          
                            <button
                              type="button"
                              className="rq-action-btn rq-action-btn--green"
                              onClick={(event) => {
                                event.stopPropagation();
                                onEditRow(item);
                              }}
                            > 
                              Editar
                            </button>
                            : null
                          }
                          {canManageRequisicion ?
                            <button
                              type="button"
                              className="rq-action-btn rq-action-btn--primary"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedProcessRow(item);
                              }}
                            >
                              Checklist
                            </button> : null
                          }
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="rb-pagination" aria-label="Controles de paginacion">
          <div className="rb-pagination__summary">
            <span className="rb-pagination__count">{requisicionesController.rows.length} requisiciones visibles</span>
            <span className="rb-pagination__page">Pagina {requisicionesController.pageIndex}</span>
          </div>

          <div className="rb-pagination__controls">
            <label className="rb-pagination__size">
              <span>Requisiciones por pagina</span>
              <select
                className="rb-select rb-pagination__select"
                value={requisicionesController.pageSize}
                onChange={(event) => requisicionesController.setPageSize(Number(event.target.value))}
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <div className="rb-pagination__buttons">
              <button
                type="button"
                className="rb-pagination__button"
                onClick={requisicionesController.prevPage}
                disabled={requisicionesController.loading || !requisicionesController.hasPrevious}
              >
                Anterior
              </button>
              <button
                type="button"
                className="rb-pagination__button rb-pagination__button--primary"
                onClick={requisicionesController.nextPage}
                disabled={requisicionesController.loading || !requisicionesController.hasNext}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </section>

      <ProcesoRequisicionModal
        open={Boolean(selectedProcessRow)}
        row={selectedProcessRow}
        onClose={() => {reloadRequisiciones(); setSelectedProcessRow(null)}}
      />
    </div>
  );
}

function SortableHeader({
  label,
  columnKey,
  sortConfig,
  onSort,
}: {
  label: string;
  columnKey: SortKey;
  sortConfig: { key: SortKey; direction: "asc" | "desc" };
  onSort: (key: SortKey) => void;
}) {
  const isActive = sortConfig.key === columnKey;
  const direction = isActive ? sortConfig.direction : undefined;
  const ariaSort = !isActive ? "none" : direction === "asc" ? "ascending" : "descending";

  return (
    <th aria-sort={ariaSort}>
      <button
        type="button"
        className={`rb-sort-button ${isActive ? "is-active" : ""}`.trim()}
        onClick={() => onSort(columnKey)}
      >
        <span>{label}</span>
        <span className="rb-sort-button__icon" aria-hidden="true">
          {isActive ? (direction === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "neutral" | "success" | "danger" | "info" | "warn";
  icon: React.ReactNode;
}) {
  return (
    <div className={`rb-stat-card rb-stat-card--${tone}`} role="listitem">
      <span className="rb-stat-card__icon" aria-hidden="true">{icon}</span>
      <div className="rb-stat-card__copy">
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function getInitials(name?: string): string {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function progressTone(value: number): "danger" | "warn" | "ok" {
  if (value >= 100) return "ok";
  if (value >= 50) return "warn";
  return "danger";
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
    urgencyLabel = "Vacante cerrada";
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
  if (s.includes("cerr") || s.includes("completa")) return "closed";
  if (s.includes("activo") || s.includes("abiert")) return "active";
  return "neutral";
}
