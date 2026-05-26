import type { detalleRequisicion } from "../../../../../models/Requisiciones/pasos";
import { spDateToDDMMYYYY } from "../../../../../utils/Date";
export type completedStepProps = {
  detail: detalleRequisicion;
};

export default function CompletedStep(props: completedStepProps) {
  const {detail,} = props;


  return (

    <div className="rq-process-card__notes">
      <p>
        <strong>Completado por:</strong> {detail.CompletadoPor || "Sin dato"}
      </p>
      <p>
        <strong>Fecha:</strong> {detail.FechaCompletadoPor ? spDateToDDMMYYYY(detail.FechaCompletadoPor) : "Sin dato"}
      </p>
      <p>
        <strong>Notas:</strong> {detail.Notas || "Sin observaciones"}
      </p>
    </div>
  );
}
