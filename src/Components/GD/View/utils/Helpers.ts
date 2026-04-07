/* ================= Helpers ================= */
export function buildBreadcrumb(currentPath: string) {
  const parts = (currentPath || "")
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);

  return parts.map((p) => p.replace(/\s+/g, " "));
}

export function parseFolderDataFromPath(path: string) {
  const partes = (path || "").split("/").filter(Boolean);
  const fullname = partes[partes.length - 1] || "";
  const [cedula = "", nombre = ""] = fullname.split(" - ");

  return {
    cedula: cedula.trim(),
    nombre: nombre.trim(),
    fullname: fullname.trim(),
    path: path || "",
  };
}

export function normalizeEstado(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

export function getEstadoClass(estado: string) {
  const normalized = normalizeEstado(estado);
  if (normalized === "aprobado") return "ce3-state ce3-state--aprovve";
  if (normalized === "rechazada") return "ce3-state ce3-state--building";
  return "ce3-state ce3-state--building";
}