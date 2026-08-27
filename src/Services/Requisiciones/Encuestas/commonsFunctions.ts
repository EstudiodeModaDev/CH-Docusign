// Excel guarda fechas como número serial (días desde 1899-12-30); 25569 es la
// distancia en días entre ese origen y el epoch de JS (1970-01-01 UTC).
export function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

// El formulario cambió sus opciones de respuesta con el tiempo (Sí/No -> escala
// Nunca/Algunas veces/Casi siempre/Siempre); se tratan como positivas "Sí" y las
// dos opciones más favorables de la escala.
export function toBooleanAnswer(value: unknown): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "sí" || v === "si" || v === "siempre" || v === "casi siempre";
}