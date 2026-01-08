import React from "react";
import { useAuth } from "../auth/authProvider";
import type { DetallesPasos, PasosProceso } from "../models/Cesaciones";
import { useGraphServices } from "../graph/graphContext";
import type { DetallesPasosRetail } from "../Services/DetallesPasosRetail.service";

export function usePasosRetail() {
  
  const {pasosRetail, detallesPasosRetail,} = useGraphServices()
  const [rows, setRows] = React.useState<PasosProceso[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const {account} = useAuth()
  const [decisiones, setDecisiones] = React.useState<Record<string, "" | "Aceptado" | "Rechazado">>({});
  const [motivos, setMotivos] = React.useState<Record<string, string>>({});

  const loadPasosPromocion = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const items = await pasosRetail.getAll({orderby: "fields/Orden asc"})
      setRows(items);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando pasos de la promoción");
      setRows([]);
    } finally {
      setLoading(false);
    }
    }, [pasosRetail,]);

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
      loadPasosPromocion();
  }, [loadPasosPromocion]);

  const handleCompleteStep = async (detalle: DetallesPasos) => {
    const idDetalle = detalle.Id;
    if (!idDetalle) return;

    const paso: PasosProceso | null = byId[detalle.NumeroPaso] ?? null;
    if (!paso) return;

    const estadoAnterior = detalle.EstadoPaso;
    if (estadoAnterior === "Completado") return; 

    const requiereEvidencia = paso.TipoPaso === "SubidaDocumento";
    const requiereNotas = paso.TipoPaso === "Aprobacion";
    const userName = account?.name ?? ""; 

    // ========== 1) Caso: requiere evidencia ==========
    if (requiereEvidencia) {

      await detallesPasosRetail.update(idDetalle, {
        EstadoPaso: "Completado",
        CompletadoPor: userName,
        FechaCompletacion: todayISO(),
      });
      alert("Se ha completado con éxito")
      return;
    }

    // ========== 2) Caso: requiere notas ==========
    if (requiereNotas) {
      const decision = decisiones[idDetalle] ?? ""; 
      const motivo = motivos[idDetalle] ?? "";

      // Si es rechazado y no hay motivo → error
      if (decision === "Rechazado" && !motivo.trim()) {
        alert("Debe indicar el motivo del rechazo");
        return;
      }

      if(!decision){
        alert("Debe seleccionar un estado")
        return
      }

      const notas = decision === "Rechazado"  ? `${decision} con el motivo: ${motivo}` : decision || "";

      await detallesPasosRetail.update(idDetalle, {
        EstadoPaso: "Completado",
        CompletadoPor: userName,
        FechaCompletacion: todayISO(),
        Notas: notas,
      });
      alert("Se ha completado con éxito")
      return ;
    }

    // ========== 3) Caso: no requiere ni notas ni evidencia ==========
    if (!requiereNotas && !requiereEvidencia) {
      await detallesPasosRetail.update(idDetalle, {
        EstadoPaso: "Completado",
        CompletadoPor: userName,
        FechaCompletacion: todayISO(),
      });
      alert("Se ha completado con éxito")
    }
  };

  return {
    rows, loading, error, byId, motivos, decisiones,
    searchStep, handleCompleteStep, setMotivos, setDecisiones, loadPasosPromocion
  };
}

export function useDetallesPasosRetail(DetallesSvc: DetallesPasosRetail, selected?: string) {
  const [rows, setRows] = React.useState<DetallesPasos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDetallesPromocion = React.useCallback(async (): Promise<DetallesPasos[]> => {
    setLoading(true); setError(null);
    try {
      const items = await DetallesSvc.getAll({filter: `fields/Title eq ${selected}`, orderby: "fields/Paso asc"});
      setRows(items);
      return items;
    } catch (e: any) {
      setError(e?.message ?? "Error cargando pasos de la promoción");
      setRows([]);
      return []
      } finally {
      setLoading(false);
      }
  }, [selected,]);

  React.useEffect(() => {
      loadDetallesPromocion();
  }, [loadDetallesPromocion]);

  const handleCreateAllSteps = async (pasos: PasosProceso[], promocionId: string) => {
    if(!pasos || pasos.length===0){
      alert("No hay un proceso definido")
      return
    }

    try{
      await Promise.all(
        pasos.map((p: PasosProceso) =>
          DetallesSvc.create({
            Title: promocionId,           
            CompletadoPor: "",
            EstadoPaso: "Pendiente",
            FechaCompletacion: "",
            Notas: "",
            NumeroPaso: p.Id ?? "",
            Paso: p.Orden,
            TipoPaso: p.TipoPaso
          })
        )
      );

      console.log("Se han creado todos los pasos")
    } catch (e) {
      console.error("Error creando los pasos de la promocion.")
      alert("Ha ocurrido un error")
    }
  }

  const calcPorcentaje = async (): Promise<number> => {
    const items = await loadDetallesPromocion();
    if(items.length > 0){
      const completados = items.filter(i => i.EstadoPaso === "Completado").length;
      return (completados / items.length) * 100;
    } else {
      return 0
    }
  }

  return {
    rows, loading, error, loadDetallesPromocion, handleCreateAllSteps, calcPorcentaje
  };
}

