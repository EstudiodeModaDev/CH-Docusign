import * as React from "react";
import "./CesacionManager.css";
import type { PasosProceso } from "../../../../models/Cesaciones";
import RichTextBase64 from "../../../RichText/RichText";

type PasoCesacionDraft = Omit<PasosProceso, "Id">;

type Props = {
  onChanged?: () => void;
  onReload: () => void;
  onAdd: (payload: PasosProceso) => void;
  onEdit: (id: string, edited: any) => void;
  onDelete: (id: string) => void;
  pasos: PasosProceso[];
  tipo: string;
};

const TIPOS_PASO = ["Aprobacion", "Notificacion", "SubidaDocumento"];

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export const ProcesosStepManager: React.FC<Props> = ({onChanged, pasos, onReload, tipo, onAdd, onEdit, onDelete,}) => {
  const [state, setState] = React.useState<PasosProceso>({
    NombreEvidencia: "",
    NombrePaso: "",
    Orden: 0,
    TipoPaso: "",
    Title: "",
    PlantillaCorreo: "",
    PlantillaAsunto: "",
    Obligatorio: true,
  });

  const setField = <K extends keyof PasosProceso>(k: K, v: PasosProceso[K]) => setState((s) => ({ ...s, [k]: v }));

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // MODAL
  const [openModal, setOpenModal] = React.useState(false);

  // Cerrar modal con ESC
  React.useEffect(() => {
    if (!openModal) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) closeModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openModal, saving]);

  const startAdd = () => {
    setEditingId(null);

    // Sugerir el siguiente orden + limpiar campos (manteniendo Title)
    const maxOrden = pasos.reduce((m, s) => Math.max(m, toInt(s.Orden, 0)), 0);

    setState((prev: PasosProceso) => ({
      ...prev,
      NombrePaso: "",
      Orden: maxOrden + 1,
      NombreEvidencia: "",
      TipoPaso: "Aprobacion",
      PlantillaCorreo: "",
      PlantillaAsunto: "",
      Obligatorio: true,
    }));

    setError("");
    setOpenModal(true);
  };

  const startEdit = (s: PasosProceso) => {
    setState({
      Title: s.Title,
      NombrePaso: s.NombrePaso ?? "",
      Orden: toInt(s.Orden, 1),
      NombreEvidencia: s.NombreEvidencia ?? "",
      TipoPaso: s.TipoPaso ?? "Aprobacion",
      PlantillaCorreo: s.PlantillaCorreo ?? "",
      PlantillaAsunto: s.PlantillaAsunto ?? "",
      Obligatorio: s.Obligatorio ?? true,
    });

    setEditingId(s.Id!);
    setError("");
    setOpenModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setOpenModal(false);
    setEditingId(null);
    setError("");
  };

  const validate = (d: PasoCesacionDraft) => {
    if (!d.Title?.trim()) return "Falta el Title de la cesación.";
    if (!d.NombrePaso?.trim()) return "El nombre del paso es obligatorio.";
    if (!Number.isFinite(d.Orden) || d.Orden <= 0) return "El orden debe ser un número mayor a 0.";

    if (d.TipoPaso === "SubidaDocumento" && !d.NombreEvidencia?.trim()) {
      return "Si es SubidaDocumento, debes indicar el nombre de la evidencia.";
    }

    if (d.TipoPaso === "Notificacion") {
      if (!d.PlantillaAsunto?.trim()) return "Si es Notificación, debes indicar una plantilla de asunto.";
      if (!d.PlantillaCorreo?.trim()) return "Si es Notificación, debes indicar una plantilla de cuerpo.";
    }

    return "";
  };

  const save = async () => {
    setError("");
    const msg = validate(state);
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await onEdit(editingId, state);
      } else {
        await onAdd(state);
      }

      await onReload();
      onChanged?.();
      setOpenModal(false);
      setEditingId(null);
    } catch (e: any) {
      setError(e?.message ?? "No fue posible guardar el paso.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: PasosProceso) => {
    if (!s.Id) return;

    setSaving(true);
    setError("");
    try {
      await onDelete(s.Id);
      await onReload();
      onChanged?.();
    } catch (e: any) {
      setError(e?.message ?? "No fue posible eliminar el paso.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="csx">
      <header className="csx__head">
        <div className="csx__titleWrap">
          <h2 className="csx__title">Proceso de {tipo}</h2>
        </div>

        <div className="csx__actions">
          <button type="button" className="btn btn-xs btn-primary" onClick={startAdd} disabled={saving}>
            + Añadir paso
          </button>

          <button type="button" className="btn btn-xs" onClick={onReload} disabled={saving}>
            Recargar
          </button>
        </div>
      </header>

      {error && !openModal && <div className="csx__error">{error}</div>}

      {/* LISTA */}
      <div className="csx__card">
        <div className="csx__cardHead">
          <h3 className="csx__cardTitle">Actuales</h3>
          <span className="csx__badge">{pasos.length}</span>
        </div>

        {pasos.length === 0 ? (
          <div className="csx__muted">No hay pasos registrados.</div>
        ) : (
          <ul className="csx__list">
            {pasos.map((s) => {
              const isEditing = editingId === s.Id;

              return (
                <li key={s.Id ?? `${s.Orden}-${s.NombrePaso}`} className={`csx__item ${isEditing ? "is-editing" : ""}`}>
                  <div className="csx__itemMain">
                    <div className="csx__row">
                      <span className="csx__order">#{s.Orden}</span>
                      <span className="csx__name">{s.NombrePaso}</span>
                    </div>

                    <div className="csx__meta">
                      <span className="csx__pill">{s.TipoPaso}</span>

                      {/* ✅ Obligatorio / Opcional */}
                      <span className="csx__pill">
                        {s.Obligatorio ?? true ? "Obligatorio" : "Opcional"}
                      </span>

                      {s.TipoPaso === "SubidaDocumento" && (
                        <span className="csx__pill">
                          Evidencia: <b>{s.NombreEvidencia || "—"}</b>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="csx__itemBtns">
                    <button type="button" className="btn btn-xs btn-primary" onClick={() => startEdit(s)} disabled={saving}>
                      Editar
                    </button>

                    <button type="button" className="btn btn-xs btn-danger" onClick={() => remove(s)} disabled={saving}>
                      Eliminar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="csx-modal__backdrop" role="dialog" aria-modal="true" onMouseDown={closeModal}>
          <div className="csx-modal__card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="csx-modal__head">
              <h3 className="csx-modal__title">{editingId ? "Editar paso" : "Nuevo paso"}</h3>

              <button type="button" className="btn btn-xs" onClick={closeModal} disabled={saving}>
                Cerrar
              </button>
            </div>

            {error && <div className="csx__error csx__error--inModal">{error}</div>}

            <div className="csx-modal__body">
              <div className="csx__field">
                <label className="csx__label">Nombre del paso</label>
                <input className="csx__input" value={state.NombrePaso} placeholder="Ej: Recolección de carnet" disabled={saving} onChange={(e) => {
                                                                                                                                  setField("NombrePaso", e.target.value);
                                                                                                                                  setField("Title", e.target.value);
                                                                                                                                }}/>
              </div>

              <div className="csx-modal__row2">
                <div className="csx__field">
                  <label className="csx__label">Orden</label>
                  <input className="csx__input" type="number" min={1} value={state.Orden} onChange={(e) => setField("Orden", Number(e.target.value))} disabled={saving}/>
                </div>

                <div className="csx__field">
                  <label className="csx__label">Tipo de paso</label>
                  <select className="csx__input" value={state.TipoPaso} disabled={saving} onChange={(e) => {
                                                                                            const next = e.target.value;

                                                                                            setField("TipoPaso", next);

                                                                                            // ✅ Limpia campos específicos si cambian de tipo
                                                                                            if (next !== "SubidaDocumento") setField("NombreEvidencia", "" as any);
                                                                                            if (next !== "Notificacion") {
                                                                                              setField("PlantillaAsunto", "" as any);
                                                                                              setField("PlantillaCorreo", "" as any);
                                                                                            }
                                                                                          }}>
                    {TIPOS_PASO.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ✅ CHECK DE OBLIGATORIEDAD */}
              <div className="csx__field">
                <label className="csx__label">Obligatoriedad</label>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={state.Obligatorio ?? true} onChange={(e) => setField("Obligatorio", e.target.checked as any)} disabled={saving}/>
                  <span>{state.Obligatorio ?? true ? "Este paso es obligatorio" : "Este paso es opcional (se puede omitir)"}</span>
                </label>
              </div>

              {state.TipoPaso === "SubidaDocumento" && (
                <div className="csx__field">
                  <label className="csx__label">Nombre de evidencia</label>
                  <input className="csx__input" value={state.NombreEvidencia} onChange={(e) => setField("NombreEvidencia", e.target.value)} placeholder="Ej: Paz y salvo, carta, acta…" disabled={saving}/>
                </div>
              )}

              {/* ✅ Campos extra para Notificación */}
              {state.TipoPaso === "Notificacion" && (
                <>
                  <div className="csx__field">
                    <label className="csx__label">Plantilla de asunto</label>
                    <input className="csx__input" value={state.PlantillaAsunto ?? ""} onChange={(e) => setField("PlantillaAsunto", e.target.value)} placeholder="Ej: Contratación {nombre} - {numeroDoc}" disabled={saving}/>
                  </div>

                  <div className="csx__field">
                    <label className="csx__label">Plantilla de cuerpo</label>
                    <RichTextBase64 value={state.PlantillaCorreo ?? ""} onChange={(html) => setField("PlantillaCorreo", html)} placeholder="Ej: Contratación {nombre} - {numeroDoc}"/>
                  </div>
                </>
              )}

              <div className="csx-modal__footer">
                <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>

                <button type="button" className="btn" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
