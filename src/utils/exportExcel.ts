// src/utils/exportExcel.ts
import * as XLSX from "xlsx";

import type { Envio } from "../models/Envios";
import type { Novedad } from "../models/Novedades";
import type { Promocion } from "../models/Promociones";
import type { HabeasData } from "../models/HabeasData";
import type { Cesacion } from "../models/Cesaciones";
import type { Retail } from "../models/Retail";

import { toISODateFlex } from "./Date";
import { formatPesosEsCO, } from "./Number";
import { computePctById, type GetAllSvc, type PasoLike } from "./completation";

/* ============================================================================
   EXPORTS SIN % (SYNC)
   - Envios
   - HabeasData
   ============================================================================ */

export function exportEnviosToExcel(rows: Envio[], opts?: { fileName?: string }) {
  const data = rows.map((row) => ({
    "Documento enviado": row.Title ?? "N/A",
    Destinatario: row.Receptor ?? "N/A",
    "Correo Receptor": row.CorreoReceptor ?? "N/A",
    Cédula: row.Cedula ?? "N/A",
    "Enviado por": row.EnviadoPor ?? "N/A",
    "Fecha de envío": row.Fechadeenvio ?? "N/A",
    Fuente: row.Fuente ?? "N/A",
    "Compañía que solicita": row.Compa_x00f1_ia ?? "N/A",
    Estado:
      row.Estado === "Sent"
        ? "Enviado"
        : row.Estado === "Completed"
          ? "Completado"
          : row.Estado === "Declined"
            ? "Rechazado"
            : row.Estado ?? "N/A",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Envios");

  XLSX.writeFile(wb, opts?.fileName ?? "ReporteEnvios.xlsx");
}

export function exportHabeasToExcel(rows: HabeasData[], opts?: { fileName?: string }) {
  const data = rows.map((row) => ({
    "Información enviada por": row.Informacionreportadapor ?? "N/A",
    "Fecha en la que se reportó": toISODateFlex(row.Fechaenlaquesereporta) ?? "N/A",
    "Tipo de documento": row.Tipodoc ?? "N/A",
    Abreviación: row.AbreviacionTipoDoc ?? "N/A",
    "Número de documento": row.NumeroDocumento ?? "N/A",
    "Nombre del seleccionado": row.Title ?? "N/A",
    "Correo electrónico del seleccionado": row.Correo ?? "N/A",
    Ciudad: row.Ciudad ?? "N/A",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "HabeasData");

  XLSX.writeFile(wb, opts?.fileName ?? "ReporteHabeasData.xlsx");
}

/* ============================================================================
   EXPORTS CON % COMPLETACIÓN (ASYNC)
   - Novedades
   - Promociones
   - Cesaciones
   - Retail
   ============================================================================ */

export async function exportNovedadesToExcel(
  rows: Novedad[],
  detallesPasosNovedadSvc: GetAllSvc<PasoLike>,
  opts?: { fileName?: string }
) {
  const ids = rows.map((r) => String(r.Id ?? "")).filter(Boolean);
  const pctById = await computePctById(ids, detallesPasosNovedadSvc, { concurrency: 10 });

  const data = rows.map((row) => {
    const id = String(row.Id ?? "");
    const pct = pctById[id];

    return {
      "Información enviada por": row.Informaci_x00f3_n_x0020_enviada_ ?? "N/A",
      "Fecha en la que se reportó": toISODateFlex(row.FechaReporte) ?? "N/A",
      "Tipo de documento": row.tipodoc ?? "N/A",
      Abreviación: row.Tipo_x0020_de_x0020_documento_x0 ?? "N/A",
      "Número de documento": row.Numero_x0020_identificaci_x00f3_ ?? "N/A",
      "Nombre del seleccionado": row.NombreSeleccionado ?? "N/A",
      "Correo electrónico del seleccionado": row.CORREO_x0020_ELECTRONICO_x0020_ ?? "N/A",
      "Celular del seleccionado": row.CELULAR_x0020_ ?? "N/A",
      Dirección: row.DIRECCION_x0020_DE_x0020_DOMICIL ?? "N/A",
      Barrio: row.BARRIO_x0020_ ?? "N/A",
      "Fecha requerida para el ingreso": toISODateFlex(row.FECHA_x0020_REQUERIDA_x0020_PARA0) ?? "N/A",
      "Empresa solicitante": row.Empresa_x0020_que_x0020_solicita ?? "N/A",
      Ciudad: row.CIUDAD ?? "N/A",
      Cargo: row.CARGO ?? "N/A",
      "Especificidad del cargo": row.ESPECIFICIDAD_x0020_DEL_x0020_CA ?? "N/A",
      "Nivel de cargo": row.NIVEL_x0020_DE_x0020_CARGO ?? "N/A",
      "¿Cargo crítico?": row.CARGO_x0020_CRITICO ?? "N/A",
      Dependencia: row.DEPENDENCIA_x0020_ ?? "N/A",
      "Centro de costos":
        (row.CODIGO_x0020_CENTRO_x0020_DE_x00 ?? "N/A") +
        " - " +
        (row.DESCRIPCION_x0020_DE_x0020_CENTR ?? "N/A"),
      "Centro operativo":
        (row.CENTRO_x0020_OPERATIVO_x0020_ ?? "N/A") +
        " - " +
        (row.DESCRIPCION_x0020_CENTRO_x0020_O ?? "N/A"),
      "Unidad de negocio":
        (row.ID_x0020_UNIDAD_x0020_DE_x0020_N ?? "N/A") +
        " - " +
        (row.UNIDAD_x0020_DE_x0020_NEGOCIO_x0 ?? "N/A"),
      "Personas a cargo": row.PERSONAS_x0020_A_x0020_CARGO ?? "N/A",
      Temporal: row.TEMPORAL ?? "N/A",
      "Origen de la selección": row.ORIGEN_x0020_DE_x0020_LA_x0020_S ?? "N/A",
      "Tipo de trabajo": row.MODALIDAD_x0020_TELETRABAJO ?? "N/A",
      "Tipo de vacante": row.TIPO_x0020_DE_x0020_VACANTE_x002 ?? "N/A",
      "Tipo de contrato": row.TIPO_x0020_DE_x0020_CONTRATO ?? "N/A",
      "Fecha de ajuste académico": toISODateFlex(row.FECHA_x0020_DE_x0020_AJUSTE_x002) ?? "N/A",
      "Fecha de entrega de valoración de potencial":
        toISODateFlex(row.FECHA_x0020_DE_x0020_ENTREGA_x00) ?? "N/A",
      Salario: row.SALARIO ? formatPesosEsCO(row.SALARIO) : "N/A",
      "Salario en letras": row.salariotexto ?? "N/A",
      "Tiene garantizado": row.GARANTIZADO_x0020__x0020__x00bf_ ?? "N/A",
      "Valor garantizado": row.VALOR_x0020_GARANTIZADO ? formatPesosEsCO(row.VALOR_x0020_GARANTIZADO) : "N/A",
      "Garantizado en letras": row.Garantizado_x0020_en_x0020_letra ?? "N/A",
      "Auxilio de conectividad": row.auxconectividadvalor ?? "N/A",
      "Auxilio de conectividad en letras": row.auxconectividadtexto ?? "N/A",
      "Auxilio de rodamiento": row.Auxilio_x0020_de_x0020_rodamient ?? "N/A",
      "Auxilio de rodamiento en letras": row.Auxilio_x0020_de_x0020_rodamient0 ?? "N/A",
      "¿Pertenece al modelo?": row.Pertenecealmodelo ? "Sí" : "No",
      "Presupuesto ventas/Magnitud económica": row.PRESUPUESTO_x0020_VENTAS_x002f_M ?? "N/A",
      Autonomía: row.AUTONOM_x00cd_A_x0020_ ?? "N/A",
      "Impacto cliente externo": row.IMPACTO_x0020_CLIENTE_x0020_EXTE ?? "N/A",
      "Contribución a la estrategia": row.CONTRIBUCION_x0020_A_x0020_LA_x0 ?? "N/A",
      Promedio: row.Pertenecealmodelo ? (row.PROMEDIO_x0020_ ?? "N/A") : "N/A",
      "Grupo CVE": row.GRUPO_x0020_CVE_x0020_ ?? "N/A",
      "Herramienta que posee el colaborador": row.HERRAMIENTAS_x0020_QUE_x0020_POS ?? "N/A",
      "Se debe hacer cargue de nuevo equipo de trabajo": row.SE_x0020_DEBE_x0020_HACER_x0020_ ?? "N/A",
      "% Completación": pct === undefined ? "N/A" : `${pct.toFixed(2)}%`,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "NovedadesAdministrativas");

  XLSX.writeFile(wb, opts?.fileName ?? "ReporteNovedadesAdministrativas.xlsx");
}

export async function exportPromocionesToExcel(
  rows: Promocion[],
  detallesPasosPromocionSvc: GetAllSvc<PasoLike>,
  opts?: { fileName?: string }
) {
  const ids = rows.map((r) => String(r.Id ?? "")).filter(Boolean);
  const pctById = await computePctById(ids, detallesPasosPromocionSvc, { concurrency: 10 });

  const data = rows.map((row) => {
    const id = String(row.Id ?? "");
    const pct = pctById[id];

    return {
      "Información enviada por": row.InformacionEnviadaPor ?? "N/A",
      "Tipo de documento": row.TipoDoc ?? "N/A",
      Abreviación: row.AbreviacionTipoDoc ?? "N/A",
      "Número de documento": row.NumeroDoc ?? "N/A",
      "Nombre del seleccionado": row.NombreSeleccionado ?? "N/A",
      "Correo electrónico del seleccionado": row.Correo ?? "N/A",
      "Fecha requerida para la promoción": row.FechaIngreso ?? "N/A",
      "Empresa solicitante": row.EmpresaSolicitante ?? "N/A",
      Ciudad: row.Ciudad ?? "N/A",
      Cargo: row.Cargo ?? "N/A",
      "Especificidad del cargo": row.EspecificidadCargo ?? "N/A",
      "Nivel de cargo": row.NivelCargo ?? "N/A",
      "¿Cargo crítico?": row.CargoCritico ?? "N/A",
      Dependencia: row.Dependencia ?? "N/A",
      "Centro de costos": (row.CodigoCentroCostos ?? "N/A") + " - " + (row.DescripcionCentroCostos ?? "N/A"),
      "Centro operativo": (row.CentroOperativo ?? "N/A") + " - " + (row.DescripcionCentroOperativo ?? "N/A"),
      "Unidad de negocio": (row.IDUnidadNegocio ?? "N/A") + " - " + (row.UnidadNegocio ?? "N/A"),
      "Personas a cargo": row.PersonasCargo ?? "N/A",
      "Tipo de trabajo": row.ModalidadTeletrabajo ?? "N/A",
      "Tipo de vacante": row.TipoVacante ?? "N/A",
      "Tipo de contrato": row.TipoContrato ?? "N/A",
      "Fecha de ajuste académico": toISODateFlex(row.FechaAjusteAcademico) ?? "N/A",
      "Fecha de entrega de valoración de potencial": toISODateFlex(row.FechaValoracionPotencial) ?? "N/A",
      Salario: row.Salario ? formatPesosEsCO(row.Salario) : "N/A",
      "Salario en letras": row.SalarioTexto ?? "N/A",
      "Tiene garantizado": row.Garantizado_x00bf_SiNo_x003f_ ?? "N/A",
      "Valor garantizado": row.ValorGarantizado ? formatPesosEsCO(row.ValorGarantizado) : "N/A",
      "Garantizado en letras": row.GarantizadoLetras ?? "N/A",
      "Auxilio de conectividad": row.AuxilioValor ?? "N/A",
      "Auxilio de conectividad en letras": row.AuxilioTexto ?? "N/A",
      "Auxilio de rodamiento": row.AuxilioRodamiento ?? "N/A",
      "Auxilio de rodamiento en letras": row.AuxilioRodamientoLetras ?? "N/A",
      "¿Pertenece al modelo?": row.PerteneceModelo ? "Sí" : "No",
      "Presupuesto ventas/Magnitud económica": row.PresupuestoVentasMagnitudEconomi ?? "N/A",
      Autonomía: row.Autonomia ?? "N/A",
      "Impacto cliente externo": row.ImpactoClienteExterno ?? "N/A",
      "Contribución a la estrategia": row.ContribucionaLaEstrategia ?? "N/A",
      Promedio: row.PerteneceModelo ? (row.Promedio ?? "N/A") : "N/A",
      "Grupo CVE": row.GrupoCVE ?? "N/A",
      "Herramienta que posee el colaborador": row.HerramientasColaborador ?? "N/A",
      "Se debe hacer cargue de nuevo equipo de trabajo": row.CargueNuevoEquipoTrabajo ?? "N/A",
      "% Completación": pct === undefined ? "N/A" : `${pct.toFixed(2)}%`,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Promociones");

  XLSX.writeFile(wb, opts?.fileName ?? "ReportePromociones.xlsx");
}

export async function exportCesacionesToExcel(
  rows: Cesacion[],
  detallesPasosCesacionSvc: GetAllSvc<PasoLike>,
  opts?: { fileName?: string }
) {
  const ids = rows.map((r) => String(r.Id ?? "")).filter(Boolean);
  const pctById = await computePctById(ids, detallesPasosCesacionSvc, { concurrency: 10 });

  const data = rows.map((row) => {
    const id = String(row.Id ?? "");
    const pct = pctById[id];

    return {
      "Información enviada por": row.Reportadopor ?? "N/A",
      "Tipo de documento": row.TipoDoc ?? "N/A",
      "Número de documento": row.Title ?? "N/A",
      "Nombre del seleccionado": row.Nombre ?? "N/A",
      "Correo electrónico del seleccionado": row.Correoelectronico ?? "N/A",
      "Fecha en la que se reportó": toISODateFlex(row.Fechaenlaquesereporta) ?? "N/A",
      "Fecha de ingreso": toISODateFlex(row.FechaIngreso),
      "Empresa solicitante": row.Empresaalaquepertenece ?? "N/A",      
      Ciudad: row.Ciudad ?? "N/A",
      Cargo: row.Cargo ?? "N/A",
      "Nivel de cargo": row.Niveldecargo ?? "N/A",
      "¿Cargo crítico?": row.CargoCritico ?? "N/A",
      Dependencia: row.Dependencia ?? "N/A",
      "Centro de costos": (row.CodigoCC ?? "Sin código") + " - " + (row.DescripcionCC ?? "Desconocido"),
      "Centro operativo": (row.CodigoCO ?? "Sin código") + " - " + (row.DescripcionCO ?? "Desconocido"),
      "Unidad de negocio": (row.CodigoUN ?? "Sin código") + " - " + (row.DescripcionUN ?? "Desconocido"),
      Salario: row.Salario ? formatPesosEsCO(row.Salario) : "N/A",
      "Salario en letras": row.SalarioTexto ?? "N/A",
      "Auxilio de conectividad": formatPesosEsCO(row.auxConectividadValor) ?? "N/A",
      "Auxilio de conectividad en letras": row.auxConectividadTexto ?? "N/A",
      "% Completación": pct === undefined ? "N/A" : `${pct.toFixed(2)}%`,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cesaciones");

  XLSX.writeFile(wb, opts?.fileName ?? "ReporteCesaciones.xlsx");
}

export async function exportRetailToExcel(
  rows: Retail[],
  detallesPasosRetailSvc: GetAllSvc<PasoLike>,
  opts?: { fileName?: string }
) {
  const ids = rows.map((r) => String(r.Id ?? "")).filter(Boolean);
  const pctById = await computePctById(ids, detallesPasosRetailSvc, { concurrency: 10 });

  const data = rows.map((row) => {
    const id = String(row.Id ?? "");
    const pct = pctById[id];

    return {
      "Información enviada por": row.InformacionEnviadaPor ?? "N/A",
      "Tipo de documento": row.TipoDoc ?? "N/A",
      "Número de documento": row.Title ?? "N/A",
      "Nombre del seleccionado": row.Nombre ?? "N/A",
      "Correo electrónico del seleccionado": row.CorreoElectronico ?? "N/A",
      "Fecha en la que se reportó": toISODateFlex(row.FechaReporte) ?? "N/A",
      "Fecha de ingreso": toISODateFlex(row.FechaIngreso),
      "Empresa solicitante": row.Empresaalaquepertenece ?? "N/A",    
      Ciudad: row.Ciudad ?? "N/A",
      Cargo: row.Cargo ?? "N/A",
      "Nivel de cargo": row.NivelCargo ?? "N/A",
      Dependencia: row.Depedencia ?? "N/A",
      "Centro de costos": (row.CodigoCentroCostos ?? "Sin código") + " - " + (row.CentroCostos ?? "Desconocido"),
      "Centro operativo": (row.CodigoCentroOperativo ?? "Sin código") + " - " + (row.CentroOperativo ?? "Desconocido"),
      "Unidad de negocio": (row.CodigoUnidadNegocio ?? "Sin código") + " - " + (row.UnidadNegocio ?? "Desconocido"),
      Salario: row.Salario ? formatPesosEsCO(row.Salario) : "N/A",
      "Salario en letras": row.SalarioLetras ?? "N/A",
      "Auxilio de conectividad": formatPesosEsCO(row.Auxiliodetransporte) ?? "N/A",
      "Auxilio de conectividad en letras": row.Auxiliotransporteletras ?? "N/A",
      "% Completación": pct === undefined ? "N/A" : `${pct.toFixed(2)}%`,
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Retail");

  XLSX.writeFile(wb, opts?.fileName ?? "ReporteRetail.xlsx");
}
