import React from "react";
import type {permisos, renovar } from "../../models/PazSalvo";
import type { RenovarService } from "../../Services/Renovar.service";
import { useAuth } from "../../auth/authProvider";

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
  
  const loadRenovables = React.useCallback(async () => {
    setLoading(true)
    try {
      const items = await renovarServiceSvc.getAll({filter: `fields/Title eq '${account?.username}'`}); 
      setRows(items);
      return items;
    } catch (e: any) {
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
      await renovarServiceSvc.create(payload);

      cleanState();
    } finally {
        setLoading(false);
      }
  };

  const updateState = async () => {
    const userState = rows.find(r => r.Title === account?.username);
    if (userState) {
      renovarServiceSvc.update(userState.Id ?? "", {Estado: "Renovado" });
      alert("Su firma ha sido renovada correctamente.");
    }
  }

  return {
    rows, loading, state,
    setField, handleSubmit, cleanState, loadRenovables, updateState
  };
}

