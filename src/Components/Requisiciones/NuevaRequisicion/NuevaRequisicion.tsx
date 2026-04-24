import * as React from "react";
import "./NuevaRequisicion.css";
import { useGraphServices } from "../../../graph/graphContext";
import type { cargoCiudadAnalista, requisiciones } from "../../../models/requisiciones";
import FirstStepForm from "./FormStep1/Step1";
import { gruposCVE, useCargo, useCentroCostos, useCentroOperativo, useDeptosMunicipios, useDireccion, useGenero, useModalidadTrabajo, useMotivoRequisicion, useTipoVacante, useUnidadNegocio } from "../../../Funcionalidades/Desplegables";
import Step2Form from "./FormStep2/Step2";



type Props = {
  onClose: () => void;
  state: requisiciones;
  handleSubmit: (ans: number, analista: cargoCiudadAnalista) => Promise<{created: requisiciones | null; ok: boolean;}>;
  notifyAsignacion: (created: requisiciones) => Promise<void>;
  notificarMotivo: (motivo: string, coCodigo: string, coNombre: string) => Promise<void>;
  setField: <K extends keyof requisiciones>(k: K, v: requisiciones[K]) => void;
};

function sameText(left: unknown, right: unknown) {
  return String(left ?? "").trim().toLowerCase() === String(right ?? "").trim().toLowerCase();
}
export default function WizardRequisicion3Pasos({onClose, state, handleSubmit, notifyAsignacion, notificarMotivo, setField,}: Props) {
  
  const { categorias, ansRequisicion, cargoCiudadAnalista, Maestro, DeptosYMunicipios} = useGraphServices();
  const [submitting, setSubmitting] = React.useState(false);

  //Desplegables Options
  const {reload: loadCargos, options: cargoOptions,} = useCargo(Maestro)
  const {reload: loadTipoVacante, options: tipoConvocatoriaOptions} = useTipoVacante(Maestro)
  const {reload: loadGenero, options: generoOptions} = useGenero(Maestro)
  const {reload: loadCiudades, options: ciudadesOptions} = useDeptosMunicipios(DeptosYMunicipios)
  const {reload: loadMotivos, options: motivosOptions} = useMotivoRequisicion(Maestro)
  const {reload: loadCentroOperativo, options: centroOperativoOptions} = useCentroOperativo(Maestro)
  const {reload: loadCentroCostos, options: centroCostosOptioons} = useCentroCostos(Maestro)
  const {reload: loadUnidadNegocio, options: unidadNegocioOptions} = useUnidadNegocio(Maestro)
  const {reload: loadDireccion, options: direccionOptions} = useDireccion(Maestro)
  const {reload: loadCVE, options: cveOptions} = gruposCVE(Maestro)
  const {reload: loadModalidad, options: modalidadOptions} = useModalidadTrabajo(Maestro)

  //Cargos retail
  const cargosRetail: string[] = [
    "administrador de almacenes",
    "administrador de sales smart",
    "asesor comercial",
    "auxiliar de centro de distribucion",
    "coadministrador"
  ] 

  //Todas las ciudades
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
  
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [tipoRequisicion, setTipoRequisicion] = React.useState<"Administrativa" | "Retail">("Administrativa")

  //Cargas desplegables 
  React.useEffect(() => {
    loadCargos()
    loadCiudades()
    loadTipoVacante()
    loadGenero()
    loadMotivos()
    loadCentroOperativo()
    loadCentroCostos()
    loadUnidadNegocio()
    loadDireccion()
    loadCVE()
    loadModalidad()
  }, []);


  //Seleccionados
  const selectedCargo = cargoOptions.find((option) => sameText(option.label, state.Title)) ?? null;
  const selectedCiudad = ciudadesAllOptions.find((option) => sameText(option.value, state.Ciudad)) ?? null;
  const selectedTipoConvocatoria = tipoConvocatoriaOptions.find((option) => sameText(option.label, state.tipoConvocatoria)) ?? null;
  const selectedGenero = generoOptions.find((option) => sameText(option.label, state.genero)) ?? null;
  const selectedMotivo = motivosOptions.find((option) => sameText(option.label, state.motivo)) ?? null;
  const selectedCentroOperativo = centroOperativoOptions.find((option) => sameText(option.value, state.codigoCentroOperativo)) ?? null;
  const selectedCentroCostos = centroCostosOptioons.find((option) => sameText(option.value, state.codigoCentroCosto)) ?? null;
  const selectedUnidadNegocio = unidadNegocioOptions.find((option) => sameText(option.value, state.codigoUnidadNegocio)) ?? null;
  const selectedDireccion = direccionOptions.find((option) => sameText(option.value, state.direccion)) ?? null;
  const selectedCVE = cveOptions.find((option) => sameText(option.value, state.grupoCVE)) ?? null;
  const selectedModalidad = modalidadOptions.find((option) => sameText(option.value, state.modalidadTeletrabajo)) ?? null;

  const handleSubmitRequest = async () => {

    if (!state.Title || !state.Ciudad) {
      alert("Debes seleccionar el cargo y la ciudad para asignar el ANS y el analista.");
      return;
    }

    setSubmitting(true);

    try {
      //1 Buscar la categoria del cargo
      const categoriaCargo = (await categorias.getAll({filter: `fields/Title eq '${state.Title}'`}))[0]
      console.log(categoriaCargo)

      if(!categoriaCargo){
        alert("Este cargo no ha sido configurado, por favor comuniquese con capital humano")
        return
      }

      const [ansRows, analystRows] = await Promise.all([
        ansRequisicion.getAll({ filter: `fields/NivelCargo eq '${categoriaCargo.Categoria}'`, top: 1 }),
        cargoCiudadAnalista.getAll({
          filter: `fields/Cargo eq '${state.Title}' and fields/Ciudad eq '${state.Ciudad}'`,
          top: 1,
        }),
      ]);

      const ans = ansRows[0];
      const analyst = analystRows[0];

      if (!ans) {
        alert("No se encontró ANS configurado para el cargo seleccionado.");
        return;
      }

      if (!analyst) {
        alert("No se encontró un analista asignado para la combinación de cargo y ciudad.");
        return;
      }

      const result = await handleSubmit(Number(ans.diasHabiles0 ?? 0), analyst);

      if (!result.ok || !result.created) {
        alert("No fue posible crear la requisición.");
        return;
      }

      await notifyAsignacion(result.created);

      if (result.created.motivo && result.created.codigoCentroOperativo) {
        await notificarMotivo(
          result.created.motivo,
          result.created.codigoCentroOperativo,
          result.created.descripcionCentroOperativo
        );
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if(!state.Title) {
        alert("Debes seleccionar un cargo")
        return
      }

      if(!state.Ciudad) {
        alert("Debes seleccionar una ciudad")
        return
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
  }

  const handleCargoChange = (cargo: string) => {
    const cleanCargo = cargo.toLocaleLowerCase().trim()
    setField("Title", cargo)
    console.log("Started")
    
    if(cargosRetail.includes(cleanCargo)){
      setTipoRequisicion("Retail")
      return
    }

    setTipoRequisicion("Administrativa")

  };

  return (
    <div className="rqw-page-shell">
      <section className="ft-scope ft-card rqw-card rqw-card--page">
        <header className="ft-head rqw-head">
          <div>
            <p className="rqw-subtitle">Completa la informacion del cargo y los datos operativos para crear la requisicion.</p>
            <h2 className="ft-title">Solicitud de requisición</h2>
          </div>
        </header>

        <form className="ft-form" noValidate>

          {step === 1 ? 
            <FirstStepForm 
              tipoRequisicion={tipoRequisicion}
              selectedCargo={selectedCargo}
              onChangeCargo={handleCargoChange}
              selectedCiudad={selectedCiudad}
              cargosOptions={cargoOptions}
              ciudadesAllOptions={ciudadesAllOptions} 
              setField={setField}            /> : null
          }

          {step === 2 ? 
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
              selectedModalidad={selectedModalidad}/>
            : null
          }

        </form>

        <footer className="ft-foot rqw-foot">

          <div className="ft-foot__left">
            <button type="button" className="btn btn-primary-final btn-xs" disabled={submitting} onClick={handleNext}>
              {submitting ? "Creando..." : step === 2 ? "Crear requisición" : "Siguiente Paso"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
