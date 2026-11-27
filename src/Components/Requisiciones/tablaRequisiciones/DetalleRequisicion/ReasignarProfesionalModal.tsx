import * as React from "react";
import { notify } from "../../../../utils/notify";
import type { resolutor } from "../../../../Funcionalidades/Requisiciones/Requisicion/Hooks/useRequisicionActions";
import SubModal from "./SubModal";

type Props = {
  open: boolean;
  /** Profesional asignado actualmente (puede venir vacio) */
  nombreActual?: string | null;
  correoActual?: string | null;
  onClose: () => void;
  loadProfesionales: () => Promise<resolutor[]>;
  /** Devuelve true si la reasignacion se guardo */
  onConfirm: (profesional: resolutor) => Promise<boolean>;
};

export default function ReasignarProfesionalModal({ open, nombreActual, correoActual, onClose, loadProfesionales, onConfirm }: Props) {
  const [profesionales, setProfesionales] = React.useState<resolutor[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const currentCorreo = String(correoActual ?? "").trim().toLowerCase();

  // Carga la lista de profesionales cada vez que se abre el modal
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSelected("");
    setLoading(true);
    loadProfesionales()
      .then((list) => { if (!cancelled) setProfesionales(list); })
      .catch((e) => {
        console.error("Error cargando profesionales", e);
        if (!cancelled) notify.error("No fue posible cargar la lista de profesionales.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConfirm = async () => {
    const profesional = profesionales.find((p) => p.correo === selected);

    if (!profesional) {
      notify.error("Debes seleccionar un profesional.");
      return;
    }

    if (profesional.correo.toLowerCase() === currentCorreo) {
      notify.error("El profesional seleccionado ya está asignado a esta requisición.");
      return;
    }

    setSaving(true);
    try {
      const ok = await onConfirm(profesional);
      if (!ok) {
        notify.error("No fue posible cambiar el profesional asignado.");
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SubModal
      open={open}
      titleId="rq-reasignar-title"
      kicker="Reasignación"
      title="Cambiar profesional asignado"
      description={<>Profesional actual: <strong>{nombreActual || "Sin profesional asignado"}</strong></>}
      busy={saving}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary-final btn-xs rq-detail-btn" disabled={saving} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary btn-xs rq-detail-btn"
            disabled={saving || loading || !selected}
            onClick={handleConfirm}
          >
            {saving ? "Guardando..." : "Cambiar profesional"}
          </button>
        </>
      }
    >
      <label className="rq-report-label" htmlFor="rq-reasignar-profesional">Nuevo profesional</label>
      <select
        id="rq-reasignar-profesional"
        className="rq-report-select"
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        disabled={saving || loading}
      >
        <option value="">{loading ? "Cargando profesionales..." : "Selecciona un profesional"}</option>
        {profesionales.map((p) => (
          <option key={p.correo} value={p.correo} disabled={p.correo.toLowerCase() === currentCorreo}>
            {p.nombre} ({p.correo})
          </option>
        ))}
      </select>
    </SubModal>
  );
}
