import * as React from "react";
import "./NuevaRequisicion.css";
import { gruposCVE, tipoConvocatoria, useCargo, useCentroCostos, useCentroOperativo, useDeptosMunicipios, useDireccion, useGenero, useMotivoRequisicion, useUnidadNegocio,} from "../../../Funcionalidades/Desplegables";
import { useCargoCiudadAnalista } from "../../../Funcionalidades/Requisiciones/cargoCiudadAnalista";
import { Step3, type Step3Result } from "./step3";
import { useGraphServices } from "../../../graph/graphContext";
import { useRequsiciones } from "../../../Funcionalidades/Requisiciones/Requisicion";
import type { cargoCiudadAnalista, requisiciones } from "../../../models/requisiciones";
import type { desplegablesOption } from "../../../models/Desplegables";
import { Step1 } from "./step1";
import { Step2 } from "./step2";
import { toISODateTimeFlex } from "../../../utils/Date";
import { useANSRequisicion } from "../../../Funcionalidades/Requisiciones/ANS-Requisicion/hooks/useANSRequisicion";
type Step = 1 | 2 | 3;

type Props = {
  state: requisiciones,
  handleSubmit: (ans: number, analista: cargoCiudadAnalista) => Promise<{created: requisiciones | null, ok: boolean}>
  onClose: () => void
  notifyAsignacion: (requisicion: requisiciones) => void
  notificarMotivo: (motivo: string, idCentroOperativo: string, descripcionCentroOperativo: string) => void
  setField: <K extends keyof requisiciones>(k: K, v: requisiciones[K]) => void;
  selectedCiudad: desplegablesOption | null
  selectedCargo: desplegablesOption | null
  selectedDireccion: desplegablesOption | null
  selectedCentroCostos: desplegablesOption | null
  selectedCentroOperativo: desplegablesOption | null
  selectedUnidadNegocio: desplegablesOption | null
  selectedGenero: desplegablesOption | null
  selectedMotivo: desplegablesOption | null
  selectedCVE: desplegablesOption | null
  selectedTipoConvocatoria: desplegablesOption | null
}

export default function WizardRequisicion3Pasos({selectedTipoConvocatoria, selectedCentroOperativo, selectedCVE, selectedMotivo, selectedGenero, selectedUnidadNegocio, selectedCentroCostos, selectedDireccion, selectedCiudad, selectedCargo, setField, state, handleSubmit, onClose, notifyAsignacion, notificarMotivo}: Props) {
  const [step, setStep] = React.useState<Step>(1);
  const [ans, setANS] = React.useState<number>(0);
  const [analista, setAnalista] = React.useState<cargoCiudadAnalista | null>(null);
  const [displaySalario, setDisplaySalario] = React.useState<string>("");
  const [displayComisiones, setDisplayComisiones] = React.useState<string>("");
  const [cve, setCVE] = React.useState<boolean>(false);
  const [creating, setCreating] = React.useState(false);
  const [result3, setResult3] = React.useState<Step3Result | null>(null);

  const { requisiciones, Maestro, DeptosYMunicipios, cargoCiudadAnalista, moverANS } = useGraphServices();
  const { cleanState, errors,} = useRequsiciones(requisiciones);
  const { lookForANS } = useANSRequisicion();
  const { lookForAnalistaEncargado } = useCargoCiudadAnalista(cargoCiudadAnalista);
  const { options: cargoOptions, loading: loadingCargo, reload: reloadCargo } = useCargo(Maestro);
  const { options: generoOptions, loading: loadingGenero, reload: reloadGenero } = useGenero(Maestro);
  const { options: motivoOptions, loading: loadingMotivo, reload: reloadMotivo } = useMotivoRequisicion(Maestro);
  const { options: tipoConvocatoriaOptions, loading: loadingTipoConvocatoria, reload: reloadTipoConvocatoria } = tipoConvocatoria(Maestro);
  const { options: CentroCostosOptions, loading: loadingCC, reload: reloadCC } = useCentroCostos(Maestro);
  const { options: COOptions, loading: loadingCO, reload: reloadCO } = useCentroOperativo(Maestro);
  const { options: UNOptions, loading: loadingUN, reload: reloadUN } = useUnidadNegocio(Maestro);
  const { options: direccionOptions, loading: loadingDireccion, reload: reloadDireccion } = useDireccion(Maestro);
  const { options: deptoOptions, loading: loadingDepto, reload: reloadDeptos } = useDeptosMunicipios(DeptosYMunicipios);
  const { options: cveOptions, loading: loadingCVE, reload: reloadCVE } = gruposCVE(Maestro);

  React.useEffect(() => {
    reloadCargo();
    reloadGenero();
    reloadMotivo();
    reloadTipoConvocatoria();
    reloadCC();
    reloadCO();
    reloadDeptos();
    reloadUN();
    reloadDireccion();
    reloadCVE();
  }, []);

  const municipioSelectOptions = React.useMemo<desplegablesOption[]>(() => {
    const set = new Set<string>();
    (deptoOptions ?? []).forEach((i) => {
      const city = String(i.value ?? "").trim();
      if (city) set.add(city);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((city) => ({ value: city, label: city }));
  }, [deptoOptions]);

  React.useEffect(() => {
    const cargo = String(selectedCargo?.value ?? "").trim();
    const ciudad = String(selectedCiudad?.label ?? "").trim();
    if (!cargo || !ciudad) return;

    let cancelled = false;

    (async () => {
      try {
        const ansOption = await lookForANS(cargo);
        if (!cancelled) {
          if (ansOption) setANS(ansOption.diasHabiles0);
          else alert("Este cargo no tiene un ANS definido, por favor comuníquese con CH y solicite su definición");
        }

        const analistaOption = await lookForAnalistaEncargado(cargo, ciudad);
        if (!cancelled) {
          if (analistaOption) setAnalista(analistaOption);
          else
            alert(
              "Esta combinación de cargo y ciudad no tiene un analista definido, por favor comuníquese con Capital Humano y solicite su definición"
            );
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error(e);
          alert(e?.message ?? "Error consultando ANS/Analista.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCargo?.value, selectedCiudad?.label,]);

  // Validaciones por paso
  const step1Ok = String(state.Title ?? "").trim() && String(state.Ciudad ?? "").trim() &&  String(state.correoSolicitante ?? "").trim() && Boolean(state.tipoRequisicion);
  const step2Ok = Boolean(String(state.motivo ?? "").trim()) && Boolean(String(state.tipoConvocatoria ?? "").trim()) && Boolean(String(state.salarioBasico ?? "").trim());
  const step3Ok = !!result3;
  const canGoNext = step === 1 ? !!step1Ok : step === 2 ? !!step2Ok : false;

  async function goNext() {
    if (!canGoNext) return;

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!analista) {
        alert("No hay analista definido para este cargo/ciudad.");
        return;
      }

      setCreating(true);
      try {
        const resp = await handleSubmit(ans, analista);

        if (!resp?.ok) {
          alert("No se pudo crear la requisición.");
          return;
        }

        await notifyAsignacion(resp.created!)
        await notificarMotivo(resp.created?.motivo ?? "", resp.created?.codigoCentroOperativo ?? "", resp.created?.descripcionCentroOperativo ?? "")
        await moverANS.create({ANS: resp.created?.ANS ?? "", fechaComentario: toISODateTimeFlex(new Date()), fechaLimite: resp.created?.fechaLimite ?? null, observacion: "Nueva requisición", Title: resp.created?.Id ?? ""})
        const requisicionId = resp.created?.Id|| "—";
        const profesionalNombre = String((resp as any)?.profesionalNombre ?? analista?.nombreAnalista ?? "—").trim() || "—";
        const fechaInicioProceso = String((resp as any)?.fechaInicioProceso ?? state.fechaInicioProceso ?? "").trim() || "—";
        const fechaLimiteVinculacion = String((resp as any)?.fechaLimiteVinculacion ?? `${ans} días hábiles`).trim() || `${ans} días hábiles`;
        const correoProfesional = resp.created?.correoProfesional ?? ""

        setResult3({
          requisicionId,
          profesionalNombre,
          fechaInicioProceso,
          fechaLimiteVinculacion,
          correoProfesional,
        });

        setStep(3);
      } catch (e: any) {
        console.error(e);
        alert(e?.message ?? "Error creando la requisición.");
      } finally {
        setCreating(false);
      }
    }
  }

  function goBack() {
    setStep((s) => (s === 3 ? 2 : 1));
  }

  function goToStep(target: Step) {
    const allow =
      target === step ||
      target === 1 ||
      (target === 2 && step1Ok) ||
      (target === 3 && step1Ok && step2Ok && result3);

    if (!allow) return;
    setStep(target);
  }

  function onReset() {
    cleanState();
    setDisplaySalario("");
    setDisplayComisiones("");
    setANS(0);
    setAnalista(null);
    setCVE(false);
    setResult3(null);
    setStep(1);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step !== 3) return;
  }

  return (
    <div className="ft-modal-backdrop" role="dialog" aria-modal="true">
      <section className="ft-scope ft-card">
        <header className="ft-head">
          <div>
            <h2 className="ft-title">Requisición</h2>
          </div>
          <button className="ft-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        {/* Stepper */}
        <nav className="ft-steps" aria-label="Progreso">
          <button type="button" className={`ft-stepbtn ${step === 1 ? "is-active" : ""} ${step1Ok ? "is-done" : ""}`} onClick={() => goToStep(1)}>
            <span className="ft-dot">1</span>
            <span className="ft-steplabel">
              <span className="ft-stepname">Cargo y Ciudad</span>
            </span>
          </button>

          <div className={`ft-bar ${step1Ok ? "is-done" : ""}`} />

          <button type="button" className={`ft-stepbtn ${step === 2 ? "is-active" : ""} ${step2Ok ? "is-done" : ""}`} onClick={() => goToStep(2)}>
            <span className="ft-dot">2</span>
            <span className="ft-steplabel">
              <span className="ft-stepname">Detalles</span>
            </span>
          </button>

          <div className={`ft-bar ${step1Ok && step2Ok && result3 ? "is-done" : ""}`} />

          <button type="button" className={`ft-stepbtn ${step === 3 ? "is-active" : ""} ${step3Ok ? "is-done" : ""}`} onClick={() => goToStep(3)} >
            <span className="ft-dot">3</span>
            <span className="ft-steplabel">
              <span className="ft-stepname">Confirmación</span>
            </span>
          </button>
        </nav>

        <form className="ft-form" onSubmit={onSubmit}>
          {step === 1 && (
            <Step1 state={state} errors={errors} cargoOptions={cargoOptions} loadingCargo={loadingCargo} municipioSelectOptions={municipioSelectOptions} loadingDepto={loadingDepto} cve={cve} setCVE={setCVE} setField={setField as any} selectedCargo={selectedCargo} selectedCiudad={selectedCiudad}/>
          )}

          {step === 2 && (
            <Step2 state={state} errors={errors} direccionOptions={direccionOptions} loadingDireccion={loadingDireccion} selectedDireccion={selectedDireccion} COOptions={COOptions} loadingCO={loadingCO} selectedCentroOperativo={selectedCentroOperativo} CentroCostosOptions={CentroCostosOptions} loadingCC={loadingCC} selectedCentroCostos={selectedCentroCostos} UNOptions={UNOptions} loadingUN={loadingUN} selectedUnidadNegocio={selectedUnidadNegocio} generoOptions={generoOptions} loadingGenero={loadingGenero} selectedGenero={selectedGenero} motivoOptions={motivoOptions} loadingMotivo={loadingMotivo} selectedMotivo={selectedMotivo} tipoConvocatoriaOptions={tipoConvocatoriaOptions} loadingTipoConvocatoria={loadingTipoConvocatoria} selectedTipoConvocatoria={selectedTipoConvocatoria} cve={cve} cveOptions={cveOptions} loadingCVE={loadingCVE} selectedCVE={selectedCVE} displaySalario={displaySalario} setDisplaySalario={setDisplaySalario} displayComisiones={displayComisiones} setDisplayComisiones={setDisplayComisiones} setField={setField as any}/>
          )}

          {step === 3 && <Step3 result3={result3} />}

          {/* Acciones */}
          <footer className="ft-actions full-fila">
            <button type="button" className="btn" onClick={onReset} disabled={creating}>
              Limpiar
            </button>

            <div className="ft-actions-right">
              <button type="button" className="btn" onClick={onClose} disabled={creating}>
                Cancelar
              </button>

              <button type="button" className="btn" onClick={goBack} disabled={step === 1 || creating}>
                Atrás
              </button>

              {step < 3 ? (
                <button type="button" className="btn btn-primary" onClick={goNext} disabled={!canGoNext || creating}>
                  {creating ? "Creando…" : "Siguiente"}
                </button>
              ) : (
                <button type="button" className="btn btn-primary" onClick={onClose}>
                  Finalizar
                </button>
              )}
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
