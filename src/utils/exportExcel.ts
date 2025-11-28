// src/utils/exportExcel.ts
import * as XLSX from "xlsx";
import type { Envio } from "../models/Envios";
import type { Novedad } from "../models/Novedades";
import { toISODateFlex } from "./Date";
import { toNumberFromEsCO } from "./Number";
import type { Promocion } from "../models/Promociones";
import type { HabeasData } from "../models/HabeasData";


export function exportEnviosToExcel(rows: Envio[], opts?: { fileName?: string }) {
  // 1) Mapeas tus rows al formato que quieres en el Excel
  const data = rows.map(row => ({
    "Documento enviado": row.Title,
    "Destinatario": row.Receptor,
    "Correo Receptor": row.CorreoReceptor,
    "Cedula": row.Cedula,
    "Enviado por": row.EnviadoPor,
    "Fecha de envio": row.Fechadeenvio,
    "Fuente": row.Fuente,
    "Compañia que solicita": row.Compa_x00f1_ia,
    "Estado": row.Estado === "Sent" ? "Enviado" : row.Estado === "Completed" ? "Completado":  row.Estado === "Declined" ? "Rechazado" : row.Estado, 
  }));

  // 2) Crear hoja a partir de JSON
  const ws = XLSX.utils.json_to_sheet(data);

  // 3) Crear libro y anexar hoja
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Envios");

  // 4) Descargar archivo
  const fileName = opts?.fileName ?? "ReporteEnvios.xlsx";
  XLSX.writeFile(wb, fileName);
}

export function exportNovedadesToExcel(rows: Novedad[], opts?: { fileName?: string }) {
  // 1) Mapeas tus rows al formato que quieres en el Excel
  const data = rows.map(row => ({
    "Información enviada por": row.Informaci_x00f3_n_x0020_enviada_ ?? "N/A",
    "Feha en la que se reporto": toISODateFlex(row.FechaReporte) ?? "N/A",
    "Tipo de documento": row.tipodoc ?? "N/A",
    "Abreviacion": row.Tipo_x0020_de_x0020_documento_x0 ?? "N/A",
    "Numero de documento": row.Numero_x0020_identificaci_x00f3_ ?? "N/A",
    "Nombre del seleccionado": row.NombreSeleccionado ?? "N/A",
    "Correo electronico del seleccionado": row.CORREO_x0020_ELECTRONICO_x0020_ ?? "N/A",
    "Celular del seleccionado": row.CELULAR_x0020_ ?? "N/A",
    "Dirección": row.DIRECCION_x0020_DE_x0020_DOMICIL ?? "N/A",
    "Barrio": row.BARRIO_x0020_ ?? "N/A",
    "Fecha requerida para el ingreso": row.FECHA_x0020_REQUERIDA_x0020_PARA0 ?? "N/A",
    "Empresa solicitante": row.Empresa_x0020_que_x0020_solicita ?? "N/A",
    "Ciudad": row.CIUDAD ?? "N/A", 
    "Cargo": row.CARGO ?? "N/A",
    "Especifidad del cargo": row.ESPECIFICIDAD_x0020_DEL_x0020_CA ?? "N/A",
    "Nivel de cargo": row.NIVEL_x0020_DE_x0020_CARGO ?? "N/A",
    "¿Cargo critico?": row.CARGO_x0020_CRITICO ?? "N/A",
    "Dependencia": row.DEPENDENCIA_x0020_ ?? "N/A",
    "Centro de costos": row.CODIGO_x0020_CENTRO_x0020_DE_x00 + " - " + row.DESCRIPCION_x0020_DE_x0020_CENTR,
    "Centro operativo": row.CENTRO_x0020_OPERATIVO_x0020_ + " - " + row.DESCRIPCION_x0020_CENTRO_x0020_O ,
    "Unidad de negocio": row.ID_x0020_UNIDAD_x0020_DE_x0020_N + " - " + row.UNIDAD_x0020_DE_x0020_NEGOCIO_x0,
    "Personas a cargo": row.PERSONAS_x0020_A_x0020_CARGO ?? "N/A",
    "Temporal": row.TEMPORAL ?? "N/A",
    "Origen de la selección": row.ORIGEN_x0020_DE_x0020_LA_x0020_S ?? "N/A",
    "Tipo de trabajo": row.MODALIDAD_x0020_TELETRABAJO ?? "N/A",
    "Tipo de vacante": row.TIPO_x0020_DE_x0020_VACANTE_x002 ?? "N/A",
    "Tipo de contrato": row.TIPO_x0020_DE_x0020_CONTRATO ?? "N/A",
    "Fecha de ajuste academico": toISODateFlex(row.FECHA_x0020_DE_x0020_AJUSTE_x002) ?? "N/A",
    "Fecha de entrega de valoración de potencial": toISODateFlex(row.FECHA_x0020_DE_x0020_ENTREGA_x00) ?? "N/A",
    "Salario": row.SALARIO ? toNumberFromEsCO(row.SALARIO) : "N/A",
    "Salario en letras": row.salariotexto ?? "N/A",
    "Tiene garantizado": row.GARANTIZADO_x0020__x0020__x00bf_ ?? "N/A",
    "Valor garantizado": row.VALOR_x0020_GARANTIZADO ? toNumberFromEsCO(row.VALOR_x0020_GARANTIZADO) : "N/A", 
    "Garantizado en letras": row.Garantizado_x0020_en_x0020_letra ?? "N/A",
    "Auxilio de conectividad": row.auxconectividadvalor ?? "N/A",
    "Auxilio de conectividad en letras": row.auxconectividadtexto ?? "N/A",
    "Auxilio de rodamiento": row.Auxilio_x0020_de_x0020_rodamient ?? "N/A",
    "Auxilio de rodamiento en letras": row.Auxilio_x0020_de_x0020_rodamient0 ?? "N/A",
    "¿Pertenece al modelo?": row.Pertenecealmodelo ? "Si" : "No",
    "Presupuesto ventas/Magnitud economica": row.PRESUPUESTO_x0020_VENTAS_x002f_M ?? "N/A",
    "Autonomia": row.AUTONOM_x00cd_A_x0020_ ?? "N/A",
    "Impacto cliente externo": row.IMPACTO_x0020_CLIENTE_x0020_EXTE ?? "N/A",
    "Contribución a la estrategia": row.CONTRIBUCION_x0020_A_x0020_LA_x0 ?? "N/A",
    "Promedio": row.Pertenecealmodelo ? row.PROMEDIO_x0020_ : "N/A",
    "Grupo CVE": row.GRUPO_x0020_CVE_x0020_ ?? "N/A",
    "Herramienta que posee el colaborador": row.HERRAMIENTAS_x0020_QUE_x0020_POS ?? "N/A",
    "Se debe hacer cargue de nuevo equipo de trabajo": row.SE_x0020_DEBE_x0020_HACER_x0020_ ?? "N/A",
  }));

  // 2) Crear hoja a partir de JSON
  const ws = XLSX.utils.json_to_sheet(data);

  // 3) Crear libro y anexar hoja
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "NovedadesAdministrativas");

  // 4) Descargar archivo
  const fileName = opts?.fileName ?? "ReporteNovedadesAdministrativas.xlsx";
  XLSX.writeFile(wb, fileName);
}

export function exportPromocionesToExcel(rows: Promocion[], opts?: { fileName?: string }) {
  // 1) Mapeas tus rows al formato que quieres en el Excel
  const data = rows.map(row => ({
    "Información enviada por": row.InformacionEnviadaPor ?? "N/A",
    "Tipo de documento": row.TipoDoc ?? "N/A",
    "Abreviacion": row.AbreviacionTipoDoc ?? "N/A",
    "Numero de documento": row.NumeroDoc ?? "N/A",
    "Nombre del seleccionado": row.NombreSeleccionado ?? "N/A",
    "Correo electronico del seleccionado": row.Correo ?? "N/A",
    "Fecha requerida para la promoción": row.FechaIngreso ?? "N/A",
    "Empresa solicitante": row.EmpresaSolicitante ?? "N/A",
    "Ciudad": row.Ciudad ?? "N/A", 
    "Cargo": row.Cargo ?? "N/A",
    "Especifidad del cargo": row.EspecificidadCargo ?? "N/A",
    "Nivel de cargo": row.NivelCargo ?? "N/A",
    "¿Cargo critico?": row.CargoCritico ?? "N/A",
    "Dependencia": row.Dependencia ?? "N/A",
    "Centro de costos": row.CodigoCentroCostos + " - " + row.DescripcionCentroCostos,
    "Centro operativo": row.CentroOperativo + " - " + row.DescripcionCentroOperativo ,
    "Unidad de negocio": row.IDUnidadNegocio + " - " + row.UnidadNegocio,
    "Personas a cargo": row.PersonasCargo ?? "N/A",
    "Tipo de trabajo": row.ModalidadTeletrabajo ?? "N/A",
    "Tipo de vacante": row.TipoVacante ?? "N/A",
    "Tipo de contrato": row.TipoContrato ?? "N/A",
    "Fecha de ajuste academico": toISODateFlex(row.FechaAjusteAcademico) ?? "N/A",
    "Fecha de entrega de valoración de potencial": toISODateFlex(row.FechaValoracionPotencial) ?? "N/A",
    "Salario": row.Salario ? toNumberFromEsCO(row.Salario) : "N/A",
    "Salario en letras": row.SalarioTexto ?? "N/A",
    "Tiene garantizado": row.Garantizado_x00bf_SiNo_x003f_ ?? "N/A",
    "Valor garantizado": row.ValorGarantizado ? toNumberFromEsCO(row.ValorGarantizado) : "N/A", 
    "Garantizado en letras": row.GarantizadoLetras ?? "N/A",
    "Auxilio de conectividad": row.AuxilioValor ?? "N/A",
    "Auxilio de conectividad en letras": row.AuxilioTexto ?? "N/A",
    "Auxilio de rodamiento": row.AuxilioRodamiento ?? "N/A",
    "Auxilio de rodamiento en letras": row.AuxilioRodamientoLetras ?? "N/A",
    "¿Pertenece al modelo?": row.PerteneceModelo ? "Si" : "No",
    "Presupuesto ventas/Magnitud economica": row.PresupuestoVentasMagnitudEconomi ?? "N/A",
    "Autonomia": row.Autonomia ?? "N/A",
    "Impacto cliente externo": row.ImpactoClienteExterno ?? "N/A",
    "Contribución a la estrategia": row.ContribucionaLaEstrategia ?? "N/A",
    "Promedio": row.PerteneceModelo ? row.Promedio : "N/A",
    "Grupo CVE": row.GrupoCVE ?? "N/A",
    "Herramienta que posee el colaborador": row.HerramientasColaborador ?? "N/A",
    "Se debe hacer cargue de nuevo equipo de trabajo": row.CargueNuevoEquipoTrabajo ?? "N/A",
  }));

  // 2) Crear hoja a partir de JSON
  const ws = XLSX.utils.json_to_sheet(data);

  // 3) Crear libro y anexar hoja
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Promociones");

  // 4) Descargar archivo
  const fileName = opts?.fileName ?? "ReportePromociones.xlsx";
  XLSX.writeFile(wb, fileName);
}

export function exportHabeasToExcel(rows: HabeasData[], opts?: { fileName?: string }) {
  // 1) Mapeas tus rows al formato que quieres en el Excel
  const data = rows.map(row => ({
    "Información enviada por": row.Informacionreportadapor ?? "N/A",
    "Fecha en la que se reporto": toISODateFlex(row.Fechaenlaquesereporta) ?? "N/A",
    "Tipo de documento": row.Tipodoc ?? "N/A",
    "Abreviacion": row.AbreviacionTipoDoc ?? "N/A",
    "Numero de documento": row.NumeroDocumento ?? "N/A",
    "Nombre del seleccionado": row.Title ?? "N/A",
    "Correo electronico del seleccionado": row.Correo ?? "N/A",
    "Ciudad": row.Ciudad ?? "N/A", 
  }));

  // 2) Crear hoja a partir de JSON
  const ws = XLSX.utils.json_to_sheet(data);

  // 3) Crear libro y anexar hoja
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "HabeasData");

  // 4) Descargar archivo
  const fileName = opts?.fileName ?? "ReporteHabeasData.xlsx";
  XLSX.writeFile(wb, fileName);
}

