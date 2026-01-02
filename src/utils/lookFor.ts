import type { Cesacion } from "../models/Cesaciones";
import type { HabeasData } from "../models/HabeasData";
import type { Novedad } from "../models/Novedades";
import type { Promocion } from "../models/Promociones";
import type { Proceso } from "./unify";

/* =======================
   Tipos
======================= */

export type datosBasicos = {
  cedula: string;
  nombre: string;
  empresa: string;
  tipoDoc: string;
  correo: string;
  departamento: string;
  ciudad: string;
  celular: string;
  direccion: string;
  barrio: string;
};

type Candidate =
  | { proceso: "Promocion"; created: Date; data: Promocion }
  | { proceso: "Nuevo"; created: Date; data: Novedad }
  | { proceso: "Habeas"; created: Date; data: HabeasData }
  | { proceso: "Cesacion"; created: Date; data: Cesacion };


/* =======================
   Utils
======================= */

const emptyDB = (): datosBasicos => ({
  cedula: "",
  correo: "",
  empresa: "",
  nombre: "",
  tipoDoc: "",
  barrio: "",
  celular: "",
  ciudad: "",
  departamento: "",
  direccion: ""
});

function safeDate(v: unknown): Date {
  if (v instanceof Date) return v;
  const d = new Date(String(v ?? ""));
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function pickNewest<T extends { created: Date }>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr.reduce((best, cur) => (cur.created > best.created ? cur : best));
}


function getCreatedFromPromocion(p: Promocion) {
  return safeDate((p as any).Created ?? (p as any).createdDateTime ?? (p as any).created);
}
function getCreatedFromNovedad(n: Novedad) {
  return safeDate((n as any).Created ?? (n as any).createdDateTime ?? (n as any).created);
}
function getCreatedFromHabeas(h: HabeasData) {
  return safeDate((h as any).Created ?? (h as any).createdDateTime ?? (h as any).created);
}
function getCreatedFromCesacion(c: Cesacion) {
  return safeDate((c as any).Created ?? (c as any).createdDateTime ?? (c as any).created);
}

/* =======================
   Mappers
======================= */

export function mapPromocionToVM(p: Promocion): datosBasicos {
  return {
    ...emptyDB(),
    cedula: p.NumeroDoc,
    correo: p.Correo ?? p.Email ?? "",
    empresa: p.EmpresaSolicitante ?? "",
    nombre: p.NombreSeleccionado ?? "",
    tipoDoc: p.TipoDoc ?? "",
    ciudad: p.Ciudad,
    departamento: p.Departamento,
  };
}

export function mapNovedadToVM(n: Novedad): datosBasicos {
  return {
    ...emptyDB(),
    nombre: n.NombreSeleccionado ?? "",
    cedula: n.Numero_x0020_identificaci_x00f3_ ?? "",
    correo: n.CORREO_x0020_ELECTRONICO_x0020_ ?? "",
    empresa: n.Empresa_x0020_que_x0020_solicita ?? "",
    tipoDoc: n.Tipo_x0020_de_x0020_documento_x0 ?? "",
    barrio: n.BARRIO_x0020_,
    celular: n.CELULAR_x0020_,
    ciudad: n.CIUDAD,
    departamento: n.Departamento,
    direccion: n.DIRECCION_x0020_DE_x0020_DOMICIL
  };
}

export function mapHabeasToVM(h: HabeasData): datosBasicos {
  return {
    ...emptyDB(),
    nombre: h.Title ?? "",
    cedula: h.NumeroDocumento ?? "",
    correo: h.Correo ?? "",
    empresa: h.Empresa ?? "",
    tipoDoc: h.Tipodoc ?? "",
    ciudad: h.Ciudad
  };
}

export function mapCesacionToVM(c: Cesacion): datosBasicos {
  return {
    ...emptyDB(),
    nombre: c.Nombre ?? "",
    cedula: c.Title ?? "",
    correo: c.Correoelectronico ?? "",
    empresa: c.Empresaalaquepertenece ?? "",
    tipoDoc: c.TipoDoc ?? "",
    celular: c.Celular,
    ciudad: c.Ciudad,
    departamento: c.Departamento,
  };
}

export function toDocuSignVM(proceso: Proceso, data: Promocion | Novedad | HabeasData | Cesacion): datosBasicos {
  switch (proceso) {
    case "Promocion":
      return mapPromocionToVM(data as Promocion);
    case "Nuevo":
      return mapNovedadToVM(data as Novedad);
    case "Habeas":
      return mapHabeasToVM(data as HabeasData);
    case "Cesacion":
      return mapCesacionToVM(data as Cesacion);
  }
}

/* =======================
   Main
======================= */

/**
 * Recibe las 4 funciones searchRegister ya armadas (para que esto NO sea hook)
 * y devuelve los datos básicos del registro más reciente (por Created).
 */
export async function lookOtherInfo(cedula: string, deps: {searchPromocion: (cedula: string) => Promise<Promocion | null>; searchNovedad: (cedula: string) => Promise<Novedad | null>; searchCesacion: (cedula: string) => Promise<Cesacion | null>; searchHabeas: (cedula: string) => Promise<HabeasData | null>;}):  Promise<datosBasicos | null> {


  if (!cedula) return null;

  const [p, n, c, h] = await Promise.all([
    deps.searchPromocion(cedula),
    deps.searchNovedad(cedula),
    deps.searchCesacion(cedula),
    deps.searchHabeas(cedula),
  ]);

  const candidates: Candidate[] = [];

  if (p) candidates.push({ proceso: "Promocion", created: getCreatedFromPromocion(p), data: p });
  if (n) candidates.push({ proceso: "Nuevo", created: getCreatedFromNovedad(n), data: n });
  if (c) candidates.push({ proceso: "Cesacion", created: getCreatedFromCesacion(c), data: c });
  if (h) candidates.push({ proceso: "Habeas", created: getCreatedFromHabeas(h), data: h });

  const newest = pickNewest(candidates);
  if (!newest) return null;

  return toDocuSignVM(newest.proceso, newest.data);
}
