import * as React from "react";
import "./NuevaRequisicion.css";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";
import FirstStepForm from "./FormStep1/Step1";
import {
  gruposCVE,
  useCargo,
  useCentroCostos,
  useCentroOperativo,
  useDeptosMunicipios,
  useDireccion,
  useGenero,
  useModalidadTrabajo,
  useMotivoRequisicion,
  useTipoVacante,
  useUnidadNegocio,
} from "../../../Funcionalidades/Desplegables";
import Step2Form from "./FormStep2/Step2";
import { useCoreGraphServices, useRequisicionesServices } from "../../../graph/graphContext";
import { notify } from '../../../utils/notify';

type Props = {
  onClose: () => void;
  state: requisiciones;
  handleSubmit: (ans: number) => Promise<{ created: requisiciones | null; ok: boolean }>;
  notifyAsignacion: (created: requisiciones) => Promise<void>;
  setField: <K extends keyof requisiciones>(k: K, v: requisiciones[K]) => void;
};

function sameText(left: unknown, right: unknown) {
  return String(left ?? "").trim().toLowerCase() === String(right ?? "").trim().toLowerCase();
}

export default function WizardRequisicion3Pasos({
  onClose,
  state,
  handleSubmit,
  notifyAsignacion,
  setField,
}: Props) {
  const { ansRequisicion } = useRequisicionesServices();
  const { categorias, Maestro, DeptosYMunicipios } = useCoreGraphServices();
  const [submitting, setSubmitting] = React.useState(false);

  const { reload: loadCargos, options: cargoOptions } = useCargo(Maestro);
  const { reload: loadTipoVacante, options: tipoConvocatoriaOptions } = useTipoVacante(Maestro);
  const { reload: loadGenero, options: generoOptions } = useGenero(Maestro);
  const { reload: loadCiudades, options: ciudadesOptions } = useDeptosMunicipios(DeptosYMunicipios);
  const { reload: loadMotivos, options: motivosOptions } = useMotivoRequisicion(Maestro);
  const { reload: loadCentroOperativo, options: centroOperativoOptions } = useCentroOperativo(Maestro);
  const { reload: loadCentroCostos, options: centroCostosOptioons } = useCentroCostos(Maestro);
  const { reload: loadUnidadNegocio, options: unidadNegocioOptions } = useUnidadNegocio(Maestro);
  const { reload: loadDireccion, options: direccionOptions } = useDireccion(Maestro);
  const { reload: loadCVE, options: cveOptions } = gruposCVE(Maestro);
  const { reload: loadModalidad, options: modalidadOptions } = useModalidadTrabajo(Maestro);

  const cargosRetail: string[] = [
    "administrador de almacenes",
    "administrador de sales smart",
    "asesor comercial",
    "auxiliar de centro de distribucion",
    "coadministrador",
  ];

  const ciudadesAllOptions = React.useMemo(() => {
    const set = new Set<string>();

    ciudadesOptions.forEach((i) => {
      const city = String(i.value ?? "").trim();
      if (city) set.add(city);
    });

    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((c) => ({ value: c, label: c }));
  }, [ciudadesOptions]);

  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [tipoRequisicion, setTipoRequisicion] = React.useState<"Administrativa" | "Retail">("Administrativa");

  React.useEffect(() => {
    loadCargos();
    loadCiudades();
    loadTipoVacante();
    loadGenero();
    loadMotivos();
    loadCentroOperativo();
    loadCentroCostos();
    loadUnidadNegocio();
    loadDireccion();
    loadCVE();
    loadModalidad();
  }, []);

  const selectedCargo = cargoOptions.find((option) => sameText(option.label, state.Title)) ?? null;
  const selectedCiudad = ciudadesAllOptions.find((option) => sameText(option.value, state.Ciudad)) ?? null;
  const selectedTipoConvocatoria = tipoConvocatoriaOptions.find((option) => sameText(option.label, state.tipoConvocatoria)) ?? null;
  const selectedGenero = generoOptions.find((option) => sameText(option.label, state.genero)) ?? null;
  const selectedMotivo = motivosOptions.find((option) => sameText(option.label, state.motivo)) ?? null;
  const selectedCentroOperativo = centroOperativoOptions.find((option) => sameText(option.value, state.codigoCentroOperativo)) ?? null;
  const selectedCentroCostos = centroCostosOptioons.find((option) => sameText(option.value, state.codigoCentroCosto)) ?? null;
  const selectedUnidadNegocio = unidadNegocioOptions.find((option) => sameText(option.value, state.codigoUnidadNegocio)) ?? null;
  const selectedDireccion = direccionOptions.find((option) => sameText(option.label, state.direccion)) ?? null;
  const selectedCVE = cveOptions.find((option) => sameText(option.value, state.grupoCVE)) ?? null;
  const selectedModalidad = modalidadOptions.find((option) => sameText(option.label, state.modalidadTeletrabajo)) ?? null;

  const handleSubmitRequest = async () => {
    if (!state.Title || !state.Ciudad) {
      notify.auto("Debes seleccionar el cargo y la ciudad para asignar el ANS y el analista.");
      return;
    }

    setSubmitting(true);

    try {
      const categoriaCargo = state.NivelCargo;

      if (!categoriaCargo) {
        notify.auto("Este cargo no ha sido configurado, por favor comuniquese con capital humano");
        return;
      }

      const [ansRows] = await Promise.all([
        ansRequisicion.getAll({ filter: `fields/NivelCargo eq '${categoriaCargo}'`, top: 1 }),
      ]);

      const ans = ansRows[0];
      if (!ans) {
        notify.auto("No se encontro ANS configurado para el cargo seleccionado.");
        return;
      }

      const result = await handleSubmit(Number(ans.diasHabiles0 ?? 0));

      if (!result.ok || !result.created) {
        notify.auto("No fue posible crear la requisicion.");
        return;
      }

      await notifyAsignacion(result.created);

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!state.Title) {
        notify.auto("Debes seleccionar un cargo");
        return;
      }

      if (!state.Ciudad) {
        notify.auto("Debes seleccionar una ciudad");
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      await handleSubmitRequest();
      setStep(1);
      return;
    }

    await handleSubmitRequest();
    setStep(1);
  };

  const handleCargoChange = async (cargo: string) => {
    const cleanCargo = cargo.toLocaleLowerCase().trim();
    setField("Title", cargo);

    if (cargosRetail.includes(cleanCargo)) {
      setTipoRequisicion("Retail");
      setField("tipoRequisicion", "Retail");
      return;
    }

    const categoriaCargo = (await categorias.getAll({ filter: `fields/Title eq '${cargo}'` }))[0];
    setField("NivelCargo", categoriaCargo?.Categoria || "");

    setTipoRequisicion("Administrativa");
    setField("tipoRequisicion", "Administrativa");
  };

  const currentStep = step === 1 ? 1 : 2;
  const stepTone = currentStep === 1 ? "Definicion inicial" : "Configuracion final";

  return (
    <div className="rqw-shell">
      <section className="rqw-frame">
        <header className="rqw-hero">
          <div className="rqw-hero__copy">
            <span className="rqw-badge">Nueva vacante</span>
            <h2 className="rqw-hero__title">Crear requisicion</h2>
            <p className="rqw-hero__subtitle">
              Registra la vacante paso a paso y valida la informacion clave antes de enviarla al flujo.
            </p>
          </div>

          <div className="rqw-progress">
            <div className={`rqw-progress__step ${currentStep === 1 ? "is-current" : currentStep > 1 ? "is-done" : ""}`}>
              <span className="rqw-progress__index">1</span>
              <div>
                <strong>Base</strong>
                <span>Cargo y ciudad</span>
              </div>
            </div>
            <div className={`rqw-progress__step ${currentStep === 2 ? "is-current" : ""}`}>
              <span className="rqw-progress__index">2</span>
              <div>
                <strong>Detalle</strong>
                <span>Datos operativos</span>
              </div>
            </div>
          </div>
        </header>

        <div className="rqw-layout">
          <aside className="rqw-sidebar">
            <div className="rqw-sidebar-card rqw-sidebar-card--accent">
              <span className="rqw-sidebar-card__eyebrow">Estado</span>
              <strong className="rqw-sidebar-card__title">{stepTone}</strong>
              <p className="rqw-sidebar-card__copy">
                {currentStep === 1
                  ? "Primero definimos la identidad de la vacante."
                  : "Ahora completamos la estructura y las condiciones de la solicitud."}
              </p>
            </div>

            <div className="rqw-sidebar-card">
              <span className="rqw-sidebar-card__eyebrow">Resumen</span>
              <div className="rqw-sidebar-list">
                <div className="rqw-sidebar-list__item">
                  <span>Cargo</span>
                  <strong>{state.Title || "Pendiente"}</strong>
                </div>
                <div className="rqw-sidebar-list__item">
                  <span>Ciudad</span>
                  <strong>{state.Ciudad || "Pendiente"}</strong>
                </div>
                <div className="rqw-sidebar-list__item">
                  <span>Tipo</span>
                  <strong>{state.tipoRequisicion || tipoRequisicion}</strong>
                </div>
                <div className="rqw-sidebar-list__item">
                  <span>Paso</span>
                  <strong>{currentStep} de 2</strong>
                </div>
              </div>
            </div>
          </aside>

          <main className="rqw-main">
            <form className="rqw-form" noValidate>
              {step === 1 ? (
                <FirstStepForm
                  selectedCargo={selectedCargo}
                  onChangeCargo={handleCargoChange}
                  selectedCiudad={selectedCiudad}
                  cargosOptions={cargoOptions}
                  ciudadesAllOptions={ciudadesAllOptions}
                  setField={setField}
                  state={state}
                />
              ) : null}

              {step === 2 ? (
                <Step2Form
                  state={state}
                  setField={setField}
                  tipoConvocatoria={tipoRequisicion}
                  tipoConvocatoriaOptions={tipoConvocatoriaOptions}
                  selectedTipoConvocatoria={selectedTipoConvocatoria}
                  generoOptions={generoOptions}
                  selectedGenero={selectedGenero}
                  motivoOptions={motivosOptions}
                  selectedMotivo={selectedMotivo}
                  centroOperativoOptions={centroOperativoOptions}
                  selectedCentroOperativo={selectedCentroOperativo}
                  centroCostosOptions={centroCostosOptioons}
                  selectedCentroCostos={selectedCentroCostos}
                  unidadNegocioOptions={unidadNegocioOptions}
                  selectedUnidadNegocio={selectedUnidadNegocio}
                  direccionOptions={direccionOptions}
                  selectedDireccion={selectedDireccion}
                  cveOptions={cveOptions}
                  selectedCve={selectedCVE}
                  modalidadOptions={modalidadOptions}
                  selectedModalidad={selectedModalidad}
                />
              ) : null}
            </form>
          </main>
        </div>

        <footer className="rqw-actions">
          <div className="rqw-actions__left">
            {step === 2 ? (
              <button type="button" className="btn btn-secondary-final btn-xs" disabled={submitting} onClick={() => setStep(1)}>
                Volver
              </button>
            ) : null}
            <button type="button" className="btn btn-transparent-final btn-xs" disabled={submitting} onClick={onClose}>
              Cancelar
            </button>
          </div>

          <div className="rqw-actions__right">
            <p className="rqw-actions__hint">
              {currentStep === 1
                ? "Define el cargo y la ciudad para habilitar el siguiente paso."
                : "Verifica la informacion antes de crear la requisicion."}
            </p>
            <button type="button" className="btn btn-primary-final btn-xs" disabled={submitting} onClick={handleNext}>
              {submitting ? "Creando..." : step === 2 ? "Crear requisicion" : "Continuar"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}


