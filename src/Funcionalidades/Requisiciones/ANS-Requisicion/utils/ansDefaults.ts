import type { ansRequisicion, ansRequisionErrors } from "../../../../models/requisiciones";

export const createDefaultANSState = (): ansRequisicion => ({
  AplicaVDPNuevo: false,
  AplicaVDPPromocion: false,
  Cargo: "",
  diasHabiles0: 0,
  Title: "",
});

export const createDefaultANSErrors = (): ansRequisionErrors => ({});