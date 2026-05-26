export type SiteConfig = {
  hostname: string;
  sitePath: string;
};

export type UnifiedConfig = {
  ch: SiteConfig;
  test: SiteConfig;
  helpDesk: SiteConfig;
  lists: {
    HabeasData: string;
    Contratos: string;
    PasosNovedades: string;
    DetallesPasosNovedad: string;
    Promociones: string;
    PasosPromocion: string;
    DetallesPasosPromocion: string;
    Cesaciones: string;
    PasosCesacion: string;
    DetallesPasosCesacion: string;
    Retail: string;
    pasosRetail: string;
    detallesPasosRetail: string;
    DeptosYMunicipios: string;
    Maestros: string;
    salarios: string;
    categorias: string;
    configuraciones: string;
    Usuarios: string;
    Perfiles: string;
    MatrizPermisos: string;
    Envios: string;
    ColaboradoresEDM: string;
    ColaboradoresDH: string;
    ColaboradoresDenim: string;
    ColaboradoresVisual: string;
    ColaboradoresMeta: string;
    ColaboradoresBroken: string;
    PazSalvos: string;
    PermisosPaz: string;
    renovar: string;
    Firma: string;
    Respuesta: string;
    tickets: string;
    log: string;
    ansRequisicion: string;
    cargoCiudadAnalista: string;
    maestroMotivos: string;
    moverANS: string;
    pasoRestriccion: string;
    solicitud: string;
    detalle: string;
    controlRevisionCarpetas: string;
    historialRevisionCarpetas: string;
  };
};

export const DEFAULT_CONFIG: UnifiedConfig = {
  ch: {
    hostname: "estudiodemoda.sharepoint.com",
    sitePath: "/sites/TransformacionDigital/IN/CH",
  },
  test: {
    hostname: "estudiodemoda.sharepoint.com",
    sitePath: "/sites/TransformacionDigital/IN/Test",
  },
  helpDesk: {
    hostname: "estudiodemoda.sharepoint.com",
    sitePath: "/sites/TransformacionDigital/IN/HD",
  },
  lists: {
    HabeasData: "Habeas Data",
    Contratos: "Novedades - Novedades Administrativas",
    PasosNovedades: "Novedades - Pasos",
    DetallesPasosNovedad: "Novedades - Detalles Pasos",
    Promociones: "Promocion - Promociones",
    PasosPromocion: "Promocion - Pasos",
    DetallesPasosPromocion: "Promocion - Detalles Pasos",
    Cesaciones: "Cesasion - Cesaciones",
    PasosCesacion: "Cesacion - Pasos",
    DetallesPasosCesacion: "Cesacion - Detalles Pasos",
    Retail: "Retail - Novedades Retail",
    pasosRetail: "Retail - Pasos",
    detallesPasosRetail: "Retail - DetallesPasos",
    Maestros: "Maestros",
    DeptosYMunicipios: "DeptosyMunicipios",
    salarios: "Cargos - Salarios Recomendados",
    categorias: "Cargos - CategoriaCargos",
    configuraciones: "Configuraciones",
    Usuarios: "Permisos Docu",
    Perfiles: "Perfiles Novedades",
    MatrizPermisos: "Permisos - Matriz Funcionamiento",
    Envios: "Envios",
    ColaboradoresEDM: "Colaboradores EDM",
    ColaboradoresDH: "Colaboradores DH",
    ColaboradoresDenim: "Colaboradores DENIM",
    ColaboradoresVisual: "Colaboradores Visual",
    ColaboradoresMeta: "Colaboradores METAGRAPHICS",
    ColaboradoresBroken: "Colaboradores BROKEN",
    PazSalvos: "Paz y salvos",
    PermisosPaz: "Permisos PazSalvos",
    renovar: "Renovar",
    Firma: "Firma",
    Respuesta: "Respuestas",
    tickets: "Tickets",
    log: "Log",
    ansRequisicion: "Requisiciones - ANS",
    cargoCiudadAnalista: "ANS - CargoCiudadAnalista",
    maestroMotivos: "Requisiciones - MaestroMotivos",
    moverANS: "Requisiciones - Historico Fechas",
    pasoRestriccion: "PasoRestriccionProceso",
    solicitud: "Actualizacion - Solicitud Cambio",
    detalle: "Actualizacion - DetalleSolicitud",
    controlRevisionCarpetas: "Carpetas - ControlRevisionCarpetas",
    historialRevisionCarpetas: "Carpetas - HistorialRevisionCarpetas",
  },
};

export function mergeGraphConfig(config?: Partial<UnifiedConfig>): UnifiedConfig {
  const base = DEFAULT_CONFIG;
  const normPath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

  const ch: SiteConfig = {
    hostname: config?.ch?.hostname ?? base.ch.hostname,
    sitePath: normPath(config?.ch?.sitePath ?? base.ch.sitePath),
  };

  const test: SiteConfig = {
    hostname: config?.test?.hostname ?? base.test.hostname,
    sitePath: normPath(config?.test?.sitePath ?? base.test.sitePath),
  };

  const helpDesk: SiteConfig = {
    hostname: config?.helpDesk?.hostname ?? base.helpDesk.hostname,
    sitePath: normPath(config?.helpDesk?.sitePath ?? base.helpDesk.sitePath),
  };

  return {
    ch,
    test,
    helpDesk,
    lists: { ...base.lists, ...(config?.lists ?? {}) },
  };
}
