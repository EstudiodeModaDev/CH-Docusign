import type { Cesacion } from "../models/Cesaciones";
import type { HabeasData } from "../models/HabeasData";
import type { Novedad } from "../models/Novedades";
import type { Promocion } from "../models/Promociones";

/* ============================================================================
 * VM
 * ========================================================================== */
export type UnifyVM = {
  nombre: string;
  fechaIngreso: string;
  cargo: string;
  ciudad: string;
  conectividadLetras: string;
  conectividadValor: string;
  garantizadoValor: string;
  garantizadoLetras: string;
  identificacion: string;
  salarioLetras: string;
  salarioValor: string;
  tipoDoc: string;
  tipoDocCorto: string;
  tipoTel: string;
  empresa: string;
  numeroDoc: string
  correoElectronico: string
};

export const emptyVM = (): UnifyVM => ({
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
  empresa: "",
  numeroDoc: "",
  correoElectronico: ""
});

/* ============================================================================
 * Utils genéricos
 * ========================================================================== */

// Obtiene un valor por path tipo "a.b.c"
function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function toStr(v: any) {
  return (v ?? "").toString();
}

/* ============================================================================
 * Tipos de mapping
 * ========================================================================== */

type ObjectRule<T> = {
  path: string;
  transform?: (value: any, src: T) => any;
};

type MapRule<T> =
  | string
  | ObjectRule<T>
  | ((src: T) => any);

type Mapping<T> = Partial<Record<keyof UnifyVM, MapRule<T>>>;

function isObjectRule<T>(rule: MapRule<T>): rule is ObjectRule<T> {
  return typeof rule === "object" && rule !== null && "path" in rule;
}

/* ============================================================================
 * Mapper genérico
 * ========================================================================== */
export function mapToUnifyVM<T>(
  src: T,
  mapping: Mapping<T>,
  overrides?: Partial<UnifyVM>
): UnifyVM {
  const base: UnifyVM = { ...emptyVM(), ...(overrides ?? {}) };
  const out: UnifyVM = { ...base };

  (Object.keys(base) as (keyof UnifyVM)[]).forEach((vmKey) => {
    const rule = mapping[vmKey];
    if (!rule) return;

    let raw: any;

    if (typeof rule === "function") {
      raw = rule(src);
    } else if (isObjectRule(rule)) {
      raw = getByPath(src as any, rule.path);
      if (rule.transform) raw = rule.transform(raw, src);
    } else {
      raw = getByPath(src as any, rule);
    }

    (out as any)[vmKey] = toStr(raw);
  });

  return out;
}

/* ============================================================================
 * Proceso
 * ========================================================================== */
export type Proceso = "Promocion" | "Nuevo" | "Habeas" | "Cesacion";

type DataByProceso = {
  Promocion: Promocion;
  Nuevo: Novedad;
  Habeas: HabeasData;
  Cesacion: Cesacion;
};

/* ============================================================================
 * Helpers de normalización
 * ========================================================================== */
function normalizeEmpresa(v: any) {
  return toStr(v).trim();
}

/* ============================================================================
 * Mappings por proceso
 * ========================================================================== */
export const UNIFY_MAPPINGS: {
  Promocion: Mapping<Promocion>;
  Nuevo: Mapping<Novedad>;
  Habeas: Mapping<HabeasData>;
  Cesacion: Mapping<Cesacion>;
} = {
  Promocion: {
    nombre: "NombreSeleccionado",
    fechaIngreso: "FechaIngreso",
    cargo: "Cargo",
    ciudad: "Ciudad",
    conectividadLetras: "AuxilioTexto",
    conectividadValor: "AuxilioValor",
    garantizadoValor: "ValorGarantizado",
    garantizadoLetras: "GarantizadoLetras",
    identificacion: "NumeroDoc",
    salarioLetras: "SalarioTexto",
    salarioValor: "Salario",
    tipoDoc: "TipoDoc",
    tipoDocCorto: "AbreviacionTipoDoc",
    tipoTel: "ModalidadTeletrabajo",
    empresa: { path: "EmpresaSolicitante", transform: normalizeEmpresa },
    numeroDoc: "NumeroDoc",
    correoElectronico: "Email"
  },

  Nuevo: {
    nombre: "NombreSeleccionado",
    fechaIngreso: "FECHA_x0020_REQUERIDA_x0020_PARA0",
    cargo: "CARGO",
    ciudad: "CIUDAD",
    conectividadLetras: "auxconectividadtexto",
    conectividadValor: "auxconectividadvalor",
    garantizadoValor: "VALOR_x0020_GARANTIZADO",
    garantizadoLetras: "Garantizado_x0020_en_x0020_letra",
    identificacion: "Numero_x0020_identificaci_x00f3_",
    salarioLetras: "salariotexto",
    salarioValor: "SALARIO",
    tipoDoc: "tipodoc",
    tipoDocCorto: "Tipo_x0020_de_x0020_documento_x0",
    tipoTel: "MODALIDAD_x0020_TELETRABAJO",
    empresa: { path: "Empresa_x0020_que_x0020_solicita", transform: normalizeEmpresa },
    numeroDoc: "Numero_x0020_identificaci_x00f3_",
    correoElectronico: "CORREO_x0020_ELECTRONICO_x0020_"
  },

  Habeas: {
    nombre: "Title",
    identificacion: "NumeroDocumento",
    tipoDoc: "Tipodoc",
    tipoDocCorto: "AbreviacionTipoDoc",
    ciudad: "Ciudad",
    empresa: () => "",
  },

  Cesacion: {
    nombre: "Nombre",
    fechaIngreso: "FechaIngreso",
    cargo: "Cargo",
    ciudad: "Ciudad",
    conectividadLetras: "auxConectividadTexto",
    conectividadValor: "auxConectividadValor",
    identificacion: "Title",
    salarioLetras: "SalarioTexto",
    salarioValor: "Salario",
    tipoDoc: "TipoDoc",
    empresa: { path: "Empresaalaquepertenece", transform: normalizeEmpresa },
    numeroDoc: "Title",
    correoElectronico: "Correoelectronico"
  },
};

/* ============================================================================
 * API principal
 * ========================================================================== */
export function toUnifyVM<P extends Proceso>(
  proceso: P,
  data: DataByProceso[P]
): UnifyVM {
  const mapping = UNIFY_MAPPINGS[proceso] as Mapping<DataByProceso[P]>;
  return mapToUnifyVM<DataByProceso[P]>(data, mapping);
}
