import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../graph/graphContext";
import { useCargo } from "../../../Funcionalidades/Desplegables";
import type { maestro } from "../../../models/Desplegables";
import { useSalarios } from "../../../Funcionalidades/Salario";

export const CargosManager: React.FC = () => {
  const { Maestro, salarios } = useGraphServices();
  const { items, add, editItem, reload, remove } = useCargo(Maestro);
  const { state: stateSalario, setState: setStateSalario } = useSalarios(salarios);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [state, setState] = React.useState<maestro>({T_x00ed_tulo1: "", Abreviacion: "", Title: "", Codigo: "",});

  // ======= búsqueda de salario =======
  const [cargoQuery, setCargoQuery] = React.useState<string>("");
  const [loadingSalario, setLoadingSalario] = React.useState<boolean>(false);
  const [errorSalario, setErrorSalario] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<boolean>(false);

  const resetForm = React.useCallback(() => {
    setState({ T_x00ed_tulo1: "", Abreviacion: "", Title: "", Codigo: "" });
    setStateSalario({ Salariorecomendado: "", Title: "", Id: "" });
    setCargoQuery("");
    setErrorSalario(null);
    setLoadingSalario(false);
  }, [setStateSalario]);


  const handleAddEditSalary = React.useCallback(async () => {
    const cargo = (state.T_x00ed_tulo1 ?? "").trim();
    const salarioVal = (stateSalario.Salariorecomendado ?? "").toString().trim();

    if (!cargo) return;

    // Si quieres permitir guardar salario vacío, elimina este if:
    if (!salarioVal) return;


    if (!stateSalario.Id) {
      const created = await salarios.create({Salariorecomendado: salarioVal, Title: cargo,});

      // Si create devuelve el registro, sincroniza Id para futuras ediciones
      if (created?.Id) {
        setStateSalario((prev: any) => ({ ...prev, Id: created.Id, Title: cargo }));
      } else {
        // fallback: al menos deja Title
        setStateSalario((prev: any) => ({ ...prev, Title: cargo }));
      }
    } else {
      await salarios.update(stateSalario.Id, {Salariorecomendado: salarioVal, Title: cargo,});
    }
  }, [salarios, state.T_x00ed_tulo1, stateSalario.Id, stateSalario.Salariorecomendado, setStateSalario]);

  const handleAddNew = React.useCallback(async (): Promise<maestro | null> => {
    const cargo = (state.T_x00ed_tulo1 ?? "").trim();
    if (!cargo) {
      alert("Rellene todos los campos");
      return null;
    }

    const payload: maestro = {
      Abreviacion: "",
      Title: "Cargos",
      Codigo: "",
      T_x00ed_tulo1: cargo.toLocaleUpperCase(),
    };

    // Guarda salario si aplica
    await handleAddEditSalary();

    // Limpia inputs
    resetForm();

    return payload;
  }, [state.T_x00ed_tulo1, handleAddEditSalary, resetForm]);

  const handleDelete = React.useCallback(
    async (id: string) => {
      if (!confirm("¿Seguro que quieres eliminar esta empresa?")) return;

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
  }, [reload]);

  // ======= EFECTO: buscar salario al cambiar cargoQuery (debounced) =======
  React.useEffect(() => {
    const q = (cargoQuery ?? "").trim();

    if (!q) {
      setStateSalario({ Salariorecomendado: "", Title: "", Id: "" });
      setLoadingSalario(false);
      setErrorSalario(null);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoadingSalario(true);
      setErrorSalario(null);

      try {
        const safe = q.replace(/'/g, "''");
        const res = await salarios.getAll({ filter: `fields/Title eq '${safe}'` });

        if (cancelled) return;

        if (res?.length) {
          const s = res[0];
          setStateSalario({
            Salariorecomendado: s.Salariorecomendado ?? "",
            Title: s.Title ?? q,
            Id: s.Id ?? "",
          });
        } else {
          setStateSalario({ Salariorecomendado: "", Title: q, Id: "" });
        }
      } catch (e: any) {
        if (cancelled) return;
        setErrorSalario(e?.message ?? String(e));
        setStateSalario({ Salariorecomendado: "", Title: q, Id: "" });
      } finally {
        if (!cancelled) setLoadingSalario(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cargoQuery, salarios, setStateSalario]);

  return (
    <div className="emp-page">
      <div className="emp-header">
        <button type="button" className="btn btn-primary btn-xs" onClick={() => { 
                                                                            setIsAdding(true);
                                                                            setIsEditing(false);
                                                                            setState({ ...state, T_x00ed_tulo1: "" });
                                                                            setCargoQuery("");
                                                                            setStateSalario({ Salariorecomendado: "", Title: "", Id: "" });
                                                                        }}>
          <span className="emp-add-btn__icon">＋</span>
          Añadir nuevo cargo
        </button>
      </div>

      <div className="emp-layout">
        <section className="emp-list">
          {items.map((tipoDoc) => (
            <div key={tipoDoc.Id} className="emp-row">
              <button type="button" className="emp-row__name" onClick={() => {
                                                                setIsEditing(true);
                                                                setIsAdding(false);
                                                                setState(tipoDoc);
                                                                setCargoQuery(tipoDoc.T_x00ed_tulo1 ?? "");}}>
                {tipoDoc.T_x00ed_tulo1}
              </button>

              <div className="emp-row__actions">
                <button type="button" className="emp-icon-btn" title="Eliminar" onClick={() => handleDelete(tipoDoc.Id ?? "")}>
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
                Cargos
              </label>

              <input id="empresaNombre" type="text" className="emp-input" placeholder="Cargos" value={state?.T_x00ed_tulo1} disabled={saving} onChange={(e) => {
                                                                                                                                                    const v = e.target.value;
                                                                                                                                                    setState({ ...state, T_x00ed_tulo1: v.toUpperCase() });
                                                                                                                                                    setCargoQuery(v);
                                                                                                                                                }}/>

              <input id="cargoSalario" type="number" className="emp-input" placeholder="Salario del cargo (Opcional)" value={stateSalario.Salariorecomendado}  disabled={saving} onChange={(e) =>
                                                                                                                                                                                    setStateSalario({
                                                                                                                                                                                        ...stateSalario,
                                                                                                                                                                                        Salariorecomendado: e.target.value,
                                                                                                                                                                                        Title: state.T_x00ed_tulo1,
                                                                                                                                                                                    })
                                                                                                                                                                                    }/>

              {loadingSalario && <small className="emp-help">Buscando salario…</small>}
              {errorSalario && <small className="emp-help emp-help--error">{errorSalario}</small>}
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
                                                                                            const cargo = (state?.T_x00ed_tulo1.toUpperCase() ?? "").trim();
                                                                                            if (!cargo) {
                                                                                            alert("Rellene todos los campos");
                                                                                            return;
                                                                                            }

                                                                                            setSaving(true);
                                                                                            try {
                                                                                            // Guarda el cargo
                                                                                            if (editItem) {
                                                                                                await editItem({ Title: "Cargos", T_x00ed_tulo1: cargo }, state!.Id ?? "");
                                                                                            }

                                                                                            // Guarda salario asociado (si aplica)
                                                                                            await handleAddEditSalary();
                                                                                            alert("Se ha actualizado el cargo con éxito")
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
                                                                                                    alert("Se ha creado el cargo con éxito")
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
