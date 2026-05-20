import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import { validate } from "../utils/requisicionValidation";
import type { requisiciones, RequisicionesErrors } from "../../../../models/Requisiciones/requisiciones";
import { fetchHolidays } from "../../../../Services/Festivos";
import { calcularFechaSolucionRequisicion, startDateByCutoff } from "../../../../utils/ansRequisicion";
import type { Holiday } from "festivos-colombianos";
import { toGraphDateTime } from "../../../../utils/Date";
import { buildRequisicionesPatch } from "../utils/requisicionPatch";
import { chooseFinalResponsible } from "../utils/requisicionResponsible";
import { lookPlantaIdeal } from "../utils/requisicionesGetPlantaIdeal";
import { getContractsByCO } from "../../../../Services/Requisiciones/VistaContratos.Service";
import { useNotifyRequisiciones } from "./useRequisicionNotifications";

type Props = {
  state: requisiciones;
  setErrors: React.Dispatch<React.SetStateAction<RequisicionesErrors>>;
};

export function useRequisicionesActions({ state, setErrors }: Props) {
  const [loading, setLoading] = React.useState<boolean>(false)
  const notifications = useNotifyRequisiciones()
  const graph = useGraphServices()

  const validateResult = () => {
    const e = validate(state)
    console.log(e)
    setErrors(e)

    return Object.keys(e).length === 0;
  };

  const sendNotificationPlantaIdeal = async (co: string, motivo: string, nombreTienda: string): Promise<{message: string | null, sent: boolean}> => {
    setLoading(true);
    try {
      const [plantaIdeal, resultado] = await Promise.all([
        lookPlantaIdeal(graph.plantaIdeal, co),
        getContractsByCO(co)
      ]);
      console.log(plantaIdeal)
      console.log(resultado)

      if(plantaIdeal ?? 0 <= Number(resultado.lenght?? 0)){
        await notifications.notificarMotivo(motivo, co, nombreTienda)
      }

      return{
        message: "Se ha enviado con exito la advertencia",
        sent: true
      }
    }catch (e){
      return {
        message: "No se ha podido enviar la advertencia " + e,
        sent: false        
        }
      }finally {
        setLoading(false);
      }
  };


  const handleSubmit = async (ans: number,): Promise<{created: requisiciones | null, ok: boolean}> => {
    if (!validateResult()) { 
      alert("Hay campos sin rellenar")
      return {
        created: null,
        ok: false        
      }
    };
    const payload = state
    setLoading(true);
    try {
      const categoriaCargo = (await graph.categorias.getAll({ filter: `fields/Title eq '${state.Title}'`, top: 1 }))[0]
      const holidays: Holiday[] = await fetchHolidays()
      const fechaInicio = startDateByCutoff(new Date(), holidays)
      const fechaFinal = calcularFechaSolucionRequisicion(fechaInicio, ans, holidays)
      const responsable = await chooseFinalResponsible(
        graph.DeptosYMunicipios,
        graph.responsableZonas,
        graph.responsablesNivel,
        graph.requisiciones,
        state.Ciudad,
        state.tipoRequisicion as "Administrativa" | "Retail",
        categoriaCargo?.Categoria || state.NivelCargo
      )
      const payload: requisiciones = {
        cedulaEmpleadoVinculado: state.cedulaEmpleadoVinculado,
        ANS: String(ans),
        Ciudad: state.Ciudad,
        codigoCentroCosto: state.codigoCentroCosto,
        codigoCentroOperativo: state.codigoCentroOperativo,
        codigoUnidadNegocio: String(state.codigoUnidadNegocio),
        comisiones: String(state.comisiones),
        correoProfesional: responsable?.email || '',
        correoSolicitante: state.correoSolicitante,
        cumpleANS: state.cumpleANS,
        descripcionCentroCosto: state.descripcionCentroCosto,
        descripcionUnidadNegocio: state.descripcionUnidadNegocio,
        diasHabiles: Number(ans),
        fechaIngreso: toGraphDateTime(state.fechaIngreso) ?? null,
        fechaInicioProceso: toGraphDateTime(fechaInicio) ?? null,
        fechaLimite: toGraphDateTime(fechaFinal) ?? null,
        genero: state.genero,
        motivo: state.motivo,
        nombreProfesional: responsable?.name || '',
        salarioBasico: state.salarioBasico,
        solicitante: state.solicitante,
        tienda: state.tienda,
        tipoConvocatoria: state.tipoConvocatoria,
        tipoRequisicion: state.tipoRequisicion,
        Title: state.Title,
        auxilioRodamiento: state.auxilioRodamiento,
        direccion: state.direccion,
        grupoCVE: state.grupoCVE,
        modalidadTeletrabajo: state.modalidadTeletrabajo,
        perteneceCVE: state.perteneceCVE,
        empresaContratista: state.empresaContratista,
        Estado: state.Estado,
        fechaTerna: state.fechaTerna,
        Identificador: state.Identificador,
        motivoNoCumplimiento: state.motivoNoCumplimiento,
        nombreEmpleadoVinculado: state.nombreEmpleadoVinculado,
        nuevoPromocion: state.nuevoPromocion,
        NivelCargo: categoriaCargo?.Categoria || state.NivelCargo
      }; 
      const created = await graph.requisiciones.create(payload);
      alert("Se ha creado el registro con éxito")
      return {
        created: created,
        ok: true        
      }
    } catch{
      return {
        created: null,
        ok: false        
      }
    }finally {
      setLoading(false);
      if(payload.tipoRequisicion === "Retail"){
        await sendNotificationPlantaIdeal(state.codigoCentroCosto, state.motivo, state.descripcionCentroCosto)
      }
    }
  };

  const handleEdit = async (requisicionSeleccionada: requisiciones) => {
    if (!validateResult()) { return};
    setLoading(true);
    try {  
      const payload = buildRequisicionesPatch(requisicionSeleccionada, state)

      if(payload.fechaIngreso){
        const limite = new Date(state.fechaLimite ?? "").getTime();
        const ingreso = new Date(state.fechaIngreso ?? "").getTime();
        const cumple = limite < ingreso ? "No" : "Si"
        await graph.requisiciones.update(requisicionSeleccionada.Id!, {...payload, Estado: "Cerrado", cumpleANS: cumple})
        alert("Se ha finalizado con éxito la requisición")
        return
      }

      await graph.requisiciones.update(requisicionSeleccionada.Id!, payload);
      alert("Se ha actualizado el registro con éxito")
      return
    } finally {
        setLoading(false);
      }
  };

  const cancelarBD = async (r: requisiciones): Promise<boolean> => {
    alert(r.Id)
    if(!state.motivoNoCumplimiento) return false
    await graph.requisiciones.update(r.Id ?? "", {Estado: "Cancelado", cumpleANS: "No Aplica", motivoNoCumplimiento: r.motivoNoCumplimiento})
    alert("Se ha cancelado la requisición con éxito")
    return true
  }

  return {
    loading, state, handleSubmit, handleEdit, cancelarBD, sendNotificationPlantaIdeal
  }
}



