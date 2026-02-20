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

export function renderTemplate(template: string, data: Record<string, any>) {
  return (template ?? "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = data[key];
    return (value ?? "").toString();
  });
}

export function safeString(v: any) {
  return (v ?? "").toString();
}

export function parseEmails(raw: string): string[] {
  return (raw ?? "")
    .split(/[;,]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const emailsArray = (emailsStr: string): string[] =>
  emailsStr
    .split(";")
    .map(s => s.trim())
    .filter(Boolean);

export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export const safeLower = (v: unknown) => String(v ?? "").toLocaleLowerCase().trim();