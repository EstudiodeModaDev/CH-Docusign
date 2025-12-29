import * as React from "react";
import "./SettingsPage.css";
import { EmpresasManager } from "./CompaniesSettings/CompaniesSettings";
import { DocumentTypeManager } from "./DocumentsType/DocumentType";
import { CargosManager } from "./Cargos/Cargos";
import { ModalidadesManager } from "./ModalidadesTrabajo/ModalidadesTrabajo";
import { EspecificidadManager } from "./EspecificidadCargo/EspecificidadCargo";
import { NivelCargosManager } from "./NivelCargos/NivelCargos";
import { CentroOperativoManager } from "./CentrosOperativos/CentrosOperativos";
import { UnidadNegocioManager } from "./UnidadNegocio/UnidadNegocio";
import { TipoContratoManager } from "./TipoContrato/TipoContrato";
import { TipoVacanteManager } from "./TipoVacante/TipoVacante";
import { CentroCostosManager } from "./CentroCostos/CentroCostos";
import { CesacionStepsManager } from "./CesacionManager/CesacionManager";

export type ParamTab = {
  id: string;
  label: string;
};

type Props = {
  tabs: ParamTab[];
  value: string;                     // id activo
  onChange: (id: string) => void;
};

export const ParamTabs: React.FC<Props> = ({ tabs, value, onChange}) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeIndex = tabs.findIndex((t) => t.id === value);
    if (activeIndex === -1) {
      setIndicatorStyle({ opacity: 0 });
      return;
    }

    const buttons = container.querySelectorAll<HTMLButtonElement>(".ptabs__tab");
    const btn = buttons[activeIndex];
    if (!btn) return;

    const { offsetLeft, offsetWidth } = btn;
    setIndicatorStyle({
      opacity: 1,
      transform: `translateX(${offsetLeft}px)`,
      width: offsetWidth,
    });
  }, [tabs, value]);


  return (
    <div className="ptabs">
      <div className="ptabs__track" ref={containerRef}>
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button key={tab.id} type="button" className={`ptabs__tab ${active ? "ptabs__tab--active" : ""}`} onClick={() => onChange(tab.id)}>
              {tab.label}
            </button>
          );
        })}
        <span className="ptabs__indicator" style={indicatorStyle} />
      </div>
    </div>
  );
};

const TABS = [
  { id: "empresas", label: "Empresas" },
  { id: "tipodoc", label: "Tipos de documentos" },
  { id: "cargos", label: "Cargos" },
  { id: "modalidad", label: "Modalidades de trabajo" },
  { id: "especificidad", label: "Especificidad de cargos" },
  { id: "nivel", label: "Nivel de cargos" },
  { id: "centros", label: "Centros operativos" },
  { id: "unidad", label: "Unidad de negocio" },
  { id: "tipocontrato", label: "Tipo de contrato" },
  { id: "tipovacante", label: "Tipo vacante" },
  { id: "centrocostos", label: "Centro de costos" },
  { id: "cesaciones", label: "Proceso cesación" },
];

export const ParametrosPage: React.FC = () => {
  const [active, setActive] = React.useState<string>("empresas");

  return (
    <section>
      <ParamTabs tabs={TABS} value={active} onChange={setActive} />

      {/* aquí renderizas según la pestaña */}
      {active === "empresas" && <EmpresasManager></EmpresasManager>}
      {active === "tipodoc" && <DocumentTypeManager/>}
      {active === "cargos" && <CargosManager/>}
      {active === "modalidad" && <ModalidadesManager/>}
      {active === "especificidad" && <EspecificidadManager/>}
      {active === "nivel" && <NivelCargosManager/>}
      {active === "centros" && <CentroOperativoManager/>}
      {active === "unidad" && <UnidadNegocioManager/>}
      {active === "tipocontrato" && <TipoContratoManager/>}
      {active === "tipovacante" && <TipoVacanteManager/>}
      {active === "centrocostos" && <CentroCostosManager/>}
      {active === "cesaciones" && <CesacionStepsManager></CesacionStepsManager>}
    </section>
  );
};
