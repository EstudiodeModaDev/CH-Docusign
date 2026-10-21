import React from "react";
import type {  rsOption,} from "../../../../models/Commons";
import type { Cesacion, } from "../../../../models/Cesaciones";
import { useAuth } from "../../../../auth/authProvider";
import { buildCesacionCreatePayload } from "../utils/cesacionesPayload";
import { buildCesacionPatch } from "../utils/cesacionPatch";
import { useCesacionForm } from "./useCesacionForm";
import { useCesacionesTable } from "./useCesacionesTable";
import { convertCommonToOptions, convertToCommonDTO } from "../../../Common/parseOptions";
import { useRequestActions } from "../../UpdateRequest/hooks/useRequestActions";
import { detallePayloadFromCesacion } from "../../UpdateRequestDetails/utils/requestPayload";
import { notifyUpdateRequest } from "../../../../utils/mail";
import { toGraphDateTime } from "../../../../utils/Date";
import { useCoreGraphServices, useGestorServices } from "../../../../graph/graphContext";
import { notify } from '../../../../utils/notify';
import { useAuditLog } from "../../../Common/useAuditLog";

export function useCesaciones() {
  const { account } = useAuth();
  const {Cesaciones} = useGestorServices()
  const {mail, graph, log} = useCoreGraphServices()
  const formController = useCesacionForm(account?.username ?? "")
  const registerController = useCesacionesTable(Cesaciones, account?.username)
  const requestController = useRequestActions()
  const [workers, setWorkers] = React.useState<Cesacion[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { audit, withAudit } = useAuditLog("Contrataciones");

  const auditActor = {
    actor: account?.name ?? "Desconocido",
    correo_actor: account?.username ?? "Desconocido",
  };


  const handleSubmit = async (): Promise<{ created: Cesacion | null; ok: boolean }> => {
    const validationErrors = formController.validate()
    const payload = buildCesacionCreatePayload(formController.state);

    let created: Cesacion | null = null;
    let success = false;
    let attempted = false;

    if (!validationErrors) {
      notify.auto("Hay campos sin rellenar");
      return { ok: false, created: null };
    }

    setLoading(true);
    attempted = true
    try {
      
      created = await Cesaciones.create(payload);
      success = true
      registerController.loadFirstPage();
      notify.auto("Se ha creado el registro con éxito");
      return { ok: true, created: created };
    } catch {
      return { ok: false, created: null };
    } finally {

      if (attempted) {
        await log.create({
          accion: "Creacion",
          ...auditActor,
          descripcion: success
            ? "Se creó un registro en el módulo de cesaciones"
            : "Falló la creación de un registro en el módulo de cesaciones",
          detalle: JSON.stringify({
            campos_enviados: Object.keys(payload),
          }),
          id_item_afectado: created?.Id,
          modulo: "Contrataciones",
          resultado: success ? "Exito" : "Error",
        });
      }

      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent, cesacionSeleccionada: Cesacion, canEdit: boolean) => {
    e.preventDefault();

    const validationErrors = formController.validate()

    if (!validationErrors) {
      notify.auto("Hay algunos campos faltantes")
      return
    };
    if (!cesacionSeleccionada.Id) {
      notify.auto("Registro sin Id");
      return;
    }

    setLoading(true);

    try {
      const toEdit = await Cesaciones.get(cesacionSeleccionada.Id!)
      const payload = buildCesacionPatch(toEdit, formController.state, );

      if (Object.keys(payload).length === 0) {
        notify.auto("No hay cambios para guardar");
        return;
      }

      
      if(!canEdit){
        await withAudit(
          {
            accion: "Edicion",
            descripcion: "Se actualizó un registro de cesación",
            descripcionError: "Falló la actualización de un registro de cesación",
            id_item_afectado: cesacionSeleccionada.Id,
            detalle: { campos_modificados: Object.keys(payload) },
          },
          () => Cesaciones.update(cesacionSeleccionada.Id!, payload)
        );
        notify.auto("Se ha actualizado el registro con éxito");
      } else {
        const detalleSolicitud = { tipo_evento: "SolicitudEdicion", campos_solicitados: Object.keys(payload) };

        const request = await requestController.createRequest("Cesacion", cesacionSeleccionada.Id)
        if(!request.created || !request.ok) {
          await audit({
            accion: "Edicion",
            descripcion: "No fue posible crear la solicitud de edición de una cesación",
            id_item_afectado: cesacionSeleccionada.Id,
            detalle: detalleSolicitud,
            resultado: "Error",
          });
          return
        }
        const solicitudCreada = request.created;

        await withAudit(
          {
            accion: "Edicion",
            descripcion: "Se solicitó la edición de una cesación",
            descripcionError: "Falló el proceso de solicitud de edición de una cesación",
            id_item_afectado: cesacionSeleccionada.Id,
            detalle: { ...detalleSolicitud, id_solicitud: solicitudCreada.Id },
          },
          async () => {
            const realRegister = await Cesaciones.get(cesacionSeleccionada.Id!)

            const DetallesPayload = detallePayloadFromCesacion(realRegister, formController.state, solicitudCreada.Id!)

            requestController.genericProcess("Cesacion", DetallesPayload,)

            const groupMembers = await graph.getAllGroupMembers("3dc57761-477f-4096-99c8-e533b6fd7423", {excludeEmail: "larendon@estudiodemoda.com.co"})
            await notifyUpdateRequest(mail, "Cesacion", account?.name ?? "", cesacionSeleccionada.Title, groupMembers,)
          }
        );

        notify.auto("Se ha enviado la solicitud, se te notificara el resultado")
        
      }
    } catch {
      notify.auto("Ha ocurrido un error");
    } finally {
      setLoading(false);
    }
  };

  const searchWorker = async (query: string): Promise<Cesacion[]> => {
    const resp = await Cesaciones.getAll({filter: `fields/Title eq '${query}'`, top: 200,});

    const foundWorkers = resp.items ?? [];
    setWorkers(foundWorkers);

    const convertedToCommon = foundWorkers.map(worker => convertToCommonDTO(worker));
    setWorkersOptions(convertCommonToOptions(convertedToCommon));

    return foundWorkers;
  };

  const searchRegister = async (query: string): Promise<Cesacion | null> => {
    const resp = await Cesaciones.findLastByTitle(query);

    return resp ? resp : null;
  };

  const handleCancelProcessbyId = React.useCallback(
    async (Id: string, RazonCancelacion: string) => {
      try {
        const proceso = await Cesaciones.get(Id);

        if (proceso) {
          await withAudit(
            {
              accion: "Edicion",
              descripcion: "Se canceló un proceso de cesación",
              descripcionError: "Falló la cancelación de un proceso de cesación",
              id_item_afectado: Id,
              detalle: { campos_modificados: ["CanceladoPor", "Estado", "RazonCancelacion"], estado_resultante: "Cancelado" },
            },
            () => Cesaciones.update(Id, {
              CanceladoPor: account?.name,
              Estado: "Cancelado",
              RazonCancelacion,
            })
          );
          notify.auto("Se ha cancelado este proceso con éxito");
          registerController.loadFirstPage();
        }
      } catch {
        throw new Error("Ha ocurrido un error cancelando el proceso");
      }
    },
    [account?.name, withAudit]
  );

  const handleReactivateProcessById = React.useCallback(
    async (Id: string) => {
      try {
        const proceso = await Cesaciones.get(Id);

        if (proceso) {
          await withAudit(
            {
              accion: "Edicion",
              descripcion: "Se reactivó un proceso de cesación",
              descripcionError: "Falló la reactivación de un proceso de cesación",
              id_item_afectado: Id,
              detalle: { campos_modificados: ["Estado"], estado_resultante: "En proceso" },
            },
            () => Cesaciones.update(Id, { Estado: "En proceso" })
          );
          notify.auto("Se ha reactivado este proceso con éxito");
          registerController.loadFirstPage();
        }
      } catch {
        throw new Error("Ha ocurrido un error reactivando el proceso");
      }
    },
    [withAudit]
  );

  const deleteCesacion = React.useCallback(async (Id: string) => {
      try {
        await withAudit(
          {
            accion: "Eliminacion",
            descripcion: "Se eliminó un registro de cesación",
            descripcionError: "Falló la eliminación de un registro de cesación",
            id_item_afectado: Id,
          },
          () => Cesaciones.delete(Id)
        );
        await registerController.loadBase()
        notify.auto("Se ha eliminado el registro con exito.")
      } catch {
        throw new Error("Ha ocurrido un error eliminando la cesación");
      }
    },
    [withAudit]
  );

  const saveMedicalExams = React.useCallback(async (Id: string, fecha: string) => {
      try {
        if(!Id || !fecha ) return

        const spDate = toGraphDateTime(fecha)
        await withAudit(
          {
            accion: "Edicion",
            descripcion: "Se registró la fecha de exámenes médicos de una cesación",
            descripcionError: "Falló el registro de la fecha de exámenes médicos de una cesación",
            id_item_afectado: Id,
            detalle: { campo_modificado: "FechaExamenesMedicos" },
          },
          () => Cesaciones.update(Id, {FechaExamenesMedicos: spDate})
        );
        await registerController.loadBase()
        notify.auto("Se ha guardado la fecha de los examenes medicos con éxito.")
      } catch {
        throw new Error("Ha ocurrido un error eliminando la novedad");
      }
    },
    [withAudit]
  )

  return {
    formController,
    workers,
    workersOptions,
    handleReactivateProcessById,
    handleCancelProcessbyId,
    saveMedicalExams,
    handleSubmit,
    searchRegister,
    handleEdit,
    searchWorker,
    deleteCesacion,
    ...formController,
    ...registerController,
    loading
  };
}

