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
import { ProcesosStepManager } from "./CesacionManager/CesacionManager";
import { usePasosCesacion } from "../../Funcionalidades/PasosCesacion";
import { useGraphServices } from "../../graph/graphContext";
import { usePasosNoveades } from "../../Funcionalidades/PasosNovedades";
import type { PasosProceso } from "../../models/Cesaciones";
import { usePasosPromocion } from "../../Funcionalidades/PasosPromocion";
import type { TablaParametrosProps } from "../../models/Props";
import { usePasosRetail } from "../../Funcionalidades/PasosRetail";
import { ConfiguracionesVariasComponent } from "./ConfiguracionesVarias/ConfiguracionesVarias";
import { OrigenSeleccionManager } from "./OrigenSeleccion/OrigenSeleccion";

export type ParamTab = {
  id: string;
  label: string;
};

export const ParamTabs: React.FC<TablaParametrosProps> = ({ tabs, value, onChange}) => {
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
  { id: "configs", label: "Configuraciones" },
  { id: "empresas", label: "Empresas" },
  { id: "origen", label: "Origenes de selección" },
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
  { id: "novedades", label: "Proceso Novedades Administrativas" },
  { id: "promociones", label: "Proceso Promociones" },
  { id: "retail", label: "Proceso contratación retail" },
];

export const ParametrosPage: React.FC = () => {
  const [active, setActive] = React.useState<string>("configs");
  const {PasosCesacion, PasosNovedades,PasosPromocion, pasosRetail} = useGraphServices()
  const {loadPasosCesacion, rows} = usePasosCesacion()
  const {loadPasosNovedad, rows: rowsNovedades} = usePasosNoveades()
  const {rows: rowsPromocion, loadPasosPromocion} = usePasosPromocion()
  const {rows: rowsRetail, loadPasosPromocion: loasPasosReatil} = usePasosRetail()

  return (
    <section>
      <ParamTabs tabs={TABS} value={active} onChange={setActive} />

      {/* aquí renderizas según la pestaña */}
      {active === "configs" && <ConfiguracionesVariasComponent/>}
      {active === "empresas" && <EmpresasManager></EmpresasManager>}
      {active === "origen" && <OrigenSeleccionManager/>}
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
      {active === "cesaciones" && <ProcesosStepManager 
                                    onReload={() => loadPasosCesacion()} 
                                    pasos={rows} 
                                    tipo={"Cesación"} 
                                    onAdd={(payload: PasosProceso) => PasosCesacion.create(payload)} 
                                    onEdit={(id: string, changed: Partial<Omit<PasosProceso, "ID">>) => PasosCesacion.update(id, changed)} 
                                    onDelete={(id: string) => PasosCesacion.delete(id)}/>}
      {active === "novedades" && <ProcesosStepManager 
                                    onReload={() => loadPasosNovedad()} 
                                    pasos={rowsNovedades} 
                                    tipo={"Novedades Administrativas"} 
                                    onAdd={(payload: PasosProceso) => PasosNovedades.create(payload)} 
                                    onEdit={(id: string, changed: Partial<Omit<PasosProceso, "ID">>) => PasosNovedades.update(id, changed)} 
                                    onDelete={(id: string) => PasosNovedades.delete(id)}/>}
      {active === "promociones" && <ProcesosStepManager 
                                    onReload={() => loadPasosPromocion()} 
                                    pasos={rowsPromocion} 
                                    tipo={"Promociones"} 
                                    onAdd={(payload: PasosProceso) => PasosPromocion.create(payload)} 
                                    onEdit={(id: string, changed: Partial<Omit<PasosProceso, "ID">>) => PasosPromocion.update(id, changed)} 
                                    onDelete={(id: string) => PasosPromocion.delete(id)}/>}
      {active === "retail" && <ProcesosStepManager 
                                    onReload={() => loasPasosReatil()} 
                                    pasos={rowsRetail} 
                                    tipo={"Retail"} 
                                    onAdd={(payload: PasosProceso) => pasosRetail.create(payload)} 
                                    onEdit={(id: string, changed: Partial<Omit<PasosProceso, "ID">>) => pasosRetail.update(id, changed)} 
                                    onDelete={(id: string) => pasosRetail.delete(id)}/>}
      
    </section>
  );
};
