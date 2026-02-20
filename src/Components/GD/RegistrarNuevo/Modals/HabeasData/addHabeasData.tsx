
import * as React from "react";
import "../AddContrato.css"
import Select, { components, type OptionProps } from "react-select";
import type { desplegablesOption } from "../../../../../models/Desplegables";
import { useAuth } from "../../../../../auth/authProvider";
import { getTodayLocalISO } from "../../../../../utils/Date";
import type { HabeasData, HabeasErrors } from "../../../../../models/HabeasData";
import type { SetField } from "../Contrato/addContrato";
import { safeLower } from "../../../../../utils/text";

/* ================== Option custom para react-select ================== */
const Option = (props: OptionProps<desplegablesOption, false>) => {
  const { label } = props;

  return (
    <components.Option {...props}>
      <div className="rs-opt">
        <div className="rs-opt__text">
          <span className="rs-opt__title">{label}</span>
        </div>
      </div>
    </components.Option>
  );
};

type Props = {
  onClose: () => void;
  state: HabeasData
  setField: SetField<HabeasData>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleEdit: (e: React.FormEvent, NovedadSeleccionada: HabeasData) => void;
  errors: HabeasErrors
  loadFirstPage: () => Promise<void>
  tipo: "new" | "edit" | "view"
  selectedHabeasData?: HabeasData
  setState: (n: HabeasData) => void
  title: string

  //Desplegables
  empresaOptions: desplegablesOption[]
  loadingEmp: boolean
  tipoDocOptions: desplegablesOption[], 
  loadingTipo: boolean 

  deptoOptions: desplegablesOption[], 
  loadingDepto: boolean, 
  sending: boolean
};

/* ================== Formulario ================== */
export default function FormHabeas({sending, title, setState, selectedHabeasData, handleEdit, tipo, empresaOptions, loadingEmp, tipoDocOptions, loadingTipo, deptoOptions, loadingDepto, onClose, state, setField, handleSubmit, errors, loadFirstPage }: Props) {
  const isView = tipo === "view"

  const [selectedDepto, setSelectedDepto] = React.useState<string>("");
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>("");

  const { account } = useAuth();
  const today = getTodayLocalISO();

  /* ================== Deptos/Municipios ================== */
   const deptos = React.useMemo(() => {
    const set = new Set<string>();
    deptoOptions.forEach((i) => set.add(i.label));
    return Array.from(set).sort(); // array de deptos únicos
  }, [deptoOptions]);

  const municipiosFiltrados = React.useMemo(
    () => deptoOptions.filter((i) => i.label.toLocaleLowerCase() === selectedDepto.toLocaleLowerCase()),
    [deptoOptions, selectedDepto]
  );

  const deptoSelectOptions = React.useMemo(
    () =>
      deptos.map((d) => ({
        value: d,
        label: d,
      })),
    [deptos]
  );

  // Opciones para el select de Municipio según el depto elegido
  const municipioSelectOptions = React.useMemo(
    () =>
      municipiosFiltrados.map((m) => ({
        value: String(m.value), // Municipio
        label: String(m.value),
      })),
    [municipiosFiltrados]
  );


  React.useEffect(() => {
    if (!selectedHabeasData) return;

    setState(selectedHabeasData)
  }, [selectedHabeasData, setField]);

  React.useEffect(() => {
    if (!state.Ciudad) return;
    if (!deptoOptions.length) return;

    const match = deptoOptions.find(
      (o) => String(o.value).trim() === state.Ciudad.trim()
    );

    if (match) {
      setSelectedDepto(match.label); // Departamento
      setSelectedMunicipio(String(match.value)); // Municipio (Ciudad)
    }
  }, [state.Ciudad, deptoOptions]);

  /* ================== Selected values ================== */
  const selectedTipoDocumento = tipoDocOptions.find((o) => safeLower(o.value) === safeLower(state.AbreviacionTipoDoc)) ?? null; 
  const selectedEmpresa = empresaOptions.find((o) => safeLower(o.label)=== safeLower(state.Empresa)) ?? null;

  const handleCreateNovedad = async (e: React.FormEvent) => {
    if(tipo=== "new"){
      await handleSubmit(e);
      await loadFirstPage()
      onClose()
    } else if(tipo=== "edit") {
      handleEdit(e, selectedHabeasData!)
    }
  };

  
  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
        <h2 id="ft_title" className="ft-title">{title}</h2>

        <form className="ft-form" noValidate>

          {/* Nombre seleccionado */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="ciudad">Empresa solicitante *</label>
            <Select<desplegablesOption, false>
              inputId="solicitante"
              options={empresaOptions}
              placeholder={loadingEmp ? "Cargando opciones…" : "Buscar empresa..."}
              value={selectedEmpresa}
              onChange={(opt) => setField("Empresa", opt?.label ?? "")}
              classNamePrefix="rs"
              isDisabled={loadingEmp || isView}
              isLoading={loadingEmp}
              getOptionValue={(o) => String(o.value)}
              getOptionLabel={(o) => o.label}
              components={{ Option }}
              isClearable
            />
            <small>{errors.Empresa}</small>
          </div>

          <div className="ft-field">
            <label className="ft-label" htmlFor="nombreSeleccionado"> Nombre del seleccionado *</label>
            <input disabled={isView} id="nombreSeleccionado" name="NombreSeleccionado" type="text" placeholder="Ingrese el nombre del seleccionado" value={state.Title ?? ""} onChange={(e) => setField("Title", e.target.value.toUpperCase())} autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.Title}</small>
          </div>

          {/* ================= Tipo documento ================= */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="tipoDocumento">Tipo de documento *</label>
            <Select<desplegablesOption, false>
              inputId="tipoDocumento"
              options={tipoDocOptions}
              placeholder={loadingTipo ? "Cargando opciones…" : "Buscar tipo de documento..."}
              value={selectedTipoDocumento}
              onChange={(opt) => {setField("AbreviacionTipoDoc", opt?.value ?? ""); setField("Tipodoc", opt?.label ?? "");}}
              classNamePrefix="rs"
              isDisabled={loadingTipo || isView}
              isLoading={loadingTipo}
              getOptionValue={(o) => String(o.value)}
              getOptionLabel={(o) => o.label}
              components={{ Option }}
              menuPortalTarget={document.body}
              menuPosition="fixed"
              menuShouldBlockScroll
              isClearable
            />
            <small>{errors.Tipodoc}</small>
          </div>

          {/* Abreviación tipo documento (solo lectura con la abreviación seleccionada) */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc"> Abreviación tipo de documento *</label>
            <input disabled={isView} id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo de documento" value={state.AbreviacionTipoDoc ?? ""} readOnly/>
          </div>

          {/* Número documento */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Número de identificación *</label>
            <input  disabled={isView} id="numeroIdent" name="Numero_x0020_identificaci_x00f3_" type="number" placeholder="Ingrese el número de documento" value={state.NumeroDocumento ?? ""} onChange={(e) => setField("NumeroDocumento", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.NumeroDocumento}</small>
          </div>

          {/* Correo */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="correo">Correo electrónico *</label>
            <input  disabled={isView} id="correo" name="CORREO_x0020_ELECTRONICO_x0020_" type="email" placeholder="Ingrese el correo electrónico del seleccionado" value={state.Correo ?? ""} onChange={(e) => setField("Correo", e.target.value.toLocaleLowerCase())}
              autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.Correo}</small>
          </div>

          {/* ================= Departamento ================= */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="departamento">Departamento *</label>
            <Select<desplegablesOption, false>
              inputId="departamento"
              options={deptoSelectOptions}
              placeholder={loadingDepto ? "Cargando opciones…" : "Buscar departamento..."}
              value={selectedDepto ? { value: selectedDepto, label: selectedDepto } : null}
              onChange={(opt) => {
                const value = opt?.value ?? "";
                setSelectedDepto(value.toUpperCase());
                setSelectedMunicipio("");           
              }}
              classNamePrefix="rs"
              isDisabled={loadingDepto}
              isLoading={loadingDepto}
              getOptionValue={(o) => String(o.value)}
              getOptionLabel={(o) => o.label}
              components={{ Option }}
              isClearable
              menuPortalTarget={document.body}
              menuPosition="fixed"
              menuShouldBlockScroll
            />
            <small>{errors.Ciudad}</small>
          </div>

          {/* ================= Ciudad ================= */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="ciudad">Ciudad *</label>
            <Select<desplegablesOption, false>
              inputId="ciudad"
              options={municipioSelectOptions}
              placeholder={!selectedDepto ? "Selecciona un departamento..." : loadingDepto ? "Cargando municipios…" : "Selecciona un municipio..."}
              value={ selectedMunicipio ? { value: selectedMunicipio, label: selectedMunicipio } : state.Ciudad ? { value: state.Ciudad, label: state.Ciudad } : null}
              onChange={(opt) => {
                const value = opt?.value ?? "";
                setSelectedMunicipio(value);
                setField("Ciudad", value.toUpperCase());          
              }}
              classNamePrefix="rs"
              isDisabled={!selectedDepto  || loadingDepto}
              isLoading={loadingDepto}
              getOptionValue={(o) => String(o.value)}
              getOptionLabel={(o) => o.label}
              components={{ Option }}
              isClearable
              menuPortalTarget={document.body}
              menuPosition="fixed"
              menuShouldBlockScroll
            />
            <small>{errors.Ciudad}</small>
          </div>

          {/* Fecha reporte ingreso */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="FechaReporte"> Fecha reporte ingreso *</label>
            <input  disabled={isView} id="FechaReporte" name="FechaReporte" type="date" value={today} readOnly/>
          </div>

          {/* Informacion enviada por */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="enviadaPor"> Información enviada por *</label>
            <input  disabled={isView} id="enviadaPor" name="enviadaPor" type="text" value={account?.name} readOnly/>
          </div>
        </form>

        {/* Acciones */}
        <div className="ft-actions">
          <button disabled={isView || sending} type="button" className="btn btn-primary btn-xs" onClick={(e) => handleCreateNovedad(e)}>
            {isView ? "No se puede editar este registro ya que fue usado" : sending ? "Guardando..." : "Guardar"}
          </button> 
          <button type="button" className="btn btn-xs" onClick={onClose}>Cancelar</button>
        </div>

      </section>
    </div>
  );
}

