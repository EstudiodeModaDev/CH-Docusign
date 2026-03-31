
import type { Cesacion } from "../../models/Cesaciones";
import type { CommonRegister, rsOption } from "../../models/Commons";
import type { HabeasData } from "../../models/HabeasData";
import type { Novedad } from "../../models/Novedades";
import type { Promocion } from "../../models/Promociones";
import type { Retail } from "../../models/Retail";
import { toISODateTimeFlex } from "../../utils/Date";
import { isCesacion, isHabeasData, isNovedad, isPromocion, isRetail } from "./detectType";

function mapCesacionToCommonRegister(item: Cesacion): CommonRegister {
  return {
    Id: item.Id ?? "",
    Cedula: item.Title ?? "",
    Nombre: item.Nombre ?? "",
    Correoelectronico: item.Correoelectronico ?? "",
    Empresaalaquepertenece: item.Empresaalaquepertenece ?? "",
    Cargo: item.Cargo,
    Temporal: item.Temporal,
    Celular: item.Celular,
    FechaIngreso: item.FechaIngreso,
    FechaSalidaCesacion: item.FechaSalidaCesacion,
    FechaLimiteDocumentos: item.FechaLimiteDocumentos,
    Reportadopor: item.Reportadopor,
    Fechaenlaquesereporta: item.Fechaenlaquesereporta,
    TipoDoc: item.TipoDoc,
    auxConectividadTexto: item.auxConectividadTexto,
    auxConectividadValor: item.auxConectividadValor,
    CargoCritico: item.CargoCritico,
    Ciudad: item.Ciudad,
    CodigoCC: item.CodigoCC,
    CodigoCO: item.CodigoCO,
    CodigoUN: item.CodigoUN,
    Departamento: item.Departamento,
    Dependencia: item.Dependencia,
    DescripcionCC: item.DescripcionCC,
    DescripcionCO: item.DescripcionCO,
    DescripcionUN: item.DescripcionUN,
    direccionResidencia: item.direccionResidencia,
    Estado: item.Estado,
    Niveldecargo: item.Niveldecargo,
    Salario: item.Salario,
    SalarioTexto: item.SalarioTexto,
    Fuente: "Cesacion"
  };
}

function mapNovedadToCommonRegister(item: Novedad): CommonRegister {
  return {
    Id: item.Id ?? "",
    Cedula: item.Numero_x0020_identificaci_x00f3_ ?? "",
    Nombre: item.NombreSeleccionado ?? "",
    Correoelectronico: item.CORREO_x0020_ELECTRONICO_x0020_ ?? "",
    Empresaalaquepertenece: item.Empresa_x0020_que_x0020_solicita ?? "",
    Cargo: item.CARGO,
    Temporal: item.TEMPORAL,
    Celular: item.CELULAR_x0020_,
    FechaIngreso: item.FECHA_x0020_REQUERIDA_x0020_PARA0,
    FechaSalidaCesacion: null,
    FechaLimiteDocumentos: null,
    Reportadopor: item.Informaci_x00f3_n_x0020_enviada_,
    Fechaenlaquesereporta: item.FechaReporte,
    TipoDoc: item.Tipo_x0020_de_x0020_documento_x0,
    auxConectividadTexto: item.auxconectividadtexto,
    auxConectividadValor: item.auxconectividadvalor,
    CargoCritico: item.CARGO_x0020_CRITICO,
    Ciudad: item.CIUDAD,
    CodigoCC: item.CODIGO_x0020_CENTRO_x0020_DE_x00,
    CodigoCO: item.CENTRO_x0020_OPERATIVO_x0020_,
    CodigoUN: item.ID_x0020_UNIDAD_x0020_DE_x0020_N,
    Departamento: item.Departamento,
    Dependencia: item.DEPENDENCIA_x0020_,
    DescripcionCC: item.DESCRIPCION_x0020_DE_x0020_CENTR,
    DescripcionCO: item.DESCRIPCION_x0020_CENTRO_x0020_O,
    DescripcionUN: item.UNIDAD_x0020_DE_x0020_NEGOCIO_x0,
    direccionResidencia: item.DIRECCION_x0020_DE_x0020_DOMICIL,
    Estado: item.Estado,
    Niveldecargo: item.NIVEL_x0020_DE_x0020_CARGO,
    Salario: item.SALARIO,
    SalarioTexto: item.salariotexto,
    Fuente: "Contratacion"
  };
}

function mapPromocionToCommonRegister(item: Promocion): CommonRegister {
  return {
    Id: item.Id ?? "",
    Cedula: item.NumeroDoc ?? "",
    Nombre: item.NombreSeleccionado ?? "",
    Correoelectronico: item.Correo ?? "",
    Empresaalaquepertenece: item.EmpresaSolicitante ?? "",
    Cargo: item.Cargo,
    Temporal: "",
    Celular: "",
    FechaIngreso: item.FechaIngreso,
    FechaSalidaCesacion: null,
    FechaLimiteDocumentos: null,
    Reportadopor: item.InformacionEnviadaPor,
    Fechaenlaquesereporta: "",
    TipoDoc: item.TipoDoc,
    auxConectividadTexto: item.AuxilioTexto,
    auxConectividadValor: item.AuxilioValor,
    CargoCritico: item.CargoCritico,
    Ciudad: item.Ciudad,
    CodigoCC: item.CodigoCentroCostos,
    CodigoCO: item.CentroOperativo,
    CodigoUN: item.IDUnidadNegocio,
    Departamento: item.Departamento,
    Dependencia: item.Dependencia,
    DescripcionCC: item.DescripcionCentroCostos,
    DescripcionCO: item.DescripcionCentroOperativo,
    DescripcionUN: item.UnidadNegocio,
    direccionResidencia: "",
    Estado: item.Estado,
    Niveldecargo: item.NivelCargo,
    Salario: item.Salario,
    SalarioTexto: item.SalarioTexto,
    Fuente: "Promocion"
  };
}

function mapHabeasDataToCommonRegister(item: HabeasData): CommonRegister {
  return {
    Id: item.Id ?? "",
    Cedula: item.NumeroDocumento ?? "",
    Nombre: item.Title ?? "",
    Correoelectronico: item.Correo ?? "",
    Empresaalaquepertenece: item.Empresa ?? "",
    Cargo: "",
    Temporal: "",
    Celular: "",
    FechaIngreso: null,
    FechaSalidaCesacion: null,
    FechaLimiteDocumentos: null,
    Reportadopor: item.Informacionreportadapor,
    Fechaenlaquesereporta: item.Fechaenlaquesereporta,
    TipoDoc: item.Tipodoc,
    auxConectividadTexto: "",
    auxConectividadValor: "",
    CargoCritico: "",
    Ciudad: item.Ciudad,
    CodigoCC: "",
    CodigoCO: "",
    CodigoUN: "",
    Departamento: "",
    Dependencia: "",
    DescripcionCC: "",
    DescripcionCO: "",
    DescripcionUN: "",
    direccionResidencia: "",
    Estado: "",
    Niveldecargo: "",
    Salario: "",
    SalarioTexto: "",
    Fuente: "Habeas data"
  };
}

function mapRetailToCommonRegister(item: Retail): CommonRegister {
  return {
    Id: item.Id ?? "",
    Cedula: item.Title ?? "",
    Nombre: item.Nombre ?? "",
    Correoelectronico: item.CorreoElectronico ?? "",
    Empresaalaquepertenece: item.Empresaalaquepertenece ?? "",
    Cargo: item.Cargo,
    Temporal: item.Temporal,
    Celular: item.Celular,
    FechaIngreso: item.FechaIngreso,
    FechaSalidaCesacion: null,
    FechaLimiteDocumentos: null,
    Reportadopor: item.InformacionEnviadaPor,
    Fechaenlaquesereporta: item.FechaReporte,
    TipoDoc: item.TipoDoc,
    auxConectividadTexto: item.Auxiliotransporteletras,
    auxConectividadValor: item.Auxiliodetransporte,
    CargoCritico: "",
    Ciudad: item.Ciudad,
    CodigoCC: item.CodigoCentroCostos,
    CodigoCO: item.CentroOperativo,
    CodigoUN: item.CodigoUnidadNegocio,
    Departamento: item.Departamento,
    Dependencia: item.Depedencia,
    DescripcionCC: item.CentroCostos,
    DescripcionCO: item.CentroOperativo,
    DescripcionUN: item.UnidadNegocio,
    direccionResidencia: "",
    Estado: item.Estado,
    Niveldecargo: item.NivelCargo,
    Salario: item.Salario,
    SalarioTexto: item.SalarioLetras,
    Fuente: "Retail"
  };
}


export function convertToCommonDTO(original: Cesacion | Novedad | Promocion | HabeasData | Retail): CommonRegister { 
  if (isCesacion(original)) {
    return mapCesacionToCommonRegister(original);
  }

  if (isNovedad(original)) {
    return mapNovedadToCommonRegister(original);
  }

  if (isPromocion(original)) {
    return mapPromocionToCommonRegister(original);
  }

  if (isHabeasData(original)) {
    return mapHabeasDataToCommonRegister(original);
  }

  if (isRetail(original)) {
    return mapRetailToCommonRegister(original);
  }

  throw new Error("Tipo de registro no soportado");
}



export function convertCommonToOptions(workers: CommonRegister[]): rsOption[] { 
  
  const seen = new Set<string>();

  const next: rsOption[] = workers
    .map(item => ({
      value: item.Id!,
      label: `Nombre: ${item.Nombre} - ${item.Fuente} - Cargo: ${item.Cargo} - Fecha ingreso: ${toISODateTimeFlex(item.FechaIngreso)}.`,
    }))
      .filter(opt => {
        if (!opt.value) return false;
        if (seen.has(opt.value)) return false;
        seen.add(opt.value);
        return true;
      });

    return next;
}
