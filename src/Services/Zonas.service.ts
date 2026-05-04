import type { GraphRest } from "../graph/graphRest";
import type { zona } from "../models/zonas";
import { BaseSharePointListService } from "./base.service";

export class ZonasService extends BaseSharePointListService<zona> {
  constructor(graph: GraphRest) {
    super(
      graph,
      "estudiodemoda.sharepoint.com",
      "/sites/TransformacionDigital/IN/CH",
      "General - Zonas"
    );
  }

  protected toModel(item: any): zona {
    const f = item?.fields ?? {};

    return {
      Id: String(item?.id ?? ""),
      Title: f.Title,
    };
  }
}
