import type { cargoCiudadAnalista, cargoCiudadAnalistaErrors } from "../../../../models/requisiciones";

export const createDefaultCargoCiudadAnalistaState = (): cargoCiudadAnalista => ({
  Cargo: "",
  Ciudad: "",
  nombreAnalista: "",
  Title: "",
});

export const createDefaultCargoCiudadAnalistaErrors = (): cargoCiudadAnalistaErrors => ({});