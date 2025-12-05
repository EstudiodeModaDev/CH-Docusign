export const esc = (s: string) => String(s).replace(/'/g, "''");

export const norm = (s?: string) => {
  const base = (s ?? '').normalize('NFD').toLowerCase().trim();
  try {
    return base.replace(/\p{Diacritic}/gu, '');
  } catch {
    // Fallback: elimina marcas combinantes (Mn)
    return base.replace(/[\u0300-\u036f]/g, '');
  }
}