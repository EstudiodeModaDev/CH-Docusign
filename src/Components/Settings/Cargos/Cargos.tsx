import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../graph/graphContext";
import { useCargo, useNivelCargo } from "../../../Funcionalidades/Desplegables";
import type { maestro } from "../../../models/Desplegables";
import { useSalarios } from "../../../Funcionalidades/Salario";
import { useAutomaticCargo } from "../../../Funcionalidades/Niveles";

export const CargosManager: React.FC = () => {
  const { Maestro, salarios, categorias } = useGraphServices();

  const { items, add, editItem, reload, remove } = useCargo(Maestro);
  const { reload: reloadNiveles, items: nivelesCargo } = useNivelCargo(Maestro);

  const { state: stateSalario, setState: setStateSalario } = useSalarios(salarios);
  const { state: stateCategoriaCargo, setState: setStateCargoAutomatico } = useAutomaticCargo(categorias);

  const [isEditing, setIsEditing] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);

  const [state, setState] = React.useState<maestro>({
    T_x00ed_tulo1: "",
    Abreviacion: "",
    Title: "",
    Codigo: "",
  });

  // ======= búsqueda de salario / nivel =======
  const [cargoQuery, setCargoQuery] = React.useState<string>("");
  const [loadingSalario, setLoadingSalario] = React.useState<boolean>(false);
  const [errorSalario, setErrorSalario] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<boolean>(false);

  const resetForm = React.useCallback(() => {
    setState({ T_x00ed_tulo1: "", Abreviacion: "", Title: "", Codigo: "" });
    setStateSalario({ Salariorecomendado: "", Title: "", Id: "" });
    setStateCargoAutomatico({ Categoria: "", Title: "", Id: "" });
    setCargoQuery("");
    setErrorSalario(null);
    setLoadingSalario(false);
  }, [setStateSalario, setStateCargoAutomatico]);

  const handleAddEditSalary = React.useCallback(async () => {
    const cargo = (state.T_x00ed_tulo1 ?? "").trim();
    const salarioVal = (stateSalario.Salariorecomendado ?? "").toString().trim();

    if (!cargo) return;
    // Si quieres permitir guardar salario vacío, elimina este if:
    if (!salarioVal) return;

    if (!stateSalario.Id) {
      const created = await salarios.create({
        Salariorecomendado: salarioVal,
        Title: cargo,
      });

      if (created?.Id) {
        setStateSalario((prev: any) => ({ ...prev, Id: created.Id, Title: cargo }));
      } else {
        setStateSalario((prev: any) => ({ ...prev, Title: cargo }));
      }
    } else {
      await salarios.update(stateSalario.Id, {
        Salariorecomendado: salarioVal,
        Title: cargo,
      });
    }
  }, [
    salarios,
    state.T_x00ed_tulo1,
    stateSalario.Id,
    stateSalario.Salariorecomendado,
    setStateSalario,
  ]);

  const handleEditNivelCargo = React.useCallback(async () => {
    const cargo = (state.T_x00ed_tulo1 ?? "").trim();
    const nivelCargo = (stateCategoriaCargo.Categoria ?? "").toString().trim();

    if (!cargo) return;
    if (!nivelCargo) return;

    if (!stateCategoriaCargo.Id) {
      const created = await categorias.create({
        Categoria: nivelCargo,
        Title: cargo,
      });

      if (created?.Id) {
        setStateCargoAutomatico((prev: any) => ({ ...prev, Id: created.Id, Title: cargo }));
      } else {
        setStateCargoAutomatico((prev: any) => ({ ...prev, Title: cargo }));
      }
    } else {
      await categorias.update(stateCategoriaCargo.Id, {
        Categoria: nivelCargo,
        Title: cargo,
      });
    }
  }, [
    categorias,
    state.T_x00ed_tulo1,
    stateCategoriaCargo.Categoria,
    stateCategoriaCargo.Id,
    setStateCargoAutomatico,
  ]);

  const handleAddNew = React.useCallback(async (): Promise<maestro | null> => {
    const cargo = (state.T_x00ed_tulo1 ?? "").trim();
    if (!cargo) {
      alert("Rellene todos los campos");
      return null;
    }

    return {
      Abreviacion: "",
      Title: "Cargos",
      Codigo: "",
      T_x00ed_tulo1: cargo.toLocaleUpperCase(),
    };
  }, [state.T_x00ed_tulo1]);

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
    reloadNiveles();
  }, [reload, reloadNiveles]);

  // ======= EFECTO: buscar salario/nivel al cambiar cargoQuery (debounced) =======
  React.useEffect(() => {
    const q = (cargoQuery ?? "").trim();

    if (!q) {
      setStateSalario({ Salariorecomendado: "", Title: "", Id: "" });
      setLoadingSalario(false);
      setErrorSalario(null);
      setStateCargoAutomatico({ Categoria: "", Title: "", Id: "" });
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setLoadingSalario(true);
      setErrorSalario(null);

      try {
        const safe = q.replace(/'/g, "''");
        const res = await salarios.getAll({ filter: `fields/Title eq '${safe}'` });
        const nivelRes = await categorias.getAll({ filter: `fields/Title eq '${safe}'` });

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

        if (nivelRes?.length) {
          const s = nivelRes[0];
          setStateCargoAutomatico({
            Categoria: s.Categoria ?? "",
            Title: s.Title ?? q,
            Id: s.Id ?? "",
          });
        } else {
          setStateCargoAutomatico({ Categoria: "", Title: q, Id: "" });
        }
      } catch (e: any) {
        if (cancelled) return;
        setErrorSalario(e?.message ?? String(e));
        setStateSalario({ Salariorecomendado: "", Title: q, Id: "" });
        setStateCargoAutomatico({ Categoria: "", Title: q, Id: "" });
      } finally {
        if (!cancelled) setLoadingSalario(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cargoQuery, salarios, categorias, setStateSalario, setStateCargoAutomatico]);

  return (
    <div className="emp-page">
      <div className="emp-header">
        <button
          type="button"
          className="btn btn-primary btn-xs"
          onClick={() => {
            setIsAdding(true);
            setIsEditing(false);
            setState({ ...state, T_x00ed_tulo1: "" });
            setCargoQuery("");
            setStateSalario({ Salariorecomendado: "", Title: "", Id: "" });
            setStateCargoAutomatico({ Categoria: "", Title: "", Id: "" });
          }}
        >
          <span className="emp-add-btn__icon">＋</span>
          Añadir nuevo cargo
        </button>
      </div>

      <div className="emp-layout">
        <section className="emp-list">
          {items.map((tipoDoc) => (
            <div key={tipoDoc.Id} className="emp-row">
              <button
                type="button"
                className="emp-row__name"
                onClick={() => {
                  setIsEditing(true);
                  setIsAdding(false);
                  setState(tipoDoc);

                  const q = (tipoDoc.T_x00ed_tulo1 ?? "").toUpperCase();
                  setCargoQuery(q);
                }}
              >
                {tipoDoc.T_x00ed_tulo1}
              </button>

              <div className="emp-row__actions">
                <button
                  type="button"
                  className="emp-icon-btn"
                  title="Eliminar"
                  onClick={() => handleDelete(tipoDoc.Id ?? "")}
                >
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

              <input
                id="empresaNombre"
                type="text"
                className="emp-input"
                placeholder="Cargos"
                value={state?.T_x00ed_tulo1 ?? ""}
                disabled={saving}
                onChange={(e) => {
                  const up = (e.target.value ?? "").toUpperCase();
                  setState({ ...state, T_x00ed_tulo1: up });
                  setCargoQuery(up);
                }}
              />

              <input
                id="cargoSalario"
                type="number"
                className="emp-input"
                placeholder="Salario del cargo (Opcional)"
                value={stateSalario.Salariorecomendado ?? ""}
                disabled={saving}
                onChange={(e) =>
                  setStateSalario({
                    ...stateSalario,
                    Salariorecomendado: e.target.value,
                    Title: state.T_x00ed_tulo1,
                  })
                }
              />

              <select
                className="emp-input"
                value={stateCategoriaCargo.Categoria ?? ""}
                onChange={(e) =>
                  setStateCargoAutomatico({
                    ...stateCategoriaCargo,
                    Categoria: e.target.value,
                  })
                }
                disabled={saving}
              >
                <option value="">Escoja el nivel de cargo</option>
                {nivelesCargo.map((m) => (
                  <option key={m.Id} value={m.T_x00ed_tulo1 ?? ""}>
                    {m.T_x00ed_tulo1}
                  </option>
                ))}
              </select>

              {loadingSalario && <small className="emp-help">Buscando salario…</small>}
              {errorSalario && <small className="emp-help emp-help--error">{errorSalario}</small>}
            </div>

            {isEditing && (
              <div className="emp-actions">
                <button
                  type="button"
                  className="emp-btn emp-btn--cancel"
                  disabled={saving}
                  onClick={() => {
                    setIsEditing(false);
                    setIsAdding(false);
                    resetForm();
                  }}
                >
                  ✕
                </button>

                <button
                  type="button"
                  className="emp-btn emp-btn--ok"
                  disabled={saving}
                  onClick={async () => {
                    const cargo = (state?.T_x00ed_tulo1?.toUpperCase() ?? "").trim();
                    if (!cargo) {
                      alert("Rellene todos los campos");
                      return;
                    }

                    setSaving(true);
                    try {
                      if (editItem) {
                        await editItem(
                          { Title: "Cargos", T_x00ed_tulo1: cargo },
                          state!.Id ?? ""
                        );
                      }

                      await handleAddEditSalary();
                      await handleEditNivelCargo();

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
                  }}
                >
                  ✔
                </button>
              </div>
            )}

            {isAdding && (
              <div className="emp-actions">
                <button
                  type="button"
                  className="emp-btn emp-btn--cancel"
                  disabled={saving}
                  onClick={() => {
                    setIsEditing(false);
                    setIsAdding(false);
                    resetForm();
                  }}
                >
                  ✕
                </button>

                <button
                  type="button"
                  className="emp-btn emp-btn--ok"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const payload = await handleAddNew();
                      if (!payload?.T_x00ed_tulo1?.trim()) return;

                      // 1) crear cargo
                      if (add) await add(payload);

                      // 2) guardar salario/nivel
                      await handleAddEditSalary();
                      await handleEditNivelCargo();

                      alert("Se ha creado el cargo con éxito");
                      reload();
                      setIsAdding(false);

                      // 3) limpiar
                      resetForm();
                    } catch (e: any) {
                      console.error(e);
                      alert(e?.message ?? String(e));
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
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
