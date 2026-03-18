import React from "react";
import { useAuth } from "../../auth/authProvider";
import type { DetallesPasosCesacionService } from "../../Services/DetallesPasosCesacion.service";
import type { TipoPaso } from "../../Components/GD/RegistrarNuevo/Modals/Cesaciones/procesoCesacion";
import type { DetallesPasos, PasosProceso } from "../../models/Pasos";
import { useGraphServices } from "../../graph/graphContext";
import { shouldActivate } from "./StepRules/pasoActivationResolver";

export function usePasosCesacion() {
  const graph = useGraphServices()
  const [rows, setRows] = React.useState<PasosProceso[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const {account} = useAuth()
  const [decisiones, setDecisiones] = React.useState<Record<string, "" | "Aceptado" | "Rechazado">>({});
  const [motivos, setMotivos] = React.useState<Record<string, string>>({});

  const loadPasosCesacion = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const items = await graph.PasosCesacion.getAll({orderby: "fields/Orden asc"})
      setRows(items);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando pasos de la promoción");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [graph.PasosCesacion,]);

  const byId = React.useMemo(() => {
      const map: Record<string, PasosProceso> = {};
      for (const r of rows) {
        if (r.Id) map[r.Id] = r;
      }
      return map;
  }, [rows]);

  const searchStep = React.useCallback((idPaso: string): PasosProceso | null => {
      return byId[idPaso] ?? null;
  },[byId]);

  React.useEffect(() => {
      loadPasosCesacion();
  }, [loadPasosCesacion]);

  
  const handleCompleteStep = async (detalle: DetallesPasos, estado: string) => {
    const idDetalle = detalle.Id;
    if (!idDetalle) return;

    const paso: any = byId[detalle.NumeroPaso] ?? null;
    if (!paso) return;

    const estadoAnterior = detalle.EstadoPaso;

    // si ya está resuelto, no hagas nada
    if (estadoAnterior === "Completado" || estadoAnterior === "Omitido") return;

    const userName = account?.name ?? "";
    const tipoPaso: TipoPaso = paso.TipoPaso as TipoPaso;

    // ✅ 0) OMITIR (no valida nada, solo marca y desbloquea)
    if (estado === "Omitido") {
      await graph.DetallesPasosCesacion.update(idDetalle, {
        EstadoPaso: "Omitido",
        CompletadoPor: userName,
        FechaCompletacion: todayISO(),
        Notas: "Paso omitido",
      });

      alert("Paso omitido");
      return;
    }

    // ========= 1) SUBIDA DOCUMENTO =========
    if (tipoPaso === "SubidaDocumento") {
      await graph.DetallesPasosCesacion.update(idDetalle, {
        EstadoPaso: "Completado",
        CompletadoPor: userName,
        FechaCompletacion: todayISO(),
        Notas: "Archivo subido",
      });

      alert("Se ha completado con éxito");
      return;
    }

    // ========= 2) APROBACIÓN =========
    if (tipoPaso === "Aprobacion") {
      const decision = (decisiones[idDetalle] ?? "") as "" | "Aceptado" | "Rechazado";
      const motivo = (motivos[idDetalle] ?? "").toString();

      if (!decision) {
        alert("Debe seleccionar un estado");
        return;
      }

      if (decision === "Rechazado" && !motivo.trim()) {
        alert("Debe indicar el motivo del rechazo");
        return;
      }

      const notas = decision === "Rechazado" ? `Rechazado con el motivo: ${motivo}` : "Aceptado";

      await graph.DetallesPasosCesacion.update(idDetalle, {
        EstadoPaso: "Completado",
        CompletadoPor: userName,
        FechaCompletacion: todayISO(),
        Notas: notas,
      });

      alert("Se ha completado con éxito");
      return;
    }

    // ========= 3) NOTIFICACIÓN =========
    if (tipoPaso === "Notificacion") {
      await graph.DetallesPasosCesacion.update(idDetalle, {
        EstadoPaso: "Completado",
        CompletadoPor: userName,
        FechaCompletacion: todayISO(),
        Notas: "Notificación enviada",
      });

      alert("Se ha completado con éxito");
      return;
    }

    // ========= 4) fallback =========
    await graph.DetallesPasosCesacion.update(idDetalle, {
      EstadoPaso: "Completado",
      CompletadoPor: userName,
      FechaCompletacion: todayISO(),
    });

    alert("Se ha completado con éxito");
  };

  return {
    rows, loading, error, byId, motivos, decisiones,
    searchStep , setMotivos, setDecisiones, loadPasosCesacion, handleCompleteStep, 
  };
}

export function useDetallesPasosCesacion(DetallesSvc: DetallesPasosCesacionService, selected?: string) {
  const [rows, setRows] = React.useState<DetallesPasos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const graph = useGraphServices()

  const loadDetallesCesacion = React.useCallback(async (): Promise<DetallesPasos[]> => {
    setLoading(true); setError(null);
    try {
      const items = await DetallesSvc.getAll({filter: `fields/Title eq ${selected}`, orderby: "fields/NumeroPaso asc"})
      setRows(items);
      return items;
    } catch (e: any) {
      setError(e?.message ?? "Error cargando pasos de la promoción");
      setRows([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selected,]);

  React.useEffect(() => {
      loadDetallesCesacion();
  }, [loadDetallesCesacion]);

  const handleCreateAllSteps = async (pasos: PasosProceso[], cesacionId: string, cargoNegocio: string) => {
    if (!pasos || pasos.length === 0) {
      alert("No hay un proceso definido");
      return;
    }

    try {
      const creates: Promise<any>[] = [];

      for (const p of pasos) {
        const idPaso = String(p.Id ?? "");
        const aplica = await shouldActivate("CESACION", idPaso, cargoNegocio, graph);

        if (!aplica) {
          console.log(`Paso ${idPaso} omitido por regla de cargo`);
          continue;
        }

        creates.push(
          DetallesSvc.create({
            Title: cesacionId,
            CompletadoPor: "",
            EstadoPaso: "Pendiente",
            FechaCompletacion: "",
            Notas: "",
            NumeroPaso: p.Id ?? "",
            Paso: Number(p.NombrePaso),
            TipoPaso: p.TipoPaso
          })
        );
      }

      if (creates.length === 0) {
        alert("No hay pasos aplicables para este cargo.");
        return;
      }

      await Promise.all(creates);

      console.log("Se han creado todos los pasos aplicables");
    } catch (e) {
      console.error("Error creando los pasos de la promoción.", e);
      alert("Ha ocurrido un error");
    }
  };

  const calcPorcentaje = async (): Promise<number> => {
    const items = await loadDetallesCesacion();
    if(items.length > 0){
      const completados = items.filter(i => i.EstadoPaso === "Completado" || i.EstadoPaso === "Omitido").length;
      return (completados / items.length) * 100;
    } else {
      return 0
    }
  }

  return {
    rows, loading, error, loadDetallesCesacion, handleCreateAllSteps, calcPorcentaje
  };
}

