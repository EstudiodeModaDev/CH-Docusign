import type { SortDir, SortField } from "../../models/Commons";
import type { EnvioSort } from "../GD/Envios/utils/enviosSorts";


export function resolveNextSort(prev: {field: string, dir: SortDir}[], field: SortField, additive = false): EnvioSort[] {
  const idx = prev.findIndex((s) => s.field === field);

  if (!additive) {
    if (idx >= 0) {
      const dir: SortDir = prev[idx].dir === "desc" ? "asc" : "desc";
      return [{ field, dir }];
    }
    return [{ field, dir: "asc" }];
  }

  if (idx >= 0) {
    const copy = [...prev];
    copy[idx] = {
      field,
      dir: copy[idx].dir === "desc" ? "asc" : "desc",
    };
    return copy;
  }

  return [...prev, { field, dir: "asc" }];
}