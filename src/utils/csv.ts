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

import * as XLSX from "xlsx";

export function exportRowsToXlsx(columns: string[], rows: Row[], fileName: string) {
  // 1) convierto tus rows (Record) a objetos alineados por columns
  const data = rows.map((r) => {
    const obj: Record<string, any> = {};
    for (const c of columns) obj[c] = r[c] ?? "";
    return obj;
  });

  // 2) hoja (sheet) con orden de columnas
  const ws = XLSX.utils.json_to_sheet(data, { header: columns });

  // (opcional) congelar primera fila
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  // (opcional) anchos automáticos simples
  ws["!cols"] = columns.map((c) => ({ wch: Math.max(12, c.length + 2) }));

  // 3) libro
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bulk");

  // 4) descarga .xlsx
  const safe = fileName.toLowerCase().endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, safe);
}

export async function readExcelFile(file: File): Promise<{ headers: string[]; rows: Row[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };

  const ws = wb.Sheets[sheetName];
  if (!ws) return { headers: [], rows: [] };

  // 1) Saca la matriz (incluye encabezados)
  const matrix = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false });

  if (!matrix.length) return { headers: [], rows: [] };

  // 2) Primera fila = headers
  const headers = (matrix[0] as any[]).map((h) => (h ?? "").toString().trim()).filter(Boolean);

  // 3) Filas siguientes
  const rows: Row[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const cells = matrix[r] as any[];
    // ignora filas totalmente vacías
    const hasAny = cells?.some((c) => (c ?? "").toString().trim().length > 0);
    if (!hasAny) continue;

    const obj: Row = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (cells?.[c] ?? "").toString().trim();
    }
    rows.push(obj);
  }

  return { headers, rows };
}

