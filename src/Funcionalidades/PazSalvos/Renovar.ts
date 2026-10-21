import React from "react";
import type {permisos, renovar } from "../../models/PazSalvo";
import type { RenovarService } from "../../Services/Renovar.service";
import { useAuth } from "../../auth/authProvider";
import { notify } from '../../utils/notify';
import { useAuditLog } from "../Common/useAuditLog";

export function useRenovar(renovarServiceSvc: RenovarService) {
  const [rows, setRows] = React.useState<permisos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [state, setState] = React.useState<renovar>({
    Title: "",
    Estado: "",
    Nombre: ""
  });
  const setField = <K extends keyof renovar>(k: K, v: renovar[K]) => setState((s) => ({ ...s, [k]: v }));
  const {account} = useAuth();
  const { withAudit } = useAuditLog("Paz y salvos");
  
  const loadRenovables = React.useCallback(async () => {
    setLoading(true)
    try {
      const items = await renovarServiceSvc.getAll({filter: `fields/Title eq '${account?.username}'`}); 
      setRows(items);
      return items;
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [renovarServiceSvc]);

  const cleanState = () => {
    setState({
        Estado: "",
        Title: "",
        Nombre: ""
    })
  };

  const handleSubmit = async (override?: Partial<renovar>) => {
    setLoading(true);
    try {
      // Objeto de creación
      const payload: renovar = {
        Estado: "Renovar",
        Title: override?.Title ?? state.Title,
        Nombre: override?.Nombre ?? state.Nombre
      };
      await withAudit(
        {
          accion: "Creacion",
          descripcion: "Se registró una solicitud de renovación de firma",
          descripcionError: "Falló el registro de una solicitud de renovación de firma",
          detalle: { campos_enviados: Object.keys(payload), estado_resultante: payload.Estado },
          idFromResult: (r) => r?.Id,
        },
        () => renovarServiceSvc.create(payload)
      );

      cleanState();
    } finally {
        setLoading(false);
      }
  };

  const updateState = async () => {
    const userState = rows.find(r => r.Title === account?.username);
    if (userState) {
      void withAudit(
        {
          accion: "Edicion",
          descripcion: "Se marcó la firma como renovada",
          descripcionError: "Falló la actualización del estado de renovación de firma",
          id_item_afectado: userState.Id,
          detalle: { campos_actualizados: ["Estado"], estado_resultante: "Renovado" },
        },
        () => renovarServiceSvc.update(userState.Id ?? "", {Estado: "Renovado" })
      );
      notify.auto("Su firma ha sido renovada correctamente.");
    }
  }

  return {
    rows, loading, state,
    setField, handleSubmit, cleanState, loadRenovables, updateState
  };
}



