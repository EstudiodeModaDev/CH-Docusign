import * as React from "react";
import "./SettingsPage.css";
import { Outlet, useLocation } from "react-router-dom";
import { ParamTabs } from "./Tabs";
import type { ParamTab } from "../../../models/Props";

export const SETTINGS_TABS: ParamTab[] = [
  { id: "configs", label: "Configuraciones", to: "/settings/configuraciones" },
  { id: "empresas", label: "Empresas", to: "/settings/empresas" },
  { id: "origen", label: "Origenes de seleccion", to: "/settings/origenes" },
  { id: "tipodoc", label: "Tipos de documentos", to: "/settings/tiposdocumentos" },
  { id: "cargos", label: "Cargos", to: "/settings/cargos" },
  { id: "modalidad", label: "Modalidades de trabajo", to: "/settings/modalidades" },
  { id: "especificidad", label: "Especificidad de cargos", to: "/settings/especificidad" },
  { id: "nivel", label: "Nivel de cargos", to: "/settings/nivel" },
  { id: "centros", label: "Centros operativos", to: "/settings/co" },
  { id: "unidad", label: "Unidad de negocio", to: "/settings/un" },
  { id: "tipocontrato", label: "Tipo de contrato", to: "/settings/tipocontrato" },
  { id: "tipovacante", label: "Tipo vacante", to: "/settings/tipovacante" },
  { id: "centrocostos", label: "Centro de costos", to: "/settings/cc" },
  { id: "cesaciones", label: "Proceso cesacion", to: "/settings/proceso/cesacion" },
  { id: "novedades", label: "Proceso Novedades Administrativas", to: "/settings/proceso/novedades" },
  { id: "promociones", label: "Proceso Promociones", to: "/settings/proceso/promocion" },
  { id: "retail", label: "Proceso contratacion retail", to: "/settings/proceso/retail" },
];

export const ParametrosPage: React.FC = () => {
  const location = useLocation();

  const activeTab = React.useMemo(() => {
    const match = SETTINGS_TABS.find((tab) => tab.to === location.pathname);
    return match?.id ?? SETTINGS_TABS[0].id;
  }, [location.pathname]);

  return (
    <section>
      <ParamTabs tabs={SETTINGS_TABS} value={activeTab} />
      <Outlet />
    </section>
  );
};
