import type { GraphRest } from "../../graph/graphRest";
import type { detalleRequisicion, } from "../../models/Requisiciones/pasos";
import { BaseSharePointListService } from "../base.service";

export class DetalleRequisicionService extends BaseSharePointListService<detalleRequisicion> {
  constructor(graph: GraphRest) {
    super(
      graph,
      "estudiodemoda.sharepoint.com",
      "/sites/TransformacionDigital/IN/CH",
      "Requisicion - Detalles Requisicion"
    );
  }

  protected toModel(item: any): detalleRequisicion {
    const f = item?.fields ?? {};

    console.log(f)

    return {
      Id: String(item?.id ?? ""),
      Title: f.Title,
      CompletadoPor: f.CompletadoPor,
      Estado: f.Estado,
      FechaCompletadoPor: f.FechaCompletadoPor,
      Notas: f.Notas,
      IdRequisicion: f.IdRequisicion
    };
  }
}
