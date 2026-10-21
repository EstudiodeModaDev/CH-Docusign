import * as React from "react";
import { useAuth } from "../../auth/authProvider";
import { useCoreGraphServices } from "../../graph/graphContext";
import type { log } from "../../models/log";

export type AuditEntry = {
  accion: log["accion"];
  descripcion: string;
  id_item_afectado?: string | number | null;
  // Se serializa a JSON si no es string.
  detalle?: unknown;
  resultado?: log["resultado"];
};

export type AuditedEntry<T> = Omit<AuditEntry, "resultado"> & {
  // Descripción a registrar si la operación falla. Por defecto: "Falló: <descripcion>".
  descripcionError?: string;
  // Permite tomar el Id del resultado (p. ej. al crear un registro).
  idFromResult?: (result: T) => string | number | null | undefined;
};

const toDetalle = (detalle: unknown): string =>
  detalle === undefined || detalle === null ? "" : typeof detalle === "string" ? detalle : JSON.stringify(detalle);

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export function useAuditLog(modulo: log["modulo"]) {
  const { account } = useAuth();
  const { log } = useCoreGraphServices();

  const actor = account?.name ?? "Desconocido";
  const correo_actor = account?.username ?? "Desconocido";

  // Registra una entrada en el log. Nunca lanza.
  const audit = React.useCallback(
    async (entry: AuditEntry): Promise<void> => {
      await log.create({
        modulo,
        accion: entry.accion,
        descripcion: entry.descripcion,
        detalle: toDetalle(entry.detalle),
        id_item_afectado: String(entry.id_item_afectado ?? ""),
        resultado: entry.resultado ?? "Exito",
        actor,
        correo_actor,
      });
    },
    [log, modulo, actor, correo_actor]
  );

  // Ejecuta la operación y registra su resultado (éxito o error). Relanza el error original.
  const withAudit = React.useCallback(
    async <T>(entry: AuditedEntry<T>, operation: () => Promise<T>): Promise<T> => {
      const { descripcionError, idFromResult, ...base } = entry;
      try {
        const result = await operation();
        await audit({
          ...base,
          id_item_afectado: idFromResult?.(result) ?? base.id_item_afectado,
          resultado: "Exito",
        });
        return result;
      } catch (error) {
        const detalle = base.detalle === undefined || base.detalle === null
          ? { error: errorMessage(error) }
          : typeof base.detalle === "object"
            ? { ...(base.detalle as object), error: errorMessage(error) }
            : { detalle: base.detalle, error: errorMessage(error) };

        await audit({
          ...base,
          descripcion: descripcionError ?? `Falló: ${base.descripcion}`,
          detalle,
          resultado: "Error",
        });
        throw error;
      }
    },
    [audit]
  );

  return { audit, withAudit };
}
