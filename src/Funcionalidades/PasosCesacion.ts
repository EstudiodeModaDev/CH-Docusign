import React from "react";
import { useAuth } from "../auth/authProvider";
import type { DetallesPasosCesacionService } from "../Services/DetallesPasosCesacion.service";
import type { TipoPaso } from "../Components/RegistrarNuevo/Modals/Cesaciones/procesoCesacion";
import type { DetallesPasos, PasosProceso } from "../models/Cesaciones";
import { useGraphServices } from "../graph/graphContext";

export function usePasosCesacion() {
  const {PasosCesacion, DetallesPasosCesacion} = useGraphServices()
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
      const items = await PasosCesacion.getAll({orderby: "fields/Orden asc"})
      setRows(items);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando pasos de la promoción");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [PasosCesacion,]);

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

  

  const handleCompleteStep = async (detalle: DetallesPasos) => {
    const idDetalle = detalle.Id;
    if (!idDetalle) return;

    const paso: any = byId[detalle.NumeroPaso] ?? null;
    if (!paso) return;

    const estadoAnterior = detalle.EstadoPaso;
    if (estadoAnterior === "Completado") return;

    const userName = account?.name ?? "";

    const tipoPaso: TipoPaso = (paso.TipoPaso as TipoPaso);

  // ========= 1) SUBIDA DOCUMENTO =========
  if (tipoPaso === "SubidaDocumento") {

    await DetallesPasosCesacion.update(idDetalle, {EstadoPaso: "Completado", CompletadoPor: userName, FechaCompletacion: todayISO(), Notas: "Archivo subido"});

    alert("Se ha completado con éxito");
    return;
  }

  // ========= 2) APROBACIÓN =========
  if (tipoPaso === "Aprobacion") {
    // soporta tu estado actual (decisiones/motivos del hook)
    const decision = (decisiones[idDetalle] ?? "") as | "" | "Aceptado" | "Rechazado";

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

    await DetallesPasosCesacion.update(idDetalle, {EstadoPaso: "Completado", CompletadoPor: userName, FechaCompletacion: todayISO(), Notas: notas,});

    alert("Se ha completado con éxito");
    return;
  }

  // ========= 3) NOTIFICACIÓN =========
    if (tipoPaso === "Notificacion") {

      await DetallesPasosCesacion.update(idDetalle, {EstadoPaso: "Completado", CompletadoPor: userName, FechaCompletacion: todayISO(), Notas: "Notificación enviada",});

      alert("Se ha completado con éxito");
      return;
    }

  // ========= 4) fallback =========
    await DetallesPasosCesacion.update(idDetalle, {EstadoPaso: "Completado", CompletadoPor: userName, FechaCompletacion: todayISO(),});
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

  const loadDetallesCesacion = React.useCallback(async () => {
      setLoading(true); setError(null);
      try {
      const items = await DetallesSvc.getAll({filter: `fields/Title eq ${selected}`, orderby: "fields/NumeroPaso asc"})
      setRows(items);
      } catch (e: any) {
      setError(e?.message ?? "Error cargando pasos de la promoción");
      setRows([]);
      } finally {
      setLoading(false);
      }
  }, [selected,]);

  React.useEffect(() => {
      loadDetallesCesacion();
  }, [loadDetallesCesacion]);

  const handleCreateAllSteps = async (pasos: PasosProceso[], promocionId: string) => {
    if(!pasos || pasos.length===0){
      alert("No hay un proceso definido")
      return
    }

    console.table(pasos)

    try{
      await Promise.all(
        pasos.map((p) =>
          DetallesSvc.create({
            Title: promocionId,           
            CompletadoPor: "",
            EstadoPaso: "Pendiente",
            FechaCompletacion: "",
            Notas: "",
            NumeroPaso: p.Id ?? "",
            Paso: Number(p.NombrePaso),
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

  return {
    rows, loading, error, loadDetallesCesacion, handleCreateAllSteps, 
  };
}

