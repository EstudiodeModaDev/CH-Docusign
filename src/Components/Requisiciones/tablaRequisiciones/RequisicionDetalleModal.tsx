import * as React from "react";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";
import { notify } from "../../../utils/notify";
import "./tablaRequisiciones.css";
import { useRequisicionesContext } from "../../../Funcionalidades/Requisiciones/RequisicionesContext";
import { ConfirmModal, type ConfirmModalPayload } from "../../GD/Common/confirmModal/ConfirmModal";
import { toast } from "sonner";
import type { commonResponse } from "../../../models/Commons";
import { usePermissions } from "../../../Funcionalidades/Permisos";
import HistorialRequisicionModal from "./HistorialRequisicionModal";
import type { resolutor } from "../../../Funcionalidades/Requisiciones/Requisicion/Hooks/useRequisicionActions";
import DetalleHeader from "./DetalleRequisicion/DetalleHeader";
import DetalleSections from "./DetalleRequisicion/DetalleSections";
import ReportarProblemaModal from "./DetalleRequisicion/ReportarProblemaModal";
import ReasignarProfesionalModal from "./DetalleRequisicion/ReasignarProfesionalModal";

type Props = {
  open: boolean;
  row: requisiciones | null;
  onClose: () => void;
  onPostergarANSBD: (r: requisiciones, date: string, motivo: string) => void;
  handleCancelRequisicion: (r: requisiciones, motivo: string) => Promise<commonResponse<void>>;
  loading: boolean;
};

export default function RequisicionDetalleModal({ loading, open, row, onClose, onPostergarANSBD, handleCancelRequisicion }: Props) {
  const { notifyInconveniente, getProfesionalesDisponibles, reasignarProfesional } = useRequisicionesContext();
  const { engine } = usePermissions();

  const [currentRow, setCurrentRow] = React.useState<requisiciones | null>(row);
  const [historialOpen, setHistorialOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reasignarOpen, setReasignarOpen] = React.useState(false);
  const [postergarOpen, setPostergarOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const canEdit = React.useMemo(() => engine.can("requisiciones.edit"), [engine]);

  // Escape cierra el detalle; con un submodal abierto, solo cierra ese submodal
  // (Reportar y Reasignar manejan su propio Escape).
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (historialOpen) setHistorialOpen(false);
      else if (!reportOpen && !reasignarOpen) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, historialOpen, reportOpen, reasignarOpen]);

  React.useEffect(() => {
    if (!open) return;
    setCurrentRow(row);
    setHistorialOpen(false);
    setReportOpen(false);
    setReasignarOpen(false);
  }, [open, row]);

  if (!open || !currentRow) return null;

  const onReportarProblema = async (motivo: string, detalle: string) => {
    if (!row?.Id) {
      notify.error("No se ha seleccionado una requisición valida");
      return false;
    }
    await notifyInconveniente(row, motivo, detalle);
    return true;
  };

  const onReasignar = async (profesional: resolutor) => {
    const ok = await reasignarProfesional(currentRow, profesional);
    if (ok) {
      setCurrentRow({ ...currentRow, nombreProfesional: profesional.nombre, correoProfesional: profesional.correo });
    }
    return ok;
  };

  const onPostergarANS = async ({ date, reason }: ConfirmModalPayload) => {
    if (!date || !reason) return;

    if (new Date(date) < new Date()) {
      toast.error("La fecha de postergación no puede ser menor a la fecha actual");
      return;
    }

    if (new Date(date) < new Date(currentRow.fechaLimite ?? "")) {
      toast.error("La fecha de postergación no puede ser menor a la fecha límite");
      return;
    }

    await onPostergarANSBD(row!, date, reason);
  };

  const onCancelRequisicion = async ({ reason }: ConfirmModalPayload) => {
    if (!reason) {
      toast.error("Debes llenar el motivo de cancelación");
      return;
    }

    if (!row) {
      toast.error("La requisición seleccionada no ha sido encontrada en la base de datos");
      return;
    }

    const response = await handleCancelRequisicion(row, reason);

    if (!response.ok) {
      toast.error(response.errorMessage ?? "Algo ha salido mal cancelando la requisición");
      return;
    }

    toast.success("Requisición cancelada con éxito");
  };

  return (
    <div className="rq-detail-backdrop" role="presentation" onClick={onClose}>
      <div className="rq-detail-modal" role="dialog" aria-modal="true" aria-labelledby="rq-detail-title" onClick={(event) => event.stopPropagation()}>
        <DetalleHeader
          row={currentRow}
          canCancel={canEdit}
          onVerHistorial={() => setHistorialOpen(true)}
          onPostergarANS={() => setPostergarOpen(true)}
          onReportarProblema={() => setReportOpen(true)}
          onCancelar={() => setCancelOpen(true)}
          onClose={onClose}
        />

        <DetalleSections row={currentRow} onProfesionalClick={canEdit ? () => setReasignarOpen(true) : undefined} />

        <ReportarProblemaModal open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={onReportarProblema} />

        <ReasignarProfesionalModal
          open={reasignarOpen}
          nombreActual={currentRow.nombreProfesional}
          correoActual={currentRow.correoProfesional}
          onClose={() => setReasignarOpen(false)}
          loadProfesionales={getProfesionalesDisponibles}
          onConfirm={onReasignar}
        />

        <HistorialRequisicionModal open={historialOpen} row={currentRow} onClose={() => setHistorialOpen(false)} />
      </div>

      <ConfirmModal
        open={postergarOpen}
        onClose={() => setPostergarOpen(false)}
        onSend={onPostergarANS}
        title={"Postergar ANS de requisición " + row?.Title}
        needText={true}
        description={"Escriba la razón por la que se posterga el ANS"}
        buttonText={"Aplicar"}
        needDate={true}
        dateText="Nueva fecha final "
        loading={loading}
      />

      <ConfirmModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSend={onCancelRequisicion}
        title={"Cancelar la requisición #" + row?.Id}
        needText={true}
        placeHolderText={"Escriba la razón por la que se cancela la requisición"}
        buttonText={"Cancelar"}
        loadingButtonText={"Cancelando"}
      />
    </div>
  );
}
