import { GraphRest } from "./graphRest";
import type { UnifiedConfig } from "./graphConfig";
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
import {
  ColaboradoresBrokenService,
  ColaboradoresDenimService,
  ColaboradoresDHService,
  ColaboradoresEDMService,
  ColaboradoresMetaService,
  ColaboradoresVisualService,
} from "../Services/Bibliotecas.service";
import { PazSalvosService } from "../Services/PazSalvos.service";
import { PermisosPazSalvosService } from "../Services/PermisosPazSalvos.service";
import { RenovarService } from "../Services/Renovar.service";
import { FirmasService } from "../Services/Firmas.service";
import { RespuestaService } from "../Services/Respuesta.service";
import { CesacionesService } from "../Services/Cesaciones.service";
import { SalariosService } from "../Services/Salarios.service";
import { PasosCesacionService } from "../Services/PasosCesaciones.service";
import { DetallesPasosCesacionService } from "../Services/DetallesPasosCesacion.service";
import { MailService } from "../Services/Mail.service";
import { PasosNovedadesService } from "../Services/PasosNovedades.service";
import { DetallesPasosNovedadesService } from "../Services/DetallesPasosNovedades.service";
import { CategoriaCargosService } from "../Services/CategoriaCargos.service";
import { RetailService } from "../Services/Retail.service";
import { PasosRetailService } from "../Services/PasosRetail.service";
import { DetallesPasosRetail } from "../Services/DetallesPasosRetail.service";
import { TicketsService } from "../Services/Tickets.service";
import { LogService } from "../Services/Log.service";
import { ConfiguracionesService } from "../Services/Configuraciones.service";
import { MatrizPermisosService } from "../Services/MatrizPermisos.service";
import { AnsRequisicionService } from "../Services/Ans.service";
import { cargoCiudadAnalistaService } from "../Services/cargoCiudadAnalista.service";
import { maestroMotivosService } from "../Services/maestroMotivos.service";
import { MoverANSService } from "../Services/moverAns.service";
import { pasoRestriccionProcesoService } from "../Services/PasoRestriccionProceso.Service";
import { solicitudService } from "../Services/Solicitud.service";
import { solicitudDetalleService } from "../Services/SolicitudDetalle.service";
import { ControlRevisionCarpetasService } from "../Services/ControlRevisionCarpetas.service";
import { HistorialRevisionCarpetasService } from "../Services/HistorialRevisionCarpetas.service";
import { PlantaIdealService } from "../Services/Requisiciones/PlantaIdeal.service";
import { ZonasService } from "../Services/Zonas.service";
import { ResponsablesZonasService } from "../Services/Requisiciones/ResponsablesZonas.service";
import { ResponsablesNivelService } from "../Services/Requisiciones/ResponsablesNivel.service";
import { PasosVacantesService } from "../Services/Requisiciones/PasosVacante.service";
import { DetalleRequisicionService } from "../Services/Requisiciones/detalleRequisicion.service";
import { RequisicionesService } from "../Services/Requisiciones/Requisiciones.service";

export type CoreServices = {
  graph: GraphRest;
  mail: MailService;
  Maestro: MaestrosService;
  DeptosYMunicipios: DeptosYMunicipiosService;
  salarios: SalariosService;
  categorias: CategoriaCargosService;
  configuraciones: ConfiguracionesService;
  Usuarios: UsuariosSPService;
  Perfiles: PerfilesService;
  MatrizPermisos: MatrizPermisosService;
};

export type GestorServices = {
  HabeasData: HabeasDataService;
  Contratos: ContratosService;
  PasosNovedades: PasosNovedadesService;
  DetallesPasosNovedades: DetallesPasosNovedadesService;
  Promociones: PromocionesService;
  PasosPromocion: PasosPromocionService;
  DetallesPasosPromocion: DetallesPasosPromocionService;
  Cesaciones: CesacionesService;
  PasosCesacion: PasosCesacionService;
  DetallesPasosCesacion: DetallesPasosCesacionService;
  Retail: RetailService;
  pasosRetail: PasosRetailService;
  detallesPasosRetail: DetallesPasosRetail;
  pasoRestriccion: pasoRestriccionProcesoService;  
  Envios: EnviosService;
  ColaboradoresEDM: ColaboradoresEDMService;
  ColaboradoresDH: ColaboradoresDHService;
  ColaboradoresDenim: ColaboradoresDenimService;
  ColaboradoresVisual: ColaboradoresVisualService;
  ColaboradoresMeta: ColaboradoresMetaService;
  ColaboradoresBroken: ColaboradoresBrokenService;
  Tickets: TicketsService;
  log: LogService;
  solicitud: solicitudService;
  detalle: solicitudDetalleService;
  controlRevisionCarpetas: ControlRevisionCarpetasService;
  historialRevisionCarpetas: HistorialRevisionCarpetasService;
};

export type PazSalvoServices = {
  PazSalvos: PazSalvosService;
  PermisosPaz: PermisosPazSalvosService;
  Renovar: RenovarService;
  Firmas: FirmasService;
  Respuesta: RespuestaService;
};

export type RequisicionesServices = {
  requisiciones: RequisicionesService;
  ansRequisicion: AnsRequisicionService;
  cargoCiudadAnalista: cargoCiudadAnalistaService;
  maestrosMotivos: maestroMotivosService;
  moverANS: MoverANSService;
  pasosVacante: PasosVacantesService
  plantaIdeal: PlantaIdealService;
  zona: ZonasService;
  responsableZonas: ResponsablesZonasService;
  responsablesNivel: ResponsablesNivelService;
  detalleRequisicion: DetalleRequisicionService
};

export type GraphServices = CoreServices & GestorServices & PazSalvoServices & RequisicionesServices;

export type GraphDomainBundle = {
  core: CoreServices;
  gestor: GestorServices;
  pazSalvo: PazSalvoServices;
  requisiciones: RequisicionesServices;
  all: GraphServices;
};

export function buildGraphDomainServices(cfg: UnifiedConfig, graph: GraphRest): GraphDomainBundle {
  const { ch, lists, helpDesk } = cfg;

  const core: CoreServices = {
    graph,
    mail: new MailService(graph),
    Maestro: new MaestrosService(graph, ch.hostname, ch.sitePath, lists.Maestros),
    DeptosYMunicipios: new DeptosYMunicipiosService(graph, ch.hostname, ch.sitePath, lists.DeptosYMunicipios),
    salarios: new SalariosService(graph, ch.hostname, ch.sitePath, lists.salarios),
    categorias: new CategoriaCargosService(graph, ch.hostname, ch.sitePath, lists.categorias),
    configuraciones: new ConfiguracionesService(graph, ch.hostname, ch.sitePath, lists.configuraciones),
    Usuarios: new UsuariosSPService(graph, ch.hostname, ch.sitePath, lists.Usuarios),
    Perfiles: new PerfilesService(graph, ch.hostname, ch.sitePath, lists.Perfiles),
    MatrizPermisos: new MatrizPermisosService(graph, ch.hostname, ch.sitePath, lists.MatrizPermisos),
  };

  const gestor: GestorServices = {
    HabeasData: new HabeasDataService(graph, ch.hostname, ch.sitePath, lists.HabeasData),
    Contratos: new ContratosService(graph, ch.hostname, ch.sitePath, lists.Contratos),
    PasosNovedades: new PasosNovedadesService(graph, ch.hostname, ch.sitePath, lists.PasosNovedades),
    DetallesPasosNovedades: new DetallesPasosNovedadesService(graph, ch.hostname, ch.sitePath, lists.DetallesPasosNovedad),
    Promociones: new PromocionesService(graph, ch.hostname, ch.sitePath, lists.Promociones),
    PasosPromocion: new PasosPromocionService(graph, ch.hostname, ch.sitePath, lists.PasosPromocion),
    DetallesPasosPromocion: new DetallesPasosPromocionService(graph, ch.hostname, ch.sitePath, lists.DetallesPasosPromocion),
    Cesaciones: new CesacionesService(graph, ch.hostname, ch.sitePath, lists.Cesaciones),
    PasosCesacion: new PasosCesacionService(graph, ch.hostname, ch.sitePath, lists.PasosCesacion),
    DetallesPasosCesacion: new DetallesPasosCesacionService(graph, ch.hostname, ch.sitePath, lists.DetallesPasosCesacion),
    Retail: new RetailService(graph, ch.hostname, ch.sitePath, lists.Retail),
    pasosRetail: new PasosRetailService(graph, ch.hostname, ch.sitePath, lists.pasosRetail),
    detallesPasosRetail: new DetallesPasosRetail(graph, ch.hostname, ch.sitePath, lists.detallesPasosRetail),
    Envios: new EnviosService(graph, ch.hostname, ch.sitePath, lists.Envios),
    ColaboradoresEDM: new ColaboradoresEDMService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresEDM),
    ColaboradoresDH: new ColaboradoresDHService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresDH),
    ColaboradoresDenim: new ColaboradoresDenimService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresDenim),
    ColaboradoresVisual: new ColaboradoresVisualService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresVisual),
    ColaboradoresMeta: new ColaboradoresMetaService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresMeta),
    ColaboradoresBroken: new ColaboradoresBrokenService(graph, ch.hostname, ch.sitePath, lists.ColaboradoresBroken),
    Tickets: new TicketsService(graph, helpDesk.hostname, helpDesk.sitePath, lists.tickets),
    log: new LogService(graph, helpDesk.hostname, helpDesk.sitePath, lists.log),
    solicitud: new solicitudService(graph, ch.hostname, ch.sitePath, lists.solicitud),
    detalle: new solicitudDetalleService(graph, ch.hostname, ch.sitePath, lists.detalle),
    controlRevisionCarpetas: new ControlRevisionCarpetasService(graph, ch.hostname, ch.sitePath, lists.controlRevisionCarpetas),
    historialRevisionCarpetas: new HistorialRevisionCarpetasService(graph, ch.hostname, ch.sitePath, lists.historialRevisionCarpetas),
    pasoRestriccion: new pasoRestriccionProcesoService(graph, ch.hostname, ch.sitePath, lists.pasoRestriccion),
  };

  const pazSalvo: PazSalvoServices = {
    PazSalvos: new PazSalvosService(graph, ch.hostname, ch.sitePath, lists.PazSalvos),
    PermisosPaz: new PermisosPazSalvosService(graph, ch.hostname, ch.sitePath, lists.PermisosPaz),
    Renovar: new RenovarService(graph, ch.hostname, ch.sitePath, lists.renovar),
    Firmas: new FirmasService(graph, ch.hostname, ch.sitePath, lists.Firma),
    Respuesta: new RespuestaService(graph, ch.hostname, ch.sitePath, lists.Respuesta),
  };

  const requisiciones: RequisicionesServices = {
    requisiciones: new RequisicionesService(graph,),
    ansRequisicion: new AnsRequisicionService(graph, ch.hostname, ch.sitePath, lists.ansRequisicion),
    cargoCiudadAnalista: new cargoCiudadAnalistaService(graph, ch.hostname, ch.sitePath, lists.cargoCiudadAnalista),
    maestrosMotivos: new maestroMotivosService(graph, ch.hostname, ch.sitePath, lists.maestroMotivos),
    moverANS: new MoverANSService(graph, ch.hostname, ch.sitePath, lists.moverANS),
    pasosVacante: new PasosVacantesService(graph,),
    plantaIdeal: new PlantaIdealService(graph),
    zona: new ZonasService(graph),
    responsableZonas: new ResponsablesZonasService(graph),
    responsablesNivel: new ResponsablesNivelService(graph),
    detalleRequisicion: new DetalleRequisicionService(graph)
  };

  const all: GraphServices = {
    ...core,
    ...gestor,
    ...pazSalvo,
    ...requisiciones,
  };

  return { core, gestor, pazSalvo, requisiciones, all };
}
