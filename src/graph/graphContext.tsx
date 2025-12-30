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
import { ColaboradoresDenimService, ColaboradoresDHService, ColaboradoresEDMService, ColaboradoresMetaService, ColaboradoresVisualService } from "../Services/Bibliotecas.service";
import { PazSalvosService } from "../Services/PazSalvos.service";
import { PermisosPazSalvosService } from "../Services/PermisosPazSalvos.service";
import { RenovarService } from "../Services/Renovar.service";
import { FirmasService } from "../Services/Firmas.service";
import { RespuestaService } from "../Services/Respuesta.service";
import { NovedadCanceladaService } from "../Services/NovedadCancelada.service";
import { CesacionesService } from "../Services/Cesaciones.service";
import { SalariosService } from "../Services/Salarios.service";
import { PasosCesacionService } from "../Services/PasosCesaciones.service";
import { DetallesPasosCesacionService } from "../Services/DetallesPasosCesacion.service";
import { MailService } from "../Services/Mail.service";
import { PasosNovedadesService } from "../Services/PasosNovedades.service";
import { DetallesPasosNovedadesService } from "../Services/DetallesPasosNovedades.service";

/* ================== Tipos de config ================== */
export type SiteConfig = {
  hostname: string;
  sitePath: string; 
};

export type UnifiedConfig = {
  ch: SiteConfig;    // sitio principal (CH)
  test: SiteConfig;  // sitio de pruebas (Paz y salvos)
  lists: {
    // Habeas Data
    HabeasData: string;

    //Novedades
    Contratos: string;
    NovedadCancelada: string;
    PasosNovedades: string;
    DetallesPasosNovedad: string;

    //Promociones
    Promociones: string;
    PasosPromocion: string;
    DetallesPasosPromocion: string

    //Cesaciones
    Cesaciones: string
    PasosCesacion: string
    DetallesPasosCesacion: string;

    //Desplegables
    DeptosYMunicipios: string;
    Maestros: string;
    salarios: string;

    //Seguridad
    Usuarios: string;
    Perfiles: string;

    //Envios
    Envios: string;

    //Bibliotecas
    ColaboradoresEDM: string;
    ColaboradoresDH: string;
    ColaboradoresDenim: string;
    ColaboradoresVisual: string;
    ColaboradoresMeta: string

    // Paz Salvos
    PazSalvos: string;
    PermisosPaz: string;
    renovar: string;
    Firma: string;
    Respuesta: string;
    
  };
};

/* ================== Tipos del contexto ================== */
export type GraphServices = {
  graph: GraphRest;

  // Habeas
  HabeasData: HabeasDataService;

  //Novedades
  Contratos: ContratosService;
  NovedadCancelada: NovedadCanceladaService,
  PasosNovedades: PasosNovedadesService,
  DetallesPasosNovedades: DetallesPasosNovedadesService,

  //Promociones
  Promociones: PromocionesService
  PasosPromocion: PasosPromocionService;
  DetallesPasosPromocion: DetallesPasosPromocionService

  //Cesaciones
  Cesaciones: CesacionesService
  PasosCesacion: PasosCesacionService
  DetallesPasosCesacion: DetallesPasosCesacionService

  //Desplegables
  Maestro: MaestrosService
  DeptosYMunicipios: DeptosYMunicipiosService;
  salarios: SalariosService

  // Seguridad
  Usuarios: UsuariosSPService;
  Perfiles: PerfilesService;

  //Envios
  Envios: EnviosService;

  //Envio correo
  mail: MailService

  //Bibliotecas
  ColaboradoresEDM: ColaboradoresEDMService,
  ColaboradoresDH: ColaboradoresDHService,
  ColaboradoresDenim: ColaboradoresDenimService,
  ColaboradoresVisual: ColaboradoresVisualService
  ColaboradoresMeta: ColaboradoresMetaService

  // Paz Salvos
  PazSalvos: PazSalvosService;
  PermisosPaz: PermisosPazSalvosService;
  Renovar: RenovarService;
  Firmas: FirmasService;
  Respuesta: RespuestaService

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
    // Habeas Data
    HabeasData: "Habeas Data",

    //Novedades
    Contratos: "Novedades - Novedades Administrativas",
    NovedadCancelada: "Novedades - Novedades Canceladas",
    PasosNovedades: "Novedades - Pasos",
    DetallesPasosNovedad: "Novedades - Detalles Pasos",

    //Promociones
    Promociones: "Promocion - Promociones",
    PasosPromocion: "Promocion - Pasos",
    DetallesPasosPromocion: "Promocion - Detalles Pasos",

    //Cesaciones
    Cesaciones: "Cesasion - Cesaciones",
    PasosCesacion: "Cesacion - Pasos",
    DetallesPasosCesacion: "Cesacion - Detalles Pasos",

    //Desplegables
    Maestros: "Maestros",
    DeptosYMunicipios: "DeptosyMunicipios",
    salarios: "Cargos - Salarios Recomendados",

    //Seguridad
    Usuarios: "Permisos Docu",
    Perfiles: "Perfiles Novedades",

    //Envios
    Envios: "Envios",

    //Bibliotecas
    ColaboradoresEDM: "Colaboradores EDM",
    ColaboradoresDH: "Colaboradores DH",
    ColaboradoresDenim: "Colaboradores DENIM",
    ColaboradoresVisual: "Colaboradores Visual",
    ColaboradoresMeta: "Colaboradores METAGRAPHICS",

    // Paz y salvos
    PazSalvos: "Paz y salvos",
    PermisosPaz: "Permisos PazSalvos",
    renovar: "Renovar",
    Firma: "Firma",
    Respuesta: "Respuestas",
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

    // Habeas Data
    const HabeasData              = new HabeasDataService(graph, ch.hostname,  ch.sitePath,  lists.HabeasData);

    //Novedades
    const Contratos               = new ContratosService(graph, ch.hostname, ch.sitePath, lists.Contratos)
    const NovedadCancelada        = new NovedadCanceladaService(graph, ch.hostname, ch.sitePath, lists.NovedadCancelada)
    const PasosNovedades          = new PasosNovedadesService(graph, ch.hostname, ch.sitePath, lists.PasosNovedades)
    const DetallesPasosNovedades  = new DetallesPasosNovedadesService(graph, ch.hostname, ch.sitePath, lists.DetallesPasosNovedad)

    //Promociones
    const Promociones             = new PromocionesService(graph, ch.hostname, ch.sitePath, lists.Promociones);
    const PasosPromocion          = new PasosPromocionService(graph, ch.hostname, ch.sitePath, lists.PasosPromocion);
    const DetallesPasosPromocion  = new DetallesPasosPromocionService(graph, ch.hostname, ch.sitePath, lists.DetallesPasosPromocion);

    //Cesaciones
    const Cesaciones              = new CesacionesService(graph, ch.hostname, ch.sitePath, lists.Cesaciones)
    const PasosCesacion           = new PasosCesacionService(graph, ch.hostname, ch.sitePath, lists.PasosCesacion)
    const DetallesPasosCesacion   = new DetallesPasosCesacionService(graph, ch.hostname, ch.sitePath, lists.DetallesPasosCesacion)

    //Desplegables
    const Maestro                 = new MaestrosService(graph, ch.hostname, ch.sitePath, lists.Maestros)
    const DeptosYMunicipios       = new DeptosYMunicipiosService(graph, ch.hostname, ch.sitePath, lists.DeptosYMunicipios)
    const salarios                = new SalariosService(graph, ch.hostname, ch.sitePath, lists.salarios)

    //Seguridad
    const Usuarios                = new UsuariosSPService(graph, ch.hostname, ch.sitePath, lists.Usuarios);
    const Perfiles                = new PerfilesService(graph, ch.hostname, ch.sitePath, lists.Perfiles);
    
    //Envios
    const Envios                  = new EnviosService(graph, ch.hostname, ch.sitePath, lists.Envios);

    //Enviar correo
    const mail                    = new MailService(graph)

    //Bibliotecas
    const ColaboradoresEDM        = new ColaboradoresEDMService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresEDM);
    const ColaboradoresDH         = new ColaboradoresDHService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresDH);
    const ColaboradoresDenim      = new ColaboradoresDenimService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresDenim)
    const ColaboradoresVisual     = new ColaboradoresVisualService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresVisual);
    const ColaboradoresMeta       = new ColaboradoresMetaService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresMeta)
    
    //Paz y salvos
    const PazSalvos               = new PazSalvosService(graph, ch.hostname, ch.sitePath, lists.PazSalvos);
    const PermisosPaz             = new PermisosPazSalvosService(graph, ch.hostname, ch.sitePath, lists.PermisosPaz);
    const Renovar                 = new RenovarService(graph, ch.hostname, ch.sitePath, lists.renovar);  
    const Firmas                  = new FirmasService (graph, ch.hostname, ch.sitePath, lists.Firma); 
    const Respuesta               = new RespuestaService(graph, ch.hostname, ch.sitePath, lists.Respuesta)
    return {
      graph,
      //Habeas
      HabeasData, 
      //Novedades
      Contratos, NovedadCancelada, PasosNovedades, DetallesPasosNovedades,
      //Promociones
      Promociones, PasosPromocion, DetallesPasosPromocion,
      //Cesaciones
      Cesaciones, PasosCesacion, DetallesPasosCesacion,
      //Desplegables
      Maestro, DeptosYMunicipios, salarios,
      //Seguridad
      Usuarios, Perfiles,
      //Envios
      Envios,
      //Enviar Correo
      mail,
      //Bibliotecas
      ColaboradoresEDM, ColaboradoresDH, ColaboradoresDenim, ColaboradoresVisual, ColaboradoresMeta,
      //paz salvos
      PazSalvos, PermisosPaz, Renovar, Firmas, Respuesta
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
