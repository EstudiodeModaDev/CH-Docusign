import type { Cesacion } from "../../../../models/Cesaciones";
import type { HabeasData } from "../../../../models/HabeasData";
import type { Novedad } from "../../../../models/Novedades";
import type { Promocion } from "../../../../models/Promociones";
import type { Retail } from "../../../../models/Retail";
import type { detalle, } from "../../../../models/solicitudCambio";
import { buildCesacionPatch } from "../../Cesaciones/utils/cesacionPatch";
import { buildContratosPatch } from "../../Contratos/utils/contratosPatch";
import { buildHabeasPatch, buildPromocionesPatch } from "../../Habeas/utils/habeasPatch";
import { buildRetailPatch } from "../../Retail/utils/RetailPatch";

export const contratosFieldMeta: Record<string, { etiqueta: string; tipoDato: string }> = {
  CARGO:                            {etiqueta: "Cargo", tipoDato: "Texto",},
  SALARIO:                          {etiqueta: "Salario", tipoDato: "Texto",},
  salariotexto:                     {etiqueta: "Salario en letras", tipoDato: "Texto"},
  auxconectividadvalor:             {etiqueta: "Auxilio de conectividad", tipoDato: "Texto",},
  auxconectividadtexto:             {etiqueta: "Auxilio de conectividad en letras", tipoDato: "Texto",},  
  PROMEDIO_x0020_:                  {etiqueta: "Promedio CVE", tipoDato: "Texto",},
  DEPENDENCIA_x0020_:               {etiqueta: "Dependecia", tipoDato: "Texto",},
  CIUDAD:                           {etiqueta: "Ciudad", tipoDato: "Texto",},
  tipodoc:                          {etiqueta: "Tipo de documento", tipoDato: "Texto",},
  Departamento:                     {etiqueta: "Departamento", tipoDato: "Texto",},
  NombreSeleccionado:               {etiqueta: "Nombre", tipoDato: "Texto",},
  Pertenecealmodelo:                {etiqueta: "Pertenece al modelo", tipoDato: "Texto",},
  Empresa_x0020_que_x0020_solicita: {etiqueta: "Empresa", tipoDato: "Texto",},
  Tipo_x0020_de_x0020_documento_x0: {etiqueta: "Tipo de documento corto", tipoDato: "Texto",},
  Numero_x0020_identificaci_x00f3_: {etiqueta: "Numero de documento", tipoDato: "Texto",},
  CORREO_x0020_ELECTRONICO_x0020_:  {etiqueta: "Correo electronico", tipoDato: "Texto",},
  CELULAR_x0020_:                   {etiqueta: "Celular", tipoDato: "Texto",},
  DIRECCION_x0020_DE_x0020_DOMICIL: {etiqueta: "Dirección", tipoDato: "Texto",},
  BARRIO_x0020_:                    {etiqueta: "Barrio", tipoDato: "Texto",},
  ESPECIFICIDAD_x0020_DEL_x0020_CA: {etiqueta: "Especificdad del cargo", tipoDato: "Texto",},
  NIVEL_x0020_DE_x0020_CARGO:       {etiqueta: "Nivel de cargo", tipoDato: "Texto",},
  CARGO_x0020_CRITICO:              {etiqueta: "Cargo critico", tipoDato: "Texto",},
  CODIGO_x0020_CENTRO_x0020_DE_x00: {etiqueta: "Codigo centro de costos", tipoDato: "Texto",},
  DESCRIPCION_x0020_DE_x0020_CENTR: {etiqueta: "Descripción centro de costos", tipoDato: "Texto",},
  CENTRO_x0020_OPERATIVO_x0020_:    {etiqueta: "Codigo centro operativo", tipoDato: "Texto",},
  DESCRIPCION_x0020_CENTRO_x0020_O: {etiqueta: "Descripción centro operativo", tipoDato: "Texto",},
  UNIDAD_x0020_DE_x0020_NEGOCIO_x0: {etiqueta: "Descripción unidad de negocio", tipoDato: "Texto",},
  ID_x0020_UNIDAD_x0020_DE_x0020_N: {etiqueta: "Codigo unidad de negocio", tipoDato: "Texto",},
  PERSONAS_x0020_A_x0020_CARGO:     {etiqueta: "Personas a cargo", tipoDato: "Texto",},
  ORIGEN_x0020_DE_x0020_LA_x0020_S: {etiqueta: "Origen de la selección", tipoDato: "Texto",},
  TIPO_x0020_DE_x0020_CONTRATO:     {etiqueta: "Tipo de contrato", tipoDato: "Texto",},
  TIPO_x0020_DE_x0020_VACANTE_x002: {etiqueta: "Tipo de vacante", tipoDato: "Texto",},
  MODALIDAD_x0020_TELETRABAJO:      {etiqueta: "Modalidad de trabajo", tipoDato: "Texto",},
  FECHA_x0020_REQUERIDA_x0020_PARA: {etiqueta: "Fecha requeridad para la finalización", tipoDato: "Texto",},
  FECHA_x0020_HASTA_x0020_PARA_x00: {etiqueta: "Fecha hasta para el personal fijo", tipoDato: "Texto",},
  FECHA_x0020_DE_x0020_AJUSTE_x002: {etiqueta: "Fecha de ajuste academico", tipoDato: "Texto",},
  FECHA_x0020_DE_x0020_ENTREGA_x00: {etiqueta: "Fecha de entrega valoración de potencial", tipoDato: "Texto",},
  GARANTIZADO_x0020__x0020__x00bf_: {etiqueta: "Garantizado si o no", tipoDato: "Texto",},
  VALOR_x0020_GARANTIZADO:          {etiqueta: "Valor del garantizado", tipoDato: "Texto",},
  Garantizado_x0020_en_x0020_letra: {etiqueta: "Garantizado en letras", tipoDato: "Texto",},
  PRESUPUESTO_x0020_VENTAS_x002f_M: {etiqueta: "Presupuesto magnitud de ventas", tipoDato: "Texto",},
  AUTONOM_x00cd_A_x0020_:           {etiqueta: "Autonomía", tipoDato: "Texto",},
  IMPACTO_x0020_CLIENTE_x0020_EXTE: {etiqueta: "Impacto cliente externo", tipoDato: "Texto",},
  CONTRIBUCION_x0020_A_x0020_LA_x0: {etiqueta: "Contribución a la estrategia", tipoDato: "Texto",},
  GRUPO_x0020_CVE_x0020_:           {etiqueta: "Grupo CVE", tipoDato: "Texto",},
  SE_x0020_DEBE_x0020_HACER_x0020_: {etiqueta: "Se debe hacer cargue de nuevo equipo de trabajo", tipoDato: "Texto",},
  FECHA_x0020_REQUERIDA_x0020_PARA0:{etiqueta: "Fecha requeridad para el ingreso", tipoDato: "Texto",},
  Auxilio_x0020_de_x0020_rodamient: {etiqueta: "Auxilio de rodamiento", tipoDato: "Texto",},
  Auxilio_x0020_de_x0020_rodamient0:{etiqueta: "Auxlio de rodamiento en letras", tipoDato: "Texto",},
  Ajustesalario:                    {etiqueta: "Ajuste de salario", tipoDato: "Boolean",},
  Auxilioderodamientosiono:         {etiqueta: "Auxilio de rodamiento si o no", tipoDato: "Boolean",},
  Universidad:                      {etiqueta: "Universidad", tipoDato: "Texto",},
  NitUniversidad:                   {etiqueta: "Nit Universidad", tipoDato: "Texto",},
  FechaNac:                         {etiqueta: "Fecha de nacimiento", tipoDato: "Texto",},
  Coordinadordepracticas:           {etiqueta: "Coordinador de practicas", tipoDato: "Texto",},
  Especialidad:                     {etiqueta: "Cargo critico", tipoDato: "Texto",},
  FechaInicioLectiva:               {etiqueta: "Fecha de inicio etapa lectiva", tipoDato: "Texto",},
  FechaFinalLectiva:                {etiqueta: "Fecha final etapa lectiva", tipoDato: "Texto",},
  FechaInicioProductiva:            {etiqueta: "Fecha inicio etapa productiva", tipoDato: "Texto",},
  FechaFinalProductiva:             {etiqueta: "Fecha final etapa productiva", tipoDato: "Texto",},
  Etapa:                            {etiqueta: "Etapa", tipoDato: "Texto",},
  Practicante:                      {etiqueta: "Practicante", tipoDato: "Boolean",},
  Aprendiz:                         {etiqueta: "Aprendiz", tipoDato: "Boolean",},
  Programa:                         {etiqueta: "Programa", tipoDato: "Texto",},
  LugarExpedicion:                  {etiqueta: "LugarExpedicion", tipoDato: "Texto",},
};

function normalizeDetailValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

export function detallePayloadFromContrato(original: Novedad, next: Novedad, solicitudId: string): detalle[] {
  const patch = buildContratosPatch(original, next);

  return Object.keys(patch).map((key) => {
    const meta = contratosFieldMeta[key] ?? {
      etiqueta: key,
      tipoDato: "Texto",
    };

    return {
      Title: solicitudId,
      NombreCampo: key,
      EtiquetaCampo: meta.etiqueta,
      TipoDato: meta.tipoDato,
      ValorAnterior: normalizeDetailValue(original[key as keyof Novedad]),
      ValorNuevo: normalizeDetailValue(next[key as keyof Novedad]),
    };
  });
}

export function detallePayloadFromCesacion(original: Cesacion, next: Cesacion, solicitudId: string): detalle[] {
  const patch = buildCesacionPatch(original, next);

  return Object.keys(patch).map((key) => {
    const meta = contratosFieldMeta[key] ?? {
      etiqueta: key,
      tipoDato: "Texto",
    };

    return {
      Title: solicitudId,
      NombreCampo: key,
      EtiquetaCampo: meta.etiqueta,
      TipoDato: meta.tipoDato,
      ValorAnterior: normalizeDetailValue(original[key as keyof Cesacion]),
      ValorNuevo: normalizeDetailValue(next[key as keyof Cesacion]),
    };
  });
}

export function detallePayloadFromHabeas(original: HabeasData, next: HabeasData, solicitudId: string): detalle[] {
  const patch = buildHabeasPatch(original, next);

  return Object.keys(patch).map((key) => {
    const meta = contratosFieldMeta[key] ?? {
      etiqueta: key,
      tipoDato: "Texto",
    };

    return {
      Title: solicitudId,
      NombreCampo: key,
      EtiquetaCampo: meta.etiqueta,
      TipoDato: meta.tipoDato,
      ValorAnterior: normalizeDetailValue(original[key as keyof HabeasData]),
      ValorNuevo: normalizeDetailValue(next[key as keyof HabeasData]),
    };
  });
}

export function detallePayloadFromPromocion(original: Promocion, next: Promocion, solicitudId: string): detalle[] {
  const patch = buildPromocionesPatch(original, next);

  return Object.keys(patch).map((key) => {
    const meta = contratosFieldMeta[key] ?? {
      etiqueta: key,
      tipoDato: "Texto",
    };

    return {
      Title: solicitudId,
      NombreCampo: key,
      EtiquetaCampo: meta.etiqueta,
      TipoDato: meta.tipoDato,
      ValorAnterior: normalizeDetailValue(original[key as keyof Promocion]),
      ValorNuevo: normalizeDetailValue(next[key as keyof Promocion]),
    };
  });
}

export function detallePayloadFromRetail(original: Retail, next: Retail, solicitudId: string): detalle[] {
  const patch = buildRetailPatch(original, next);

  return Object.keys(patch).map((key) => {
    const meta = contratosFieldMeta[key] ?? {
      etiqueta: key,
      tipoDato: "Texto",
    };

    return {
      Title: solicitudId,
      NombreCampo: key,
      EtiquetaCampo: meta.etiqueta,
      TipoDato: meta.tipoDato,
      ValorAnterior: normalizeDetailValue(original[key as keyof Retail]),
      ValorNuevo: normalizeDetailValue(next[key as keyof Retail]),
    };
  });
}