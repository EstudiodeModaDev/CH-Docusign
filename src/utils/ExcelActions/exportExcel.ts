// src/utils/exportExcel.ts
import * as XLSX from "xlsx";

import type { Envio } from "../../models/Envios";
import type { Novedad } from "../../models/Novedades";
import type { Promocion } from "../../models/Promociones";
import type { HabeasData } from "../../models/HabeasData";
import type { Cesacion } from "../../models/Cesaciones";
import type { Retail } from "../../models/Retail";
import { buildCesacionesData, buildConsolidadoData, buildEnviosData, buildHabeasData, buildNovedadesData, buildPromocionesData, buildRetailData } from "./convertDataToExcel";
import type { GetAllSvc, PasoLike } from "../completation";
import { convertToReportDTO } from "./convertToCommonDTO";
import type { ReportDTO } from "../../models/DTO";

type ExportAllParams = {
  novedades?: Novedad[];
  promociones?: Promocion[];
  cesaciones?: Cesacion[];
  retail?: Retail[];

  detallesPasosNovedadSvc?: GetAllSvc<PasoLike>;
  detallesPasosPromocionSvc?: GetAllSvc<PasoLike>;
  detallesPasosCesacionSvc?: GetAllSvc<PasoLike>;
  detallesPasosRetailSvc?: GetAllSvc<PasoLike>;

  fileName?: string;
};

//Funcion que crea una nueva hoja para el exporte
function appendSheet<T extends Record<string, unknown>>(wb: XLSX.WorkBook, sheetName: string, data: T[]) {
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}


export function exportEnviosToExcel(rows: Envio[], opts?: { fileName?: string }) {
  const data = buildEnviosData(rows)

  const wb = XLSX.utils.book_new();
  appendSheet(wb, "Envios", data)

  XLSX.writeFile(wb, opts?.fileName ?? "ReporteEnvios.xlsx");
}

export function exportHabeasToExcel(rows: HabeasData[], opts?: { fileName?: string }) {
  const data = buildHabeasData(rows)

  const wb = XLSX.utils.book_new();
  appendSheet(wb, "Habeas data", data)

  XLSX.writeFile(wb, opts?.fileName ?? "Reporte-Habeas.xlsx");
}

export async function exportNovedadesToExcel(rows: Novedad[], detallesPasosNovedadSvc: GetAllSvc<PasoLike>, opts?: { fileName?: string }) {
  const data = await buildNovedadesData(rows, detallesPasosNovedadSvc)

  const wb = XLSX.utils.book_new();
  appendSheet(wb, "Contrataciones", data)

  XLSX.writeFile(wb, opts?.fileName ?? "Contrataciones.xlsx");
}

export async function exportPromocionesToExcel(rows: Promocion[], detallesPasosPromocionSvc: GetAllSvc<PasoLike>, opts?: { fileName?: string }) {

  const data = await buildPromocionesData(rows, detallesPasosPromocionSvc)

  const wb = XLSX.utils.book_new();
  appendSheet(wb, "Promociones", data)

  XLSX.writeFile(wb, opts?.fileName ?? "Promociones.xlsx");
}

export async function exportCesacionesToExcel(rows: Cesacion[], detallesPasosCesacionSvc: GetAllSvc<PasoLike>, opts?: { fileName?: string }) {

  const data = await buildCesacionesData(rows, detallesPasosCesacionSvc)

  const wb = XLSX.utils.book_new();
  appendSheet(wb, "Cesación", data)

  XLSX.writeFile(wb, opts?.fileName ?? "Reporte Cesaciones.xlsx");
}

export async function exportRetailToExcel(rows: Retail[], detallesPasosRetailSvc: GetAllSvc<PasoLike>, opts?: { fileName?: string }) {

  const data = await buildRetailData(rows, detallesPasosRetailSvc)

  const wb = XLSX.utils.book_new();
  appendSheet(wb, "Retail", data)

  XLSX.writeFile(wb, opts?.fileName ?? "Reporte-Retail.xlsx");
}

export async function exportAllProcesosToExcel({novedades = [], promociones = [], cesaciones = [], retail = [], detallesPasosNovedadSvc, detallesPasosPromocionSvc, detallesPasosCesacionSvc, detallesPasosRetailSvc,}: ExportAllParams) {
  const wb = XLSX.utils.book_new();
  const allRows: ReportDTO[] = []

  if (novedades.length > 0 && detallesPasosNovedadSvc) {
    for(const novedad of novedades) {
      allRows.push(convertToReportDTO(novedad));
    }
  }

  if (promociones.length > 0 && detallesPasosPromocionSvc) {
    for(const promocion of promociones) {
      allRows.push(convertToReportDTO(promocion));
    }
  }

  if (cesaciones.length > 0 && detallesPasosCesacionSvc) {
    for(const cesacion of cesaciones) {
      allRows.push(convertToReportDTO(cesacion));
    }
  }

  if (retail.length > 0 && detallesPasosRetailSvc) {
    for(const r of retail) {
      allRows.push(convertToReportDTO(r));
    }
  }

  const data = await buildConsolidadoData(allRows, {cesaciones: detallesPasosCesacionSvc, novedades: detallesPasosNovedadSvc, promociones: detallesPasosPromocionSvc, retail: detallesPasosRetailSvc})
  appendSheet(wb, "Reporte consolidado", data)
  XLSX.writeFile(wb, "Reporte consolidado.xlsx");
}
