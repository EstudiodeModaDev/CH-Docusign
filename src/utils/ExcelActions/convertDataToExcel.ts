import type { Cesacion } from "../../models/Cesaciones";
import type { Envio } from "../../models/Envios";
import type { HabeasData } from "../../models/HabeasData";
import type { Novedad } from "../../models/Novedades";
import type { Promocion } from "../../models/Promociones";
import type { Retail } from "../../models/Retail";
import { computePctById, type GetAllSvc, type PasoLike } from "../completation";
import { toISODateFlex } from "../Date";
import { formatPesosEsCO } from "../Number";

export function buildEnviosData(rows: Envio[]) {
  return rows.map((row) => ({
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
}

export function buildHabeasData(rows: HabeasData[],) {

  return rows.map((row) => ({
    "Información enviada por": row.Informacionreportadapor ?? "N/A",
    "Fecha en la que se reportó": toISODateFlex(row.Fechaenlaquesereporta) ?? "N/A",
    "Tipo de documento": row.Tipodoc ?? "N/A",
    Abreviación: row.AbreviacionTipoDoc ?? "N/A",
    "Número de documento": row.NumeroDocumento ?? "N/A",
    "Nombre del seleccionado": row.Title ?? "N/A",
    "Correo electrónico del seleccionado": row.Correo ?? "N/A",
    Ciudad: row.Ciudad ?? "N/A",
  }));
}

export async function buildNovedadesData(rows: Novedad[], detallesPasosNovedadSvc: GetAllSvc<PasoLike>) {
  const ids = rows.map((r) => String(r.Id ?? "")).filter(Boolean);
  const pctById = await computePctById(ids, detallesPasosNovedadSvc, { concurrency: 10 });

  return rows.map((row) => {
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
      "Fecha requerida para el ingreso":
        toISODateFlex(row.FECHA_x0020_REQUERIDA_x0020_PARA0) ?? "N/A",
      "Empresa solicitante": row.Empresa_x0020_que_x0020_solicita ?? "N/A",
      Ciudad: row.CIUDAD ?? "N/A",
      Cargo: row.CARGO ?? "N/A",
      "Especificidad del cargo": row.ESPECIFICIDAD_x0020_DEL_x0020_CA ?? "N/A",
      "Nivel de cargo": row.NIVEL_x0020_DE_x0020_CARGO ?? "N/A",
      "¿Cargo crítico?": row.CARGO_x0020_CRITICO ?? "N/A",
      Dependencia: row.DEPENDENCIA_x0020_ ?? "N/A",
      Estado: row.Estado ?? "N/A",
      "% Completación": pct === undefined ? "N/A" : `${pct.toFixed(2)}%`,
    };
  });
}

export async function buildPromocionesData(rows: Promocion[], detallesPasosPromocionSvc: GetAllSvc<PasoLike>,) {
  const ids = rows.map((r) => String(r.Id ?? "")).filter(Boolean);
  const pctById = await computePctById(ids, detallesPasosPromocionSvc, { concurrency: 10 });

  return rows.map((row) => {
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
      Estado: row.Estado,
      "% Completación": pct === undefined ? "N/A" : `${pct.toFixed(2)}%`,
    };
  });
}

export async function buildCesacionesData(rows: Cesacion[], detallesPasosPromocionSvc: GetAllSvc<PasoLike>,) {
  const ids = rows.map((r) => String(r.Id ?? "")).filter(Boolean);
  const pctById = await computePctById(ids, detallesPasosPromocionSvc, { concurrency: 10 });

  return rows.map((row) => {
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
      Estado: row.Estado,
      "% Completación": pct === undefined ? "N/A" : `${pct.toFixed(2)}%`,
    };
  });
}

export async function buildRetailData(rows: Retail[], detallesPasosPromocionSvc: GetAllSvc<PasoLike>,) {
  const ids = rows.map((r) => String(r.Id ?? "")).filter(Boolean);
  const pctById = await computePctById(ids, detallesPasosPromocionSvc, { concurrency: 10 });

  return rows.map((row) => {
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
      Estado: row.Estado,
      "% Completación": pct === undefined ? "N/A" : `${pct.toFixed(2)}%`,
    };
  });
}



