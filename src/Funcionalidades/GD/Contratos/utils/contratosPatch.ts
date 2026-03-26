import type { Novedad } from "../../../../models/Novedades";
import { normalize, normalizeDate } from "../../../../utils/Date";

const fields: (keyof Novedad)[] = [
  "Title", "AUTONOM_x00cd_A_x0020_", "Ajustesalario", "Aprendiz", "Auxilio_x0020_de_x0020_rodamient", "Auxilio_x0020_de_x0020_rodamient0", "Auxilioderodamientosiono", "BARRIO_x0020_",
  "CARGO", "CARGO_x0020_CRITICO", "CELULAR_x0020_", "CENTRO_x0020_OPERATIVO_x0020_", "CIUDAD", "CODIGO_x0020_CENTRO_x0020_DE_x00", "CONTRIBUCION_x0020_A_x0020_LA_x0", "CORREO_x0020_ELECTRONICO_x0020_",
  "Coordinadordepracticas", "DEPENDENCIA_x0020_", "DESCRIPCION_x0020_CENTRO_x0020_O", "DESCRIPCION_x0020_DE_x0020_CENTR", "DIRECCION_x0020_DE_x0020_DOMICIL", "Departamento",
  "ESPECIFICIDAD_x0020_DEL_x0020_CA", "Empresa_x0020_que_x0020_solicita", "Especialidad", "Etapa", "GARANTIZADO_x0020__x0020__x00bf_", "GRUPO_x0020_CVE_x0020_", "Garantizado_x0020_en_x0020_letra", "HERRAMIENTAS_x0020_QUE_x0020_POS",
  "ID_x0020_UNIDAD_x0020_DE_x0020_N", "IMPACTO_x0020_CLIENTE_x0020_EXTE", "LugarExpedicion", "MODALIDAD_x0020_TELETRABAJO", "NIVEL_x0020_DE_x0020_CARGO", "NitUniversidad", 
  "NombreSeleccionado", "Numero_x0020_identificaci_x00f3_", "ORIGEN_x0020_DE_x0020_LA_x0020_S", "PERSONAS_x0020_A_x0020_CARGO", "PRESUPUESTO_x0020_VENTAS_x002f_M", "PROMEDIO_x0020_",
  "Pertenecealmodelo", "Practicante", "Programa", "SALARIO", "SALARIO_x0020_AJUSTADO", "SE_x0020_DEBE_x0020_HACER_x0020_", "TIPO_x0020_DE_x0020_CONTRATO", "TEMPORAL", 
  "TIPO_x0020_DE_x0020_VACANTE_x002", "Tipo_x0020_de_x0020_documento_x0", "UNIDAD_x0020_DE_x0020_NEGOCIO_x0", "Universidad", "VALOR_x0020_GARANTIZADO", "auxconectividadtexto",
  "salariotexto", "tipodoc", 
];

const dateFields: (keyof Novedad)[] = [
  "FECHA_x0020_DE_x0020_AJUSTE_x002", "FECHA_x0020_DE_x0020_ENTREGA_x00", "FECHA_x0020_HASTA_x0020_PARA_x00", "FECHA_x0020_REQUERIDA_x0020_PARA", 
  "FECHA_x0020_REQUERIDA_x0020_PARA0", "FechaFinalLectiva", "FechaFinalProductiva", "FechaInicioLectiva", "FechaInicioProductiva", "FechaNac"
];

export function buildContratosPatch(original: Novedad, next: Novedad) {
  const patch: Record<string, any> = {};

  for (const k of fields) {
    const a = normalize(original[k]);
    const b = normalize(next[k]);
    if (a !== b) patch[k] = b;
  }

  for (const k of dateFields) {
    const a = normalizeDate(original[k]);
    const b = normalizeDate(next[k]);
    if (a !== b) patch[k] = b;
  }
  console.log(patch)
  return patch;
}