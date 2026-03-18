import type { Archivo } from "../../../../models/archivos";
import { parseDateFlex } from "../../../../utils/Date";

export type OrganizacionType = "asc" | "desc";

export function filterItems(items: Archivo[], search: string): Archivo[] {
  if (!search.trim()) return items;
  const term = search.toLowerCase();
  return items.filter(i => i.name.toLowerCase().includes(term));
}

export function getArchivoTime(item: Archivo): number {
  const d = parseDateFlex(item.lastModified ?? "");
  return d ? d.getTime() : 0;
}

export function sortItems(items: Archivo[], organizacion: OrganizacionType): Archivo[] {
  return [...items].sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;

    if (organizacion === "asc") {
      return getArchivoTime(a) - getArchivoTime(b);
    }

    return getArchivoTime(b) - getArchivoTime(a);
  });
}

export function buildVisibleItems(items: Archivo[], search: string, organizacion: OrganizacionType): Archivo[] {
  const filtered = filterItems(items, search);
  return sortItems(filtered, organizacion);
}