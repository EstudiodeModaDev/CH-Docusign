import React from "react";
import "./SendDocument.css";
import { useGraphServices } from "../../../graph/graphContext";
import { usePromocion } from "../../../Funcionalidades/GD/Promocion";
import { ElegirColaboradorModal } from "./ModalSelect/ModalSelect";
import { getEnvelopeDocGenFormFields, getEnvelopeDocumentTabs, sendEnvelope, updateEnvelopeDocGenFormFields, updateEnvelopePrefillTextTabs, updateEnvelopeRecipients, } from "../../../Services/DocusignAPI.service";
import type { Promocion } from "../../../models/Promociones";
import type { Novedad } from "../../../models/Novedades";
import type { HabeasData } from "../../../models/HabeasData";
import type { Cesacion } from "../../../models/Cesaciones";
import type { Retail } from "../../../models/Retail";
import { useRetail } from "../../../Funcionalidades/GD/Retail";
import type { DocGenUpdateDocPayload, DocusignRecipient, UpdatePrefillTextTabPayload } from "../../../models/Docusign";
import { useCesaciones } from "../../../Funcionalidades/GD/Cesaciones/hooks/useCesaciones";
import { useContratos } from "../../../Funcionalidades/GD/Contratos/hooks/useContratos";
import { useDocusignTemplates } from "../../../Funcionalidades/GD/Docusing/Templates/hooks/useDocusingTemplates";
import { useEnvios } from "../../../Funcionalidades/GD/Envios/hooks/useEnvios";
import { useHabeasData } from "../../../Funcionalidades/GD/Habeas/hooks/useHabeas";
import { toDocuSignVM, type Proceso } from "../../../Funcionalidades/GD/Docusing/Templates/utils/parseToCommon";
import { SignersModal } from "./SignerModal/SignerModal";
import { pickValueFromLabel } from "../../../Funcionalidades/GD/Docusing/Templates/utils/getDocusignObject";
import { convertToCommonDTO } from "../../../Funcionalidades/Common/parseOptions";
import { validateFields } from "../../../Funcionalidades/GD/Docusing/Templates/utils/validateTemplate";


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
  const [asunto, setAsunto] = React.useState<string>("");
  const [signers, setSigners] = React.useState<DocusignRecipient[]>([]);
  const [varColaborador, setVarColaborador] = React.useState<Promocion | Novedad | HabeasData | Cesacion | Retail | null>(null);
  const [elegir, setElegir] = React.useState<boolean>(false);
  const docusignController = useDocusignTemplates();
  const { Promociones, Retail } = useGraphServices();
  const enviosController = useEnvios();
  const { searchWorker: searchWorkerHabeas, workers: workersHabeas, workersOptions: workerOptionsHabeas,} = useHabeasData();
  const contratosController = useContratos();
  const { searchWorker, workers, workersOptions, } = usePromocion(Promociones);
  const cesaciones = useCesaciones()
  const { searchWorker: searchWorkerRetail, workersOptions: workerOptionsRetail, workers: workersRetail } = useRetail(Retail)
  const plantillaSelected = docusignController.templatesOptions.find((o) => o.value === templateId) ?? null;

  const vm = React.useMemo(() => {
    if (!proceso || !varColaborador) return null;
    return toDocuSignVM(proceso as Proceso, varColaborador);
  }, [proceso, varColaborador]);

  const handleSubmit = async (e: React.FormEvent,) => {
    e.preventDefault();
    const Cedula = enviosController.state.Cedula
    const receptor = enviosController.state.Receptor
    const correoReceptor = enviosController.state.CorreoReceptor
    const canContinue = validateFields({proceso, templateId, Cedula, receptor, asunto, correoReceptor })

    if(!canContinue.ok){
      alert(canContinue.message)
    }

    if (!varColaborador) {
      alert("No se encontró información del colaborador.");
      return;
    }

    try {
      const draft = await docusignController.createdraft(templateId, asunto);
      setEnvelopeId(draft.envelopeId);

      const signersResp = await docusignController.getRecipients(draft.envelopeId);
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

      enviosController.setField("IdSobre", draft.envelopeId);
      enviosController.setField("Title", plantillaSelected?.label ?? "");
      setSegundoPaso(true);
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error creando el sobre. Revisa consola.");
    } finally {
      setLoading(false);
    }
  };

  const handleLookWorker = async (query: string) => {
    if (query.length < 5 || !proceso) return;

    const processMap = {
      Promocion: {
        search: searchWorker,
        fuente: "Promocion",
      },
      Cesacion: {
        search: cesaciones.searchWorker,
        fuente: "Cesación",
      },
      Habeas: {
        search: searchWorkerHabeas,
        fuente: "Habeas",
      },
      Nuevo: {
        search: contratosController.searchWorker,
        fuente: "Novedades",
      },
      Retail: {
        search: searchWorkerRetail,
        fuente: "Retail",
      },
    } as const;

    const config = processMap[proceso as keyof typeof processMap];
    if (!config) return;

    const results = await config.search(query);
    const cantidad = results.length;

    if (cantidad === 0) {
      alert("No se encontró el colaborador");
      return;
    }

    if (cantidad > 1) {
      setElegir(true);
      return;
    }

    const unico = results[0];
    setVarColaborador(unico);

    const unified = convertToCommonDTO(unico);
    if (!unified) return;

    enviosController.setField("CorreoReceptor", unified.Correoelectronico);
    enviosController.setField("Receptor", unified.Nombre ?? "");
    enviosController.setField("Fuente", config.fuente);
    enviosController.setField("Cedula", unified.Cedula ?? "");
    enviosController.setField("Compa_x00f1_ia", unified.Empresaalaquepertenece ?? "");
    enviosController.setField("Estado", "Enviado");
    enviosController.setField("ID_Novedad", unified.Id ?? "");
  };

  const handleConfirmWorker = (selectedId: string) => {
    if (!proceso) return;

    switch (proceso) {
      case "Promocion": {
        const seleccionado = workers.find((w: any) => w.Id === selectedId) as Promocion | undefined;
        if (!seleccionado) return;

        setVarColaborador(seleccionado);
        enviosController.setField("CorreoReceptor", (seleccionado.Correo ?? seleccionado.Email) ?? "");
        enviosController.setField("Receptor", seleccionado.NombreSeleccionado ?? "");
        enviosController.setField("Fuente", "Promocion");
        enviosController.setField("Cedula", seleccionado.NumeroDoc ?? "");
        enviosController.setField("Compa_x00f1_ia", seleccionado.EmpresaSolicitante ?? "");
        enviosController.setField("Estado", "Enviado");
        enviosController.setField("ID_Novedad", seleccionado.Id ?? "");
        setElegir(false);
        break;
      }

      case "Habeas": {
        const seleccionado = workersHabeas.find((w: any) => w.Id === selectedId) as HabeasData | undefined;
        if (!seleccionado) return;

        setVarColaborador(seleccionado);
        enviosController.setField("CorreoReceptor", seleccionado.Correo ?? "");
        enviosController.setField("Receptor", seleccionado.Title ?? "");
        enviosController.setField("Fuente", "Habeas");
        enviosController.setField("Cedula", seleccionado.NumeroDocumento ?? "");
        enviosController.setField("Compa_x00f1_ia", seleccionado.Empresa ?? "");
        enviosController.setField("Estado", "Enviado");
        enviosController.setField("ID_Novedad", seleccionado.Id ?? "");
        setElegir(false);
        break;
      }

      case "Nuevo": {
        const seleccionado = contratosController.workers.find((w: any) => w.Id === selectedId) as Novedad | undefined;
        if (!seleccionado) return;

        setVarColaborador(seleccionado);
        enviosController.setField("CorreoReceptor", seleccionado.CORREO_x0020_ELECTRONICO_x0020_ ?? "");
        enviosController.setField("Receptor", seleccionado.NombreSeleccionado ?? "");
        enviosController.setField("Fuente", "Novedades");
        enviosController.setField("Cedula", seleccionado.Numero_x0020_identificaci_x00f3_ ?? "");
        enviosController.setField("Compa_x00f1_ia", seleccionado.Empresa_x0020_que_x0020_solicita ?? "");
        enviosController.setField("Estado", "Enviado");
        enviosController.setField("ID_Novedad", seleccionado.Id ?? "");
        setElegir(false);
        break;
      }
      case "Cesacion": {
        const seleccionado = cesaciones.workersOptions.find((w: any) => w.Id === selectedId) as Cesacion | undefined;
        if (!seleccionado) return;

        setVarColaborador(seleccionado);
        enviosController.setField("CorreoReceptor", seleccionado.Correoelectronico ?? "");
        enviosController.setField("Receptor", seleccionado.Nombre ?? "");
        enviosController.setField("Fuente", "Cesacion");
        enviosController.setField("Cedula", seleccionado.Title ?? "");
        enviosController.setField("Compa_x00f1_ia", seleccionado.Empresaalaquepertenece ?? "");
        enviosController.setField("Estado", "Enviado");
        enviosController.setField("ID_Novedad", seleccionado.Id ?? "");
        setElegir(false);
      break;
      }
      case "Retail": {
          const seleccionado = workersRetail.find((w: any) => w.Id === selectedId) as Retail | undefined;
          if (!seleccionado) return;

          setVarColaborador(seleccionado);
          enviosController.setField("CorreoReceptor", seleccionado.CorreoElectronico ?? "");
          enviosController.setField("Receptor", seleccionado.Nombre ?? "");
          enviosController.setField("Fuente", "Retail");
          enviosController.setField("Cedula", seleccionado.Title ?? "");
          enviosController.setField("Compa_x00f1_ia", seleccionado.Empresaalaquepertenece ?? "");
          enviosController.setField("Estado", "Enviado");
          enviosController.setField("ID_Novedad", seleccionado.Id ?? "");
          setElegir(false);
        break;
      }
    };
  };

  const handleChangeSigner = (index: number, updated: Partial<DocusignRecipient>) => {
    setSigners((prev) => prev.map((s, i) => (i === index ? { ...s, ...updated } : s)));
  };

  const handleSendEnvolope = async () => {
    try {
      const recipients = await updateEnvelopeRecipients(envelopeId, { signers });
      enviosController.setField("Recipients", JSON.stringify(recipients.signers));
      await sendEnvelope(envelopeId);
      enviosController.handleSubmit();
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
              <option value="Nuevo">Contratación</option>
              <option value="Promocion">Promocion</option>
              <option value="Habeas">Habeas Data</option>
              <option value="Cesacion">Cesación</option>
              <option value="Retail">Retail</option>
            </select>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="cedula"> Cédula del receptor </label>
            <input id="cedula" type="number" className="ef-input" disabled={disabled} value={enviosController.state.Cedula} onBlur={(e) => handleLookWorker(e.target.value)} onChange={(e) => enviosController.setField("Cedula", e.target.value)}/>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="nombre"> Nombre del receptor </label>
            <input id="nombre" type="text" className="ef-input" disabled={disabled} value={enviosController.state.Receptor} onChange={(e) => enviosController.setField("Receptor", e.target.value)}/>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="correo"> Correo del receptor </label>
            <input id="correo" type="email" className="ef-input" disabled={disabled} value={enviosController.state.CorreoReceptor} onChange={(e) => enviosController.setField("CorreoReceptor", e.target.value)}/>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="formato"> ¿Qué formato se va a enviar? </label>
            <select id="formato" className="ef-input" disabled={disabled} value={plantillaSelected?.value ?? ""} onChange={(e) => {
                                                                                                                    const newTemplateId = e.target.value;
                                                                                                                    setTemplateId(newTemplateId);

                                                                                                                    const sel = docusignController.templatesOptions.find((o) => o.value === newTemplateId);
                                                                                                                    enviosController.setField("Title", sel?.label ?? "");
                                                                                                                  }}>
              <option value="">Selecciona un formato</option>
              {docusignController.templatesOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ef-field">
            <label className="ef-label" htmlFor="correo"> Asunto del correo </label>
            <input id="correo" type="text" className="ef-input" disabled={disabled} value={asunto} onChange={(e) => setAsunto(e.target.value)}/>
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
                                                                                                                : proceso === "Nuevo" ? contratosController.workersOptions
                                                                                                                : proceso === "Cesacion" ? cesaciones.workersOptions
                                                                                                                : proceso === "Retail" ? workerOptionsRetail:
                                                                                                                workersOptions
                                                                                                            }/>

      <SignersModal open={segundoPaso} signers={signers} onClose={() => setSegundoPaso(false)} onChangeSigner={handleChangeSigner} onSave={handleSendEnvolope} vm={vm} vmEmail={enviosController.state.CorreoReceptor ?? ""}/>
    </div>
  );
};


export default EnviarFormatoCard;
