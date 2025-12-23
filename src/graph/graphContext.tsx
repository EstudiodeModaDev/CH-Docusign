import * as React from "react";
import { useAuth } from "../auth/authProvider";
import { GraphRest } from "./graphRest";
import { HabeasDataService } from "../Services/HabeasData.service";
import { UsuariosSPService } from "../Services/Usuarios.service";
import { PerfilesService } from "../Services/Perfiles.service";
import { ContratosService } from "../Services/Contratos.service";
import { PromocionesService } from "../Services/Promociones.service";
import { MaestrosService } from "../Services/Maestros.service";
import { DeptosYMunicipiosService } from "../Services/DeptosYMunicipios.service";
import { EnviosService } from "../Services/Envios.service";
import { PasosPromocionService } from "../Services/PasosPromocion.service";
import { DetallesPasosPromocionService } from "../Services/DetallesPasosPromocion.service";
import { ColaboradoresDenimService, ColaboradoresDHService, ColaboradoresEDMService, ColaboradoresVisualService } from "../Services/Bibliotecas.service";
import { PazSalvosService } from "../Services/PazSalvos.service";
import { PermisosPazSalvosService } from "../Services/PermisosPazSalvos.service";
import { RenovarService } from "../Services/Renovar.service";
import { FirmasService } from "../Services/Firmas.service";
import { RespuestaService } from "../Services/Respuesta.service";
import { NovedadCanceladaService } from "../Services/NovedadCancelada.service";

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
    DeptosYMunicipios: string;
    Maestros: string;
    Envios: string;
    PasosPromocion: string;
    DetallesPasosPromocion: string
    ColaboradoresEDM: string;
    ColaboradoresDH: string;
    ColaboradoresDenim: string;
    ColaboradoresVisual: string
    NovedadCancelada: string;

    // Paz Salvos
    PazSalvos: string;
    PermisosPaz: string;
    renovar: string;
    Firma: string;
    Respuesta: string;
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
  Maestro: MaestrosService
  DeptosYMunicipios: DeptosYMunicipiosService;
  Envios: EnviosService;
  PasosPromocion: PasosPromocionService;
  DetallesPasosPromocion: DetallesPasosPromocionService
  ColaboradoresEDM: ColaboradoresEDMService,
  ColaboradoresDH: ColaboradoresDHService,
  ColaboradoresDenim: ColaboradoresDenimService,
  ColaboradoresVisual: ColaboradoresVisualService
  NovedadCancelada: NovedadCanceladaService,

  // Paz Salvos
  PazSalvos: PazSalvosService;
  PermisosPaz: PermisosPazSalvosService;
  Renovar: RenovarService;
  Firmas: FirmasService;
  Respuesta: RespuestaService
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
    Promociones: "Promocion - Promociones",
    Maestros: "Maestros",
    DeptosYMunicipios: "DeptosyMunicipios",
    Envios: "Envios",
    PasosPromocion: "Promocion - Pasos",
    DetallesPasosPromocion: "Promocion - Detalles Pasos",
    NovedadCancelada: "Novedades Canceladas",

    // Renovar
    PazSalvos: "Paz y salvos",
    PermisosPaz: "Permisos PazSalvos",
    renovar: "Renovar",
    Firma: "Firma",
    Respuesta: "Respuestas",

    //Bibliotecas de documentos
    ColaboradoresEDM: "Colaboradores EDM",
    ColaboradoresDH: "Colaboradores DH",
    ColaboradoresDenim: "Colaboradores DENIM",
    ColaboradoresVisual: "Colaboradores Visual"
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
    const Maestro                 = new MaestrosService(graph, ch.hostname, ch.sitePath, lists.Maestros)
    const DeptosYMunicipios       = new DeptosYMunicipiosService(graph, ch.hostname, ch.sitePath, lists.DeptosYMunicipios)
    const Envios                  = new EnviosService(graph, ch.hostname, ch.sitePath, lists.Envios);
    const PasosPromocion          = new PasosPromocionService(graph, ch.hostname, ch.sitePath, lists.PasosPromocion);
    const DetallesPasosPromocion  = new DetallesPasosPromocionService(graph, ch.hostname, ch.sitePath, lists.DetallesPasosPromocion);
    const ColaboradoresEDM        = new ColaboradoresEDMService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresEDM);
    const ColaboradoresDH         = new ColaboradoresDHService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresDH);
    const PazSalvos               = new PazSalvosService(graph, ch.hostname, ch.sitePath, lists.PazSalvos);
    const PermisosPaz             = new PermisosPazSalvosService(graph, ch.hostname, ch.sitePath, lists.PermisosPaz);
    const Renovar                 = new RenovarService(graph, ch.hostname, ch.sitePath, lists.renovar);  
    const Firmas                  = new FirmasService (graph, ch.hostname, ch.sitePath, lists.Firma); 
    const Respuesta               = new RespuestaService(graph, ch.hostname, ch.sitePath, lists.Respuesta)
    const NovedadCancelada        = new NovedadCanceladaService(graph, ch.hostname, ch.sitePath, lists.NovedadCancelada)
    const ColaboradoresDenim      = new ColaboradoresDenimService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresDenim)
    const ColaboradoresVisual     = new ColaboradoresVisualService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresVisual)

    return {
      graph,
        
      //CH
      HabeasData, Usuarios, Perfiles, Contratos, Promociones, Maestro, DeptosYMunicipios, Envios, PasosPromocion, DetallesPasosPromocion, ColaboradoresEDM, ColaboradoresDH, ColaboradoresDenim, NovedadCancelada, ColaboradoresVisual,

      //paz salvos
      PazSalvos, PermisosPaz, Renovar, Firmas, Respuesta
      
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
