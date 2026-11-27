import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import { getDetailSections } from "../../../../consts/requisicionesFields";
import { formatValue } from "./detalleUtils";

type Props = {
  row: requisiciones;
  /** Si se pasa, el campo "Profesional" se muestra como boton para reasignarlo */
  onProfesionalClick?: () => void;
};

export default function DetalleSections({ row, onProfesionalClick }: Props) {
  const sections = getDetailSections(row);

  return (
    <div className="rq-detail-body">
      {sections.map((section) => (
        <section key={section.title} className="rq-detail-section">
          <div className="rq-detail-section__header">
            <h3>{section.title}</h3>
          </div>

          <div className="rq-detail-grid">
            {section.fields.map((field) => (
              <article key={field.key} className="rq-detail-card">
                <span className="rq-detail-label">{field.label}</span>
                {field.key === "nombreProfesional" && onProfesionalClick ? (
                  <button
                    type="button"
                    className="rq-detail-value rq-detail-value--link"
                    title="Cambiar profesional asignado"
                    onClick={onProfesionalClick}
                  >
                    {formatValue(row, field)}
                  </button>
                ) : (
                  <strong className="rq-detail-value">{formatValue(row, field)}</strong>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
