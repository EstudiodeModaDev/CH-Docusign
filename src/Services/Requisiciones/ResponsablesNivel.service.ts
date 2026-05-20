import type { GraphRest } from "../../graph/graphRest";
import type { responsablesNivel, } from "../../models/Requisiciones/responsablesZonas";
import { BaseSharePointListService } from "../base.service";

export class ResponsablesNivelService extends BaseSharePointListService<responsablesNivel> {
  constructor(graph: GraphRest) {
    super(
      graph,
      "estudiodemoda.sharepoint.com",
      "/sites/TransformacionDigital/IN/CH",
      "Responsables - NivelCargo"
    );
  }

  protected toModel(item: any): responsablesNivel {
    const f = item?.fields ?? {};

    return {
      Id: String(item?.id ?? ""),
      Title: f.Title,
      correoResponsable: f.correoResponsable,
      NivelCargo: f.NivelCargo,
    };
  }
}
