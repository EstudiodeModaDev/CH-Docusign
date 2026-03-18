import * as React from "react";
import "./PasosActivacionModal.css";
import type { PasoRestriccion, PasosProceso } from "../../../../models/Pasos";
import type { desplegablesOption } from "../../../../models/Desplegables";
import { safeLower } from "../../../../utils/text";
import Select, { components, type OptionProps } from "react-select";

export type TipoReglaPaso = "INCLUIR" | "EXCLUIR";

type DraftRegla = Omit<PasoRestriccion, "Id">;

type Props = {
  open: boolean;
  proceso: string;
  paso: PasosProceso | null;
  onClose: () => void;
  onChanged?: () => void;

  loadRules: (proceso: string, idPaso: string) => Promise<PasoRestriccion[]>;
  onAddRule: (payload: DraftRegla) => Promise<any>;
  onEditRule: (payload: DraftRegla) => Promise<any>;
  onToggleRule: (id: string, activo: boolean) => Promise<any>;
  cargos: desplegablesOption[],
  loadingCargo: boolean
};

const TIPOS_REGLA: TipoReglaPaso[] = ["INCLUIR", "EXCLUIR"];

const emptyDraft = (proceso: string, idPaso: string): DraftRegla => ({
  Title: idPaso,
  Proceso: proceso,
  CargoNombre: "",
  TipoRegla: "EXCLUIR",
  Activo: true,
});

export const Option = (props: OptionProps<desplegablesOption, false>) => {
  const { label } = props;

  return (
    <components.Option {...props}>
      <div className="rs-opt">
        <div className="rs-opt__text">
          <span className="rs-opt__title">{label}</span>
        </div>
      </div>
    </components.Option>
  );
};

export const PasoActivationRulesModal: React.FC<Props> = ({loadingCargo, cargos, open, proceso, paso, onClose, onChanged, loadRules, onAddRule, onEditRule, onToggleRule,}) => {
  const [rules, setRules] = React.useState<PasoRestriccion[]>([]);
  const [draft, setDraft] = React.useState<DraftRegla>(emptyDraft(proceso, ""));
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const selectedCargo = cargos.find((o) => safeLower(o.label) === safeLower(draft.CargoNombre)) ?? null;

  const pasoId = String(paso?.Id ?? "");

  const reload = React.useCallback(async () => {
    if (!pasoId || !proceso) return;

    setLoading(true);
    setError("");
    try {
      const data = await loadRules(proceso, pasoId);
      setRules(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "No fue posible cargar las reglas.");
    } finally {
      setLoading(false);
    }
  }, [loadRules, pasoId, proceso]);

  React.useEffect(() => {
    if (!open || !pasoId) return;

    setDraft(emptyDraft(proceso, pasoId));
    setEditingId(null);
    void reload();
  }, [open, pasoId, proceso, reload]);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) handleClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, saving]);

  const setField = <K extends keyof DraftRegla>(key: K, value: DraftRegla[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    if (saving) return;
    setError("");
    setEditingId(null);
    onClose();
  };

  const startCreate = () => {
    if (!pasoId) return;
    setEditingId(null);
    setDraft(emptyDraft(proceso, pasoId));
    setError("");
  };

  const startEdit = (rule: PasoRestriccion) => {
    setEditingId(rule.Id ?? null);
    setDraft({
      Title: rule.Title,
      Proceso: rule.Proceso,
      CargoNombre: rule.CargoNombre ?? "",
      TipoRegla: rule.TipoRegla,
      Activo: rule.Activo ?? true,
    });
    setError("");
  };

  const validate = (data: DraftRegla): string => {
    if (!data.Title?.trim()) return "Falta el id del paso.";
    if (!data.Proceso?.trim()) return "El proceso es obligatorio.";
    if (!data.CargoNombre?.trim()) return "El cargo es obligatorio.";
    if (!data.TipoRegla) return "El tipo de regla es obligatorio.";
    return "";
  };

  const handleSave = async () => {
    const msg = validate(draft);
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await onEditRule(draft);
      } else {
        await onAddRule(draft);
      }

      await reload();
      onChanged?.();
      startCreate();
    } catch (e: any) {
      setError(e?.message ?? "No fue posible guardar la regla.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (rule: PasoRestriccion) => {
    if (!rule.Id) return;

    setSaving(true);
    setError("");
    try {
      await onToggleRule(rule.Id, !rule.Activo);
      await reload();
      onChanged?.();
    } catch (e: any) {
      setError(e?.message ?? "No fue posible actualizar el estado de la regla.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !paso) return null;

  return (
    <div className="parm-backdrop" role="dialog" aria-modal="true" onMouseDown={handleClose}>
      <div className="parm-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="parm-head">
          <div>
            <h3 className="parm-title">Reglas de activación</h3>
            <p className="parm-subtitle">Paso <b>{paso.NombrePaso ?? "—"}</b> · Orden <b>#{paso.Orden ?? "—"}</b></p>
          </div>

          <button type="button" className="btn btn-xs" onClick={handleClose} disabled={saving}>
            Cerrar
          </button>
        </div>

        <div className="parm-meta">
          <div className="parm-metaItem">
            <span className="parm-metaLabel">Proceso</span>
            <span className="parm-chip">{proceso}</span>
          </div>

          <div className="parm-metaItem">
            <span className="parm-metaLabel">Paso ID</span>
            <span className="parm-chip">{pasoId || "—"}</span>
          </div>

          <div className="parm-metaItem">
            <span className="parm-metaLabel">Tipo</span>
            <span className="parm-chip">{paso.TipoPaso || "—"}</span>
          </div>
        </div>

        {error && <div className="parm-error">{error}</div>}

        <div className="parm-grid">
          {/* FORMULARIO */}
          <section className="parm-panel">
            <div className="parm-panelHead">
              <h4 className="parm-panelTitle">
                {editingId ? "Editar regla" : "Nueva regla"}
              </h4>

              {editingId && (
                <button type="button" className="btn btn-xs" onClick={startCreate} disabled={saving}>
                  Nueva
                </button>
              )}
            </div>

            <div className="parm-field">
              <label className="parm-label">Cargo</label>
              <Select<desplegablesOption, false>
                inputId="cargo"
                options={cargos}
                placeholder={loadingCargo ? "Cargando opciones…" : "Buscar cargo..."}
                value={selectedCargo}
                onChange={(opt) => {setField("CargoNombre", opt?.label ?? "");}}
                classNamePrefix="rs"
                isDisabled={loadingCargo}
                isLoading={loadingCargo}
                getOptionValue={(o) => String(o.value)}
                getOptionLabel={(o) => o.label}
                components={{ Option }}
                isClearable
              />
            </div>

            <div className="parm-field">
              <label className="parm-label">Tipo de regla</label>
              <select className="parm-input" value={draft.TipoRegla} onChange={(e) => setField("TipoRegla", e.target.value as TipoReglaPaso)} disabled={saving}>
                {TIPOS_REGLA.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="parm-field">
              <label className="parm-check">
                <input type="checkbox" checked={draft.Activo} onChange={(e) => setField("Activo", e.target.checked)} disabled={saving}/>
                <span>{draft.Activo ? "Regla activa" : "Regla inactiva"}</span>
              </label>
            </div>

            <div className="parm-note">
              <b>INCLUIR:</b> el paso solo aplica a esos cargos. <br />
              <b>EXCLUIR:</b> el paso aplica a todos menos a esos cargos.
            </div>

            <div className="parm-actions">
              <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear regla"}
              </button>

              <button type="button" className="btn" onClick={startCreate} disabled={saving}>
                Limpiar
              </button>
            </div>
          </section>

          {/* LISTADO */}
          <section className="parm-panel">
            <div className="parm-panelHead">
              <h4 className="parm-panelTitle">Reglas actuales</h4>
              <button type="button" className="btn btn-xs" onClick={reload} disabled={loading || saving}
              >
                {loading ? "Cargando…" : "Recargar"}
              </button>
            </div>

            {loading ? (
              <div className="parm-empty">Cargando reglas…</div>
            ) : rules.length === 0 ? (
              <div className="parm-empty">Este paso no tiene reglas registradas.</div>
            ) : (
              <div className="parm-tableWrap">
                <table className="parm-table">
                  <thead>
                    <tr>
                      <th>Cargo</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th className="parm-actionsCol">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.Id ?? `${rule.Proceso}-${rule.Title}-${rule.CargoNombre}`}>
                        <td>{rule.CargoNombre}</td>
                        <td>
                          <span
                            className={`parm-badge ${
                              rule.TipoRegla === "INCLUIR"
                                ? "is-include"
                                : "is-exclude"
                            }`}
                          >
                            {rule.TipoRegla}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`parm-badge ${
                              rule.Activo ? "is-active" : "is-inactive"
                            }`}
                          >
                            {rule.Activo ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td>
                          <div className="parm-rowActions">
                            <button
                              type="button"
                              className="btn btn-xs btn-primary"
                              onClick={() => startEdit(rule)}
                              disabled={saving}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="btn btn-xs"
                              onClick={() => handleToggle(rule)}
                              disabled={saving}
                            >
                              {rule.Activo ? "Desactivar" : "Activar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default PasoActivationRulesModal;