import type { GraphRest } from "../../graph/graphRest";
import type { pasoRequisicion } from "../../models/Requisiciones/pasos";
import { BaseSharePointListService } from "../base.service";

export class PasosVacantesService extends BaseSharePointListService<pasoRequisicion> {
  constructor(graph: GraphRest) {
    super(
      graph,
      "estudiodemoda.sharepoint.com",
      "/sites/TransformacionDigital/IN/CH",
      "Requisicion - Pasos"
    );
  }

  protected toModel(item: any): pasoRequisicion {
    const f = item?.fields ?? {};

    console.log(f)

    return {
      Id: String(item?.id ?? ""),
      Title: f.Title,
      Activo: Boolean(f.Activo),
      Descripcion: f.Descripcion,
      Obligatorio: Boolean(f.Obligatorio),
      TipoPaso: f.TipoPaso,
      OrdenPaso: Number(f.OrdenPaso ?? f.Orden ?? 0),
    };
  }
}
