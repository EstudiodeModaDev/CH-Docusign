import * as React from "react";
import "./NewPazSalvo.css";
import { useGraphServices } from "../../../graph/graphContext";
import { usePazSalvo } from "../../../Funcionalidades/PazSalvos/PazSalvos";
import { useWorkers } from "../../../Funcionalidades/PazSalvos/Workers";
import Select from "react-select";
import type { UserOption } from "../../../models/User";
import type { solicitados } from "../../../models/PazSalvo";
import { useCargo, useCentroOperativo, useEmpresasSelect } from "../../../Funcionalidades/Desplegables";
import { useRenovar } from "../../../Funcionalidades/PazSalvos/Renovar";
import { useFirmaUsuario } from "../../../Funcionalidades/PazSalvos/Firmas";
import { useAuth } from "../../../auth/authProvider";

type Props = {
  onBack: () => void;
};

export const PazSalvoForm: React.FC<Props> = ({ onBack,}) => {
  const {PazSalvos, Maestro, Renovar, Firmas, mail, configuraciones} = useGraphServices()
  const {account} = useAuth()
  const {getFirmaInline} = useFirmaUsuario(Firmas, account?.username!)
  const {state, setField, handleSubmit, errors, loading} = usePazSalvo(PazSalvos,mail);
  const {loadRenovables, handleSubmit: createRenovar, setField: setRenovableField,} = useRenovar(Renovar)
  const { workersOptions, loadingWorkers, error: usersError } = useWorkers({onlyEnabled: true,});
  const { options: COOptions, loading: loadingCO, reload: reloadCO} = useCentroOperativo(Maestro);
  const { options: empresaOptions, loading: loadingEmp, reload: reloadEmpresas} = useEmpresasSelect(Maestro);
  const { options: cargoOptions, loading: loadingCargo, reload: reloadCargo} = useCargo(Maestro);
  const [aprobadorSelected, setSelectedAprobador] = React.useState<UserOption | null>(null);
  const selectedJefe = workersOptions.find((o) => o.value.trim().toLocaleLowerCase() === state.CorreoJefe.trim().toLocaleLowerCase()) ?? null;
  const selectedEmpresa = empresaOptions.find((o) => o.label.trim().toLocaleLowerCase() === state.Empresa.trim().toLocaleLowerCase()) ?? null;
  const selectedCentroOperativo = COOptions.find((o) => o.value === state.CO) ?? null;
  const selectedCargo = cargoOptions.find((o) => o.label === state.Cargo) ?? null;

  const [correo, setCorreo] = React.useState<string>("")
  const [encuesta, setEncuesta] = React.useState<string>("")
  
  React.useEffect(() => {
    reloadCO(),
    reloadEmpresas(),
    reloadEmpresas(),
    reloadCargo()
  }, [reloadCO, reloadEmpresas, reloadEmpresas, reloadCargo]);


  React.useEffect(() => {
    const prederminados: solicitados[] = [
      {correo: "ngaviria@estudiodemoda.com.co", nombre: "Nicolle Gaviria Mejia", estado: "En espera", fechaRespuesta: "",},
      {correo: "clbetancur@estudiodemoda.com.co", nombre: "Claudia L Betancur Gaviria", estado: "En espera", fechaRespuesta: "",},
      {correo: "aprendizgd@estudiodemoda.com.co", nombre: "Aprendiz Gestion Documental", estado: "En espera", fechaRespuesta: "",},
      {correo: "gestiondocumental@estudiodemoda.com.co", nombre: "Gloria Estela Bustamante Arango", estado: "En espera", fechaRespuesta: "",},
      {correo: "auxiliarch@estudiodemoda.com.co", nombre: "Melissa Monsalve Gutierrez", estado: "En espera", fechaRespuesta: "",},
      {correo: "vlopez@estudiodemoda.com.co", nombre: "Veronica Lopez Echavarria", estado: "En espera", fechaRespuesta: "",},
      {correo: "listo@estudiodemoda.com.co", nombre: "Linea Interna de Servicios tecnologicos", estado: "En espera", fechaRespuesta: "",},
      {correo: "cesanchez@estudiodemoda.com.co", nombre: "Cesar Eduardo Sanchez Salazar", estado: "En espera", fechaRespuesta: "",},
      {correo: "nagomez@estudiodemoda.com.co", nombre: "Nixon Alexis Gomez Cuervo", estado: "En espera", fechaRespuesta: "",},
      {correo: "gcperez@estudiodemoda.com.co", nombre: "Gloria Constanza Perez Bravo", estado: "En espera", fechaRespuesta: "",},
    ];

    setField("Solicitados", [...prederminados]);
  }, []);
  
  const handleSelectAprobador = (option: UserOption | null) => {

    if(!option){
      setSelectedAprobador(null);
      return;
    }

    const actuales: solicitados[] = Array.isArray(state.Solicitados) ? state.Solicitados : [];

    const correo = option.value ?? "";
    if(!correo){
      setSelectedAprobador(null);
      return;
    }

    // Evitar duplicados por correo
    const yaExiste = actuales.some((s) => s.correo.toLowerCase() === correo!.toLowerCase());
    if (yaExiste) {
      setSelectedAprobador(null);
      return;
    }

    const nuevo: solicitados = {
      correo,
      nombre: option.label ?? "",
      estado: "En espera",
      fechaRespuesta: "",
    };

    setField("Solicitados", [...actuales, nuevo]);
    setSelectedAprobador(null);
  };

  const handleRemoveSolicitado = (correo: string) => {
    const actuales: solicitados[] = Array.isArray(state.Solicitados)
      ? state.Solicitados
      : [];
    const next = actuales.filter(
      (s) => s.correo.toLowerCase() !== correo.toLowerCase()
    );
    setField("Solicitados", next);
  };

  const handleSelectAprobadorRenovable = async (opt: UserOption | null)=> {
    if (!opt) return;

    const correo = opt.value;
    if (!correo) return;

    // 1) Consultar si ya existe renovable para ese correo
    const existentes = await loadRenovables();

    // 2) Solo crear si realmente no hay nada
    if (!existentes || existentes.length === 0) {
      setRenovableField("Title", correo);
      setRenovableField("Nombre", opt.label ?? "");
      
      console.log("Estado renovable creado para:", correo);
      await createRenovar({Estado: "Renovar", Nombre: opt.label ?? "", Title: correo});
    }

    // 3) Luego ya haces lo que quieras en el PazSalvo
    setField("Nombre", opt.label ?? "");
  };

  const intermedio = async (opt: UserOption | null)=> {
    console.log(opt)
    if (!opt) return;
    await handleSelectAprobador(opt)
    await handleSelectAprobadorRenovable(opt!); 
  };

  const solicitarPazSalvo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!correo) {
      alert("Hay campos vacios");
      return;
    }

    // ✅ Si no está cargada, la traemos aquí
    let encuestaFinal = encuesta?.trim();
    if (!encuestaFinal) {
      const cfg = await configuraciones.get("3");
      encuestaFinal = String(cfg?.Valor ?? "").trim();
      setEncuesta(encuestaFinal);
    }

    if (!encuestaFinal) {
      alert("No se pudo cargar el link de la encuesta. Intenta de nuevo.");
      return;
    }

    const firma = await getFirmaInline();
    if (firma) {
      await handleSubmit(e, firma, correo, encuestaFinal);
    }
  };

  return (
    <div className="psf-page">
      <div className="psf-shell">
        <header className="psf-header">
          <button type="button" className="btn btn-circle btn-xs"  aria-label="Inicio" onClick={() => onBack()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 2048 2048">
              <path fill="var(--ink)" d="M2048 1088H250l787 787l-90 90L6 1024L947 83l90 90l-787 787h1798v128z"/>
            </svg>
          </button>
        </header>

        <section className="psf-card">
          <form className="psf-form" onSubmit={(e) => solicitarPazSalvo(e)}>
            {/* ====== DATOS DEL CORREO ====== */}
            <h2 className="psf-section-title">DATOS DEL CORREO</h2>

            <div className="psf-field psf-field--full">
              <label className="psf-label">
                <span className="psf-label-text" title="Selecciona unicamente cuentas de correos nombras. ej; cesanchez@estudiodemoda.com.co">
                  * Aprobadores
                  <span className="psf-info-icon" aria-hidden="true">i</span>
                </span>
              </label>
              <Select<UserOption, false>
                options={workersOptions}
                placeholder={loadingWorkers ? "Cargando opciones…" : "Buscar solicitado..."}
                value={aprobadorSelected}
                onChange={(opt) =>handleSelectAprobador(opt)}
                classNamePrefix="rs"
                isDisabled={ loadingWorkers}
                isLoading={loadingWorkers }
                noOptionsMessage={() => (usersError ? "Error cargando opciones" : "Sin coincidencias")}
                isClearable
              />
            </div>

            <div className="psf-field psf-field--full">
              <label className="psf-label">
                <span className="psf-label-text" title="Selecciona unicamente cuentas de correos genericas. ej; practicantelisto@estudiodemoda.com.co">
                  Otros Aprobadores
                  <span className="psf-info-icon" aria-hidden="true">i</span>
                </span>
              </label>
              <Select<UserOption, false>
                options={workersOptions}
                placeholder={loadingWorkers ? "Cargando opciones…" : "Buscar solicitado..."}
                value={aprobadorSelected}
                onChange={(opt) => {intermedio(opt)}}
                classNamePrefix="rs"
                isDisabled={ loadingWorkers}
                isLoading={loadingWorkers }
                noOptionsMessage={() => (usersError ? "Error cargando opciones" : "Sin coincidencias")}
                isClearable
              />
            </div>

            {/* ====== CORREOS SELECCIONADOS ====== */}
            {Array.isArray(state.Solicitados) &&
              state.Solicitados.length > 0 && (
                <div className="psf-selected">
                  <span className="psf-selected-title">
                    Correos seleccionados
                  </span>
                  <ul className="psf-selected-list">
                    {state.Solicitados.map((s) => (
                      <li className="psf-selected-item" key={s.correo}>
                        <span className="psf-selected-name">{s.nombre}</span>
                        <button type="button" className="psf-selected-remove" onClick={() => handleRemoveSolicitado(s.correo)} aria-label={`Quitar ${s.nombre}`}>
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}


            {/* ====== DATOS DEL EMPLEADO ====== */}
            <h2 className="psf-section-title psf-section-title--spaced">DATOS DEL EMPLEADO (RETIRADO)</h2>

            <div className="psf-grid">
                <div className="psf-field">
                    <label className="psf-label">* Cédula (Tercero)</label>
                    <input className="psf-input" value={state.Title} onChange={(e) =>  setField("Title", e.target.value)}/>    
                    <small className="psf-error">{errors.Title}</small>
                </div>

                <div className="psf-field">
                    <label className="psf-label"> * Nombre (Tercero) </label>
                    <input className="psf-input" value={state.Nombre} onChange={(e) =>  setField("Nombre", e.target.value)}/>
                    <small className="psf-error">{errors.Nombre}</small>
                </div>

                <div className="psf-field">
                    <label className="psf-label">* Correo electronico</label>
                    <input className="psf-input" value={correo} onChange={(e) =>  setCorreo(e.target.value)}/>    
                </div>

                <div className="psf-field">
                    <label className="psf-label"> * Fecha de ingreso</label>
                    <input type="date" className="psf-input" value={state.FechaIngreso ?? ""} onChange={(e) =>  setField("FechaIngreso", e.target.value)}/>
                    <small className="psf-error">{errors.FechaIngreso}</small>
                </div>

                <div className="psf-field">
                    <label className="psf-label">* Fecha de retiro</label>
                    <input type="date" className="psf-input" value={state.FechaSalida ?? ""} onChange={(e) =>  setField("FechaSalida", e.target.value)}/>
                    <small className="psf-error">{errors.FechaSalida}</small>
                </div>

                 <div className="psf-field">
                    <label className="psf-label"> * Jefe directo</label>
                    <Select<UserOption, false>
                      options={workersOptions}
                      placeholder={loadingWorkers ? "Cargando opciones…" : "Buscar jefe directo..."}
                      value={selectedJefe}
                      onChange={(opt) => {{setField("CorreoJefe", opt?.value ?? ""); setField("Jefe", opt?.label ??"");}}}
                      classNamePrefix="rs"
                      isDisabled={ loadingWorkers}
                      isLoading={loadingWorkers }
                      noOptionsMessage={() => (usersError ? "Error cargando opciones" : "Sin coincidencias")}
                      isClearable
                    />
                    <small className="psf-error">{errors.Jefe}</small>
                </div>

                <div className="psf-field">
                    <label className="psf-label"> * CO </label>
                    <Select<UserOption, false>
                      options={COOptions}
                      placeholder={loadingCO ? "Cargando opciones…" : "Buscar CO..."}
                      value={selectedCentroOperativo}
                      onChange={(opt) => {setField("CO", opt?.value ?? "")}}
                      classNamePrefix="rs"
                      isDisabled={ loadingCO}
                      isLoading={loadingCO }
                      noOptionsMessage={() => (usersError ? "Error cargando opciones" : "Sin coincidencias")}
                      isClearable
                    />
                    <small className="psf-error">{errors.CO}</small>
                </div>

                <div className="psf-field">
                    <label className="psf-label">* Empresa</label>
                    <Select<UserOption, false>
                      options={empresaOptions}
                      placeholder={loadingEmp ? "Cargando opciones…" : "Buscar empresas..."}
                      value={selectedEmpresa}
                      onChange={(opt) => {setField("Empresa", opt?.label ?? "");}}
                      classNamePrefix="rs"
                      isDisabled={ loadingWorkers}
                      isLoading={loadingWorkers }
                      noOptionsMessage={() => (usersError ? "Error cargando opciones" : "Sin coincidencias")}
                      isClearable
                    />
                </div>

                <div className="psf-field">
                    <label className="psf-label"> * Cargo </label>
                    <Select<UserOption, false>
                      options={cargoOptions}
                      placeholder={loadingCargo ? "Cargando opciones…" : "Buscar cargo..."}
                      value={selectedCargo}
                      onChange={(opt) => {setField("Cargo",  opt?.label ?? "");}}
                      classNamePrefix="rs"
                      isDisabled={ loadingCargo}
                      isLoading={loadingCargo }
                      noOptionsMessage={() => (usersError ? "Error cargando opciones" : "Sin coincidencias")}
                      isClearable
                    />
                    <small className="psf-error">{errors.Cargo}</small>
                </div>
            </div>

            {/* ====== Acciones ====== */}
            <div className="psf-actions">
              <button type="button" className="btn btn-xs" onClick={onBack}>
                <span className="psf-btn-arrow">←</span>
                Volver
              </button>
              <button type="submit" className="btn btn-primary btn-xs" disabled={loading}>
                {loading ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
