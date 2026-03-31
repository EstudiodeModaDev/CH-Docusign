import { isCesacion, isNovedad, isPromocion, isRetail } from "../../Funcionalidades/Common/detectType";
import type { Cesacion } from "../../models/Cesaciones";
import type { ReportDTO } from "../../models/DTO";
import type { Novedad } from "../../models/Novedades";
import type { Promocion } from "../../models/Promociones";
import type { Retail } from "../../models/Retail";


function mapCesacionToReportDTO(item: Cesacion): ReportDTO {
  return {
    Id: item.Id ?? "",
    Cedula: item.Title ?? "",
    Nombre: item.Nombre ?? "",
    "Fecha de ingreso": item.FechaIngreso ?? "",
    "Programación de exámenes": item.FechaExamenesMedicos ?? "No se han registrado",
    Cargo: item.Cargo,
    Empresa: item.Empresaalaquepertenece,
    Modulo:  "Cesaciones",
    Salario: item.Salario,
    SalarioTexto: item.SalarioTexto
  };
}

function mapNovedadToReportDTO(item: Novedad): ReportDTO {
  return {
    Id: item.Id ?? "",
    Cedula: item.Numero_x0020_identificaci_x00f3_ ?? "",
    Nombre: item.NombreSeleccionado ?? "",
    "Fecha de ingreso": item.FECHA_x0020_REQUERIDA_x0020_PARA0 ?? "",
    "Programación de exámenes": item.FechaExamenesMedicos ?? "",
    Cargo: item.CARGO,
    Empresa: item.Empresa_x0020_que_x0020_solicita,
    Modulo: "Contratación",
    Salario: item.SALARIO,
    SalarioTexto: item.salariotexto
  };
}

function mapPromocionToReportDTO(item: Promocion): ReportDTO {
  return {
    Id: item.Id ?? "",
    Cedula: item.NumeroDoc ?? "",
    Nombre: item.NombreSeleccionado ?? "",
    "Fecha de ingreso": item.FechaIngreso ?? "",
    "Programación de exámenes": item.FechaExamenesMedicos ?? "",
    Cargo: item.Cargo,
    Empresa: item.EmpresaSolicitante,
    Modulo: "Promoción",
    Salario: item.Salario,
    SalarioTexto: item.SalarioTexto
  };
}

function mapRetailToReportDTO(item: Retail): ReportDTO {
  return {
    Id: item.Id ?? "",
    Cedula: item.Title ?? "",
    Nombre: item.Nombre ?? "",
    "Fecha de ingreso": item.FechaIngreso ?? "",
    "Programación de exámenes": item.FechaExamenesMedicos ?? "",
    Cargo: item.Cargo,
    Empresa: item.Empresaalaquepertenece,
    Modulo: "Retail",
    Salario: item.Salario,
    SalarioTexto: item.SalarioLetras,
  };
}

export function convertToReportDTO(original: Cesacion | Novedad | Promocion | Retail): ReportDTO { 
  if (isCesacion(original)) {
    return mapCesacionToReportDTO(original);
  }

  if (isNovedad(original)) {
    return mapNovedadToReportDTO(original);
  }

  if (isPromocion(original)) {
    return mapPromocionToReportDTO(original);
  }

  if (isRetail(original)) {
    return mapRetailToReportDTO(original);
  }

  throw new Error("Tipo de registro no soportado");
}