import React from "react";
import Select, { components, type OptionProps } from "react-select";
import type { desplegablesOption } from "../../../models/Desplegables";
import "./talent360.css";

type Props = {
  open: boolean;
  onClose: () => void;

  title?: string;
  subtitle?: string;

  colaborador?: string;

  perfilesOption: desplegablesOption[];
  loadingPerfiles: boolean;

  warningText?: string;
  footerHint?: string;
};

const Option = (props: OptionProps<desplegablesOption, false>) => {
  const { label } = props;
  return (
    <components.Option {...props}>
      <div className="t360rs-opt">
        <span className="t360rs-opt__title">{label}</span>
      </div>
    </components.Option>
  );
};

export function Talent360Setup({open, onClose, title = "Requisiciones de personal", subtitle = "Se ha identificado que esta requisición debe generar una evaluación de 360 Talent. Siga el paso a paso para configurarla.", colaborador, perfilesOption, loadingPerfiles, footerHint = "Al generar, se creará el plan de evaluación asociado al colaborador.",}: Props) {
  const [cedulaAnalista, setCedulaAnalista] = React.useState("");
  const [cedulaColaborador, setCedulaColaborador] = React.useState("");
  const [perfilCargo, setPerfilCargo] = React.useState("");

  // al abrir el modal, inicializa datos
  React.useEffect(() => {
    if (!open) return;
    setCedulaAnalista("");
    setCedulaColaborador(String(colaborador ?? ""));
    setPerfilCargo("");
  }, [open, colaborador]);

  // cerrar con ESC
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const selectedPerfil = perfilesOption.find( (o) =>  String(o.label ?? "").trim().toLowerCase() === perfilCargo.trim().toLowerCase()) ?? null;

  const canGenerate = cedulaColaborador.trim().length > 0 && perfilCargo.trim().length > 0; 

  async function onGeneratePlan() {
    return    

  /* TODO:
  // 1) Validar que NO exista ya una relación evaluador–evaluado para el plan_ID = 32
  //    - Filtra shp_360arbol_rela por plan_ID = 32
  //    - Cuenta registros donde:
  //        • cedula_evaluado = TextInputCedulaColaborador.Text
  //        • cedula_evaluador = TextInputCedulaAnalista.Text
  //    - Si el conteo > 0, notificar error y DETENER el flujo (evitar duplicados)
  //
  // 2) Construir la colección colJSONHabilidades según el nivel de cargo (varNivelCargo)
  //    - Filtrar shp_360maestros_generales por:
  //        • clave = "vdp_requisiciones"
  //        • texto_valor = varNivelCargo
  //    - Seleccionar columnas: clave, texto_valor, numero_valor (id de competencia)
  //    - Por cada competencia, buscar en xlsVDPPreguntas el JSON_habilidades
  //      usando la relación:
  //        • Value(competencia_id) = Value(numero_valor)
  //
  // 3) Armar un JSON tipo array con todas las habilidades
  //    - Concatenar los valores json_habilidad de colJSONHabilidades
  //    - Envolver el resultado entre [ ]
  //    - Validar que no existan valores Blank() para evitar JSON inválido
  //
  // 4) Crear el registro en shp_360arbol_rela (Patch)
  //    - plan_ID = 32
  //    - cedula_evaluado y cedula_evaluador desde inputs
  //    - Relacionar el plan mediante lookup (shp_360_planes)
  //    - Obtener JSON_evaluado y JSON_evaluador desde vista_contratos
  //    - Asignar metadata de categoría y escala
  //    - Guardar JSON_habilidades generado
  //
  // 5) Notificar éxito al finalizar
  //    - Si ocurre cualquier error en el proceso, capturarlo con IfError
  //      y mostrar mensaje de error al usuario*/

  }

  async function handleGenerate() {
    
    if (!canGenerate) return;

    await onGeneratePlan();
  }

  return (
    <div className="t360-modal" role="dialog" aria-modal="true" aria-label="Evaluación 360 Talent">
      {/* backdrop */}
      <button
        type="button"
        className="t360-backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />

      {/* panel */}
      <section className="t360-panel">
        <header className="t360-head">
          <div className="t360-head__left">
            <span className="t360-dot" aria-hidden="true" />
            <div className="t360-head__titles">
              <h1 className="t360-title">{title}</h1>
              <p className="t360-subtitle">{subtitle}</p>
            </div>
          </div>

          <button type="button" className="t360-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="t360-body">
          {/* Banner */}
          <div className="t360-banner" role="status">
            <span className="t360-banner__icon" aria-hidden="true">ℹ️</span>
            <div className="t360-banner__text">
              <strong>Evaluación 360 Talent</strong>
              <div>Usted será el evaluador y el nuevo colaborador será el evaluado.</div>
            </div>
          </div>

          {/* Paso 1 */}
          <section className="t360-card" aria-label="Paso 1">
            <div className="t360-card__bar">
              <span className="t360-step">1</span>
              <span className="t360-card__title">
                Verifique los datos del analista de selección y el nuevo colaborador. Corríjalos si es necesario
              </span>
            </div>

            <div className="t360-grid">
              <div className="t360-field">
                <label className="t360-label" htmlFor="t360-ced-analista">
                  Cédula del analista de selección
                </label>
                <input
                  id="t360-ced-analista"
                  className="t360-input"
                  value={cedulaAnalista}
                  onChange={(e) => setCedulaAnalista(e.target.value)}
                  inputMode="numeric"
                  placeholder="Ej: 1010..."
                />
              </div>

              <div className="t360-field">
                <label className="t360-label" htmlFor="t360-ced-colab">
                  Cédula del colaborador
                </label>
                <input
                  id="t360-ced-colab"
                  className="t360-input"
                  value={cedulaColaborador}
                  onChange={(e) => setCedulaColaborador(e.target.value)}
                  inputMode="numeric"
                  placeholder="Ej: 1016..."
                />
              </div>

              <div className="t360-field">
                <label className="t360-label" htmlFor="t360-perfil">
                  Perfil de cargo del colaborador
                </label>

                <Select<desplegablesOption, false>
                  inputId="t360-perfil"
                  options={perfilesOption}
                  placeholder={loadingPerfiles ? "Cargando opciones…" : "Buscar perfil..."}
                  value={selectedPerfil}
                  onChange={(opt) => setPerfilCargo(opt?.label ?? "")}
                  classNamePrefix="t360rs"
                  isDisabled={loadingPerfiles}
                  isLoading={loadingPerfiles}
                  getOptionValue={(o) => String(o.value)}
                  getOptionLabel={(o) => o.label}
                  components={{ Option }}
                  isClearable
                  menuPosition="fixed"
                />
              </div>
            </div>
          </section>

          {/* Paso 2 */}
          <section className="t360-card" aria-label="Paso 2">
            <div className="t360-card__bar">
              <span className="t360-step">2</span>
              <span className="t360-card__title">Genere el plan de evaluación</span>
            </div>

            <div className="t360-actions">
              <button
                type="button"
                className="t360-btn"
                onClick={handleGenerate}
                disabled={!canGenerate}
                title={!canGenerate ? "Completa cédula del colaborador y perfil de cargo" : "Generar plan"}
              >
                Generar
              </button>

              <div className="t360-hint">
                <span className="t360-hint__dot" aria-hidden="true" />
                <span>{footerHint}</span>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
