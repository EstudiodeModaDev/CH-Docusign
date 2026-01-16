import * as React from "react";
import { useDocusignTemplates } from "../../../../Funcionalidades/GD/Docusign";
import { downloadCsvTemplate, generateCsvForTemplate } from "../../../../Funcionalidades/GD/Bulk";


export const EnviarMasivoCard: React.FC = () => {
  const { templatesOptions, createdraft, getRecipients } = useDocusignTemplates();
  const [templateId, setTemplateId] = React.useState("");
  const [loadingCsv, setLoadingCsv] = React.useState(false);

  const plantillaSelected = templatesOptions.find((o) => o.value === templateId) ?? null;

  return (
    <div className="ef-card">
      <div className="ef-field">
        <label className="ef-label">Plantilla</label>
        <select className="ef-input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          <option value="">Selecciona una plantilla</option>
          {templatesOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="ef-actions">
        <button
          type="button"
          className="btn btn-primary-final btn-xs"
          disabled={!templateId || loadingCsv}
          onClick={async () => {
            try {
              setLoadingCsv(true);

              const build = await generateCsvForTemplate({templateId, templateName: plantillaSelected?.label ?? "template", createdraft, getRecipients,});

              const safeName = (plantillaSelected?.label ?? "Template")
                .replace(/[^\w\- ]/g, "")
                .replace(/\s+/g, "_");

              downloadCsvTemplate(build, {
                fileName: `Bulk_${safeName}.csv`,
              });

            } catch (e) {
              console.error(e);
              alert(e instanceof Error ? e.message : "Error generando CSV");
            } finally {
              setLoadingCsv(false);
            }
          }}
        >
          {loadingCsv ? "Generando..." : "Descargar CSV plantilla"}
        </button>
      </div>
    </div>
  );
};
