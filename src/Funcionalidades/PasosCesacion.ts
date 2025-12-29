import React from "react";
import type { DetallesPasosPromocion, PasosPromocion, } from "../models/Promociones";
import { useAuth } from "../auth/authProvider";
import type { Archivo } from "../models/archivos";
import { ColaboradoresDenimService, ColaboradoresDHService, ColaboradoresEDMService, ColaboradoresVisualService } from "../Services/Bibliotecas.service";
import type { PasosCesacionService } from "../Services/PasosCesaciones.service";
import type { DetallesPasosCesacionService } from "../Services/DetallesPasosCesacion.service";
import type { TipoPaso } from "../Components/RegistrarNuevo/Modals/Cesaciones/procesoCesacion";
import type { PasoCesacion } from "../models/Cesaciones";

export function usePasosCesacion(PasosCesacionSvc: PasosCesacionService, DetallesPasosCesacionSvc: DetallesPasosCesacionService, ColaboradoresDH: ColaboradoresDHService, ColaboradoresEDM: ColaboradoresEDMService, ColaboradoresVisual: ColaboradoresVisualService, ColaboradoresDenim: ColaboradoresDenimService) {
  const [rows, setRows] = React.useState<PasoCesacion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const {account} = useAuth()
  const [colaboradores, setColaboradores] = React.useState<Archivo[]>([]);
  const [decisiones, setDecisiones] = React.useState<Record<string, "" | "Aceptado" | "Rechazado">>({});
  const [motivos, setMotivos] = React.useState<Record<string, string>>({});
  const [state, setState] = React.useState<PasoCesacion>({NombreEvidencia: "", NombrePaso: "", Orden: 0, RequiereNotas: false, TipoPaso: "", Title: "",});
  const setField = <K extends keyof PasoCesacion>(k: K, v: PasoCesacion[K]) => setState((s) => ({ ...s, [k]: v }));

  const loadPasosCesacion = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const items = await PasosCesacionSvc.getAll({orderby: "fields/Orden asc"})
      setRows(items);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando pasos de la promoción");
      setRows([]);
    } finally {
      setLoading(false);
    }
    }, [PasosCesacionSvc,]);

  const byId = React.useMemo(() => {
      const map: Record<string, PasoCesacion> = {};
      for (const r of rows) {
        if (r.Id) map[r.Id] = r;
      }
      return map;
  }, [rows]);

  const searchStep = React.useCallback((idPaso: string): PasoCesacion | null => {
      return byId[idPaso] ?? null;
  },[byId]);

  React.useEffect(() => {
      loadPasosCesacion();
  }, [loadPasosCesacion]);

  

  const handleCompleteStep = async (detalle: DetallesPasosPromocion, path?: string) => {
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
    const nombreEvidencia = paso.NombreEvidencia;
    const archivo = nombreEvidencia;

    if (path) {
      await load(path);
    }

    const tieneArchivo = colaboradores.some((c) => c.name.includes(archivo));

    if (!tieneArchivo) {
      alert(`Debe subir la evidencia ${archivo} a la carpeta del colaborador`);
      return;
    }

    await DetallesPasosCesacionSvc.update(idDetalle, {EstadoPaso: "Completado", CompletadoPor: userName, FechaCompletacion: todayISO(), Notas: "Archivo subido"});

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

    await DetallesPasosCesacionSvc.update(idDetalle, {EstadoPaso: "Completado", CompletadoPor: userName, FechaCompletacion: todayISO(), Notas: notas,});

    alert("Se ha completado con éxito");
    return;
  }

  // ========= 3) NOTIFICACIÓN =========
    if (tipoPaso === "Notificacion") {

      await DetallesPasosCesacionSvc.update(idDetalle, {EstadoPaso: "Completado", CompletadoPor: userName, FechaCompletacion: todayISO(), Notas: "Notificación enviada",});

      alert("Se ha completado con éxito");
      return;
    }

  // ========= 4) fallback =========
    await DetallesPasosCesacionSvc.update(idDetalle, {EstadoPaso: "Completado", CompletadoPor: userName, FechaCompletacion: todayISO(),});
    alert("Se ha completado con éxito");
  };

  const load = async (docNumber: string) => {
    // 1) Buscar carpeta en ambas bibliotecas en paralelo
    const [edm, dh, visual, denim] = await Promise.all([
      ColaboradoresEDM.findFolderByDocNumber(docNumber),
      ColaboradoresDH.findFolderByDocNumber(docNumber),
      ColaboradoresVisual.findFolderByDocNumber(docNumber),
      ColaboradoresDenim.findFolderByDocNumber(docNumber),
    ]);

    console.log(edm)

    if (!edm && !dh && !visual && !denim) {
      alert("No se encontró carpeta para este colaborador");
      return;
    }

    // 2) Traer archivos SOLO de las carpetas que existan
    const [archivosEDM, archivosDH, archivosVisual, archivosDenim] = await Promise.all([
      edm ? ColaboradoresEDM.getFilesByFolderId(edm.id) : Promise.resolve([]),
      dh ? ColaboradoresDH.getFilesByFolderId(dh.id) : Promise.resolve([]),
      visual ? ColaboradoresVisual.getFilesByFolderId(visual.id) : Promise.resolve([]),
      denim ? ColaboradoresDenim.getFilesByFolderId(denim.id) : Promise.resolve([]),
    ]);

    console.table(edm ?? dh);

    // 3) Unir resultados de ambas bibliotecas
    setColaboradores([...archivosEDM, ...archivosDH, ...archivosVisual, ...archivosDenim]);
  };

  return {
    rows, loading, error, byId, motivos, decisiones, state,
    searchStep , setMotivos, setDecisiones, loadPasosCesacion, handleCompleteStep, setField, setState
  };
}

export function useDetallesPasosCesacion(DetallesSvc: DetallesPasosCesacionService, selected?: string) {
  const [rows, setRows] = React.useState<DetallesPasosPromocion[]>([]);
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

  const handleCreateAllSteps = async (pasos: PasosPromocion[], promocionId: string) => {
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

