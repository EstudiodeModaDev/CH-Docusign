import React from "react";
import { useGraphServices } from "../../../../graph/graphContext";
import { validate } from "../utils/requisicionValidation";
import type { cargoCiudadAnalista, requisiciones, RequisicionesErrors } from "../../../../models/requisiciones";
import { fetchHolidays } from "../../../../Services/Festivos";
import { calcularFechaSolucionRequisicion, startDateByCutoff } from "../../../../utils/ansRequisicion";
import type { Holiday } from "festivos-colombianos";
import { toGraphDateTime } from "../../../../utils/Date";
import { buildRequisicionesPatch } from "../utils/requisicionPatch";

type Props = {
  state: requisiciones;
  setErrors: React.Dispatch<React.SetStateAction<RequisicionesErrors>>;
};

export function useRequisicionesActions({ state, setErrors }: Props) {
  const [loading, setLoading] = React.useState<boolean>(false)
  const graph = useGraphServices()

  const validateResult = () => {
    const e = validate(state)
    setErrors(e)

    return Object.keys(e).length === 0;
  };


  const handleSubmit = async (ans: number, analista: cargoCiudadAnalista): Promise<{created: requisiciones | null, ok: boolean}> => {
    if (!validateResult()) { 
      alert("Hay campos sin rellenar")
      return {
        created: null,
        ok: false        
      }
    };
    console.log(state)
    setLoading(true);
    try {
      const holidays: Holiday[] = await fetchHolidays()
      const fechaInicio = startDateByCutoff(new Date(), holidays)
      const fechaFinal = calcularFechaSolucionRequisicion(fechaInicio, ans, holidays)
      const payload: requisiciones = {
        cedulaEmpleadoVinculado: state.cedulaEmpleadoVinculado,
        ANS: String(ans),
        Area: state.Area,
        Ciudad: state.Ciudad,
        cantidadPersonas: Number(state.cantidadPersonas ?? 0),
        codigoCentroCosto: state.codigoCentroCosto,
        codigoCentroOperativo: state.codigoCentroOperativo,
        codigoUnidadNegocio: String(state.codigoUnidadNegocio),
        comisiones: String(state.comisiones),
        correoProfesional: analista.Title,
        correoSolicitante: state.correoSolicitante,
        cumpleANS: state.cumpleANS,
        descripcionCentroCosto: state.descripcionCentroCosto,
        descripcionCentroOperativo: state.descripcionCentroOperativo,
        descripcionUnidadNegocio: state.descripcionUnidadNegocio,
        diasHabiles: Number(ans),
        fechaIngreso: toGraphDateTime(state.fechaIngreso) ?? null,
        fechaInicioProceso: toGraphDateTime(fechaInicio) ?? null,
        fechaLimite: toGraphDateTime(fechaFinal) ?? null,
        genero: state.genero,
        marca: state.marca,
        motivo: state.motivo,
        nombreProfesional: analista.nombreAnalista,
        observacionesSalario: state.observacionesSalario,
        razon: state.razon,
        salarioBasico: state.salarioBasico,
        solicitante: state.solicitante,
        tienda: state.tienda,
        tipoConvocatoria: state.tipoConvocatoria,
        tipoRequisicion: state.tipoRequisicion,
        Title: state.Title,
        Created: state.Created,
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
    loading, state, handleSubmit, handleEdit, cancelarBD
  }
}



