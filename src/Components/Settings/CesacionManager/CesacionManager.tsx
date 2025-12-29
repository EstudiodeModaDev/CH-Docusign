import * as React from "react";
import "./CesacionManager.css";
import type { PasoCesacion } from "../../../models/Cesaciones";
import { useGraphServices } from "../../../graph/graphContext";
import { usePasosCesacion } from "../../../Funcionalidades/PasosCesacion";

type PasoCesacionDraft = Omit<PasoCesacion, "Id">;

type Props = {
  onChanged?: () => void;
};

const TIPOS_PASO = ["Aprobacion", "Notificacion", "SubidaDocumento"];

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export const CesacionStepsManager: React.FC<Props> = ({ onChanged }) => {
  const {
    PasosCesacion,
    DetallesPasosCesacion,
    ColaboradoresEDM,
    ColaboradoresDH,
    ColaboradoresVisual,
    ColaboradoresDenim,
  } = useGraphServices();

  const { state, setField, loadPasosCesacion, setState, rows } = usePasosCesacion(
    PasosCesacion,
    DetallesPasosCesacion,
    ColaboradoresDH,
    ColaboradoresEDM,
    ColaboradoresVisual,
    ColaboradoresDenim
  );

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);

  // MODAL
  const [openModal, setOpenModal] = React.useState(false);

  React.useEffect(() => {
    loadPasosCesacion();
  }, [loadPasosCesacion]);

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
    const maxOrden = rows.reduce((m, s) => Math.max(m, toInt(s.Orden, 0)), 0);

    setState((prev) => ({
      ...prev,
      NombrePaso: "",
      Orden: maxOrden + 1,
      NombreEvidencia: "",
      RequiereNotas: false,
      TipoPaso: "Aprobacion",
    }));

    setError("");
    setOpenModal(true);
  };

  const startEdit = (s: PasoCesacion) => {
    setState({
      Title: s.Title,
      NombrePaso: s.NombrePaso ?? "",
      Orden: toInt(s.Orden, 1),
      NombreEvidencia: s.NombreEvidencia ?? "",
      RequiereNotas: !!s.RequiereNotas,
      TipoPaso: s.TipoPaso ?? "Aprobacion",
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
        await PasosCesacion.update(editingId, state);
      } else {
        await PasosCesacion.create(state);
      }

      await loadPasosCesacion();
      onChanged?.();
      setOpenModal(false);
      setEditingId(null);
    } catch (e: any) {
      setError(e?.message ?? "No fue posible guardar el paso.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: PasoCesacion) => {
    if (!PasosCesacion.delete || !s.Id) return;

    setSaving(true);
    setError("");
    try {
      await PasosCesacion.delete(s.Id);
      await loadPasosCesacion();
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
          <h2 className="csx__title">Pasos de cesación</h2>
        </div>

        <div className="csx__actions">
          <button type="button" className="btn btn-xs btn-primary" onClick={startAdd} disabled={saving}>
            + Añadir paso
          </button>

          <button type="button" className="btn btn-xs" onClick={loadPasosCesacion} disabled={saving}>
            Recargar
          </button>
        </div>
      </header>

      {error && !openModal && <div className="csx__error">{error}</div>}

      {/* LISTA */}
      <div className="csx__card">
        <div className="csx__cardHead">
          <h3 className="csx__cardTitle">Actuales</h3>
          <span className="csx__badge">{rows.length}</span>
        </div>

        {rows.length === 0 ? (
          <div className="csx__muted">No hay pasos registrados.</div>
        ) : (
          <ul className="csx__list">
            {rows.map((s) => {
              const isEditing = editingId === s.Id;
              return (
                <li
                  key={s.Id ?? `${s.Orden}-${s.NombrePaso}`}
                  className={`csx__item ${isEditing ? "is-editing" : ""}`}
                >
                  <div className="csx__itemMain">
                    <div className="csx__row">
                      <span className="csx__order">#{s.Orden}</span>
                      <span className="csx__name">{s.NombrePaso}</span>
                    </div>

                    <div className="csx__meta">
                      <span className="csx__pill">{s.TipoPaso}</span>

                      {s.TipoPaso === "SubidaDocumento" && (
                        <span className="csx__pill">
                          Evidencia: <b>{s.NombreEvidencia || "—"}</b>
                        </span>
                      )}

                      {s.RequiereNotas && <span className="csx__pill">Requiere notas</span>}
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
                <input
                  className="csx__input"
                  value={state.NombrePaso}
                  onChange={(e) => setField("NombrePaso", e.target.value)}
                  placeholder="Ej: Recolección de carnet"
                  disabled={saving}
                />
              </div>

              <div className="csx-modal__row2">
                <div className="csx__field">
                  <label className="csx__label">Orden</label>
                  <input
                    className="csx__input"
                    type="number"
                    min={1}
                    value={state.Orden}
                    onChange={(e) => setField("Orden", Number(e.target.value))}
                    disabled={saving}
                  />
                </div>

                <div className="csx__field">
                  <label className="csx__label">Tipo de paso</label>
                  <select
                    className="csx__input"
                    value={state.TipoPaso}
                    onChange={(e) => setField("TipoPaso", e.target.value)}
                    disabled={saving}
                  >
                    {TIPOS_PASO.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {state.TipoPaso === "SubidaDocumento" && (
                <div className="csx__field">
                  <label className="csx__label">Nombre de evidencia</label>
                  <input
                    className="csx__input"
                    value={state.NombreEvidencia}
                    onChange={(e) => setField("NombreEvidencia", e.target.value)}
                    placeholder="Ej: Paz y salvo, carta, acta…"
                    disabled={saving}
                  />
                </div>
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
