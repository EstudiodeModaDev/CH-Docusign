import type { HabeasData } from "../../../../models/HabeasData";
import { normalize,} from "../../../../utils/Date";

const fields: (keyof HabeasData)[] = [
  "Title", "AbreviacionTipoDoc", "Ciudad", "Correo", "Empresa", "NumeroDocumento", "Tipodoc",
];

export function buildHabeasPatch(original: HabeasData, next: HabeasData) {
  const patch: Record<string, any> = {};

  for (const k of fields) {
    const a = normalize(original[k]);
    const b = normalize(next[k]);
    if (a !== b) patch[k] = b;
  }

  return patch;
}