import type { GraphRest } from "../../graph/graphRest";
import type { resposableZonas } from "../../models/Requisiciones/responsablesZonas";
import { BaseSharePointListService } from "../base.service";

export class ResponsablesZonasService extends BaseSharePointListService<resposableZonas> {
  constructor(graph: GraphRest) {
    super(
      graph,
      "estudiodemoda.sharepoint.com",
      "/sites/TransformacionDigital/IN/CH",
      "Requisiciones - Responsables Zonas"
    );
  }

  protected toModel(item: any): resposableZonas {
    const f = item?.fields ?? {};

    return {
      Id: String(item?.id ?? ""),
      Title: f.Title,
      correoResponsable: f.correoResponsable,
      zonaId: f.zonaId,
    };
  }
}
