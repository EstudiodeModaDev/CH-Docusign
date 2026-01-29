export function toISODateFlex(v?: string | Date | null): string {
  if (v == null || v === '') return '';

  let d: Date | null = null;

  if (v instanceof Date) {
    d = v;
  } else {
    const s = String(v).trim();
    if (!s) return '';

    // 1) Intento directo (ISO u otros que JS entienda)
    const tryIso = new Date(s);
    if (!Number.isNaN(tryIso.getTime())) {
      d = tryIso;
    } else {
      // 2) dd/mm/yyyy [hh[:mm]]
      const m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})(?:\s+(\d{1,2})(?::(\d{1,2}))?)?$/.exec(s);
      if (m) {
        const [, dd, mm, yy, hh = '0', mi = '0'] = m;
        const year = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
        const month = Number(mm) - 1;
        const day = Number(dd);
        const hour = Number(hh);
        const min = Number(mi);
        const candidate = new Date(year, month, day, hour, min, 0);
        // valida que coincida (p.ej. 32/13/2025 no pase)
        if (
          candidate.getFullYear() === year &&
          candidate.getMonth() === month &&
          candidate.getDate() === day
        ) {
          d = candidate;
        }
      }
    }
  }

  return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
}

export function parseDateFlex(v?: string | Date | null): Date | null {
  if (v == null || v === '') return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

  const s = String(v).trim();
  if (!s) return null;

  // 1) Intento directo (ISO u otros)
  const attempt = new Date(s);
  if (!Number.isNaN(attempt.getTime())) return attempt;

  // 2) dd/mm/yyyy [hh[:mm]]
  const m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})(?:\s+(\d{1,2})(?::(\d{1,2}))?)?$/.exec(s);
  if (m) {
    const [, dd, mm, yy, hh = '0', mi = '0'] = m;
    const year = yy.length === 2 ? Number(`20${yy}`) : Number(yy);
    const month = Number(mm) - 1;
    const day = Number(dd);
    const hour = Number(hh);
    const min = Number(mi);
    const d = new Date(year, month, day, hour, min, 0);
    if (
      d.getFullYear() === year &&
      d.getMonth() === month &&
      d.getDate() === day
    ) return d;
  }

  return null;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function toISODateTimeFlex(v?: string | Date | null): string {
  const d = parseDateFlex(v);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getTodayLocalISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // 0–11
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toGraphDateTime(
  v: Date | { toISOString: () => string } | string | null | undefined
): string | undefined {
  if (!v) return undefined;

  if (typeof v === "string") {
    // Solo fecha "YYYY-MM-DD" -> la convertimos a ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const d = new Date(v + "T00:00:00");
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
    }

    // Ya viene con T, probablemente ISO -> la respetamos
    if (/^\d{4}-\d{2}-\d{2}T.*$/.test(v)) {
      return v;
    }

    // Otro string cualquiera -> intentamos parsear
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  // Date o similar con toISOString
  try {
    const iso = (v as any).toISOString?.();
    if (typeof iso === "string" && iso) return iso;
  } catch {}

  const d = new Date(v as any);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}


export function spDateToDDMMYYYY(spDate: string | null | undefined): string {
  if (!spDate) return "";

  const d = new Date(spDate);
  if (Number.isNaN(d.getTime())) return "";

  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());

  return `${dd}/${mm}/${yyyy}`;
}

export function DDMMYYYY(spDate: string | null | undefined): string {
  if (!spDate) return "";

  const d = new Date(spDate);
  if (Number.isNaN(d.getTime())) return "";

  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());

  return `${yyyy}/${mm}/${dd}`;
}

export function spDateToSpanishLong(
  input: string | Date | null | undefined,
  opts?: { withYearWord?: boolean; monthStyle?: "long" | "short" }
): string {
  if (!input) return "";

  const withYearWord = opts?.withYearWord ?? true;
  const monthStyle = opts?.monthStyle ?? "long";

  const raw = input instanceof Date ? input.toISOString() : String(input).trim();

  // 1) Normalizar el año si viene mal (ej: +020256-01-10... -> 2026-01-10...)
  // Captura "020256" y lo reduce a 4 dígitos tomando los últimos 4 (=> "2026")
  const normalized = raw.replace(
    /^(\+?)(\d{5,6})(-\d{2}-\d{2}T)/,
    (_m, _plus, y, rest) => `${y.slice(-4)}${rest}`
  );

  // 2) Parse seguro
  const d = input instanceof Date ? input : new Date(normalized);
  if (Number.isNaN(d.getTime())) return "";

  // OJO: SharePoint suele venir en UTC (Z). Para solo fecha, conviene usar UTC:
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();

  const monthName = new Intl.DateTimeFormat("es-CO", {
    month: monthStyle,
    timeZone: "UTC",
  }).format(d);

  // "10 de enero del año 2026" o "10 de enero de 2026"
  return withYearWord
    ? `${day} de ${monthName} del año ${year}`
    : `${day} de ${monthName} de ${year}`;
}
