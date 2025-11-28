const toNumberEs = (v: unknown): number => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const s = String(v ?? "").trim();
  if (!s) return 0;
  const normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return isFinite(n) ? n : 0;
};

export const formatPesosEsCO = (value: number | string, decimals = 2) => {
  const n = typeof value === "number" ? value : toNumberEs(value);
  // si no hay parte decimal, no obligues dos decimales
  const hasDecimals = Math.abs(n % 1) > 0;
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: hasDecimals ? decimals : 0,
    maximumFractionDigits: decimals,
  }).format(n);
};

export const toNumberFromEsCO = (formatted: string) => Number(formatted.replace(/\./g, "").replace(",", "."));

export function numeroATexto(num: number): string {
  const entero = Math.floor(num);
  const decimales = Math.round((num - entero) * 100);

  const unidades = [
    "",
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
  ];

  const especiales = [
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciséis",
    "diecisiete",
    "dieciocho",
    "diecinueve",
  ];

  const decenas = [
    "",
    "diez",
    "veinte",
    "treinta",
    "cuarenta",
    "cincuenta",
    "sesenta",
    "setenta",
    "ochenta",
    "noventa",
  ];

  const centenas = [
    "",
    "cien",
    "doscientos",
    "trescientos",
    "cuatrocientos",
    "quinientos",
    "seiscientos",
    "setecientos",
    "ochocientos",
    "novecientos",
  ];

  const convertirMenor1000 = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return unidades[n];
    if (n < 20) return especiales[n - 10];

    if (n < 100) {
      const d = Math.floor(n / 10);
      const u = n % 10;
      return u === 0 ? decenas[d] : `${decenas[d]} y ${unidades[u]}`;
    }

    if (n < 1000) {
      const c = Math.floor(n / 100);
      const resto = n % 100;

      if (c === 1 && resto > 0) {
        return `ciento ${convertirMenor1000(resto)}`;
      }

      return resto === 0
        ? centenas[c]
        : `${centenas[c]} ${convertirMenor1000(resto)}`;
    }

    return "";
  };

  // 0–999.999 (maneja miles)
  const convertirMenor1M = (n: number): string => {
    if (n < 1000) return convertirMenor1000(n);

    const miles = Math.floor(n / 1000);
    const resto = n % 1000;

    let textoMiles = "";

    if (miles === 1) {
      textoMiles = "mil";
    } else {
      textoMiles = `${convertirMenor1000(miles)} mil`;
    }

    if (resto > 0) {
      textoMiles += ` ${convertirMenor1000(resto)}`;
    }

    return textoMiles;
  };

  let texto = "";

  if (entero === 0) {
    texto = "cero";
  } else if (entero < 1_000_000) {
    // 0–999.999
    texto = convertirMenor1M(entero);
  } else {
    // Millones
    const millones = Math.floor(entero / 1_000_000);
    const restoMillones = entero % 1_000_000;

    let textoMillones = "";

    if (millones === 1) {
      textoMillones = "un millón";
    } else {
      // si quieres "dos millones", "trece millones", "ciento veinte millones", etc.
      textoMillones = `${convertirMenor1M(millones)} millones`;
    }

    if (restoMillones > 0) {
      texto = `${textoMillones} ${convertirMenor1M(restoMillones)}`;
    } else {
      texto = textoMillones;
    }
  }

  // Manejo de decimales → "con cincuenta", "con veinte", etc.
  if (decimales > 0) {
    texto += ` con ${convertirMenor1000(decimales)}`;
  }

  return texto.trim();
}


