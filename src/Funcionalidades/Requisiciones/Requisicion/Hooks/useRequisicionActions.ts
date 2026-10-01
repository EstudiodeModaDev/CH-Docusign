import React from "react";
import { useCoreGraphServices, useRequisicionesServices } from "../../../../graph/graphContext";
import { validate, validatePostergarANS } from "../utils/requisicionValidation";
import type { requisiciones, RequisicionesErrors } from "../../../../models/Requisiciones/requisiciones";
import { buildRequisicionesPatch } from "../utils/requisicionPatch";
import { chooseFinalResponsible } from "../utils/requisicionResponsible";
import { lookPlantaIdeal } from "../utils/requisicionesGetPlantaIdeal";
import { getContractsByCO } from "../../../../Services/Requisiciones/VistaContratos.Service";
import { useNotifyRequisiciones } from "./useRequisicionNotifications";
import { createRequisicionPayload } from "../utils/RequisicionPayload";
import { notify } from '../../../../utils/notify';
import { toISODateTimeFlex } from "../../../../utils/Date";
import { useHistoricoFechas } from "./useHistoricoFechas";
import type { useNewRequisicionForm } from "./useRequisicionForm";

type Props = {
  state: requisiciones;
  setErrors: React.Dispatch<React.SetStateAction<RequisicionesErrors>>;
  stateController: ReturnType<typeof useNewRequisicionForm>;
};

export function useRequisicionesActions({ state, setErrors, stateController }: Props) {
  const notifications = useNotifyRequisiciones();
  const log = useHistoricoFechas({});
  const { DeptosYMunicipios, categorias } = useCoreGraphServices();
  const {
    plantaIdeal,
    responsableZonas,
    responsablesNivel,
    requisiciones,
    pasosVacante,
    detalleRequisicion,
  } = useRequisicionesServices();
  const {loading, setLoading} = stateController

  const validateResult = () => {
    const e = validate(state);
    console.log(e);
    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const sendNotificationPlantaIdeal = async (
    co: string,
    motivo: string,
  ): Promise<{ message: string | null; sent: boolean }> => {
    setLoading(true);
    try {

      console.log(co)
      console.log(motivo)
      const [plantaIdealDefinida, resultado] = await Promise.all([
        lookPlantaIdeal(plantaIdeal, co),
        getContractsByCO(co),
      ]);
      const totalRegistros = resultado.data.length

      if ((plantaIdealDefinida ?? 0) <= Number(totalRegistros ?? 0)) {
        await notifications.notifcacionPlantaIdeal(motivo, co, {actual: Number(plantaIdealDefinida), aprobada: totalRegistros});
      }

      return {
        message: "Se ha enviado con exito la advertencia",
        sent: true,
      };
    } catch (e) {
      console.log("fallo", e)
      return {
        message: "No se ha podido enviar la advertencia " + e,
        sent: false,
      };
    } finally {
      setLoading(false);
    }
  };

  const createDetallesPasosRequisicion = async (requisicionId: string) => {
    const pasos = await pasosVacante.getAllPlain({
      filter: "fields/Activo eq 1",
      orderby: "fields/OrdenPaso asc",
    });

    if (!pasos.length) return;

    await Promise.all(
      pasos.map((paso) =>
        detalleRequisicion.create({
          Title: paso.Id!,
          Estado: "Pendiente",
          CompletadoPor: "",
          FechaCompletadoPor: null,
          Notas: "",
          IdRequisicion: requisicionId
        })
      )
    );
  };

  const handleSubmit = async (ans: number): Promise<{ created: requisiciones | null; ok: boolean }> => {
    if (!validateResult()) {
      notify.auto("Hay campos sin rellenar");
      return {
        created: null,
        ok: false,
      };
    }

    setLoading(true);

    try {
      const categoriaCargo = (await categorias.getAll({ filter: `fields/Title eq '${state.Title}'`, top: 1 }))[0];
      const responsable = await chooseFinalResponsible(
        DeptosYMunicipios,
        responsableZonas,
        responsablesNivel,
        requisiciones,
        state.Ciudad,
        state.tipoRequisicion as "Administrativa" | "Retail",
        categoriaCargo?.Categoria || state.NivelCargo
      );

      if(!responsable){
        throw new Error("No se ha encontrado un responsable definido para esta requisicion")
      }

      const payload = await createRequisicionPayload(state, ans, responsable, categoriaCargo.Categoria)
      const created = await requisiciones.create(payload);

      if (created.Id) {
        try {
          await createDetallesPasosRequisicion(created.Id);
        } catch (detailError) {
          console.error("No se pudieron crear los detalles de pasos de la requisicion", detailError);
          notify.auto("La requisicion se creo, pero no fue posible generar los detalles de pasos.");
        }
      }

      notify.auto("Se ha creado el registro con exito");
      return {
        created,
        ok: true,
      };
    } catch {
      return {
        created: null,
        ok: false,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (requisicionSeleccionada: requisiciones) => {
    if (!validateResult()) {
      return;
    }

    setLoading(true);
    try {
      const payload = buildRequisicionesPatch(requisicionSeleccionada, state);

      if (payload.fechaIngreso) {
        const limite = new Date(state.fechaLimite ?? "").getTime();
        const ingreso = new Date(state.fechaIngreso ?? "").getTime();
        const cumple = limite < ingreso ? "No" : "Si";
        await requisiciones.update(requisicionSeleccionada.Id!, { ...payload, Estado: "Cerrado", cumpleANS: cumple });
        notify.auto("Se ha finalizado con exito la requisicion");
        return;
      }

      await requisiciones.update(requisicionSeleccionada.Id!, payload);
      notify.auto("Se ha actualizado el registro con exito");
      return;
    } finally {
      setLoading(false);
    }
  };

  const cancelarBD = async (r: requisiciones, motivo: string): Promise<boolean> => {
    if (!motivo) return false;

    setLoading(true);

    try{
      await requisiciones.update(r.Id ?? "", {
        Estado: "Cancelado",
        cumpleANS: "No Aplica",
        motivoNoCumplimiento: motivo,
      });
      await log.createNewAnsLog(r, motivo, "Cancelación")
      notify.success("Se ha cancelado la requisicion con exito");
      return true;
    } catch(e){
      notify.error("No se ha podido cancelar la requisicion " + e);
      return false;
    } finally {
      setLoading(false);
    }

  };

  const postergarANS = async (r: requisiciones, date: string, motivo: string): Promise<boolean> => {

    const formatedDate = toISODateTimeFlex(date)
    const validation = validatePostergarANS(r, date, motivo)

    if(!validation){
      return false
    }

    try{
      await requisiciones.update(r.Id!, {fechaLimite:formatedDate, motivoNoCumplimiento: motivo})
      await log.createNewAnsLog(r, motivo, formatedDate)
      await notifications.notifyAnsPostergado(r, formatedDate, motivo)
      notify.success("Se ha postergado el ANS con éxito")
      return true
    } catch(e) {
    notify.error("No se ha podido postergar el ANS " + e)
    return false
    }
  };

  return {
    loading,
    state,
    handleSubmit,
    handleEdit,
    cancelarBD,
    sendNotificationPlantaIdeal,
    postergarANS
  };
}


