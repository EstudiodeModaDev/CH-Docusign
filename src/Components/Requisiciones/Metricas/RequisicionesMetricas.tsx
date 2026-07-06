import "./RequisicionesMetricas.css";
import type { desplegablesOption } from "../../../models/Desplegables";
import type {RequisicionesMetrics } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
import MetricasFilters from "./RequisicionesTableroFilters";
import RequisicionTableroCentral from "./RequisicionTableroCentral";
import KPIGenericos from "./RequisicionTableroKPIGenerico";
import RequisicionesTableroFooter from "./RequisicionTableroFooter";

type Props = {
  loading: boolean;
  error: string | null;
  rowsCount: number;
  metrics: RequisicionesMetrics;
  cargo: string;
  ciudad: string;
  analista: string;
  direccion: string;
  yearOptions: desplegablesOption[];
  cargoOptions: desplegablesOption[];
  ciudadOptions: desplegablesOption[];
  analistaOptions: desplegablesOption[];
  direccionOptions: desplegablesOption[];
  setCargo: (value: string) => void;
  setCiudad: (value: string) => void;
  setAnalista: (value: string) => void;
  setDireccion: (value: string) => void;
};

export default function RequisicionesMetricasPage(props: Props) {
  const {
    loading,
    error,
    rowsCount,
    metrics,
    cargo,
    ciudad,
    analista,
    direccion,
    yearOptions,
    cargoOptions,
    ciudadOptions,
    analistaOptions,
    direccionOptions,
    setCargo,
    setCiudad,
    setAnalista,
    setDireccion,
  } = props;

  return (
    <div className="rqm-page">
      <div className="rqm-shell">
        <MetricasFilters 
          cargo={cargo} 
          ciudad={ciudad} 
          analista={analista} 
          direccion={direccion} 
          yearOptions={yearOptions} 
          cargoOptions={cargoOptions} 
          ciudadOptions={ciudadOptions} 
          analistaOptions={analistaOptions} 
          direccionOptions={direccionOptions} 
          setCargo={setCargo} 
          setCiudad={setCiudad} 
          setAnalista={setAnalista} 
          setDireccion={setDireccion}/>

        {(loading || error) && <section className="rqm-feedback">{loading ? "Cargando métricas..." : error}</section>}
        <KPIGenericos metrics={metrics}/>
        <RequisicionTableroCentral metrics={metrics}/>  
        <RequisicionesTableroFooter rowsCount={rowsCount} metrics={metrics}/>
      </div>
    </div>
  );
}

