import * as React from "react";
import "./requisicionPage.css";
import MetricsBar from "./KPIs/Kpis";
import WizardRequisicion3Pasos from "./NuevaRequisicion/NuevaRequisicion";
import { useRequsiciones } from "../../Funcionalidades/Requisiciones/Requisicion";
import { useGraphServices } from "../../graph/graphContext";
import RequisicionesBoard from "./tablaRequisiciones/tablaRequisiciones";
import type { requisiciones } from "../../models/requisiciones";
import { gruposCVE, tipoConvocatoria, useCargo, useCentroCostos, useCentroOperativo, useDeptosMunicipios, useDireccion, useEmpresasSelect, useGenero, useMotivoRequisicion, useNivelCargo, useUnidadNegocio } from "../../Funcionalidades/Desplegables";
import type { desplegablesOption } from "../../models/Desplegables";
import { EditRequisiciones } from "./editRequisicion.tsx/editRequisicion";
import { RequisicionesDashboard } from "./Reports/Reports";

export default function RequisicionPage() {
    const [open, setOpen] = React.useState(false);
    const [edit, setEdit] = React.useState(false);
    const [show, setShow] = React.useState<string>("requisicion");
    const [displaySalario, setDisplaySalario] = React.useState("")
    const [displayComisiones, setDisplayComisiones] = React.useState("")

    const { requisiciones, Maestro, DeptosYMunicipios } = useGraphServices();
    const { año, setAño, cancelarRequisicion, cleanState, reloadAll, setField, handleEdit, setState, state, handleSubmit, notifyAsignacion, notificarMotivo, rows, errors, search, setSearch, estado, setEstado, setCargo, cargo, range, setCumpleANS, cumpleANS, setCiudad, ciudad, setAnalista, analista, setRange} = useRequsiciones(requisiciones);
    const { options: cargoOptions, reload: reloadCargo, loading: loadingCargo } = useCargo(Maestro);
    const { options: deptoOptions,  reload: reloadDeptos, loading: loadingCiudad } = useDeptosMunicipios(DeptosYMunicipios);
    const { options: generoOptions, loading: loadingGenero, reload: reloadGenero } = useGenero(Maestro);
    const { options: motivoOptions, loading: loadingMotivo, reload: reloadMotivo } = useMotivoRequisicion(Maestro);
    const { options: tipoConvocatoriaOptions, loading: loadingTipoConvocatoria, reload: reloadTipoConvocatoria } = tipoConvocatoria(Maestro);
    const { options: CentroCostosOptions, loading: loadingCC, reload: reloadCC } = useCentroCostos(Maestro);
    const { options: COOptions, loading: loadingCO, reload: reloadCO } = useCentroOperativo(Maestro);
    const { options: empresaOptions, loading: loadingEmpresa, reload: reloadEmpresa } = useEmpresasSelect(Maestro);
    const { options: UNOptions, loading: loadingUN, reload: reloadUN } = useUnidadNegocio(Maestro);
    const { options: direccionOptions, loading: loadingDireccion, reload: reloadDireccion } = useDireccion(Maestro);
    const { options: nivelesOption, loading: loadingNivel, reload: reloadNiveles } = useNivelCargo(Maestro);
    const { options: cveOptions, loading: loadingCVE, reload: reloadCVE } = gruposCVE(Maestro);

    React.useEffect(() => {
        reloadCargo();
        reloadDeptos();
        reloadDireccion()
        reloadCO()
        reloadEmpresa()
        reloadCC()
        reloadUN()
        reloadGenero()
        reloadMotivo()
        reloadTipoConvocatoria()
        reloadCVE()
        reloadNiveles()
    }, []);
    
    const ciudadesAllOptions: desplegablesOption[] = React.useMemo(() => {
        const set = new Set<string>();
    
        (deptoOptions ?? []).forEach((i) => {
          const city = String(i.value ?? "").trim();
          if (city) set.add(city);
        });
    
        return Array.from(set)
          .sort((a, b) => a.localeCompare(b, "es"))
          .map((c) => ({ value: c, label: c }));
      }, [deptoOptions]);

    const ciudadesWithAll = React.useMemo<desplegablesOption[]>(
        () => [{ value: "all", label: "*Todos*" }, ...(ciudadesAllOptions ?? [])],
    [ciudadesAllOptions])

    async function onSelect(r: requisiciones): Promise<void> {
        setState(r)
        setDisplaySalario(r.salarioBasico)
        setDisplayComisiones(r.comisiones)
        setEdit(true)
    }

    async function onEdit(r: requisiciones): Promise<void> {
        await handleEdit(r)
        await reloadAll()
        const requisicion = await requisiciones.get(r.Id ?? "")
        setState(requisicion)
    }

  const selectedCiudad = ciudadesAllOptions.find((o) => String(o.label ?? "").trim().toLowerCase() === String(state.Ciudad ?? "").trim().toLowerCase()) ?? null;
  const selectedCargo = cargoOptions.find((o) => String(o.label ?? "").trim().toLowerCase() === String(state.Title ?? "").trim().toLowerCase()) ?? null;
  const selectedMotivo = motivoOptions.find((o) => String(o.label ?? "").trim().toLowerCase() === String(state.motivo ?? "").trim().toLowerCase()) ?? null;
  const selectedCentroCostos = CentroCostosOptions.find((o) => String(o.value ?? "").trim().toLowerCase() === String(state.codigoCentroCosto ?? "").trim().toLowerCase()) ?? null;
  const selectedCentroOperativo = COOptions.find((o) => String(o.value ?? "").trim().toLowerCase() === String(state.codigoCentroOperativo ?? "").trim().toLowerCase()) ?? null;
  const selectedUnidadNegocio = UNOptions.find((o) => String(o.value ?? "").trim().toLowerCase() === String(state.codigoUnidadNegocio ?? "").trim().toLowerCase()) ?? null;
  const selectedTipoConvocatoria = tipoConvocatoriaOptions.find((o) => String(o.label ?? "").trim().toLowerCase() === String(state.tipoConvocatoria ?? "").trim().toLowerCase()) ?? null;
  const selectedCVE = cveOptions.find((o) => String(o.label ?? "").trim().toLowerCase() === String(state.grupoCVE ?? "").trim().toLowerCase()) ?? null;
  const selectedDireccion = direccionOptions.find((o) => String(o.label ?? "").trim().toLowerCase() === String(state.direccion ?? "").trim().toLowerCase()) ?? null;
  const selectedGenero = generoOptions.find((o) => String(o.label ?? "").trim().toLowerCase() === String(state.genero ?? "").trim().toLowerCase()) ?? null;
  const selectedEmpresa = empresaOptions.find((o) => String(o.label ?? "").trim().toLowerCase() === String(state.empresaContratista ?? "").trim().toLowerCase()) ?? null;

  const analistaFilterOptions: desplegablesOption[] = React.useMemo(() => {
    const set = new Set<string>();
    (rows ?? []).forEach((r) => {
      const name = String((r as any)?.nombreProfesional ?? "").trim();
      if (name) set.add(name);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, "es"))
      .map((name) => ({ value: name, label: name }));
  }, [rows]);

  const AnalistasWithAll = React.useMemo<desplegablesOption[]>(
    () => [{ value: "all", label: "*Todos*" }, ...(analistaFilterOptions ?? [])],
    [analistaFilterOptions])


  const cargoOptionsWithAll = React.useMemo<desplegablesOption[]>(
    () => [{ value: "all", label: "*Todos*" }, ...(cargoOptions ?? [])],
    [cargoOptions]
  );

    const yearsOptions: desplegablesOption[] = React.useMemo(() => {
        const years = new Set<number>();

        (rows ?? []).forEach((r) => {
            const raw = r.fechaInicioProceso;
            if (!raw) return;

            const s = String(raw).trim();
            if (!s) return;

            let d: Date | null = null;

            // ISO / Date-string común
            const iso = new Date(s);
            if (!Number.isNaN(iso.getTime())) d = iso;

            // dd/mm/yyyy (muy común en SP/PowerApps)
            if (!d) {
            const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (m) {
                const dd = Number(m[1]);
                const mm = Number(m[2]);
                const yyyy = Number(m[3]);
                const dt = new Date(yyyy, mm - 1, dd);
                if (!Number.isNaN(dt.getTime())) d = dt;
            }
            }

            if (!d) return;

            years.add(d.getFullYear());
        });

        return Array.from(years)
            .sort((a, b) => b - a) // más reciente primero
            .map((y) => ({ value: String(y), label: String(y) }));
    }, [rows]);

    return (
        <div className="rq-page">
            <header className="rq-head">
                {show === "requisicion" ?
                    <div className="rq-head__right">
                        <button className="btn btn-primary-final btn-xs" onClick={() => setOpen(true)}>
                            Solicitar nueva requisición
                        </button>
                    </div> : null
                }

                <button className="btn btn-primary-final btn-xs" onClick={() => setShow((prev) => (prev === "requisicion" ? "reportes" : "requisicion"))}>
                    {show === "requisicion" ? "Reportes" : "Requisiciones"}
                </button>
            </header>

            <section className="rq-kpis">
                <MetricsBar rows={rows} />
                {show === "requisicion" ? 
                    <RequisicionesBoard rows={rows} id={search} estado={estado} cargo={cargo} rango={range} cumple={cumpleANS} ciudad={ciudad} analista={analista} setId={setSearch} setEstado={setEstado} setCargo={setCargo} setRange={setRange} setCumple={setCumpleANS} setCiudad={setCiudad} setAnalista={setAnalista} cargoOptions={cargoOptions} ciudadOptions={ciudadesAllOptions} onOpenRow={onSelect}/>
                    : <RequisicionesDashboard years={yearsOptions} cargos={cargoOptionsWithAll} ciudades={ciudadesWithAll} profesionales={AnalistasWithAll} rows={rows} cargo={cargo} setCargo={setCargo} año={año} setAño={setAño} ciudad={ciudad} setCiudad={setCiudad} profesional={analista} setProfesional={setAnalista}/>
                }        
            </section>

            {open && (
                <WizardRequisicion3Pasos onClose={() => {reloadAll(); setOpen(false); cleanState(); }} state={state} handleSubmit={handleSubmit} notifyAsignacion={notifyAsignacion} notificarMotivo={notificarMotivo} setField={setField} selectedCiudad={selectedCiudad} selectedCargo={selectedCargo} selectedDireccion={selectedDireccion} selectedCentroCostos={selectedCentroCostos} selectedCentroOperativo={selectedCentroOperativo} selectedUnidadNegocio={selectedUnidadNegocio} selectedGenero={selectedGenero} selectedMotivo={selectedMotivo} selectedCVE={selectedCVE} selectedTipoConvocatoria={selectedTipoConvocatoria}/>
            )}

            {edit && (
                    <EditRequisiciones 
                    state={state}
                    errors={errors}
                    direccionOptions={direccionOptions}
                    loadingDireccion={loadingDireccion}
                    COOptions={COOptions}
                    loadingCO={loadingCO}
                    empresaOptions={empresaOptions}
                    loadingEmpresas={loadingEmpresa}
                    cargoOptions={cargoOptions}
                    loadingCargo={loadingCargo}
                    ciudadOptions={ciudadesAllOptions}
                    loadingCiudad={loadingCiudad}
                    CentroCostosOptions={CentroCostosOptions}
                    loadingCC={loadingCC}
                    UNOptions={UNOptions}
                    loadingUN={loadingUN}
                    generoOptions={generoOptions}
                    loadingGenero={loadingGenero}
                    motivoOptions={motivoOptions}
                    loadingMotivo={loadingMotivo}
                    tipoConvocatoriaOptions={tipoConvocatoriaOptions}
                    loadingTipoConvocatoria={loadingTipoConvocatoria}
                    cve={state.grupoCVE ? true : false}
                    cveOptions={cveOptions}
                    loadingCVE={loadingCVE}
                    displaySalario={displaySalario}
                    setDisplaySalario={setDisplaySalario}
                    displayComisiones={displayComisiones}
                    setDisplayComisiones={setDisplayComisiones}
                    setField={setField}
                    onClose={() => setEdit(false)}
                    onEdit={(r: requisiciones) => onEdit(r)}
                    selectedCiudad={selectedCiudad}
                    selectedCargo={selectedCargo}
                    selectedDireccion={selectedDireccion}
                    selectedCentroCostos={selectedCentroCostos}
                    selectedCentroOperativo={selectedCentroOperativo}
                    selectedUnidadNegocio={selectedUnidadNegocio}
                    selectedGenero={selectedGenero}
                    selectedMotivo={selectedMotivo}
                    selectedCVE={selectedCVE}
                    selectedTipoConvocatoria={selectedTipoConvocatoria}
                    selectedEmpresa={selectedEmpresa} onCancel={cancelarRequisicion} 
                    nivelesOption={nivelesOption} 
                    loadingNiveles={loadingNivel} />
                )
            }
        </div>
    );
}
