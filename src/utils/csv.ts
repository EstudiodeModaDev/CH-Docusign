export function sanitizeHeader(raw: string) {
  // CSV headers limpios y estables
  return (raw ?? "").trim().replace(/\s+/g, "_").replace(/[^\w\-]/g, "").slice(0, 80);
}

export function toCsvLine(values: string[]) {
  // escapa comillas y comas
  return values
    .map((v) => {
      const s = (v ?? "").toString();
      const escaped = s.replace(/"/g, '""');
      return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    })
    .join(",");
}

export function downloadTextFile(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
