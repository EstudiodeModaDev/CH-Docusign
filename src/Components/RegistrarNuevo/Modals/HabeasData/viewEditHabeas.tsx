import * as React from "react";
import "../AddContrato.css";
import Select, { components, type OptionProps } from "react-select";
import { useGraphServices } from "../../../../graph/graphContext";
import type { desplegablesOption } from "../../../../models/Desplegables";
import {useCargo, useDeptosMunicipios, useTipoDocumentoSelect,} from "../../../../Funcionalidades/Desplegables";
import { useAuth } from "../../../../auth/authProvider";
import { getTodayLocalISO } from "../../../../utils/Date";
import { useHabeasData } from "../../../../Funcionalidades/HabeasData";
import type { HabeasData } from "../../../../models/HabeasData";

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
  selectedHabeas: HabeasData;
  tipo: string;
};

/* ================== Formulario ================== */
export default function ViewHabeas({ onClose, selectedHabeas, tipo }: Props) {
  const { Maestro, HabeasData, DeptosYMunicipios } = useGraphServices();
  const { options: tipoDocOptions, loading: loadingTipo, reload: reloadTipoDoc} = useTipoDocumentoSelect(Maestro);
  const { loading: loadingCargo, reload: reloadCargo} = useCargo(Maestro);
  const { options: deptoOptions, loading: loadingDepto, reload: reloadDeptos} = useDeptosMunicipios(DeptosYMunicipios);
  const { state, setField, errors, handleEdit, cleanState} = useHabeasData(HabeasData);
  const [selectedDepto, setSelectedDepto] = React.useState<string>("");
  const [selectedMunicipio, setSelectedMunicipio] = React.useState<string>();
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!selectedHabeas) return;
    if (initialized) return; // ya llenamos los campos una vez

    setField("Id", selectedHabeas?.Id ?? "");
    setField("AbreviacionTipoDoc", selectedHabeas?.AbreviacionTipoDoc ?? "");
    setField("Ciudad", selectedHabeas?.Ciudad ?? "");
    setField("Correo", selectedHabeas?.Correo ?? "");
    setField("Fechaenlaquesereporta", selectedHabeas?.Fechaenlaquesereporta ?? "");
    setField("Informacionreportadapor", selectedHabeas?.Informacionreportadapor ?? "");
    setField("NumeroDocumento", selectedHabeas?.NumeroDocumento ?? "");
    setField("Tipodoc", selectedHabeas?.Tipodoc ?? "");
    setField("Title", selectedHabeas?.Title ?? "");

    setInitialized(true);
  }, [selectedHabeas, initialized, setField]);

  React.useEffect(() => {
      reloadTipoDoc();
      reloadCargo();
      reloadDeptos()
  }, [reloadDeptos, reloadTipoDoc, reloadCargo,]);

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

  const deptos = React.useMemo(() => {
    const set = new Set<string>();
    deptoOptions.forEach((i) => set.add(i.label));
    return Array.from(set).sort();
  }, [deptoOptions]);

  const municipiosFiltrados = React.useMemo(
    () => deptoOptions.filter((i) => i.label === selectedDepto),
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
  const selectedTipoDocumento = tipoDocOptions.find((o) => o.label === state.Tipodoc.trim()) ?? null;

  const isView = tipo === "view";

  const { account } = useAuth();
  const today = getTodayLocalISO();

  const handleCreatePromotion = async () => {
    await handleEdit(selectedHabeas);
    cleanState();
    onClose()
  };

  return (
    <div className="ft-modal-backdrop">
      <section className="ft-scope ft-card" role="region" aria-labelledby="ft_title">
        <h2 id="ft_title" className="ft-title">Datos de {selectedHabeas.Title}</h2>
        
        <form className="ft-form" noValidate>
          {/* ================= Tipo documento ================= */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="tipoDocumento"> Tipo de documento * </label>
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
              isClearable
            />
            <small>{errors.Tipodoc}</small>
          </div>

          {/* Abreviación tipo documento (solo lectura con la abreviación seleccionada) */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="abreviacionDoc">Abreviación tipo de documento *</label>
            <input id="abreviacionDoc" name="abreviacionDoc" type="text" placeholder="Seleccione un tipo de documento" value={state.AbreviacionTipoDoc ?? ""} readOnly disabled={isView}/>
          </div>

          {/* Número documento */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="numeroIdent">Número de identificación * </label>
            <input id="numeroIdent" name="Numero_x0020_identificaci_x00f3_" type="number" placeholder="Ingrese el número de documento" value={state.NumeroDocumento ?? ""} onChange={(e) => setField("NumeroDocumento", e.target.value)}
              autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
            <small>{errors.NumeroDocumento}</small>
          </div>

          {/* Nombre seleccionado */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="nombreSeleccionado">Nombre del seleccionado *</label>
            <input id="nombreSeleccionado" name="NombreSeleccionado" type="text" disabled={isView} placeholder="Ingrese el nombre del seleccionado" value={state.Title ?? ""}
              onChange={(e) => setField("Title", e.target.value)} autoComplete="off" required aria-required="true" maxLength={300}/>
            <small>{errors.Title}</small>
          </div>

          {/* Correo */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="correo">Correo electrónico *</label>
            <input id="correo" name="CORREO_x0020_ELECTRONICO_x0020_" type="email" placeholder="Ingrese el correo electrónico del seleccionado" value={state.Correo ?? ""}
              onChange={(e) => setField("Correo", e.target.value)} autoComplete="off" required aria-required="true" maxLength={300} disabled={isView}/>
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
              onChange={(opt) => {const value = opt?.value ?? ""; setSelectedDepto(value); setSelectedMunicipio("");}}
              classNamePrefix="rs"
              isDisabled={loadingDepto || isView}
              isLoading={loadingDepto}
              getOptionValue={(o) => String(o.value)}
              getOptionLabel={(o) => o.label}
              components={{ Option }}
              isClearable
            />
            <small>{errors.Ciudad}</small>
          </div>

          {/* ================= Ciudad ================= */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="ciudad">Ciudad * </label>
            <Select<desplegablesOption, false>
              inputId="ciudad"
              options={municipioSelectOptions}
              placeholder={!selectedDepto ? "Selecciona un departamento..." : loadingDepto ? "Cargando municipios…" : "Selecciona un municipio..."}
              value={selectedMunicipio ? { value: selectedMunicipio, label: selectedMunicipio } : state.Ciudad ? { value: state.Ciudad, label: state.Ciudad } : null}
              onChange={(opt) => {const value = opt?.value ?? ""; setSelectedMunicipio(value); setField("Ciudad", value);}}
              classNamePrefix="rs"
              isDisabled={!selectedDepto || loadingDepto || isView}
              isLoading={loadingCargo}
              getOptionValue={(o) => String(o.value)}
              getOptionLabel={(o) => o.label}
              components={{ Option }}
              isClearable
            />
            <small>{errors.Ciudad}</small>
          </div>

          {/* Fecha reporte ingreso */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="FechaReporte">Fecha reporte *</label>
            <input id="FechaReporte" name="FechaReporte" type="date" value={today} readOnly/>
          </div>

          {/* Informacion enviada por */}
          <div className="ft-field">
            <label className="ft-label" htmlFor="enviadaPor">Información enviada por * </label>
            <input id="enviadaPor" name="enviadaPor" type="text" value={account?.name} readOnly/>
          </div>
        </form>

        {/* Acciones */}
        <div className="ft-actions">
          {!isView ? (
            <button type="submit" className="btn btn-primary btn-xs" onClick={() => {handleCreatePromotion();}}>
              Guardar Registro
            </button>
          ) : (
            <small>Este registro ya ha sido usado, no puede ser editado</small>
          )}
          <button type="submit" className="btn btn-xs" onClick={() => onClose()} >
            Cancelar
          </button>
        </div>
      </section>
    </div>
  );
}
