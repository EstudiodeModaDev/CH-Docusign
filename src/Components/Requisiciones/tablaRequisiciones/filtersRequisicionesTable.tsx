import * as React from "react";
import type { desplegablesOption } from "../../../models/Desplegables";
import "./tablaRequisiciones.css";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";
import { IconBriefcase, IconCalendar, IconFlag, IconHash, IconMapPin, IconSearch, IconUser, IconX } from "./icons";

type Props = {
  cargoOptions: desplegablesOption[];
  ciudadOptions: desplegablesOption[];
  rows: requisiciones[];
  setSearch: (s: string) => void;
  setEstado: (estado: string) => void;
  setCargo: (cargo: string) => void;
  setCiudad: (ciudad: string) => void;
  setAnalista: (analista: string) => void;
  setSolicitante: (solicitante: string) => void;
  setMes: (mes: string) => void;
  mes: string | null;
  search: string;
  estado: string;
  cargo: string;
  ciudad: string;
  analista: string;
  solicitante: string;
};

export default function FiltersRequisicionesTable(props: Props) {
  const {
    cargoOptions,
    ciudadOptions,
    rows,
    setCargo,
    setSearch,
    setEstado,
    setAnalista,
    setCiudad,
    setSolicitante,
    setMes,
    mes,
    estado,
    cargo,
    ciudad,
    analista,
    solicitante,
    search,
  } = props;

  const estadoOptions: desplegablesOption[] = [
    { value: "all", label: "Todos los estados" },
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

  const cargoLabel = React.useMemo(() => {
    if (!cargo || cargo === "all") return null;
    return cargoOptions.find((o) => o.value === cargo)?.label ?? cargo;
  }, [cargo, cargoOptions]);

  const ciudadLabel = React.useMemo(() => {
    if (!ciudad || ciudad === "all") return null;
    return ciudadOptions.find((o) => o.value === ciudad)?.label ?? ciudad;
  }, [ciudad, ciudadOptions]);

  const mesLabel = React.useMemo(() => {
    if (!mes) return null;
    const [year, month] = mes.split("-");
    const parsed = new Date(Number(year), Number(month) - 1, 1);
    if (Number.isNaN(parsed.getTime())) return mes;
    const label = parsed.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [mes]);

  const activeChips = React.useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];

    if (search.trim()) chips.push({ key: "search", label: `ID: ${search.trim()}`, onClear: () => setSearch("") });
    if (solicitante.trim())
      chips.push({ key: "solicitante", label: `Solicitante: ${solicitante.trim()}`, onClear: () => setSolicitante("") });
    if (estado && estado !== "all") chips.push({ key: "estado", label: `Estado: ${estado}`, onClear: () => setEstado("all") });
    if (analista && analista !== "all")
      chips.push({ key: "analista", label: `Profesional: ${analista}`, onClear: () => setAnalista("all") });
    if (cargoLabel) chips.push({ key: "cargo", label: `Cargo: ${cargoLabel}`, onClear: () => setCargo("all") });
    if (ciudadLabel) chips.push({ key: "ciudad", label: `Ciudad: ${ciudadLabel}`, onClear: () => setCiudad("all") });
    if (mesLabel) chips.push({ key: "mes", label: `Mes: ${mesLabel}`, onClear: () => setMes("") });

    return chips;
  }, [search, solicitante, estado, analista, cargoLabel, ciudadLabel, mesLabel, setSearch, setSolicitante, setEstado, setAnalista, setCargo, setCiudad, setMes]);

  const resetFilters = () => {
    setSearch("");
    setSolicitante("");
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
        <div className="rb-filters-header__actions">
          <span className="rb-filters-counter">{activeChips.length} filtros activos</span>
          <button type="button" className="rb-clear-btn" onClick={resetFilters} disabled={activeChips.length === 0}>
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="rb-filter-grid">
        <Field label="ID" icon={<IconHash size={14} />}>
          <input
            type="text"
            inputMode="numeric"
            className="rb-input"
            value={search}
            placeholder="Ej. 1024"
            onChange={(e) => setSearch(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </Field>

        <Field label="Solicitante" icon={<IconUser size={14} />}>
          <input
            type="text"
            className="rb-input"
            value={solicitante}
            placeholder="Nombre del solicitante"
            onChange={(e) => setSolicitante(e.target.value)}
          />
        </Field>

        <Field label="Profesional" icon={<IconUser size={14} />}>
          <select className="rb-select" value={analista} onChange={(e) => setAnalista(e.target.value)}>
            <option value="all">Todos los profesionales</option>
            {analistaFilterOptions.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Estado" icon={<IconFlag size={14} />}>
          <select className="rb-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {estadoOptions.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cargo" icon={<IconBriefcase size={14} />}>
          <select className="rb-select" value={cargo} onChange={(e) => setCargo(e.target.value)}>
            <option value="all">Todos los cargos</option>
            {cargoOptions.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Ciudad" icon={<IconMapPin size={14} />}>
          <select className="rb-select" value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
            <option value="all">Todas las ciudades</option>
            {ciudadOptions.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mes de inicio" icon={<IconCalendar size={14} />}>
          <input className="rb-input" type="month" value={mes ?? ""} onChange={(e) => setMes(e.target.value)} />
        </Field>
      </div>

      {activeChips.length > 0 && (
        <div className="rb-filter-chips" role="list" aria-label="Filtros aplicados">
          {activeChips.map((chip) => (
            <button key={chip.key} type="button" className="rb-filter-chip" onClick={chip.onClear} role="listitem">
              <span>{chip.label}</span>
              <IconX size={12} />
            </button>
          ))}
        </div>
      )}

      <p className="rb-filter-helper">
        <IconSearch size={12} /> El filtro por mes usa la fecha de inicio del proceso para mostrar el periodo completo.
      </p>
    </section>
  );
}

function Field({ label, children, icon }: { label: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rb-field">
      <div className="rb-label">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}
