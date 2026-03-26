import type { useGraphServices } from "../../graph/graphContext";
import type { CommonRegister } from "../../models/Commons";
import type { solicitud } from "../../models/solicitudCambio";
import { convertToCommonDTO } from "./parseOptions";

export type Modulo = "Cesacion" | "Contratacion" | "Promocion" | "Retail" | "Habeas";

export const isModulo = (value: string): value is Modulo => {
  return ["Cesacion", "Contratacion", "Promocion", "Retail", "Habeas"].includes(value);
};

export const getServiceByModulo = (modulo: Modulo, graph: ReturnType<typeof useGraphServices>) => {
  switch (modulo) {
    case "Contratacion":
      return graph.Contratos;
    case "Cesacion":
      return graph.Cesaciones;
    case "Promocion":
      return graph.Promociones;
    case "Retail":
      return graph.Retail;
    case "Habeas":
      return graph.HabeasData;
    default:
      return null;
  }
};

export const getRegistroReal = async (solicitud: solicitud, graph: ReturnType<typeof useGraphServices>): Promise<CommonRegister | null> => {
  if(!isModulo(solicitud.Title)) return null
  
  const service = getServiceByModulo(solicitud.Title, graph);
 
  if (!service) return null;

  const result = await service.get(solicitud.IdRegistro);
  const mappedResult = convertToCommonDTO(result)

  return mappedResult;
};