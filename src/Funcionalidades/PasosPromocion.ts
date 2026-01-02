import React from "react";
import { DetallesPasosPromocionService } from "../Services/DetallesPasosPromocion.service";
import { useAuth } from "../auth/authProvider";
import type { Archivo } from "../models/archivos";
import type { DetallesPasos, PasosProceso } from "../models/Cesaciones";
import { useGraphServices } from "../graph/graphContext";

export function usePasosPromocion() {
  
  const {PasosPromocion, DetallesPasosPromocion, ColaboradoresDH, ColaboradoresDenim, ColaboradoresEDM, ColaboradoresMeta, ColaboradoresVisual} = useGraphServices()
  const [rows, setRows] = React.useState<PasosProceso[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const {account} = useAuth()
  const [colaboradores, setColaboradores] = React.useState<Archivo[]>([]);
  const [decisiones, setDecisiones] = React.useState<Record<string, "" | "Aceptado" | "Rechazado">>({});
  const [motivos, setMotivos] = React.useState<Record<string, string>>({});


  const loadPasosPromocion = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const items = await PasosPromocion.getAll()
      setRows(items);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando pasos de la promoción");
      setRows([]);
    } finally {
      setLoading(false);
    }
    }, [PasosPromocion,]);

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

  const handleCompleteStep = async (detalle: DetallesPasos, path?: string) => {
    const idDetalle = detalle.Id;
    if (!idDetalle) return;

    const paso: PasosProceso | null = byId[detalle.NumeroPaso] ?? null;
    if (!paso) return;

    const estadoAnterior = detalle.EstadoPaso;
    if (estadoAnterior === "Completado") return; 

    const requiereEvidencia = paso.TipoPaso === "SubidaArchivos";
    const requiereNotas = paso.TipoPaso !== "SubidaArchivos";
    const nombreEvidencia = paso.NombreEvidencia;
    const userName = account?.name ?? ""; 

    // ========== 1) Caso: requiere evidencia ==========
    if (requiereEvidencia) {
      const archivo = nombreEvidencia;
      
      if(path){
        load(path)
      }

      const tieneArchivo = colaboradores.some(
        (c) => c.name.includes(archivo) 
      );

      if (!tieneArchivo) {
        alert(`Debe subir la evidencia ${archivo} a la carpeta del colaborador`,);
        return;
      }

      await DetallesPasosPromocion.update(idDetalle, {
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

      await DetallesPasosPromocion.update(idDetalle, {
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
      await DetallesPasosPromocion.update(idDetalle, {
        EstadoPaso: "Completado",
        CompletadoPor: userName,
        FechaCompletacion: todayISO(),
      });
      alert("Se ha completado con éxito")
    }
  };

  const load = async (docNumber: string) => {
    // 1) Buscar carpeta en ambas bibliotecas en paralelo
    const [edm, dh, denim, meta, visual] = await Promise.all([
      ColaboradoresEDM.findFolderByDocNumber(docNumber),
      ColaboradoresDH.findFolderByDocNumber(docNumber),
      ColaboradoresDenim.findFolderByDocNumber(docNumber),
      ColaboradoresMeta.findFolderByDocNumber(docNumber),
      ColaboradoresVisual.findFolderByDocNumber(docNumber)
    ]);

    if (!edm && !dh && !denim && !meta && !visual) {
      alert("No se encontró carpeta para ese documento");
      return;
    }

    // 2) Traer archivos SOLO de las carpetas que existan
    const [archivosEDM, archivosDH, archivosDenim, archivosMeta, archivosVisual] = await Promise.all([
      edm ? ColaboradoresEDM.getFilesByFolderId(edm.id) : Promise.resolve([]),
      dh ? ColaboradoresDH.getFilesByFolderId(dh.id) : Promise.resolve([]),
      denim ? ColaboradoresDenim.getFilesByFolderId(denim.id) : Promise.resolve([]),
      denim ? ColaboradoresDenim.getFilesByFolderId(denim.id) : Promise.resolve([]),
      meta ? ColaboradoresDenim.getFilesByFolderId(meta.id) : Promise.resolve([]),
      visual ? ColaboradoresVisual.getFilesByFolderId(visual.id) : Promise.resolve([]),
    ]);

    // 3) Unir resultados de ambas bibliotecas
    setColaboradores([...archivosEDM, ...archivosDH, ...archivosDenim, ...archivosMeta, ...archivosVisual]);
  };

  return {
    rows, loading, error, byId, motivos, decisiones,
    searchStep, handleCompleteStep, setMotivos, setDecisiones, loadPasosPromocion
  };
}

export function useDetallesPasosPromocion(DetallesSvc: DetallesPasosPromocionService, selected?: string) {
  const [rows, setRows] = React.useState<DetallesPasos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDetallesPromocion = React.useCallback(async () => {
      setLoading(true); setError(null);
      try {
      const items = await DetallesSvc.getAll({filter: `fields/Title eq ${selected}`})
      setRows(items);
      } catch (e: any) {
      setError(e?.message ?? "Error cargando pasos de la promoción");
      setRows([]);
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
    rows, loading, error, loadDetallesPromocion, handleCreateAllSteps
  };
}

