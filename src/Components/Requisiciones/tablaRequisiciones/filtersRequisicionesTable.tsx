import * as React from "react";
import type { desplegablesOption } from "../../../models/Desplegables";
import "./tablaRequisiciones.css";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";

type Props = {
  cargoOptions: desplegablesOption[];
  rows: requisiciones[];
  setSearch: (s: string) => void;
  setEstado: (estado: string) => void;
  setCargo: (cargo: string) => void;
  setCiudad: (ciudad: string) => void;
  setAnalista: (analista: string) => void;
  setMes: (mes: string) => void;
  mes: string;
  search: string;
  estado: string;
  cargo: string;
  ciudad: string;
  analista: string;
};

export default function FiltersRequisicionesTable(props: Props) {
  const { cargoOptions, rows, setCargo, setSearch, setEstado, setAnalista, setCiudad, setMes, mes, estado, cargo, analista, search } = props;

  const estadoOptions: desplegablesOption[] = [
    { value: "all", label: "*Todos*" },
    { value: "Activo", label: "Activo" },
    { value: "Cancelado", label: "Cancelado" },
    { value: "Cerrado", label: "Cerrado" },
  ];

  const analistaFilterOptions: desplegablesOption[] = React.useMemo(() => {
    const set = new Set<string>();
    (rows ?? []).forEach((r) => {
      const name = String(r?.nombreProfesional ?? "").trim();
      if (name) set.add(name);
    });

    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((name) => ({ value: name, label: name }));
  }, [rows]);

  const activeFilterCount = [
    search ? 1 : 0,
    estado && estado !== "all" ? 1 : 0,
    cargo && cargo !== "all" ? 1 : 0,
    props.ciudad && props.ciudad !== "all" ? 1 : 0,
    analista && analista !== "all" ? 1 : 0,
    mes ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  const resetFilters = () => {
    setSearch("");
    setEstado("all");
    setCargo("all");
    setCiudad("all");
    setAnalista("all");
    setMes("");
  };

  return (
    <section className="rb-filters-panel" aria-label="Filtros de requisiciones">
      <div className="rb-filters-panel__header">
        <div>
          <span className="rb-filters-kicker">Filtros</span>
          <h3 className="rb-filters-title">Encuentra requisiciones rapido</h3>
        </div>
        <span className="rb-filters-counter">{activeFilterCount} filtros activos</span>
      </div>

      <div className="rb-filter-grid">
        <Field label="ID" className="rb-field--id">
          <input type="number" className="rb-input" value={search} placeholder="Buscar por ID" onChange={(e) => setSearch(e.target.value)} />
        </Field>

        <Field label="Estado">
          <select className="rb-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {estadoOptions.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cargo">
          <select className="rb-select" value={cargo} onChange={(e) => setCargo(e.target.value)}>
            <option value="all">*Todos*</option>
            {cargoOptions.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Analista">
          <select className="rb-select" value={analista} onChange={(e) => setAnalista(e.target.value)}>
            <option value="all">*Todos*</option>
            {analistaFilterOptions.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mes de inicio" className="rb-field--date">
          <input className="rb-input" type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
        </Field>
      </div>

      <div className="rb-filter-actions">
        <p className="rb-filter-helper">Filtra por el mes de `fechaInicioProceso` para ver requisiciones del periodo completo.</p>
        <button type="button" className="rb-clear-btn" onClick={resetFilters}>
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rb-field ${className ?? ""}`.trim()}>
      <div className="rb-label">{label}</div>
      {children}
    </div>
  );
}
