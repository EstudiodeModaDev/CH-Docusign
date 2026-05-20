import * as React from "react";
import "./NuevaRequisicion.css";
import { useGraphServices } from "../../../graph/graphContext";
import type { requisiciones } from "../../../models/Requisiciones/requisiciones";
import FirstStepForm from "./FormStep1/Step1";
import { gruposCVE, useCargo, useCentroCostos, useCentroOperativo, useDeptosMunicipios, useDireccion, useGenero, useModalidadTrabajo, useMotivoRequisicion, useTipoVacante, useUnidadNegocio } from "../../../Funcionalidades/Desplegables";
import Step2Form from "./FormStep2/Step2";

type Props = {
  onClose: () => void;
  state: requisiciones;
  handleSubmit: (ans: number) => Promise<{ created: requisiciones | null; ok: boolean }>;
  notifyAsignacion: (created: requisiciones) => Promise<void>;
  notificarMotivo: (motivo: string, coCodigo: string, coNombre: string) => Promise<void>;
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
  notificarMotivo,
  setField,
}: Props) {
  const { categorias, ansRequisicion, Maestro, DeptosYMunicipios, } = useGraphServices();
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
      alert("Debes seleccionar el cargo y la ciudad para asignar el ANS y el analista.");
      return;
    }

    setSubmitting(true);

    try {
      const categoriaCargo = state.NivelCargo;
      console.log(categoriaCargo);

      if (!categoriaCargo) {
        alert("Este cargo no ha sido configurado, por favor comuniquese con capital humano");
        return;
      }

      const [ansRows] = await Promise.all([
        ansRequisicion.getAll({ filter: `fields/NivelCargo eq '${categoriaCargo}'`, top: 1 }),
      ]);

      const ans = ansRows[0];
      if (!ans) {
        alert("No se encontro ANS configurado para el cargo seleccionado.");
        return;
      }

      const result = await handleSubmit(Number(ans.diasHabiles0 ?? 0));

      if (!result.ok || !result.created) {
        alert("No fue posible crear la requisicion.");
        return;
      }

      await notifyAsignacion(result.created);

      if (result.created.motivo && result.created.codigoCentroOperativo) {
        await notificarMotivo(
          result.created.motivo,
          result.created.codigoCentroOperativo,
          result.created.tienda ?? ""
        );
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!state.Title) {
        alert("Debes seleccionar un cargo");
        return;
      }

      if (!state.Ciudad) {
        alert("Debes seleccionar una ciudad");
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
    console.log("Started");

    if (cargosRetail.includes(cleanCargo)) {
      setTipoRequisicion("Retail");
      setField("tipoRequisicion", "Retail");
      return;
    }

    const categoriaCargo = (await categorias.getAll({ filter: `fields/Title eq '${cargo}'` }))[0];
    console.log(categoriaCargo)
    setField("NivelCargo", categoriaCargo?.Categoria || "");

    setTipoRequisicion("Administrativa");
    setField("tipoRequisicion", "Administrativa");
  };

  const currentStep = step === 1 ? 1 : 2;
  const isLastStep = currentStep === 2;

  return (
    <div className="rqw-page-shell">
      <section className="ft-scope ft-card rqw-card rqw-card--page">
        <header className="ft-head rqw-head">
          <div className="rqw-head__content">
            <div className="rqw-kicker-row">
              <span className="rqw-kicker">Nueva requisicion</span>
              <span className="rqw-kicker rqw-kicker--soft">{tipoRequisicion}</span>
            </div>
            <h2 className="ft-title">Solicitud de requisicion</h2>
            <p className="rqw-subtitle">Completa la informacion del cargo y los datos operativos para crear la requisicion.</p>
          </div>

          <div className="rqw-stepper" aria-label="Progreso del formulario">
            <div className={`rqw-step ${currentStep >= 1 ? "is-active" : ""}`}>
              <span className="rqw-step__index">1</span>
              <div className="rqw-step__meta">
                <strong>Base</strong>
                <span>Cargo y ciudad</span>
              </div>
            </div>
            <div className={`rqw-step ${currentStep >= 2 ? "is-active" : ""}`}>
              <span className="rqw-step__index">2</span>
              <div className="rqw-step__meta">
                <strong>Detalle</strong>
                <span>Datos operativos</span>
              </div>
            </div>
          </div>
        </header>

        <section className="rqw-overview" aria-label="Resumen de la requisicion">
          <div className="rqw-overview__item">
            <span className="rqw-overview__label">Cargo</span>
            <strong>{state.Title || "Pendiente por definir"}</strong>
          </div>
          <div className="rqw-overview__item">
            <span className="rqw-overview__label">Ciudad</span>
            <strong>{state.Ciudad || "Pendiente por definir"}</strong>
          </div>
          <div className="rqw-overview__item">
            <span className="rqw-overview__label">Paso actual</span>
            <strong>{currentStep} de 2</strong>
          </div>
        </section>

        <form className="ft-form" noValidate>
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

        <footer className="ft-foot rqw-foot">
          <div className="ft-foot__left">
            {step === 2 ? (
              <button type="button" className="btn btn-secondary-final btn-xs" disabled={submitting} onClick={() => setStep(1)}>
                Volver
              </button>
            ) : null}
            <button type="button" className="btn btn-transparent-final btn-xs" disabled={submitting} onClick={onClose}>
              Cancelar
            </button>
          </div>

          <div className="ft-foot__right">
            <p className="rqw-summary">
              {isLastStep ? "Revisa la informacion antes de crear la requisicion." : "Primero definimos el cargo, la ciudad y el tipo de requisicion."}
            </p>
            <button type="button" className="btn btn-primary-final btn-xs" disabled={submitting} onClick={handleNext}>
              {submitting ? "Creando..." : step === 2 ? "Crear requisicion" : "Siguiente paso"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
