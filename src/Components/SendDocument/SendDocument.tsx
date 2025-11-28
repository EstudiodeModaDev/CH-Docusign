import React from "react";
import "./SendDocument.css";
import { useDocusignTemplates } from "../../Funcionalidades/Docusign";
import { useGraphServices } from "../../graph/graphContext";
import { useEnvios } from "../../Funcionalidades/Envios";
import { usePromocion } from "../../Funcionalidades/Promocion";
import { ElegirColaboradorModal } from "./ModalSelect/ModalSelect";
import { useHabeasData } from "../../Funcionalidades/HabeasData";
import { useContratos } from "../../Funcionalidades/Contratos";
import { getEnvelopeDocGenFormFields, getEnvelopeDocumentTabs, sendEnvelope, updateEnvelopeDocGenFormFields, updateEnvelopePrefillTextTabs, updateEnvelopeRecipients,
  type DocGenUpdateDocPayload, type DocusignRecipient, type UpdatePrefillTextTabPayload } from "../../Services/DocusignAPI.service";
import { formatPesosEsCO } from "../../utils/Number";

export interface EnviarFormatoValues {
  cedula?: string;
  nombre?: string;
  correo?: string;
  formato?: string;
  formatoId: string;
}

const EnviarFormatoCard: React.FC = () => {
  const [templateId, setTemplateId] = React.useState<string>("")
  const [envelopeId, setEnvelopeId] = React.useState<string>("")
  const [segundoPaso, setSegundoPaso] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [proceso, setProceso] = React.useState<string>("")
  const [signers, setSigners] = React.useState<DocusignRecipient[]>([])
  const [varColaborador, setVarColaborador] = React.useState<any | null>(null)
  const [elegir, setElegir] = React.useState<boolean>(false)
  const { templatesOptions, createdraft, getRecipients } = useDocusignTemplates();
  const {Envios, Promociones, HabeasData, Contratos} = useGraphServices()
  const {state, setField, handleSubmit: crearRegistro} = useEnvios(Envios)
  const {searchWorker: searchWorkerHabeas, workers: workersHabeas, workersOptions: workerOptionsHabeas} = useHabeasData(HabeasData)
  const {searchWorker: searchWorkerContratos, workers: workersContratos, workersOptions: workerOptionsContratos} = useContratos(Contratos)
  const {searchWorker, workers, workersOptions} = usePromocion(Promociones)
  const plantillaSelected = templatesOptions.find((o) => o.value === templateId) ?? null;

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
    setLoading(true)

    // 1) Crear draft
    const draft = await createdraft(templateId);
    setEnvelopeId(draft.envelopeId)
    console.log("Se ha creado un draft envelope")

    // 2) Obtener recipients
    const signers = await getRecipients(draft.envelopeId);
    setSigners(signers)
    console.log("signers", signers);

    // 3) Obtener prefill / document tabs
    const documentTabs = await getEnvelopeDocumentTabs(draft.envelopeId, "1");
    const prefillTextTabs = documentTabs.prefillTabs?.textTabs ?? [];

    // 4) Obtener DocGen form fields
    const docGen = await getEnvelopeDocGenFormFields(draft.envelopeId);
    let firstDoc
    if(docGen.docGenFormFields){
      firstDoc = docGen.docGenFormFields[0];
    }
    console.log("Envelope doc geb tabs")

    // ================================
    // 4.a) Armar payload de PREFILL
    // ================================
    const prefillUpdates: UpdatePrefillTextTabPayload[] = prefillTextTabs
      .map(t => {
        const rawLabel = t.tabLabel ?? "";
        const label = rawLabel.toUpperCase();
        let value = t.value ?? "";

        switch (label) {
          case "nombre": value = varColaborador.NombreSeleccionado ?? varColaborador.Title ?? ""; break
          case "NOMBRE_DE_LA_PERSONA": value = varColaborador.NombreSeleccionado ?? varColaborador.Title ?? ""; break;
          case "FECHACOMP": value = varColaborador.FECHA_x0020_REQUERIDA_x0020_PARA0 ?? varColaborador.FechaIngreso ?? ""; break;
          case "FECHA_DE_INGRESO": value = varColaborador.FECHA_x0020_REQUERIDA_x0020_PARA0 ?? varColaborador.FechaIngreso ?? ""; break;
          case "CARGO": value = varColaborador.CARGO ?? varColaborador.Cargo ?? ""; break;
          case "CIUDAD": value = varColaborador.CIUDAD ?? varColaborador.Ciudad ?? ""; break;
          case "CONECTIVIDAD_EN_LETRAS": value = varColaborador.auxconectividadtexto ?? varColaborador.AuxilioTexto ?? ""; break;
          case "CONECTIVIDAD_VALOR": value = formatPesosEsCO(varColaborador.AuxilioValor ?? varColaborador.auxconectividadvalor ?? ""); break;
          case "GARANTIZADO_VALOR":
            value = formatPesosEsCO(
              varColaborador.VALOR_x0020_GARANTIZADO ??
                varColaborador.ValorGarantizado ??
                ""
            );
            break;

          case "GARANTIZADO":
            value =
              varColaborador.GarantizadoLetras ??
              varColaborador.Garantizado_x0020_en_x0020_letra ??
              "";
            break;

          case "IDENTIFICACI_N":
          case "IDENTIFICACIÓN":
            value =
              varColaborador.Numero_x0020_identificaci_x00f3_ ??
              varColaborador.NumeroDoc ??
              varColaborador.NumeroDocumento ??
              "";
            break;

          case "SALARIO_EN_LETRAS":
            value =
              varColaborador.SalarioTexto ??
              varColaborador.salariotexto ??
              "";
            break;

          case "SALARIO_VALOR":
            value = formatPesosEsCO(
              varColaborador.SALARIO ?? varColaborador.Salario ?? ""
            );
            break;

          case "TIPO_DE_DOCUMENTO":
            value =
              varColaborador.TipoDoc ??
              varColaborador.tipodoc ??
              varColaborador.Tipodoc ??
              "";
            break;

          case "TIPODOCCORT":
            value =
              varColaborador.AbreviacionTipoDoc ??
              varColaborador.Tipo_x0020_de_x0020_documento_x0 ??
              "";
            break;

          case "TIPOTEL":
            value =
              varColaborador.MODALIDAD_x0020_TELETRABAJO ??
              varColaborador.ModalidadTeletrabajo ??
              "";
            break;

          default:
            break;
        }

        if (!t.tabId) return null;

        return {
          tabId: t.tabId,
          value,
        };
      })
      .filter((x): x is UpdatePrefillTextTabPayload => x !== null);
    
    console.table(prefillUpdates)

    if (prefillUpdates.length > 0) {
      await updateEnvelopePrefillTextTabs(draft.envelopeId, "1", prefillUpdates);
    }

    // ===============================
    // 4.b) Armar payload de DOC GEN
    // ===============================
    if (firstDoc) {
      const docGenPayload: DocGenUpdateDocPayload[] = [
        {
          documentId: firstDoc.documentId,
          fields: firstDoc.docGenFormFieldList.map(f => {
            const name = f.name.toUpperCase();
            let value = f.value ?? "";

            switch (name) {
              case "NOMBRE":
              case "NOMBRE_DE_LA_PERSONA":
                value = varColaborador.NombreSeleccionado ?? varColaborador.Title ?? "";
                break;

              case "FECHACOMP":
              case "FECHA_DE_INGRESO":
                value =
                  varColaborador.FECHA_x0020_REQUERIDA_x0020_PARA0 ??
                  varColaborador.FechaIngreso ??
                  "";
                break;

              case "CARGO":
                value = varColaborador.CARGO ?? varColaborador.Cargo ?? "";
                break;

              case "CIUDAD":
                value = varColaborador.CIUDAD ?? varColaborador.Ciudad ?? "";
                break;

              case "CONECTIVIDAD_EN_LETRAS":
                value =
                  varColaborador.auxconectividadtexto ??
                  varColaborador.AuxilioTexto ??
                  "";
                break;

              case "CONECTIVIDAD_VALOR":
                value = formatPesosEsCO(
                  varColaborador.AuxilioValor ??
                    varColaborador.auxconectividadvalor ??
                    ""
                );
                break;

              case "GARANTIZADO_VALOR":
                value = formatPesosEsCO(
                  varColaborador.VALOR_x0020_GARANTIZADO ??
                    varColaborador.ValorGarantizado ??
                    ""
                );
                break;

              case "GARANTIZADO":
                value =
                  varColaborador.GarantizadoLetras ??
                  varColaborador.Garantizado_x0020_en_x0020_letra ??
                  "";
                break;

              case "IDENTIFICACI_N":
              case "IDENTIFICACIÓN":
                value =
                  varColaborador.Numero_x0020_identificaci_x00f3_ ??
                  varColaborador.NumeroDoc ??
                  varColaborador.NumeroDocumento ??
                  "";
                break;

              case "SALARIO_EN_LETRAS":
                value =
                  varColaborador.SalarioTexto ??
                  varColaborador.salariotexto ??
                  "";
                break;

              case "SALARIO_VALOR":
                value = formatPesosEsCO(
                  varColaborador.SALARIO ?? varColaborador.Salario ?? ""
                );
                break;

              case "TIPO_DE_DOCUMENTO":
                value =
                  varColaborador.TipoDoc ??
                  varColaborador.tipodoc ??
                  varColaborador.Tipodoc ??
                  "";
                break;

              case "TIPODOCCORT":
                value =
                  varColaborador.AbreviacionTipoDoc ??
                  varColaborador.Tipo_x0020_de_x0020_documento_x0 ??
                  "";
                break;

              case "TIPOTEL":
                value =
                  varColaborador.MODALIDAD_x0020_TELETRABAJO ??
                  varColaborador.ModalidadTeletrabajo ??
                  "";
                break;

              default:
                break;
            }

            return {
              name: f.name,
              value,
            };
          }),
        },
      ];

      await updateEnvelopeDocGenFormFields(draft.envelopeId, docGenPayload);
    }
    setField("IdSobre", draft.envelopeId)
    setSegundoPaso(true)
    setLoading(false)

  };

  const handleLookWorker = async (query: string) => {
    if (query.length < 5) return;
    let resultsPromocion
    let cantidadPromocion
    switch(proceso){
      case "Promocion":
        resultsPromocion = await searchWorker(query);
        cantidadPromocion = resultsPromocion.length;

        if (cantidadPromocion === 0) {
          alert("No se encontró el colaborador");
        } else if (cantidadPromocion === 1) {
          const unico = resultsPromocion[0];
          setVarColaborador(unico);
          setField("CorreoReceptor", unico.Correo ??  unico.Email );
          setField("Receptor", unico.NombreSeleccionado);
          setField("Fuente", "Promocion")
          setField("Cedula", unico.NumeroDoc)
          setField("Compa_x00f1_ia", unico.EmpresaSolicitante)
          setField("Estado", "Enviado")
          setField("ID_Novedad", unico.Id ?? "")
        } else {
          setElegir(true);
        }
      break

      case "Habeas":
        resultsPromocion = await searchWorkerHabeas(query);
        cantidadPromocion = resultsPromocion.length;
        console.log(workers)

        if (cantidadPromocion === 0) {
          alert("No se encontró el colaborador");
        } else if (cantidadPromocion === 1) {
          const unico = resultsPromocion[0];
          setVarColaborador(unico);
          setField("CorreoReceptor", unico.Correo);
          setField("Receptor", unico.Title);
          setField("Fuente", "Habeas")
          setField("Cedula", unico.NumeroDocumento)
          setField("Compa_x00f1_ia", unico.Empresa)
          setField("Estado", "Enviado")
          setField("ID_Novedad", unico.Id ?? "")
        } else {
          // más de uno → abres modal/lista usando workerOptions
          setElegir(true);
        }
      break

      case "Nuevo":
        resultsPromocion = await searchWorkerContratos(query);
        cantidadPromocion = resultsPromocion.length;
        console.log(workers)

        if (cantidadPromocion === 0) {
          alert("No se encontró el colaborador");
        } else if (cantidadPromocion === 1) {
          const unico = resultsPromocion[0];
          setVarColaborador(unico);
          setField("CorreoReceptor", unico.CORREO_x0020_ELECTRONICO_x0020_);
          setField("Receptor", unico.NombreSeleccionado);
          setField("Fuente", "Novedades")
          setField("Cedula", unico.Numero_x0020_identificaci_x00f3_)
          setField("Compa_x00f1_ia", unico.Empresa_x0020_que_x0020_solicita)
          setField("Estado", "Enviado")
          setField("ID_Novedad", unico.Id ?? "")
        } else {
          // más de uno → abres modal/lista usando workerOptions
          setElegir(true);
        }
      break
    }
  };

  const handleConfirmWorker = (selectedId: string) => {
    let seleccionado
    switch(proceso){
      case "Promocion":
        seleccionado = workers.find(w => w.Id === selectedId);
        if(!seleccionado) return
        setVarColaborador(seleccionado);
          setField("CorreoReceptor", seleccionado.Correo ??  seleccionado.Email );
          setField("Receptor", seleccionado.NombreSeleccionado);
          setField("Fuente", "Promocion")
          setField("Cedula", seleccionado.NumeroDoc)
          setField("Compa_x00f1_ia", seleccionado.EmpresaSolicitante)
          setField("Estado", "Enviado")
          setField("ID_Novedad", seleccionado.Id ?? "")
        setElegir(false);
      break;
      
      case "Habeas":
        seleccionado = workersHabeas.find(w => w.Id === selectedId);
        if(!seleccionado) return
        setVarColaborador(seleccionado);
          setField("CorreoReceptor", seleccionado.Correo);
          setField("Receptor", seleccionado.Title);
          setField("Fuente", "Habeas")
          setField("Cedula", seleccionado.NumeroDocumento)
          setField("Compa_x00f1_ia", seleccionado.Empresa)
          setField("Estado", "Enviado")
          setField("ID_Novedad", seleccionado.Id ?? "")
        setElegir(false);
      break;

      case "Nuevo":
        seleccionado = workersContratos.find(w => w.Id === selectedId);
        if(!seleccionado) return
        setVarColaborador(seleccionado);
        setField("CorreoReceptor", seleccionado.CORREO_x0020_ELECTRONICO_x0020_);
        setField("Receptor", seleccionado.NombreSeleccionado);
        setField("Fuente", "Novedades")
        setField("Cedula", seleccionado.Numero_x0020_identificaci_x00f3_)
        setField("Compa_x00f1_ia", seleccionado.Empresa_x0020_que_x0020_solicita)
        setField("Estado", "Enviado")
        setField("ID_Novedad", seleccionado.Id ?? "")
        setElegir(false);
      break;
    }

  };

  const handleChangeSigner = (
    index: number,
    updated: Partial<DocusignRecipient>
  ) => {
    setSigners(prev =>
      prev.map((s, i) => (i === index ? { ...s, ...updated } : s))
    );
  };

  const handleSendEnvolope = async () => {
    try{
      const recipients = await updateEnvelopeRecipients(envelopeId, { signers });
      setField("Recipients", JSON.stringify(recipients.signers))
      await sendEnvelope(envelopeId)
      crearRegistro()
      alert("Se ha enviado con exito el sobre")

    } catch {
      alert("Ha ocurrido un error por favor vuelva a intentarlo")
      setLoading(false)
    }
  };

  const disabled = !proceso

  return (
    <div className="ef-page">
      <div className="ef-card">
        <form onSubmit={handleSubmit} className="ef-form">
          <div className="ef-field">
            <label className="ef-label" htmlFor="formato">¿Que clase de proceso hara?</label>
            <select id="formato" className="ef-input" value={proceso} onChange={(e) => {setProceso(e.target.value)}}>
              <option value="">Selecciona un formato</option>
              <option value="Nuevo">Nuevo ingreso</option>
              <option value="Promocion">Promocion</option>
              <option value="Habeas">Habeas Data</option>
            </select>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="cedula">Cédula del receptor</label>
            <input id="cedula" type="number" className="ef-input" disabled={disabled} value={state.Cedula} onBlur={(e) => handleLookWorker(e.target.value)} onChange={(e) => {setField("Cedula", e.target.value)}}/>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="nombre">
              Nombre del receptor
            </label>
            <input id="nombre" type="text" className="ef-input" disabled={disabled} value={state.Receptor} onChange={(e) => setField("Receptor", e.target.value)}/>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="correo">
              Correo del receptor
            </label>
            <input id="correo"  type="email" className="ef-input" disabled={disabled} value={state.CorreoReceptor} onChange={(e) => setField("CorreoReceptor", e.target.value)}/>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="formato">¿Qué formato se va a enviar?</label>
            <select id="formato" className="ef-input" disabled={disabled} value={plantillaSelected?.value} onChange={(e) => {setTemplateId(e.target.value); setField("Title", plantillaSelected?.label ?? "")}}>
              <option value="">Selecciona un formato</option>
              {templatesOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                                                                                                              proceso === "Promocion" ? workersOptions:
                                                                                                              proceso === "Habeas" ? workerOptionsHabeas : 
                                                                                                              proceso === "Nuevo" ? workerOptionsContratos : workerOptionsContratos}/>
      
      <SignersModal open={segundoPaso} signers={signers} onClose={() => setSegundoPaso(false)} onChangeSigner={handleChangeSigner} onSave={handleSendEnvolope}/>
    </div>
  );
};

type Props = {
  open: boolean;
  signers: DocusignRecipient[];
  onChangeSigner?: (index: number, updated: Partial<DocusignRecipient>) => void;
  onClose: () => void;
  onSave?: () => void;
};

export const SignersModal: React.FC<Props> = ({open, signers, onChangeSigner, onClose, onSave,}) => {
  if (!open) return null;

  const handleChange =
    (index: number, field: keyof DocusignRecipient) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChangeSigner) return;
      onChangeSigner(index, { [field]: e.target.value });
    };

  const [sending, setSending] = React.useState<boolean>(false)

  return (
    <div className="signers-modal-backdrop">
      <div className="signers-modal">
        {/* Header */}
        <div className="signers-modal-header">
          <h2 className="signers-modal-title">Firmantes del sobre</h2>
          <button type="button" className="signers-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="signers-modal-body">
          <div className="signers-wrapper">
            {signers.length === 0 && (
              <p className="signers-empty">No hay firmantes asignados.</p>
            )}

            {signers.map((signer, idx) => (
              <div key={signer.recipientId ?? idx} className="signer-card">
                <div className="signer-header">
                  <span className="signer-index">Firmante {idx + 1}</span>
                  {signer.roleName && (
                    <span className="signer-role">{signer.roleName}</span>
                  )}
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
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="signers-modal-footer">
          <button type="button" className="btn btn-secondary btn-xs" disabled={sending} onClick={onClose}>
            Cancelar
          </button>
          {onSave && (
            <button type="button" className="btn btn-primary-final btn-xs" disabled={sending} onClick={() => {
                                                                                                      setSending(true);    
                                                                                                      onSave(); 
                                                                                                      setSending(false)
                                                                                                      onClose()}}>
              {sending ? "Enviando sobre..." : "Guardar cambios"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


export default EnviarFormatoCard;
