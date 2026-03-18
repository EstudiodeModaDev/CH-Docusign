// src/utils/businessDays.ts
import { addMinutes, isSaturday, isSunday } from "date-fns";
import { TZDate } from "@date-fns/tz";
import type { Holiday } from "festivos-colombianos";

const TIMEZONE = "America/Bogota";
const WORK_START = 7; // 7:00 am
const WORK_END = 17;   // 5:00 pm

/* ================== helpers de comparación ================== */
const toYMD = (d: Date) => {
  const dd = new Date(d);
  dd.setHours(12, 0, 0, 0);
  const y = dd.getFullYear();
  const m = String(dd.getMonth() + 1).padStart(2, "0");
  const day = String(dd.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const sliceYMD = (s?: string) => (s ? s.slice(0, 10) : "");

/** ¿La fecha es feriado? (comparación por YYYY-MM-DD) */
export const isHoliday = (date: Date, holidays: Holiday[]) => {
  const ymd = toYMD(date);
  return holidays.some(
    (h) => sliceYMD(h.holiday) === ymd || sliceYMD(h.celebrationDay) === ymd
  );
};

/** ¿Es día hábil? (no sábado, no domingo, no festivo) */
export const isBusinessDay = (date: Date, holidays: Holiday[]) =>
  !isSaturday(date) && !isSunday(date) && !isHoliday(date, holidays);

/* ================== normalización a 7am ================== */

/** Devuelve la misma fecha a las 7:00am en Bogotá */
export const atWorkStart = (date: Date): TZDate => {
  const d = new TZDate(date, TIMEZONE);
  return new TZDate(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    WORK_START,
    0,
    0,
    TIMEZONE
  );
};

/* ================== siguiente día hábil ================== */

/**
 * Próximo día hábil **después** de la fecha indicada (equivalente a > Today()).
 * Retorna 7:00am Bogotá del siguiente día hábil.
 */
export const nextBusinessDay = (from: Date, holidays: Holiday[]): TZDate => {
  // arrancamos en "mañana" a las 7am
  const base = new TZDate(from, TIMEZONE);
  let d = new TZDate(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() + 1,
    WORK_START,
    0,
    0,
    TIMEZONE
  );

  while (!isBusinessDay(d, holidays)) {
    d = new TZDate(
      d.getFullYear(),
      d.getMonth(),
      d.getDate() + 1,
      WORK_START,
      0,
      0,
      TIMEZONE
    );
  }

  return d;
};

/**
 * Devuelve:
 * - si la hora local (Bogotá) es <= cutHour → HOY (7am) si es hábil; si no, siguiente hábil.
 * - si la hora local (Bogotá) es >  cutHour → siguiente día hábil (7am).
 *
 * Replica la idea del If(Hour(Now())<=12; Today(); siguienteHabil)
 * pero con validación de hábil real + festivos.
 */
export const startDateByCutoff = (
  now: Date,
  holidays: Holiday[],
  cutHour = 12
): TZDate => {
  const d = new TZDate(now, TIMEZONE);
  const hoy7am = new TZDate(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    WORK_START,
    0,
    0,
    TIMEZONE
  );

  // Si es <= corte: hoy (si es hábil). Si hoy no es hábil, saltar al siguiente hábil.
  if (d.getHours() <= cutHour) {
    return isBusinessDay(hoy7am, holidays) ? hoy7am : nextBusinessDay(hoy7am, holidays);
  }

  // Si es > corte: siguiente hábil
  return nextBusinessDay(d, holidays);
};

/**
 * Calcula fecha de solución respetando días hábiles 7am–5pm y festivos.
 * Devuelve una TZDate (hora local de Bogotá).
 */
export function calcularFechaSolucionRequisicion(apertura: Date, diasHabiles: number, holidays: Holiday[]): TZDate {
  let restante = diasHabiles * (WORK_END - WORK_START) * 60;
  let actual = new TZDate(apertura, TIMEZONE); // trabajar siempre en Bogotá

  while (restante > 0) {
    let hora = actual.getHours();

    // Si es fin de semana o festivo → saltar al próximo día hábil 7am
    if (isSaturday(actual) || isSunday(actual) || isHoliday(actual, holidays)) {
      actual = new TZDate(
        new TZDate(
          actual.getFullYear(),
          actual.getMonth(),
          actual.getDate() + 1,
          WORK_START,
          0,
          0,
          TIMEZONE
        ),
        TIMEZONE
      );
      continue;
    }

    // Antes de 7am → saltar a 7am
    if (hora < WORK_START) {
      actual = new TZDate(
        actual.getFullYear(),
        actual.getMonth(),
        actual.getDate(),
        WORK_START,
        0,
        0,
        TIMEZONE
      );
      continue;
    }

    // Después de 5pm → saltar al siguiente día 7am
    if (hora >= WORK_END) {
      actual = new TZDate(
        actual.getFullYear(),
        actual.getMonth(),
        actual.getDate() + 1,
        WORK_START,
        0,
        0,
        TIMEZONE
      );
      continue;
    }

    // Minutos disponibles hasta fin de jornada
    const minutosHastaFin =
      (WORK_END - hora) * 60 - actual.getMinutes();
    const aConsumir = Math.min(restante, minutosHastaFin);

    actual = new TZDate(addMinutes(actual, aConsumir), TIMEZONE);
    restante -= aConsumir;

    // Si aún queda, mover a siguiente día 7am
    if (restante > 0) {
      actual = new TZDate(
        actual.getFullYear(),
        actual.getMonth(),
        actual.getDate() + 1,
        WORK_START,
        0,
        0,
        TIMEZONE
      );
    }
  }

  console.log("Fecha de solucion ", actual)
  return actual;
}
