import * as React from "react";
import { useAuth } from "../auth/authProvider";
import { GraphRest } from "./graphRest";
import { HabeasDataService } from "../Services/HabeasData.service";
import { UsuariosSPService } from "../Services/Usuarios.service";
import { PerfilesService } from "../Services/Perfiles.service";
import { ContratosService } from "../Services/Contratos.service";
import { PromocionesService } from "../Services/Promociones.service";
import { EmpresaService } from "../Services/Empresas.service";
import { tipoDocumentoService } from "../Services/TipoDocumento.service";
import { CargoService } from "../Services/Cargo.service";
import { ModalidadTrabajoService } from "../Services/ModalidadTrabajo.service";
import { EspecificidadCargoService } from "../Services/EspecificidadCargo.service";
import { NivelCargoService } from "../Services/NivelCargo.service";
import { centroCostosService } from "../Services/CentroCostos.service";
import { centroOperativoService } from "../Services/CentroOperativo.service";
import { unidadNegocioService } from "../Services/UnidadNegocio.service";
import { OrigenSeleccionService } from "../Services/OrigenSeleccion.service";
import { TipoContratoService } from "../Services/TipoContrato.Service";
import { TipoVacanteService } from "../Services/TipoVacante.service";
import { DeptosYMunicipiosService } from "../Services/DeptosYMunicipios.service";
import { EnviosService } from "../Services/Envios.service";
import { PasosPromocionService } from "../Services/PasosPromocion.service";
import { DetallesPasosPromocionService } from "../Services/DetallesPasosPromocion.service";
import { ColaboradoresDHService, ColaboradoresEDMService } from "../Services/Bibliotecas.service";

/* ================== Tipos de config ================== */
export type SiteConfig = {
  hostname: string;
  sitePath: string; 
};

export type UnifiedConfig = {
  ch: SiteConfig;    // sitio principal (CH)
  test: SiteConfig;  // sitio de pruebas (Paz y salvos)
  lists: {
    // CH
    HabeasData: string;
    Usuarios: string;
    Perfiles: string;
    Contratos: string;
    Promociones: string;
    Empresa: string;
    tipoDocumento: string;
    cargo: string;
    modalidadTrabajo: string;
    especificidadCargo: string;
    NivelCargo: string;
    CentroCostos: string;
    CentroOperativo: string;
    UnidadNegocio: string,
    OrigenSeleccion: string;
    TipoContrato: string;
    TipoVacante: string;
    DeptosYMunicipios: string;
    Envios: string;
    PasosPromocion: string;
    DetallesPasosPromocion: string
    ColaboradoresEDM: string;
    ColaboradoresDH: string;
    // TEST
  };
};

/* ================== Tipos del contexto ================== */
export type GraphServices = {
  graph: GraphRest;

  // CH
  HabeasData: HabeasDataService;
  Usuarios: UsuariosSPService;
  Perfiles: PerfilesService;
  Contratos: ContratosService;
  Promociones: PromocionesService
  Empresa: EmpresaService;
  tipoDocumento: tipoDocumentoService;
  cargo: CargoService;
  modalidadTrabajo: ModalidadTrabajoService;
  especificidadCargo: EspecificidadCargoService;
  NivelCargo: NivelCargoService;
  CentroCostos: centroCostosService;
  CentroOperativo: centroOperativoService;
  UnidadNegocio: unidadNegocioService;
  OrigenSeleccion: OrigenSeleccionService;
  TipoContrato: TipoContratoService;
  TipoVacante: TipoVacanteService;
  DeptosYMunicipios: DeptosYMunicipiosService;
  Envios: EnviosService;
  PasosPromocion: PasosPromocionService;
  DetallesPasosPromocion: DetallesPasosPromocionService
  ColaboradoresEDM: ColaboradoresEDMService,
  ColaboradoresDH: ColaboradoresDHService
  // TEST
};

/* ================== Contexto ================== */
const GraphServicesContext = React.createContext<GraphServices | null>(null);

/* ================== Default config (puedes cambiar paths) ================== */
const DEFAULT_CONFIG: UnifiedConfig = {
  ch: {
    hostname: "estudiodemoda.sharepoint.com",
    sitePath: "/sites/TransformacionDigital/IN/CH",
  },
  test: {
    hostname: "estudiodemoda.sharepoint.com",
    sitePath: "/sites/TransformacionDigital/IN/Test",
  },
  lists: {
    // CH
    HabeasData: "Habeas Data",
    Usuarios: "Permisos Docu",
    Perfiles: "Perfiles Novedades",
    Contratos: "Novedades Administrativas",
    Promociones: "Promociones",
    Empresa: "Empresas",
    tipoDocumento: "TipoDocumento",
    cargo: "Cargos",
    modalidadTrabajo: "ModalidadTrabajo",
    especificidadCargo: "Especificidad de cargo",
    NivelCargo: "Nivel Cargo",
    CentroCostos: "Centro Costos",
    CentroOperativo: "Centro Operativo",
    UnidadNegocio: "Unidad de negocio",
    OrigenSeleccion: "OrigenSeleccion",
    TipoContrato: "TipoContrato",
    TipoVacante: "TipoVacante",
    DeptosYMunicipios: "DeptosyMunicipios",
    Envios: "Envios",
    PasosPromocion: "PasosPromocion",
    DetallesPasosPromocion: "DetallesPasosPromocion",

    //Bibliotecas de documentos
    ColaboradoresEDM: "Colaboradores EDM",
    ColaboradoresDH: "Colaboradores DH"

    // TEST
  },
};

/* ================== Provider ================== */
type ProviderProps = {
  children: React.ReactNode;
  config?: Partial<UnifiedConfig>;
};

export const GraphServicesProvider: React.FC<ProviderProps> = ({ children, config }) => {
  const { getToken } = useAuth();

  // Mergeo de config
  const cfg: UnifiedConfig = React.useMemo(() => {
    const base = DEFAULT_CONFIG;

    const normPath = (p: string) => (p.startsWith("/") ? p : `/${p}`);

    const ch: SiteConfig = {
      hostname: config?.ch?.hostname ?? base.ch.hostname,
      sitePath: normPath(config?.ch?.sitePath ?? base.ch.sitePath),
    };

    const test: SiteConfig = {
      hostname: config?.test?.hostname ?? base.test.hostname,
      sitePath: normPath(config?.test?.sitePath ?? base.test.sitePath),
    };

    const lists = { ...base.lists, ...(config?.lists ?? {}) };

    return { ch, test, lists };
  }, [config]);

  // Cliente Graph
  const graph = React.useMemo(() => new GraphRest(getToken), [getToken]);

  const services = React.useMemo<GraphServices>(() => {
    const { ch, lists } = cfg;

    // CH
    const HabeasData              = new HabeasDataService(graph, ch.hostname,  ch.sitePath,  lists.HabeasData);
    const Usuarios                = new UsuariosSPService(graph, ch.hostname, ch.sitePath, lists.Usuarios);
    const Perfiles                = new PerfilesService(graph, ch.hostname, ch.sitePath, lists.Perfiles);
    const Contratos               = new ContratosService(graph, ch.hostname, ch.sitePath, lists.Contratos)
    const Promociones             = new PromocionesService(graph, ch.hostname, ch.sitePath, lists.Promociones);
    const Empresa                 = new EmpresaService(graph, ch.hostname, ch.sitePath, lists.Empresa);
    const tipoDocumento           = new tipoDocumentoService(graph, ch.hostname, ch.sitePath, lists.tipoDocumento);
    const cargo                   = new CargoService(graph, ch.hostname, ch.sitePath, lists.cargo);
    const modalidadTrabajo        = new ModalidadTrabajoService(graph, ch.hostname, ch.sitePath, lists.modalidadTrabajo);
    const especificidadCargo      = new EspecificidadCargoService(graph, ch.hostname, ch.sitePath, lists.especificidadCargo);
    const NivelCargo              = new NivelCargoService(graph, ch.hostname, ch.sitePath, lists.NivelCargo);
    const CentroCostos            = new centroCostosService(graph, ch.hostname, ch.sitePath, lists.CentroCostos)
    const CentroOperativo         = new centroOperativoService(graph, ch.hostname, ch.sitePath, lists.CentroOperativo);
    const UnidadNegocio           = new unidadNegocioService(graph, ch.hostname, ch.sitePath, lists.UnidadNegocio);
    const OrigenSeleccion         = new OrigenSeleccionService(graph, ch.hostname, ch.sitePath, lists.OrigenSeleccion);
    const TipoContrato            = new TipoContratoService(graph, ch.hostname, ch.sitePath, lists.TipoContrato);
    const TipoVacante             = new TipoVacanteService(graph, ch.hostname, ch.sitePath, lists.TipoVacante)
    const DeptosYMunicipios       = new DeptosYMunicipiosService(graph, ch.hostname, ch.sitePath, lists.DeptosYMunicipios)
    const Envios                  = new EnviosService(graph, ch.hostname, ch.sitePath, lists.Envios);
    const PasosPromocion          = new PasosPromocionService(graph, ch.hostname, ch.sitePath, lists.PasosPromocion);
    const DetallesPasosPromocion  = new DetallesPasosPromocionService(graph, ch.hostname, ch.sitePath, lists.DetallesPasosPromocion);
    const ColaboradoresEDM        = new ColaboradoresEDMService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresEDM);
    const ColaboradoresDH         = new ColaboradoresDHService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresDH)

    return {
      graph,
        
      //CH
      HabeasData, Usuarios, Perfiles, Contratos, Promociones, Empresa, tipoDocumento, cargo, modalidadTrabajo, especificidadCargo, NivelCargo, CentroCostos, CentroOperativo, UnidadNegocio,
      OrigenSeleccion, TipoContrato, TipoVacante, DeptosYMunicipios, Envios, PasosPromocion, DetallesPasosPromocion, ColaboradoresEDM, ColaboradoresDH
      
      // TEST

    };
  }, [graph, cfg]);

  return (
    <GraphServicesContext.Provider value={services}>
      {children}
    </GraphServicesContext.Provider>
  );
};

/* ================== Hook de consumo ================== */
export function useGraphServices(): GraphServices {
  const ctx = React.useContext(GraphServicesContext);
  if (!ctx) throw new Error("useGraphServices debe usarse dentro de <GraphServicesProvider>.");
  return ctx;
}
