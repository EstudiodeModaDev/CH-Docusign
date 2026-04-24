import type { ansRequisicion } from "../../../../models/requisiciones";

export function buildEditANSPayload(original: ansRequisicion, draft: ansRequisicion): ansRequisicion {
  return {
    AplicaVDPNuevo:
      original.AplicaVDPNuevo !== draft.AplicaVDPNuevo
        ? draft.AplicaVDPNuevo //Si cambio
        : original.AplicaVDPNuevo, //Si no cambio

    AplicaVDPPromocion:
      original.AplicaVDPPromocion !== draft.AplicaVDPPromocion
        ? draft.AplicaVDPPromocion
        : original.AplicaVDPPromocion,

    NivelCargo: original.NivelCargo !== draft.NivelCargo ? draft.NivelCargo : original.NivelCargo,

    diasHabiles0:
      Number(original.diasHabiles0) !== Number(draft.diasHabiles0)
        ? Number(draft.diasHabiles0)
        : Number(original.diasHabiles0),

    Title: draft.Title ?? original.Title ?? "",
  };
}