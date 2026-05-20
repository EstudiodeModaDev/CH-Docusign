import type { ansRequisicion, ansRequisionErrors } from "../../../../models/Requisiciones/requisiciones";

export const createDefaultANSState = (): ansRequisicion => ({
  AplicaVDPNuevo: false,
  AplicaVDPPromocion: false,
  NivelCargo: "",
  diasHabiles0: 0,
  Title: "",
});

export const createDefaultANSErrors = (): ansRequisionErrors => ({});