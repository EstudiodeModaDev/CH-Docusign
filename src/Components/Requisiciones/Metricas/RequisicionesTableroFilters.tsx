import "./RequisicionesMetricas.css";
import type { desplegablesOption } from "../../../models/Desplegables";


type Props = {
  anio: string;
  cargo: string;
  ciudad: string;
  analista: string;
  direccion: string;
  yearOptions: desplegablesOption[];
  cargoOptions: desplegablesOption[];
  ciudadOptions: desplegablesOption[];
  analistaOptions: desplegablesOption[];
  direccionOptions: desplegablesOption[];
  setAnio: (value: string) => void;
  setCargo: (value: string) => void;
  setCiudad: (value: string) => void;
  setAnalista: (value: string) => void;
  setDireccion: (value: string) => void;
};

export default function MetricasFilters(props: Props) {
  const {
    anio,
    cargo,
    ciudad,
    analista,
    direccion,
    yearOptions,
    cargoOptions,
    ciudadOptions,
    analistaOptions,
    direccionOptions,
    setAnio,
    setCargo,
    setCiudad,
    setAnalista,
    setDireccion,
  } = props;



  return (
    <section className="rqm-filters" aria-label="Filtros del tablero">
      <label className="rqm-filter-field">
        <span>Año</span>
        <select value={anio} onChange={(e) => setAnio(e.target.value)}>
          {yearOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="rqm-filter-field">
        <span>Dirección</span>
        <select value={direccion} onChange={(e) => setDireccion(e.target.value)}>
          {direccionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="rqm-filter-field">
        <span>Ciudad</span>
        <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
          {ciudadOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="rqm-filter-field">
        <span>Cargo</span>
        <select value={cargo} onChange={(e) => setCargo(e.target.value)}>
          {cargoOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="rqm-filter-field">
        <span>Analista</span>
        <select value={analista} onChange={(e) => setAnalista(e.target.value)}>
          {analistaOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
