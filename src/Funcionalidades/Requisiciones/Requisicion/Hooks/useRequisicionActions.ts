import React from "react";
import { useCoreGraphServices, useRequisicionesServices } from "../../../../graph/graphContext";
import { validate } from "../utils/requisicionValidation";
import type { requisiciones, RequisicionesErrors } from "../../../../models/Requisiciones/requisiciones";
import { buildRequisicionesPatch } from "../utils/requisicionPatch";
import { chooseFinalResponsible } from "../utils/requisicionResponsible";
import { lookPlantaIdeal } from "../utils/requisicionesGetPlantaIdeal";
import { getContractsByCO } from "../../../../Services/Requisiciones/VistaContratos.Service";
import { useNotifyRequisiciones } from "./useRequisicionNotifications";
import { createRequisicionPayload } from "../utils/RequisicionPayload";
import { notify } from '../../../../utils/notify';

type Props = {
  state: requisiciones;
  setErrors: React.Dispatch<React.SetStateAction<RequisicionesErrors>>;
};

export function useRequisicionesActions({ state, setErrors }: Props) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const notifications = useNotifyRequisiciones();
  const { DeptosYMunicipios, categorias } = useCoreGraphServices();
  const {
    plantaIdeal,
    responsableZonas,
    responsablesNivel,
    requisiciones,
    pasosVacante,
    detalleRequisicion,
  } = useRequisicionesServices();

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
      const [plantaIdealDefinida, resultado] = await Promise.all([
        lookPlantaIdeal(plantaIdeal, co),
        getContractsByCO(co),
      ]);
      console.log(plantaIdealDefinida);
      console.log(resultado);

      if (plantaIdealDefinida ?? 0 <= Number(resultado.lenght ?? 0)) {
        await notifications.notifcacionPlantaIdeal(motivo, co, {actual: Number(plantaIdealDefinida), aprobada: resultado});
      }

      return {
        message: "Se ha enviado con exito la advertencia",
        sent: true,
      };
    } catch (e) {
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

  const cancelarBD = async (r: requisiciones): Promise<boolean> => {
    notify.auto(r.Id);
    if (!state.motivoNoCumplimiento) return false;
    await requisiciones.update(r.Id ?? "", {
      Estado: "Cancelado",
      cumpleANS: "No Aplica",
      motivoNoCumplimiento: r.motivoNoCumplimiento,
    });
    notify.auto("Se ha cancelado la requisicion con exito");
    return true;
  };

  return {
    loading,
    state,
    handleSubmit,
    handleEdit,
    cancelarBD,
    sendNotificationPlantaIdeal,
  };
}


