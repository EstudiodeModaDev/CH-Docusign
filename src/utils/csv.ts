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

export function exportRowsToCsv(columns: string[], rows: Array<Record<string,string>>, fileName: string) {
  const headerLine = toCsvLine(columns);
  const lines = rows.map((r) => toCsvLine(columns.map((c) => r[c] ?? "")));
  const csv = [headerLine, ...lines].join("\n") + "\n";
  downloadTextFile(fileName, csv);
}
type Row = Record<string, string>;

function getCell(row: Row , key: string) {
  const k = key.trim().toLowerCase();
  const found = Object.keys(row).find(x => x.trim().toLowerCase() === k);
  return found ? (row[found] ?? "") : "";
}

export function must(row: Row, key: string) {
  const v = getCell(row, key);
  if (!v) throw new Error(`Falta columna/valor requerido: ${key}`);
  return v;
}

export function safeRef(row: Row, index: number) {
  return getCell(row, "ReferenceId") || `ROW-${String(index + 1).padStart(3, "0")}`;
}
