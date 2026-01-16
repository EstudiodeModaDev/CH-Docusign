import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../../graph/graphContext";
import { useOrigenSeleccion } from "../../../../Funcionalidades/Desplegables";
import type { maestro } from "../../../../models/Desplegables";

export const OrigenSeleccionManager: React.FC = () => {
  const { Maestro, } = useGraphServices();

  const { items, add, editItem, reload, remove } = useOrigenSeleccion(Maestro);

  const [isEditing, setIsEditing] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);

  const [state, setState] = React.useState<maestro>({
    T_x00ed_tulo1: "",
    Abreviacion: "",
    Title: "",
    Codigo: "",
  });

  const [saving, setSaving] = React.useState<boolean>(false);

  const resetForm = React.useCallback(() => {
    setState({ T_x00ed_tulo1: "", Abreviacion: "", Title: "", Codigo: "" });
  }, []);

  const handleAddNew = React.useCallback(async (): Promise<maestro | null> => {
    const origen = (state.T_x00ed_tulo1 ?? "").trim();
    if (!origen) {
      alert("Rellene todos los campos");
      return null;
    }

    return {
      Abreviacion: "",
      Title: "Origenes selecciones",
      Codigo: "",
      T_x00ed_tulo1: origen.toLocaleUpperCase(),
    };
  }, [state.T_x00ed_tulo1]);

  const handleDelete = React.useCallback(
    async (id: string) => {
      if (!confirm("¿Seguro que quieres eliminar este origen de selección?")) return;

      setIsAdding(false);
      setIsEditing(false);

      if (remove) {
        await remove(id);
      }

      resetForm();
      reload();
    },
    [remove, reload, resetForm]
  );

  React.useEffect(() => {
    reload();
  }, [reload, ]);

  return (
    <div className="emp-page">
      <div className="emp-header">
        <button type="button" className="btn btn-primary btn-xs" onClick={() => {
                                                                    setIsAdding(true);
                                                                    setIsEditing(false);
                                                                    setState({ ...state, T_x00ed_tulo1: "" });}}>
          <span className="emp-add-btn__icon">＋</span>
          Añadir nuevo origen de selección
        </button>
      </div>

      <div className="emp-layout">
        <section className="emp-list">
          {items.map((o) => (
            <div key={o.Id} className="emp-row">
              <button type="button" className="emp-row__name" onClick={() => {
                                                                setIsEditing(true);
                                                                setIsAdding(false);
                                                                setState(o);}}>
                {o.T_x00ed_tulo1}
              </button>

              <div className="emp-row__actions">
                <button type="button" className="emp-icon-btn" title="Eliminar" onClick={() => handleDelete(o.Id ?? "")}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </section>

        {(isAdding || isEditing) && (
          <section className="emp-form">
            <div className="emp-field">
              <label className="emp-label" htmlFor="empresaNombre">
                Origenes de selección
              </label>

              <input id="empresaNombre" type="text" className="emp-input" placeholder="Cargos" value={state?.T_x00ed_tulo1 ?? ""} disabled={saving} onChange={(e) => {
                                                                                                                                                        const up = (e.target.value ?? "").toUpperCase();
                                                                                                                                                        setState({ ...state, T_x00ed_tulo1: up });}}/>


            </div>

            {isEditing && (
              <div className="emp-actions">
                <button type="button" className="emp-btn emp-btn--cancel" disabled={saving} onClick={() => {
                                                                                                setIsEditing(false);
                                                                                                setIsAdding(false);
                                                                                                resetForm();
                                                                                            }}>
                  ✕
                </button>

                <button type="button" className="emp-btn emp-btn--ok" disabled={saving} onClick={async () => { 
                                                                                                    const cargo = (state?.T_x00ed_tulo1?.toUpperCase() ?? "").trim();
                                                                                                    if (!cargo) {
                                                                                                        alert("Rellene todos los campos");
                                                                                                        return;
                                                                                                    }
                                                                                                    setSaving(true);
                                                                                                    try {
                                                                                                        if (editItem) {
                                                                                                            await editItem({ Title: "Origenes selecciones", T_x00ed_tulo1: cargo }, state!.Id ?? "");
                                                                                                        }

                                                                                                        alert("Se ha actualizado el cargo con éxito");
                                                                                                        reload();
                                                                                                        setIsEditing(false);
                                                                                                        resetForm();
                                                                                                    } catch (e: any) {
                                                                                                        console.error(e);
                                                                                                        alert(e?.message ?? String(e));
                                                                                                    } finally {
                                                                                                        setSaving(false);
                                                                                                    }
                                                                                                }}>
                  ✔
                </button>
              </div>
            )}

            {isAdding && (
              <div className="emp-actions">
                <button type="button" className="emp-btn emp-btn--cancel" disabled={saving} onClick={() => { 
                                                                                                setIsEditing(false);
                                                                                                setIsAdding(false);
                                                                                                resetForm();
                                                                                            }}>
                  ✕
                </button>

                <button type="button" className="emp-btn emp-btn--ok" disabled={saving} onClick={async () => { 
                                                                                                    setSaving(true);
                                                                                                    try {
                                                                                                        const payload = await handleAddNew();
                                                                                                        if (!payload?.T_x00ed_tulo1?.trim()) return;

                                                                                                        if (add) await add(payload);


                                                                                                        alert("Se ha creado el origen de selección con éxito");
                                                                                                        reload();
                                                                                                        setIsAdding(false);
                                                                                                        resetForm();
                                                                                                    } catch (e: any) {
                                                                                                        console.error(e);
                                                                                                        alert(e?.message ?? String(e));
                                                                                                    } finally {
                                                                                                    setSaving(false);
                                                                                                    }
                                                                                                }}>
                  ✔
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
