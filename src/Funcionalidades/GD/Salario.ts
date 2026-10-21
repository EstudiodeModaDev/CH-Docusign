import React from "react";
import type { SalariosService } from "../../Services/Salarios.service";
import type { salario, salarioErrors } from "../../models/Desplegables";
import { notify } from '../../utils/notify';
import { useAuditLog } from "../Common/useAuditLog";

export function useSalarios(salariosSvc: SalariosService) {
    const { withAudit } = useAuditLog("Configuracion");
    const [rows, setRows] = React.useState<salario[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [state, setState] = React.useState<salario>({Salariorecomendado: "", Title: ""});
    const [errors, setErrors] = React.useState<salarioErrors>({});
  
    const loadAll = React.useCallback(async () => {
        setLoading(true); setError(null);
        try {
        const items = await salariosSvc.getAll();
        setRows(items);
        } catch (e: any) {
        setError(e?.message ?? "Error cargando los salarios");
        setRows([]);
        } finally {
        setLoading(false);
        }
    }, [salariosSvc]);

    const loadSpecificSalary = React.useCallback(async (cargo: string): Promise<salario | null> => {
        setLoading(true);
        setError(null);
        if(!cargo) return null
        try {
            const items = await salariosSvc.getAll({filter: `fields/Title eq '${cargo}'`,});
            return items.length > 0 ? items[0] : null;
        } catch (e: any) {
            setError(e?.message ?? "Error cargando los salarios");
            return null;
        } finally {
            setLoading(false);
        }
    },[salariosSvc]);

    React.useEffect(() => {
        loadAll();
    }, [loadAll]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadAll(); }, [loadAll]);
  const reloadAll  = React.useCallback(() => { loadAll(); }, [loadAll, ]);
  const setField = <K extends keyof salario>(k: K, v: salario[K]) => setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: salarioErrors = {};
    if(!state.Title) e.Title = "Seleccione un cargo"
    if(!state.Salariorecomendado) e.Salariorecomendado = "Ingrese un salario recomendado para este cargo"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { return};
    setLoading(true);
    try {
      // Objeto de creación
      const payload: salario = {
        Salariorecomendado: state.Salariorecomendado,
        Title: state.Title
      };
      await withAudit(
        {
          accion: "Creacion",
          descripcion: "Se creó un salario recomendado para un cargo",
          descripcionError: "Falló la creación de un salario recomendado para un cargo",
          detalle: { cargo: payload.Title, campos_enviados: Object.keys(payload) },
          idFromResult: (r: any) => r?.Id,
        },
        () => salariosSvc.create(payload)
      );
      notify.auto("Se ha creado el registro con éxito");
      loadAll()
    } finally {
        setLoading(false);
      }
  };

  const handleEdit = async (salarioSeleccionado: salario) => {
    if (!validate()) { return};
    setLoading(true);
    try {  
      const payload: salario = {
        Salariorecomendado: salarioSeleccionado.Salariorecomendado !== state.Salariorecomendado ? state.Salariorecomendado : salarioSeleccionado.Salariorecomendado,
        Title: salarioSeleccionado.Title !== state.Title ? state.Title : salarioSeleccionado.Title,
      };
      await withAudit(
        {
          accion: "Edicion",
          descripcion: "Se editó el salario recomendado de un cargo",
          descripcionError: "Falló la edición del salario recomendado de un cargo",
          id_item_afectado: salarioSeleccionado.Id,
          detalle: { cargo: payload.Title, campos_enviados: Object.keys(payload) },
        },
        () => salariosSvc.update(salarioSeleccionado.Id!, payload)
      );
      notify.auto("Se ha actualizado el registro con éxito");
      loadAll()
    } finally {
        setLoading(false);
      }
  };

  return {
    rows, loading, error, state, errors,
     applyRange, reloadAll, setField, handleSubmit, handleEdit, loadSpecificSalary, loadAll, setState
  };
}



