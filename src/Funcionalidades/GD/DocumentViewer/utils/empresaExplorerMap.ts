import type { EmpresaKey, PathsState } from "../../../../models/DocumentViewer";
import type { ColaboradoresBrokenService, ColaboradoresDenimService, ColaboradoresDHService, ColaboradoresEDMService, ColaboradoresMetaService, ColaboradoresVisualService } from "../../../../Services/Bibliotecas.service";


type GraphServices = {
  ColaboradoresEDM: ColaboradoresEDMService;
  ColaboradoresDH: ColaboradoresDHService;
  ColaboradoresDenim: ColaboradoresDenimService;
  ColaboradoresVisual: ColaboradoresVisualService;
  ColaboradoresMeta: ColaboradoresMetaService;
  ColaboradoresBroken: ColaboradoresBrokenService;
};

export function buildExplorerServiceMap(services: GraphServices) {
  return {
    estudio: services.ColaboradoresEDM,
    dh: services.ColaboradoresDH,
    denim: services.ColaboradoresDenim,
    visual: services.ColaboradoresVisual,
    meta: services.ColaboradoresMeta,
    broken: services.ColaboradoresBroken,
  };
}

export function getCurrentPath(paths: PathsState, empresa: EmpresaKey): string {
  return paths[empresa] ?? "";
}