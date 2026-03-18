
import type { HabeasData } from "../../../../models/HabeasData";
import { toGraphDateTime } from "../../../../utils/Date";

export function buildHabeasCreatePayload(state: HabeasData): HabeasData {
  return {
    ...state,
    Fechaenlaquesereporta: toGraphDateTime(state.Fechaenlaquesereporta) ?? null,
  };
}