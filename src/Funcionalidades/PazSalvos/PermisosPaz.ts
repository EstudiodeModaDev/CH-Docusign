import React from "react";
import type {permisos, permisosErrors } from "../../models/PazSalvo";
import type { PermisosPazSalvosService } from "../../Services/PermisosPazSalvos.service";

export function usePermisosPazSalvos(permisosPazSalvosSvc: PermisosPazSalvosService) {
  const [rows, setRows] = React.useState<permisos[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState<string>("");
  const [state, setState] = React.useState<permisos>({
    Title: "",
    Correo: "",
  });
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [errors, setErrors] = React.useState<permisosErrors>({});   
  const setField = <K extends keyof permisos>(k: K, v: permisos[K]) => setState((s) => ({ ...s, [k]: v }));
  
  const loadPermisos = React.useCallback(async () => {
    setLoading(true)
    try {
      const items = await permisosPazSalvosSvc.getAll(); 
      setRows(items);
    } catch (e: any) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [permisosPazSalvosSvc]);

  React.useEffect(() => {
    loadPermisos();
  }, [loadPermisos,search]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadPermisos(); }, [loadPermisos]);
  const reloadAll  = React.useCallback(() => { loadPermisos(); }, [loadPermisos, search]);

  const validate = () => {
    const e: permisosErrors = {};
    if(!state.Correo) e.Correo = "Obligatorio";
    if(!state.Title) e.Title = "Obligatorio"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const cleanState = () => {
    setState({
        Correo: "",
        Title: "",
    })
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {return};
    setLoading(true);
    try {
      // Objeto de creación
      const payload: permisos = {
        Correo: state.Correo,
        Title: state.Title, 
      };
      await permisosPazSalvosSvc.create(payload);
      alert("Se ha creado el registro con éxito");
      cleanState();
    } finally {
        setLoading(false);
      }
  };

  const checkAdmin = async ( email: string) => {
    setLoading(true);
    try {
        const posibilidad = await permisosPazSalvosSvc.getAll({filter: `fields/Correo eq '${email}'`});
        setIsAdmin(posibilidad.length > 0)
    } finally {
        setLoading(false);
      }
  };


  return {
    rows, loading, state, errors, isAdmin,
     applyRange, reloadAll, setSearch, setField, handleSubmit, cleanState, loadPermisos, checkAdmin, 
  };
}

