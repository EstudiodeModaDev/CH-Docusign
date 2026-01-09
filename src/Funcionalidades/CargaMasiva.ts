import * as XLSX from "xlsx";
import type { MaestrosService } from "../Services/Maestros.service";

type CentroCosto = {
  codigo: string;
  nombre: string;
};

export async function parseCentroCostosXls(file: File): Promise<CentroCosto[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Matriz de filas: [ [CODIGO, NOMBRE], [], [12111, "PRESIDENCIA"], ... ]
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  }) as (string | number)[][];

  const out: CentroCosto[] = [];

  for (const [i, row] of rows.entries()) {
    // 0 = header, 1 = fila vacía (en tu archivo)
    if (i < 2) continue;

    const codigo = String(row[0] ?? "").trim();
    const nombre = String(row[1] ?? "").trim();

    // saltar filas vacías o incompletas
    if (!codigo || !nombre) continue;

    out.push({ codigo, nombre });
  }

  return out;
}

export async function masiveCharge(file: File, maestroSvc: MaestrosService) {
  const centros = await parseCentroCostosXls(file);
  const existentes = await maestroSvc.getAll({filter: `fields/Title eq 'Centro de costos'`});

  const map = new Map<string, any>();
  for (const item of existentes) {
    const codigo = String(item?.Codigo ?? "").trim();
    if (codigo) map.set(codigo, item);
  }

  // 3) Iterar excel
  for (const cc of centros) {
    const codigo = String(cc.codigo).trim();
    const nombre = String(cc.nombre).trim();
    if (!codigo || !nombre) continue;

    const found = map.get(codigo);

    if (found) {
      await maestroSvc.update(found.Id!, {
        Codigo: codigo,
        T_x00ed_tulo1: nombre,
      });
    } else {
      await maestroSvc.create({
        Abreviacion: "",
        Codigo: codigo,
        T_x00ed_tulo1: nombre,
        Title: "Centro de costos",
      });
    }
  }
}

export async function masiveChargeCO(file: File, maestroSvc: MaestrosService) {
  const centros = await parseCentroCostosXls(file);
  const existentes = await maestroSvc.getAll({filter: `fields/Title eq 'Centros operativos'`});

  const map = new Map<string, any>();
  for (const item of existentes) {
    const codigo = String(item?.Codigo ?? "").trim();
    if (codigo) map.set(codigo, item);
  }

  // 3) Iterar excel
  for (const cc of centros) {
    const codigo = String(cc.codigo).trim();
    const nombre = String(cc.nombre).trim();
    if (!codigo || !nombre) continue;

    const found = map.get(codigo);

    if (found) {
      await maestroSvc.update(found.Id!, {
        Codigo: codigo,
        T_x00ed_tulo1: nombre,
      });
    } else {
      await maestroSvc.create({
        Abreviacion: "",
        Codigo: codigo,
        T_x00ed_tulo1: nombre,
        Title: "Centros operativos",
      });
    }
  }
}