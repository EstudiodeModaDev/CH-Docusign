import type { Cesacion } from "../../../../../models/Cesaciones";
import type { DocuSignVM } from "../../../../../models/DTO";
import type { HabeasData } from "../../../../../models/HabeasData";
import type { Novedad } from "../../../../../models/Novedades";
import type { Promocion } from "../../../../../models/Promociones";
import type { Retail } from "../../../../../models/Retail";
import { DDMMYYYY, spDateToSpanishLong } from "../../../../../utils/Date";
import { formatNIT } from "../../../../../utils/mail";
export type Proceso = "Promocion" | "Habeas" | "Nuevo" | "Cesacion" | "Retail";

const emptyVM = (): DocuSignVM => ({
  nombre: "",
  fechaIngreso: "",
  cargo: "",
  ciudad: "",
  conectividadLetras: "",
  conectividadValor: "",
  garantizadoValor: "",
  garantizadoLetras: "",
  identificacion: "",
  salarioLetras: "",
  salarioValor: "",
  tipoDoc: "",
  tipoDocCorto: "",
  tipoTel: "",
  coordinador: "",
  especialidad: "",
  etapa: "",
  fechaFinalLectiva: "",
  fechaFinalProductiva: "",
  fechaInicioLectiva: "",
  fechaInicioProductiva: "",
  fechaNac: "",
  nitUniversidad: "",
  universidad: "",
  fechaFinal: "",
  ciudadExpedicion: "",
  FechaLetras: "",
  ciudadExpe: "",
  departamento: ""
});

export function mapPromocionToVM(p: Promocion): DocuSignVM {
  return {
    ...emptyVM(),
    nombre: p.NombreSeleccionado ?? "",
    fechaIngreso: p.FechaIngreso ?? "",
    cargo: p.Cargo ?? "",
    ciudad: p.Ciudad ?? "",
    conectividadLetras: p.AuxilioTexto ?? "",
    conectividadValor: p.AuxilioValor ?? "",
    garantizadoValor: p.ValorGarantizado ?? "",
    garantizadoLetras: p.GarantizadoLetras ?? "",
    identificacion: p.NumeroDoc ?? "",
    salarioLetras: p.SalarioTexto ?? "",
    salarioValor: p.Salario ?? "",
    tipoDoc: p.TipoDoc ?? "",
    tipoDocCorto: p.AbreviacionTipoDoc ?? "",
    tipoTel: p.ModalidadTeletrabajo ?? "",
    FechaLetras: spDateToSpanishLong(p.FechaIngreso),
    departamento: p.Departamento
  };  
}

export function mapNovedadToVM(n: Novedad): DocuSignVM {
  return {
    ...emptyVM(),
    nombre: n.NombreSeleccionado ?? "",
    fechaIngreso: DDMMYYYY(n.FECHA_x0020_REQUERIDA_x0020_PARA0) ?? "",
    cargo: n.CARGO ?? "",
    ciudad: n.CIUDAD ?? "",
    conectividadLetras: n.auxconectividadtexto ?? "",
    conectividadValor: n.auxconectividadvalor ?? "",
    garantizadoValor: n.VALOR_x0020_GARANTIZADO ?? "",
    garantizadoLetras: n.Garantizado_x0020_en_x0020_letra ?? "",
    identificacion: n.Numero_x0020_identificaci_x00f3_ ?? "",
    salarioLetras: n.salariotexto ?? "",
    salarioValor: n.SALARIO ?? "",
    tipoDoc: n.tipodoc ?? "",
    tipoDocCorto: n.Tipo_x0020_de_x0020_documento_x0 ?? "",
    tipoTel: n.MODALIDAD_x0020_TELETRABAJO ?? "",
    coordinador: n.Coordinadordepracticas,
    especialidad: n.Especialidad,
    etapa: n.Etapa,
    fechaFinalLectiva: DDMMYYYY(n.FechaFinalLectiva),
    fechaFinalProductiva: DDMMYYYY(n.FechaFinalProductiva),
    fechaInicioLectiva: DDMMYYYY(n.FechaInicioLectiva),
    fechaInicioProductiva: DDMMYYYY(n.FechaInicioProductiva),
    fechaNac: DDMMYYYY(n.FechaNac),
    fechaFinal: DDMMYYYY(n.FECHA_x0020_REQUERIDA_x0020_PARA),
    FechaLetras: spDateToSpanishLong(n.FECHA_x0020_REQUERIDA_x0020_PARA0),
    nitUniversidad: formatNIT(n.NitUniversidad),
    universidad: n.Universidad,
    ciudadExpedicion: n.LugarExpedicion,
    ciudadExpe: n.LugarExpedicion,
  };
}

export function mapHabeasToVM(h: HabeasData): DocuSignVM {
  return {
    ...emptyVM(),
    nombre: h.Title ?? "",
    identificacion: h.NumeroDocumento ?? "",
    tipoDoc: h.Tipodoc ?? "",
    tipoDocCorto: h.AbreviacionTipoDoc ?? "",
    ciudad: h.Ciudad ?? "",
  };
}

export function mapCesacionToVM(p: Cesacion): DocuSignVM {
  return {
    ...emptyVM(),
    nombre: p.Nombre ?? "",
    fechaIngreso: spDateToSpanishLong(p.FechaIngreso)?? "",
    cargo: p.Cargo ?? "",
    ciudad: p.Ciudad ?? "",
    conectividadLetras: p.auxConectividadTexto ?? "",
    conectividadValor: p.auxConectividadValor ?? "",
    identificacion: p.Title ?? "",
    salarioLetras: p.SalarioTexto ?? "",
    salarioValor: p.Salario ?? "",
    tipoDoc: p.TipoDoc ?? "",
    FechaLetras: spDateToSpanishLong(p.FechaIngreso),
  };
}

export function mapRetailToVM(r: Retail): DocuSignVM {
  return {
    ...emptyVM(),
    nombre: r.Nombre ?? "",
    fechaIngreso: spDateToSpanishLong(r.FechaIngreso) ?? "",
    cargo: r.Cargo ?? "",
    ciudad: r.Ciudad ?? "",
    conectividadLetras: r.Auxiliotransporteletras ?? "",
    conectividadValor: r.Auxiliodetransporte ?? "",
    identificacion: r.Title ?? "",
    salarioLetras: r.SalarioLetras ?? "",
    salarioValor: r.Salario ?? "",
    tipoDoc: r.TipoDoc ?? "",
    FechaLetras: spDateToSpanishLong(r.FechaIngreso),
    departamento: r.Departamento
  };
}

export function toDocuSignVM(proceso: Proceso, data: Promocion | Novedad | HabeasData | Cesacion | Retail): DocuSignVM {
  switch (proceso) {
    case "Promocion":
      return mapPromocionToVM(data as Promocion);
    case "Nuevo":
      return mapNovedadToVM(data as Novedad);
    case "Habeas":
      return mapHabeasToVM(data as HabeasData);
    case "Cesacion":
      return mapCesacionToVM(data as Cesacion)
    case "Retail":
      return mapRetailToVM(data as Retail)
  }
}
