import React from "react";
import { useAuth } from "../auth/authProvider";
import type { TipoPaso } from "../Components/RegistrarNuevo/Modals/Cesaciones/procesoCesacion";
import type { DetallesPasos, PasosProceso } from "../models/Cesaciones";
import { useGraphServices } from "../graph/graphContext";
import type { DetallesPasosNovedadesService } from "../Services/DetallesPasosNovedades.service";

export function usePasosNoveades() {
    const {PasosNovedades, DetallesPasosNovedades } = useGraphServices()
  
    const [rows, setRows] = React.useState<PasosProceso[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const todayISO = () => new Date().toISOString().slice(0, 10);
    const {account} = useAuth()
    const [decisiones, setDecisiones] = React.useState<Record<string, "" | "Aceptado" | "Rechazado">>({});
    const [motivos, setMotivos] = React.useState<Record<string, string>>({});
    const [state, setState] = React.useState<PasosProceso>({NombreEvidencia: "", NombrePaso: "", Orden: 0, TipoPaso: "", Title: "", PlantillaCorreo:"", PlantillaAsunto:"", Obligatorio: true});
    const setField = <K extends keyof PasosProceso>(k: K, v: PasosProceso[K]) => setState((s) => ({ ...s, [k]: v }));

    const loadPasosNovedad = React.useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const items = await PasosNovedades.getAll({orderby: "fields/Orden asc"})
            setRows(items);
        } catch (e: any) {
            setError(e?.message ?? "Error cargando pasos de la promoción");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [PasosNovedades,]);

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
        loadPasosNovedad();
    }, [loadPasosNovedad]);

  
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
      await DetallesPasosNovedades.update(idDetalle, {
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
      await DetallesPasosNovedades.update(idDetalle, {
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

      await DetallesPasosNovedades.update(idDetalle, {
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
      await DetallesPasosNovedades.update(idDetalle, {
        EstadoPaso: "Completado",
        CompletadoPor: userName,
        FechaCompletacion: todayISO(),
        Notas: "Notificación enviada",
      });

      alert("Se ha completado con éxito");
      return;
    }

    // ========= 4) fallback =========
    await DetallesPasosNovedades.update(idDetalle, {
      EstadoPaso: "Completado",
      CompletadoPor: userName,
      FechaCompletacion: todayISO(),
    });

    alert("Se ha completado con éxito");
  };

  return {
    rows, loading, error, byId, motivos, decisiones, state,
    searchStep , setMotivos, setDecisiones, loadPasosNovedad, handleCompleteStep, setField, setState
  };
}

export function useDetallesPasosNovedades(DetallesSvc: DetallesPasosNovedadesService, selected?: string) {
  const [rows, setRows] = React.useState<DetallesPasos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDetallesNovedades = React.useCallback(async (): Promise<DetallesPasos[]> => {
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
      loadDetallesNovedades();
  }, [loadDetallesNovedades]);

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

  const calcPorcentaje = async (): Promise<number> => {
    const items = await DetallesSvc.getAll({filter: `fields/Title eq ${selected} and Obligatorio eq true`, orderby: "fields/NumeroPaso asc"})
    if(items.length > 0){
      const completados = items.filter(i => i.EstadoPaso === "Completado").length;
      return (completados / items.length) * 100;
    } else {
      return 0
    }
  }

  return {
    rows, loading, error, loadDetallesNovedades, handleCreateAllSteps, calcPorcentaje
  };
}

