
import React from "react";
import type { rsOption } from "../../../../models/Commons";
import { useAuth } from "../../../../auth/authProvider";
import {convertCommonToOptions, convertToCommonDTO,} from "../../../Common/parseOptions";
import { contratosPayload } from "../utils/contratosPayload";
import type { Novedad } from "../../../../models/Novedades";
import { useContratosTable } from "./useContratosTable";
import { useContratosForm } from "./useContratosForm";
import { buildContratosPatch } from "../utils/contratosPatch";
import { useRequestActions } from "../../UpdateRequest/hooks/useRequestActions";
import { useRequestDetailsActions } from "../../UpdateRequestDetails/hooks/useRequestDetailsActions";
import { detallePayloadFromContrato } from "../../UpdateRequestDetails/utils/requestPayload";
import { notifyUpdateRequest } from "../../../../utils/mail";
import { toGraphDateTime } from "../../../../utils/Date";
import {
  useCoreGraphServices,
  useGestorServices,
} from "../../../../graph/graphContext";
import { notify } from "../../../../utils/notify";

export function useContratos() {
  const { account } = useAuth();
  const { Contratos } = useGestorServices();
  const { graph, mail, log } = useCoreGraphServices();

  const formController = useContratosForm(account?.name ?? "");
  const registerController = useContratosTable(
    Contratos,
    account?.username
  );
  const requestController = useRequestActions();
  const requestDetailsController = useRequestDetailsActions();

  const [workers, setWorkers] = React.useState<Novedad[]>([]);
  const [workersOptions, setWorkersOptions] = React.useState<rsOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Evita que un fallo al guardar el log altere la operación principal.
  const safeLog = React.useCallback(async (entry: Parameters<typeof log.create>[0]): Promise<void> => {
    try {
      await log.create(entry);
    } catch (error) {
      console.error("No fue posible guardar el log de auditoría:", error);
    }
  }, [log]);

  // Datos comunes de auditoría.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const auditActor = {
    actor: account?.name ?? "Desconocido",
    correo_actor: account?.username ?? "Desconocido",
  };

  // CREAR CONTRATO
  const handleSubmit = async (): Promise<{created: Novedad | null; ok: boolean;}> => {
    const validationErrors = formController.validate();

    if (!validationErrors) {
      notify.auto("Hay campos sin rellenar");
      return { ok: false, created: null };
    }

    const payload = contratosPayload(formController.state);

    let created: Novedad | null = null;
    let success = false;
    let attempted = false;

    setLoading(true);

    try {
      attempted = true;

      created = await Contratos.create(payload);
      success = true;

      void registerController.loadFirstPage();

      notify.auto("Se ha creado el registro con éxito");

      return { ok: true, created };
    } catch (error) {
      console.error("Error creando el contrato:", error);

      notify.auto("Ha ocurrido un error al crear el registro");

      return { ok: false, created: null };
    } finally {
      if (attempted) {
        await safeLog({
          accion: "Creacion",
          ...auditActor,
          descripcion: success
            ? "Se creó un registro en el módulo de contrataciones"
            : "Falló la creación de un registro en el módulo de contrataciones",
          detalle: JSON.stringify({
            campos_enviados: Object.keys(payload),
          }),
          id_item_afectado: created?.Id ?? "",
          modulo: "Contrataciones",
          resultado: success ? "Exito" : "Error",
        });
      }

      setLoading(false);
    }
  };

  // EDITAR CONTRATO O SOLICITAR SU EDICIÓN
  const handleEdit = async (e: React.FormEvent, contratoToEdit: Novedad, canEdit: boolean): Promise<void> => {
    e.preventDefault();

    const validationErrors = formController.validate();

    if (!validationErrors) {
      notify.auto("Hay algunos campos faltantes");
      return;
    }

    const contratoId = contratoToEdit.Id;

    if (!contratoId) {
      notify.auto("Registro sin Id");
      return;
    }

    setLoading(true);

    let original: Novedad | null = null;
    let success = false;
    let attempted = false;
    let shouldLog = false;

    let description = "";
    let detail: string | undefined;

    try {
      // La consulta queda dentro del try para controlar sus errores.
      original = await Contratos.get(contratoId);

      const payload = buildContratosPatch(contratoToEdit, original);

      if (Object.keys(payload).length === 0) {
        notify.auto("No hay cambios para guardar");
        return;
      }

      attempted = true;
      shouldLog = true;

      if (!canEdit) {
        // Edición directa.
        description = "Se actualizó un contrato";

        detail = JSON.stringify({
          campos_modificados: Object.keys(payload),
        });

        await Contratos.update(contratoId, payload);

        success = true;

        notify.auto("Se ha actualizado el registro con éxito");
      } else {
        // Solicitud de edición sujeta a aprobación.
        description = "Se solicitó la edición de un contrato";

        detail = JSON.stringify({
          tipo_evento: "SolicitudEdicion",
          campos_solicitados: Object.keys(payload),
        });

        const request = await requestController.createRequest("Contratacion", contratoId);

        if (!request.created || !request.ok) {
          description = "No fue posible crear la solicitud de edición";
          notify.auto("No fue posible crear la solicitud");
          return;
        }

        const realRegister = await Contratos.get(contratoId);

        const detallesPayload = detallePayloadFromContrato(
          realRegister,
          formController.state,
          request.created.Id ?? ""
        );

        for (const detalle of detallesPayload) {
          await requestDetailsController.createDetails(detalle);
        }

        const groupMembers = await graph.getAllGroupMembers("3dc57761-477f-4096-99c8-e533b6fd7423",{ excludeEmail: "larendon@estudiodemoda.com.co",});

        await notifyUpdateRequest(
          mail,
          "Contrato",
          account?.name ?? "",
          contratoToEdit.Numero_x0020_identificaci_x00f3_,
          groupMembers
        );

        success = true;

        notify.auto( "Se ha enviado la solicitud, se te notificará el resultado");
      }
    } catch (error) {
      console.error("Error procesando la edición del contrato:", error);

      description = canEdit
        ? "Falló el proceso de solicitud de edición de un contrato"
        : "Falló la actualización de un contrato";

      notify.auto("Ha ocurrido un error");
    } finally {
      if (attempted && shouldLog) {
        await safeLog({
          accion: "Edicion",
          ...auditActor,
          descripcion: description,
          detalle: detail,
          id_item_afectado: contratoId,
          modulo: "Contrataciones",
          resultado: success ? "Exito" : "Error",
        });
      }

      setLoading(false);
    }
  };

  // BUSCAR TRABAJADORES
  const searchWorker = async (query: string): Promise<Novedad[]> => {
    const resp = await Contratos.getAll({
      filter: `fields/Numero_x0020_identificaci_x00f3_ eq '${query}'`,
      top: 200,
    });

    const foundWorkers = resp.items ?? [];

    setWorkers(foundWorkers);

    const convertedToCommon = foundWorkers.map((worker) => convertToCommonDTO(worker));

    setWorkersOptions(convertCommonToOptions(convertedToCommon));

    return foundWorkers;
  };

  // BUSCAR EL ÚLTIMO REGISTRO
  const searchRegister = async (query: string): Promise<Novedad | null> => {
    const resp = await Contratos.findLastByDoc(query);

    return resp ?? null;
  };

  // CANCELAR PROCESO
  const handleCancelProcessbyId = React.useCallback(async (Id: string, RazonCancelacion: string): Promise<void> => {
      let success = false;
      let attempted = false;

      try {
        const proceso = await Contratos.get(Id);

        if (!proceso) {
          throw new Error("No se encontró el proceso");
        }

        attempted = true;

        await Contratos.update(Id, {CanceladoPor: account?.name, Estado: "Cancelado", RazonCancelacion,});

        success = true;

        notify.auto("Se ha cancelado este proceso con éxito");
        await registerController.loadFirstPage();
      } catch (error) {
        console.error("Error cancelando el proceso:", error);

        throw new Error("Ha ocurrido un error cancelando el proceso");
      } finally {
        if (attempted) {
          await safeLog({
            accion: "Edicion",
            ...auditActor,
            descripcion: success
              ? "Se canceló un proceso de contratación"
              : "Falló la cancelación de un proceso de contratación",
            detalle: JSON.stringify({
              estado_resultante: success ? "Cancelado" : null,
            }),
            id_item_afectado: Id,
            modulo: "Contrataciones",
            resultado: success ? "Exito" : "Error",
          });
        }
      }
    },
    [Contratos, account?.name, auditActor, registerController, safeLog]
  );

  // REACTIVAR PROCESO
  const handleReactivateProcessById = React.useCallback(
    async (Id: string): Promise<void> => {
      let success = false;
      let attempted = false;

      try {
        const proceso = await Contratos.get(Id);

        if (!proceso) {
          throw new Error("No se encontró el proceso");
        }

        attempted = true;

        await Contratos.update(Id, {Estado: "En proceso",});

        success = true;

        notify.auto("Se ha reactivado este proceso con éxito");
        await registerController.loadFirstPage();
      } catch (error) {
        console.error("Error reactivando el proceso:", error);

        throw new Error("Ha ocurrido un error reactivando el proceso");
      } finally {
        if (attempted) {
          await safeLog({
            accion: "Edicion",
            ...auditActor,
            descripcion: success
              ? "Se reactivó un proceso de contratación"
              : "Falló la reactivación de un proceso de contratación",
            detalle: JSON.stringify({
              estado_resultante: success ? "En proceso" : null,
            }),
            id_item_afectado: Id,
            modulo: "Contrataciones",
            resultado: success ? "Exito" : "Error",
          });
        }
      }
    },
    [Contratos, auditActor, registerController, safeLog]);

  // ELIMINAR CONTRATO
  const deleteContrato = React.useCallback(async (Id: string): Promise<void> => {
    let success = false;
    let attempted = false;

    try {
      attempted = true;

      await Contratos.delete(Id);

      success = true;

      await registerController.loadBase();

      notify.auto("Se ha eliminado el registro con éxito");
    } catch (error) {
      console.error("Error eliminando el contrato:", error);

      throw new Error("Ha ocurrido un error eliminando el contrato");
    } finally {
      if (attempted) {
        await safeLog({
          accion: "Eliminacion",
          ...auditActor,
          descripcion: success
            ? "Se eliminó un registro del módulo de contrataciones"
            : "Falló la eliminación de un registro del módulo de contrataciones",
          id_item_afectado: Id,
          modulo: "Contrataciones",
          resultado: success ? "Exito" : "Error",
        });
      }
    }
  },[Contratos, auditActor, registerController, safeLog]);

  // GUARDAR FECHA DE EXÁMENES MÉDICOS
  const saveMedicalExams = React.useCallback(async (Id: string, fecha: string): Promise<void> => {
    if (!Id || !fecha) {
      return;
    }

    let success = false;
    let attempted = false;

    try {
      const spDate = toGraphDateTime(fecha);

      attempted = true;

      await Contratos.update(Id, {FechaExamenesMedicos: spDate,});

      success = true;

      await registerController.loadBase();

      notify.auto("Se ha guardado la fecha de los exámenes médicos con éxito.");
    } catch (error) {
      console.error("Error guardando la fecha de exámenes:", error);

      throw new Error("Ha ocurrido un error guardando la fecha de los exámenes médicos");
    } finally {
      if (attempted) {
        await safeLog({
          accion: "Edicion",
          ...auditActor,
          descripcion: success
            ? "Se actualizó la fecha de exámenes médicos de un contrato"
            : "Falló la actualización de la fecha de exámenes médicos",
          detalle: JSON.stringify({campo_modificado: "FechaExamenesMedicos",}),
          id_item_afectado: Id,
          modulo: "Contrataciones",
          resultado: success ? "Exito" : "Error",
        });
      }
    }
  },[Contratos, auditActor, registerController, safeLog]);

  return {
    formController,
    workers,
    workersOptions,
    handleReactivateProcessById,
    handleCancelProcessbyId,
    handleSubmit,
    searchRegister,
    handleEdit,
    searchWorker,
    deleteContrato,
    saveMedicalExams,
    ...formController,
    ...registerController,
    loading,
  };
}
