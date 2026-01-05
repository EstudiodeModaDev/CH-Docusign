import React from "react";
import type { salario, salarioErrors } from "../models/Desplegables";
import type { CategoriaCargosService } from "../Services/CategoriaCargos.service";
import type { CargoCategoria } from "../models/Maestros";

export function useAutomaticCargo(nivelSvc: CategoriaCargosService) {
    const [rows, setRows] = React.useState<CargoCategoria[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [state, setState] = React.useState<CargoCategoria>({Categoria: "", Title: ""});
    const [errors, setErrors] = React.useState<salarioErrors>({});
  
    const loadAll = React.useCallback(async () => {
        setLoading(true); setError(null);
        try {
        const items = await nivelSvc.getAll();
        setRows(items);
        } catch (e: any) {
        setError(e?.message ?? "Error cargando los salarios");
        setRows([]);
        } finally {
        setLoading(false);
        }
    }, [nivelSvc]);

    const loadSpecificLevel = React.useCallback(async (cargo: string): Promise<CargoCategoria | null> => {
        setLoading(true);
        setError(null);
        if(!cargo) return null
        try {
            const items = await nivelSvc.getAll({filter: `fields/Title eq '${cargo}'`,});
            return items.length > 0 ? items[0] : null;
        } catch (e: any) {
            setError(e?.message ?? "Error cargando los niveles de cargo");
            return null;
        } finally {
            setLoading(false);
        }
    },[nivelSvc]);

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
    if(!state.Categoria) e.Salariorecomendado = "Ingrese un nivel recomendado para este cargo"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { return};
    setLoading(true);
    try {
      // Objeto de creación
      const payload: CargoCategoria = {
        Categoria: state.Categoria,
        Title: state.Title
      };
      await nivelSvc.create(payload);
      alert("Se ha creado el registro con éxito");
      loadAll()
    } finally {
        setLoading(false);
      }
  };

  const handleEdit = async (categoriaSeleccionado: CargoCategoria) => {
    if (!validate()) { return};
    setLoading(true);
    try {  
      const payload: CargoCategoria = {
        Categoria: categoriaSeleccionado.Categoria !== state.Categoria ? state.Categoria : categoriaSeleccionado.Categoria,
        Title: categoriaSeleccionado.Title !== state.Title ? state.Title : categoriaSeleccionado.Title,
      };
      await nivelSvc.update(categoriaSeleccionado.Id!, payload);
      alert("Se ha actualizado el registro con éxito");
      loadAll()
    } finally {
        setLoading(false);
      }
  };

  return {
    rows, loading, error, state, errors,
     applyRange, reloadAll, setField, handleSubmit, handleEdit, loadSpecificLevel, loadAll, setState
  };
}

