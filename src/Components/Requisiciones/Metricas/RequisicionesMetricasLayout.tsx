import "./chartSetup";
import * as React from "react";
import { Outlet, useLocation } from "react-router-dom";
import "./RequisicionesMetricas.css";
import type { desplegablesOption } from "../../../models/Desplegables";
import type { RequisicionesMetrics } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/requisicionesMetrics";
import { ParamTabs } from "../../GD/Settings/Tabs";
import MetricasFilters from "./RequisicionesTableroFilters";
import KPIGenericos from "./RequisicionTableroKPIGenerico";
import { METRICAS_TABS } from "./metricasTabs";
import { RequisicionesMetricasDataProvider } from "./RequisicionesMetricasContext";

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

export default function RequisicionesMetricasLayout(props: Props) {
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

  const location = useLocation();


  //Encuentra que tab esta activo en funcion a que ruta se tenga activa en el momento
  const activeTab = React.useMemo(() => {
    const match = METRICAS_TABS.find((tab) => tab.to === location.pathname);
    return match?.id ?? METRICAS_TABS[0].id;
  }, [location.pathname]);

  const contextValue = React.useMemo(() => ({ loading, error, rowsCount, metrics }), [loading, error, rowsCount, metrics]);

  const showFiltrosGenerales = activeTab === "resumen";

  return (
    <div className="rqm-page">
      <div className="rqm-shell">
        {showFiltrosGenerales && (
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
            setDireccion={setDireccion}
          />
        )}

        {showFiltrosGenerales && (loading || error) && (
          <section className="rqm-feedback">{loading ? "Cargando métricas..." : error}</section>
        )}

        {showFiltrosGenerales && <KPIGenericos metrics={metrics} />}

        <ParamTabs tabs={METRICAS_TABS} value={activeTab} />

        <RequisicionesMetricasDataProvider value={contextValue}>
          <Outlet />
        </RequisicionesMetricasDataProvider>
      </div>
    </div>
  );
}
