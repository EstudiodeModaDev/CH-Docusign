import React from "react";
import "./SendDocument.css";
import { useDocusignTemplates } from "../../Funcionalidades/Docusign";
import { useGraphServices } from "../../graph/graphContext";
import { useEnvios } from "../../Funcionalidades/Envios";
import { usePromocion } from "../../Funcionalidades/Promocion";
import { ElegirColaboradorModal } from "./ModalSelect/ModalSelect";
import { useHabeasData } from "../../Funcionalidades/HabeasData";
import { useContratos } from "../../Funcionalidades/Contratos";
import { getEnvelopeDocGenFormFields, getEnvelopeDocumentTabs, sendEnvelope, updateEnvelopeDocGenFormFields, updateEnvelopePrefillTextTabs, updateEnvelopeRecipients, type DocGenUpdateDocPayload, type DocusignRecipient, type UpdatePrefillTextTabPayload,} from "../../Services/DocusignAPI.service";
import { formatPesosEsCO } from "../../utils/Number";
import type { Promocion } from "../../models/Promociones";
import type { Novedad } from "../../models/Novedades";
import type { HabeasData } from "../../models/HabeasData";
import type { Cesacion } from "../../models/Cesaciones";
import { useCesaciones } from "../../Funcionalidades/Cesaciones";
import { spDateToDDMMYYYY } from "../../utils/Date";

export type Proceso = "Promocion" | "Habeas" | "Nuevo" | "Cesacion";

type DocuSignVM = {
  nombre: string;
  fechaIngreso: string;
  cargo: string;
  ciudad: string;
  conectividadLetras: string;
  conectividadValor: string;
  garantizadoValor: string;
  garantizadoLetras: string;
  identificacion: string;
  salarioLetras: string;
  salarioValor: string;
  tipoDoc: string;
  tipoDocCorto: string;
  tipoTel: string;
  universidad: string;
  nitUniversidad: string;
  fechaNac: string;
  coordinador: string;
  especialidad: string;
  fechaInicioLectiva: string;
  fechaFinalLectiva: string;
  fechaInicioProductiva: string;
  fechaFinalProductiva: string;
  etapa: string;
  fechaFinal: string
};

const emptyVM = (): DocuSignVM => ({
  nombre: "",
  fechaIngreso: "",
  cargo: "",
  ciudad: "",
  conectividadLetras: "",
  conectividadValor: "",
  garantizadoValor: "",
  garantizadoLetras: "",
  identificacion: "",
  salarioLetras: "",
  salarioValor: "",
  tipoDoc: "",
  tipoDocCorto: "",
  tipoTel: "",
  coordinador: "",
  especialidad: "",
  etapa: "",
  fechaFinalLectiva: "",
  fechaFinalProductiva: "",
  fechaInicioLectiva: "",
  fechaInicioProductiva: "",
  fechaNac: "",
  nitUniversidad: "",
  universidad: "",
  fechaFinal: ""
});

export function mapPromocionToVM(p: Promocion): DocuSignVM {
  return {
    ...emptyVM(),
    nombre: p.NombreSeleccionado ?? "",
    fechaIngreso: p.FechaIngreso ?? "",
    cargo: p.Cargo ?? "",
    ciudad: p.Ciudad ?? "",
    conectividadLetras: p.AuxilioTexto ?? "",
    conectividadValor: p.AuxilioValor ?? "",
    garantizadoValor: p.ValorGarantizado ?? "",
    garantizadoLetras: p.GarantizadoLetras ?? "",
    identificacion: p.NumeroDoc ?? "",
    salarioLetras: p.SalarioTexto ?? "",
    salarioValor: p.Salario ?? "",
    tipoDoc: p.TipoDoc ?? "",
    tipoDocCorto: p.AbreviacionTipoDoc ?? "",
    tipoTel: p.ModalidadTeletrabajo ?? "",
  };
}

export function mapNovedadToVM(n: Novedad): DocuSignVM {
  return {
    ...emptyVM(),
    nombre: n.NombreSeleccionado ?? "",
    fechaIngreso: n.FECHA_x0020_REQUERIDA_x0020_PARA0 ?? "",
    cargo: n.CARGO ?? "",
    ciudad: n.CIUDAD ?? "",
    conectividadLetras: n.auxconectividadtexto ?? "",
    conectividadValor: n.auxconectividadvalor ?? "",
    garantizadoValor: n.VALOR_x0020_GARANTIZADO ?? "",
    garantizadoLetras: n.Garantizado_x0020_en_x0020_letra ?? "",
    identificacion: n.Numero_x0020_identificaci_x00f3_ ?? "",
    salarioLetras: n.salariotexto ?? "",
    salarioValor: n.SALARIO ?? "",
    tipoDoc: n.tipodoc ?? "",
    tipoDocCorto: n.Tipo_x0020_de_x0020_documento_x0 ?? "",
    tipoTel: n.MODALIDAD_x0020_TELETRABAJO ?? "",
    coordinador: n.Coordinadordepracticas,
    especialidad: n.Coordinadordepracticas,
    etapa: n.Etapa,
    fechaFinalLectiva: spDateToDDMMYYYY(n.FechaFinalLectiva),
    fechaFinalProductiva: spDateToDDMMYYYY(n.FechaFinalProductiva),
    fechaInicioLectiva: spDateToDDMMYYYY(n.FechaInicioLectiva),
    fechaInicioProductiva: spDateToDDMMYYYY(n.FechaInicioProductiva),
    fechaNac: spDateToDDMMYYYY(n.FechaNac),
    fechaFinal: spDateToDDMMYYYY(n.FECHA_x0020_REQUERIDA_x0020_PARA0),
    nitUniversidad: n.NitUniversidad,
    universidad: n.Universidad
  };
}

export function mapHabeasToVM(h: HabeasData): DocuSignVM {
  return {
    ...emptyVM(),
    nombre: h.Title ?? "",
    identificacion: h.NumeroDocumento ?? "",
    tipoDoc: h.Tipodoc ?? "",
    tipoDocCorto: h.AbreviacionTipoDoc ?? "",
    ciudad: h.Ciudad ?? "",
  };
}

export function mapCesacionToVM(p: Cesacion): DocuSignVM {
  return {
    ...emptyVM(),
    nombre: p.Nombre ?? "",
    fechaIngreso: p.FechaIngreso ?? "",
    cargo: p.Cargo ?? "",
    ciudad: p.Ciudad ?? "",
    conectividadLetras: p.auxConectividadValor ?? "",
    conectividadValor: p.auxConectividadValor ?? "",
    identificacion: p.Title ?? "",
    salarioLetras: p.SalarioTexto ?? "",
    salarioValor: p.Salario ?? "",
    tipoDoc: p.TipoDoc ?? "",
  };
}

export function toDocuSignVM(proceso: Proceso, data: Promocion | Novedad | HabeasData | Cesacion): DocuSignVM {
  switch (proceso) {
    case "Promocion":
      return mapPromocionToVM(data as Promocion);
    case "Nuevo":
      return mapNovedadToVM(data as Novedad);
    case "Habeas":
      return mapHabeasToVM(data as HabeasData);
    case "Cesacion":
      return mapCesacionToVM(data as Cesacion)
  }
}

export interface EnviarFormatoValues {
  cedula?: string;
  nombre?: string;
  correo?: string;
  formato?: string;
  formatoId: string;
}

const EnviarFormatoCard: React.FC = () => {
  const [templateId, setTemplateId] = React.useState<string>("");
  const [envelopeId, setEnvelopeId] = React.useState<string>("");
  const [segundoPaso, setSegundoPaso] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [proceso, setProceso] = React.useState<Proceso | "">("");
  const [signers, setSigners] = React.useState<DocusignRecipient[]>([]);
  const [varColaborador, setVarColaborador] = React.useState<Promocion | Novedad | HabeasData | Cesacion |null>(null);
  const [elegir, setElegir] = React.useState<boolean>(false);
  const { templatesOptions, createdraft, getRecipients } = useDocusignTemplates();
  const { Envios, Promociones, HabeasData, Contratos, Cesaciones } = useGraphServices();
  const { state, setField, handleSubmit: crearRegistro } = useEnvios(Envios);
  const { searchWorker: searchWorkerHabeas, workers: workersHabeas, workersOptions: workerOptionsHabeas,} = useHabeasData(HabeasData);
  const { searchWorker: searchWorkerContratos, workers: workersContratos, workersOptions: workerOptionsContratos,} = useContratos(Contratos);
  const { searchWorker, workers, workersOptions } = usePromocion(Promociones);
  const { searchWorker: searchWorkerCesacion, workersOptions: workerOptionsCesaciones } = useCesaciones(Cesaciones)
  const plantillaSelected = templatesOptions.find((o) => o.value === templateId) ?? null;

  const vm = React.useMemo(() => {
    if (!proceso || !varColaborador) return null;
    return toDocuSignVM(proceso as Proceso, varColaborador);
  }, [proceso, varColaborador]);

  const pickValueFromLabel = (raw: string, vm: DocuSignVM) => {
    const label = (raw ?? "").trim().toLowerCase();
    switch (label) {
      case "nombre":
      case "nombre_de_la_persona":
        return vm.nombre;

      case "fechacomp":
      case "fecha_de_ingreso":
      case "fechaingreso":
        return vm.fechaIngreso;

      case "cargo":
        return vm.cargo;

      case "ciudad":
        return vm.ciudad;

      case "conectividad_en_letras":
      case "auxconectividadletras":
        return vm.conectividadLetras;

      case "conectividad_valor":
      case "auxconectividadnumero":
      case "auxconectividadnu":
      case "auxconectividad":
        return formatPesosEsCO(vm.conectividadValor);

      case "garantizado_valor":
      case "garantizadonumero":
      case "garantizadonu":
        return formatPesosEsCO(vm.garantizadoValor);

      case "garantizado":
      case "garantizadoletras":
      case "garantizadoalfabetico":
        return vm.garantizadoLetras;

      case "identificaci_n":
      case "identificación":
      case "numerodoc":
        return vm.identificacion;

      case "salario_en_letras":
      case "salarioletras":
        return vm.salarioLetras;

      case "salario_valor":
      case "salario":
        return formatPesosEsCO(vm.salarioValor);

      case "tipo_de_documento":
      case "tipodoc":
        return vm.tipoDoc;

      case "tipodoccort":
        return vm.tipoDocCorto;

      case "universidad":
        return vm.universidad;

      case "nituniversidad":
        return vm.nitUniversidad;

      case "coordinadorpracticas":
        return vm.coordinador;

      case "fechanac":
        return vm.fechaNac;

      case "fechafin":
        return vm.fechaFinal;

      case "fechainiciolectiva":
        return vm.fechaInicioLectiva;

      case "fechafinallectiva":
        return vm.fechaFinalLectiva;

      case "fechainicioproductiva":
        return vm.fechaInicioProductiva;

      case "fechafinalproductiva":
        return vm.fechaFinalProductiva;

      case "etapa":
        return vm.etapa;

      case "especialidad":
        return vm.especialidad;

      case "tipotel":
        return vm.tipoTel;

      default:
        return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proceso) {
      alert("Selecciona un proceso.");
      return;
    }
    if (!templateId) {
      alert("Selecciona un formato.");
      return;
    }
    if (!state.Cedula || !state.Receptor || !state.CorreoReceptor) {
      alert("Por favor completa todos los campos.");
      return; 
    }
    if (!varColaborador) {
      alert("No se encontró información del colaborador.");
      return;
    }

    setLoading(true);

    try {
      const draft = await createdraft(templateId);
      setEnvelopeId(draft.envelopeId);

      const signersResp = await getRecipients(draft.envelopeId);
      setSigners(signersResp);

      const documentTabs = await getEnvelopeDocumentTabs(draft.envelopeId, "1");
      const prefillTextTabs = documentTabs.prefillTabs?.textTabs ?? [];

      const docGen = await getEnvelopeDocGenFormFields(draft.envelopeId);
      const firstDoc = docGen.docGenFormFields?.[0];

      const vm = toDocuSignVM(proceso as Proceso, varColaborador);

      const prefillUpdates: UpdatePrefillTextTabPayload[] = prefillTextTabs
        .map((t) => {
          const value = pickValueFromLabel(t.tabLabel ?? "", vm);
          if (!t.tabId) return null;
          return { tabId: t.tabId, value };
        })
        .filter((x): x is UpdatePrefillTextTabPayload => x !== null);

      if (prefillUpdates.length > 0) {
        await updateEnvelopePrefillTextTabs(draft.envelopeId, "1", prefillUpdates);
      }

      if (firstDoc) {
        const docGenPayload: DocGenUpdateDocPayload[] = [
          {
            documentId: firstDoc.documentId,
            fields: firstDoc.docGenFormFieldList.map((f) => {
              const value = pickValueFromLabel(f.name ?? "", vm);
              return { name: f.name, value };
            }),
          },
        ];
        await updateEnvelopeDocGenFormFields(draft.envelopeId, docGenPayload);
      }

      setField("IdSobre", draft.envelopeId);
      setField("Title", plantillaSelected?.label ?? "");
      setSegundoPaso(true);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error creando el sobre. Revisa consola.");
    } finally {
      setLoading(false);
    }
  };

  const handleLookWorker = async (query: string) => {
    if (query.length < 5) return;
    if (!proceso) return;

    let results: any[] = [];
    let cantidad = 0;

    switch (proceso) {
      case "Promocion":
        results = await searchWorker(query);
        cantidad = results.length;

        if (cantidad === 0) {
          alert("No se encontró el colaborador");
        } else if (cantidad === 1) {
          const unico = results[0] as Promocion;
          setVarColaborador(unico);

          setField("CorreoReceptor", unico.Correo ?? unico.Email ?? "");
          setField("Receptor", unico.NombreSeleccionado ?? "");
          setField("Fuente", "Promocion");
          setField("Cedula", unico.NumeroDoc ?? "");
          setField("Compa_x00f1_ia", unico.EmpresaSolicitante ?? "");
          setField("Estado", "Enviado");
          setField("ID_Novedad", unico.Id ?? "");
        } else {
          setElegir(true);
        }
        break;

      case "Cesacion":
        results = await searchWorkerCesacion(query);
        cantidad = results.length;

        if (cantidad === 0) {
          alert("No se encontró el colaborador");
        } else if (cantidad === 1) {
          const unico = results[0] as Cesacion;
          setVarColaborador(unico);

          setField("CorreoReceptor", unico.Correoelectronico ?? "");
          setField("Receptor", unico.Nombre ?? "");
          setField("Fuente", "Cesación");
          setField("Cedula", unico.Title ?? "");
          setField("Compa_x00f1_ia", unico.Empresaalaquepertenece ?? "");
          setField("Estado", "Enviado");
          setField("ID_Novedad", unico.Id ?? "");
        } else {
          setElegir(true);
        }
        break;

      case "Habeas":
        results = await searchWorkerHabeas(query);
        cantidad = results.length;

        if (cantidad === 0) {
          alert("No se encontró el colaborador");
        } else if (cantidad === 1) {
          const unico = results[0] as HabeasData;
          setVarColaborador(unico);

          setField("CorreoReceptor", unico.Correo ?? "");
          setField("Receptor", unico.Title ?? "");
          setField("Fuente", "Habeas");
          setField("Cedula", unico.NumeroDocumento ?? "");
          setField("Compa_x00f1_ia", unico.Empresa ?? "");
          setField("Estado", "Enviado");
          setField("ID_Novedad", unico.Id ?? "");
        } else {
          setElegir(true);
        }
        break;

      case "Nuevo":
        results = await searchWorkerContratos(query);
        cantidad = results.length;

        if (cantidad === 0) {
          alert("No se encontró el colaborador");
        } else if (cantidad === 1) {
          const unico = results[0] as Novedad;
          setVarColaborador(unico);

          setField("CorreoReceptor", unico.CORREO_x0020_ELECTRONICO_x0020_ ?? "");
          setField("Receptor", unico.NombreSeleccionado ?? "");
          setField("Fuente", "Novedades");
          setField("Cedula", unico.Numero_x0020_identificaci_x00f3_ ?? "");
          setField("Compa_x00f1_ia", unico.Empresa_x0020_que_x0020_solicita ?? "");
          setField("Estado", "Enviado");
          setField("ID_Novedad", unico.Id ?? "");
        } else {
          setElegir(true);
        }
        break;
    }
  };

  const handleConfirmWorker = (selectedId: string) => {
    if (!proceso) return;

    switch (proceso) {
      case "Promocion": {
        const seleccionado = workers.find((w: any) => w.Id === selectedId) as Promocion | undefined;
        if (!seleccionado) return;

        setVarColaborador(seleccionado);
        setField("CorreoReceptor", (seleccionado.Correo ?? seleccionado.Email) ?? "");
        setField("Receptor", seleccionado.NombreSeleccionado ?? "");
        setField("Fuente", "Promocion");
        setField("Cedula", seleccionado.NumeroDoc ?? "");
        setField("Compa_x00f1_ia", seleccionado.EmpresaSolicitante ?? "");
        setField("Estado", "Enviado");
        setField("ID_Novedad", seleccionado.Id ?? "");
        setElegir(false);
        break;
      }

      case "Habeas": {
        const seleccionado = workersHabeas.find((w: any) => w.Id === selectedId) as HabeasData | undefined;
        if (!seleccionado) return;

        setVarColaborador(seleccionado);
        setField("CorreoReceptor", seleccionado.Correo ?? "");
        setField("Receptor", seleccionado.Title ?? "");
        setField("Fuente", "Habeas");
        setField("Cedula", seleccionado.NumeroDocumento ?? "");
        setField("Compa_x00f1_ia", seleccionado.Empresa ?? "");
        setField("Estado", "Enviado");
        setField("ID_Novedad", seleccionado.Id ?? "");
        setElegir(false);
        break;
      }

      case "Nuevo": {
        const seleccionado = workersContratos.find((w: any) => w.Id === selectedId) as Novedad | undefined;
        if (!seleccionado) return;

        setVarColaborador(seleccionado);
        setField("CorreoReceptor", seleccionado.CORREO_x0020_ELECTRONICO_x0020_ ?? "");
        setField("Receptor", seleccionado.NombreSeleccionado ?? "");
        setField("Fuente", "Novedades");
        setField("Cedula", seleccionado.Numero_x0020_identificaci_x00f3_ ?? "");
        setField("Compa_x00f1_ia", seleccionado.Empresa_x0020_que_x0020_solicita ?? "");
        setField("Estado", "Enviado");
        setField("ID_Novedad", seleccionado.Id ?? "");
        setElegir(false);
        break;
      }
    }
  };

  const handleChangeSigner = (index: number, updated: Partial<DocusignRecipient>) => {
    setSigners((prev) => prev.map((s, i) => (i === index ? { ...s, ...updated } : s)));
  };

  const handleSendEnvolope = async () => {
    try {
      const recipients = await updateEnvelopeRecipients(envelopeId, { signers });
      setField("Recipients", JSON.stringify(recipients.signers));
      await sendEnvelope(envelopeId);
      crearRegistro();
      alert("Se ha enviado con exito el sobre");
    } catch (err) {
      console.error(err);
      alert("Ha ocurrido un error por favor vuelva a intentarlo");
      setLoading(false);
    }
  };

  const disabled = !proceso;

  return (
    <div className="ef-page">
      <div className="ef-card">
        <form onSubmit={handleSubmit} className="ef-form">
          <div className="ef-field">
            <label className="ef-label" htmlFor="proceso"> ¿Que clase de proceso hara? </label>
            <select id="proceso" className="ef-input" value={proceso} onChange={(e) => setProceso(e.target.value as Proceso | "")}>
              <option value="">Selecciona un formato</option>
              <option value="Nuevo">Nuevo ingreso</option>
              <option value="Promocion">Promocion</option>
              <option value="Habeas">Habeas Data</option>
              <option value="Cesacion">Cesación</option>
            </select>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="cedula"> Cédula del receptor </label>
            <input id="cedula" type="number" className="ef-input" disabled={disabled} value={state.Cedula} onBlur={(e) => handleLookWorker(e.target.value)} onChange={(e) => setField("Cedula", e.target.value)}/>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="nombre"> Nombre del receptor </label>
            <input id="nombre" type="text" className="ef-input" disabled={disabled} value={state.Receptor} onChange={(e) => setField("Receptor", e.target.value)}/>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="correo"> Correo del receptor </label>
            <input id="correo" type="email" className="ef-input" disabled={disabled} value={state.CorreoReceptor} onChange={(e) => setField("CorreoReceptor", e.target.value)}/>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="formato"> ¿Qué formato se va a enviar? </label>
            <select id="formato" className="ef-input" disabled={disabled} value={plantillaSelected?.value ?? ""} onChange={(e) => {
                                                                                                                    const newTemplateId = e.target.value;
                                                                                                                    setTemplateId(newTemplateId);

                                                                                                                    const sel = templatesOptions.find((o) => o.value === newTemplateId);
                                                                                                                    setField("Title", sel?.label ?? "");
                                                                                                                  }}>
              <option value="">Selecciona un formato</option>
              {templatesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ef-actions">
            <button type="submit" className="btn btn-primary-final btn-xs" disabled={disabled || loading}>
              {loading ? "Cargando" : "Siguiente"}
            </button>
          </div>
        </form>
      </div>

      <ElegirColaboradorModal open={elegir} onClose={() => setElegir(false)} onConfirm={handleConfirmWorker} options={
                                                                                                              proceso === "Promocion" ? workersOptions
                                                                                                                : proceso === "Habeas"? workerOptionsHabeas
                                                                                                                : proceso === "Nuevo" ? workerOptionsContratos
                                                                                                                : proceso === "Cesacion" ? workerOptionsCesaciones:
                                                                                                                workersOptions
                                                                                                            }/>

      <SignersModal open={segundoPaso} signers={signers} onClose={() => setSegundoPaso(false)} onChangeSigner={handleChangeSigner} onSave={handleSendEnvolope} vm={vm} vmEmail={state.CorreoReceptor ?? ""}/>
    </div>
  );
};

type SignersModalProps = {
  open: boolean;
  signers: DocusignRecipient[];
  onChangeSigner?: (index: number, updated: Partial<DocusignRecipient>) => void;
  onClose: () => void;
  onSave?: () => void;
  vm: DocuSignVM | null;
  vmEmail: string;
};
export const SignersModal: React.FC<SignersModalProps> = ({open, signers, onChangeSigner, onClose, onSave, vm, vmEmail}) => {
  const [sending, setSending] = React.useState<boolean>(false);

  if (!open) return null;

  const handleChange = (index: number, field: keyof DocusignRecipient) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChangeSigner) return;
      onChangeSigner(index, { [field]: e.target.value });
  };

  return (
    <div className="signers-modal-backdrop">
      <div className="signers-modal">
        <div className="signers-modal-header">
          <h2 className="signers-modal-title">Firmantes del sobre</h2>
          <button type="button" className="signers-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="signers-modal-body">
          <div className="signers-wrapper">
            {signers.length === 0 && <p className="signers-empty">No hay firmantes asignados.</p>}

            {signers.map((signer, idx) => {
              const autoName = vm?.nombre ?? "";
              const autoEmail = vmEmail ?? "";

              // el check está "true" si ya coincide con el VM
              const isFilledFromVM =
                !!vm &&
                (signer.name ?? "") === autoName &&
                (signer.email ?? "") === autoEmail;

              return (
                <div key={signer.recipientId ?? idx} className="signer-card">
                  <div className="signer-header">
                    <span className="signer-index">Firmante {idx + 1}</span>
                    {signer.roleName && <span className="signer-role">{signer.roleName}</span>}
                  </div>

                  <div className="signer-body">
                    <div className="signer-field">
                      <label className="signer-label">Nombre</label>
                      <input className="signer-input" type="text" value={signer.name ?? ""} onChange={handleChange(idx, "name")} placeholder="Nombre del firmante"/>
                    </div>

                    <div className="signer-field">
                      <label className="signer-label">Correo electrónico</label>
                      <input className="signer-input" type="email" value={signer.email ?? ""} onChange={handleChange(idx, "email")} placeholder="correo@ejemplo.com"/>
                    </div>

                    {/* ✅ CHECK: al marcar => llena con VM; al desmarcar => limpia */}
                    <label className="signer-check">
                      <input className="signer-check__input" type="checkbox" disabled={!vm || !onChangeSigner} checked={isFilledFromVM} onChange={(e) => {
                                                                                                                                                    if (!onChangeSigner) return;

                                                                                                                                                    if (e.target.checked) {
                                                                                                                                                      onChangeSigner(idx, {
                                                                                                                                                        name: autoName,
                                                                                                                                                        email: autoEmail,
                                                                                                                                                      });
                                                                                                                                                    } else {
                                                                                                                                                      onChangeSigner(idx, {
                                                                                                                                                        name: "",
                                                                                                                                                        email: "",
                                                                                                                                                      });
                                                                                                                                                    }
                                                                                                                                                  }}
                                                                                                                                                />
                      <span className="signer-check__text">
                        Usar datos del colaborador
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="signers-modal-footer">
          <button type="button" className="btn btn-secondary btn-xs" disabled={sending} onClick={onClose}>
            Cancelar
          </button>

          {onSave && (
            <button type="button" className="btn btn-primary-final btn-xs" disabled={sending} onClick={async () => {
                                                                                                        setSending(true);
                                                                                                        try {
                                                                                                          await onSave();
                                                                                                          onClose();
                                                                                                        } finally {
                                                                                                          setSending(false);
                                                                                                        }
                                                                                                      }}>
              {sending ? "Enviando sobre..." : "Guardar cambios"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnviarFormatoCard;
