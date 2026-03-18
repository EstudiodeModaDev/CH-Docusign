import type { cargoCiudadAnalista } from "../../../../models/requisiciones";


export function buildEditCargoCiudadAnalistaPayload(original: cargoCiudadAnalista, draft: cargoCiudadAnalista): cargoCiudadAnalista {
  return {
    Cargo: original.Cargo !== draft.Cargo ? draft.Cargo : original.Cargo,
    Ciudad: original.Ciudad !== draft.Ciudad ? draft.Ciudad : original.Ciudad,
    nombreAnalista: original.nombreAnalista !== draft.nombreAnalista ? draft.nombreAnalista : original.nombreAnalista,
    Title: draft.Title ?? original.Title ?? "",
  };
}