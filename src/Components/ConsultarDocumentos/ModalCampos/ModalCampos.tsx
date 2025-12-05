import * as React from "react";
import "./ModalCampos.css"
import { useDocusignTemplates } from "../../../Funcionalidades/Docusign";
import { updateEnvelopeRecipients, type DocGenFormFieldResponse, type DocusignRecipient, type PrefillTabsResponse } from "../../../Services/DocusignAPI.service";

export type CampoActual = {
  label: string;
  value: string | null | undefined;
};

interface PreviewEnvioModalProps {
  open: boolean;
  onClose: () => void;
  envelopeId: string;
}

export const PreviewEnvioModal: React.FC<PreviewEnvioModalProps> = ({open, onClose, envelopeId, }) => {
    const {getTabsFromSendEnvelope, getRecipients, getenvelopeInfo} = useDocusignTemplates();
    const [campos, setCampos] = React.useState<CampoActual[]>([]);
    const [destinatarios, setDestinatarios] = React.useState<DocusignRecipient[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);

    const loadTemplates = React.useCallback(async () => {
        if (!envelopeId) return;
        try {
            setLoading(true);
            const res = await getTabsFromSendEnvelope(envelopeId);
            const tabs: PrefillTabsResponse | undefined = res.tabs;
            const docGen: DocGenFormFieldResponse | undefined = res.documentGeneration;
            const result: CampoActual[] = [];

            // 1) Campos de prefillTabs (document tabs)
            const prefillTextTabs = tabs?.prefillTabs?.textTabs ?? [];
            prefillTextTabs.forEach((t) => {
                result.push({
                    label: t.tabLabel ?? t.tabId ?? "Campo sin etiqueta",
                    value: t.value ?? null,
                });
            });

            const docs = docGen?.docGenFormFields ?? [];
            docs.forEach((doc) => {
                doc.docGenFormFieldList.forEach((f) => {
                result.push({
                    label: f.label ?? f.name,
                    value: f.value ?? null,
                });
                });
            });

            const recipients = await getRecipients(envelopeId)
            setDestinatarios(recipients);

            const info = await getenvelopeInfo(envelopeId)
            console.log("Envelope info:", info);

            setCampos(result);
            } catch (e) {
                console.error("Error loading envelope tabs:", e);
                setCampos([]);
            } finally {
            setLoading(false);
        }
    }, [envelopeId, getTabsFromSendEnvelope]);

    const handleReSend = React.useCallback(async () => {
        if (!envelopeId) return;
        try {
                setLoading(true);
                await updateEnvelopeRecipients(envelopeId, { signers: destinatarios }, {resendEnvelope: true});
                alert("El sobre ha sido reenviado correctamente.");
            } catch (e) {
                console.error("Ha ocurrido un error reenviando el error:", e);
                alert("Ha ocurrido un error reenviando el sobre.");
            } finally {
            setLoading(false);
        }
    }, [envelopeId]);

    React.useEffect(() => {-
        loadTemplates()
    }, [envelopeId]);
  
    if (!open) return null;

    return (
        <div className="pe-overlay" role="dialog" aria-modal="true">
        <div className="pe-panel">
            {/* Header */}
            <header className="pe-header">
            <h2>Resumen del envío</h2>
            <button type="button" className="pe-close" onClick={onClose}>
                ×
            </button>
            </header>

            {/* Body */}
            <div className="pe-body">
            {/* Columna izquierda: Campos actuales */}
            <section className="pe-column">
                <h3 className="pe-column-title">Campos actuales</h3>
                <div className="pe-fields">
                {campos.map((campo) => (
                    <div className="pe-field-row" key={campo.label}>
                    <span className="pe-field-label">{campo.label}</span>
                    <div className="pe-field-value" title={campo.value ?? ""} >
                        {campo.value ?? "—"}
                    </div>
                    </div>
                ))}
                </div>
            </section>

            {/* Columna derecha: Destinatarios actuales */}
            <section className="pe-column">
                <h3 className="pe-column-title">Destinatarios actuales</h3>
                <div className="pe-destinatarios">
                {destinatarios.map((dest, index) => (
                    <div className="pe-destinatario-card" key={`${dest.email}-${index}`} >
                        <div className="pe-destinatario-title">{index + 1}. {dest.roleName ?? "".toUpperCase()}</div>

                        <div className="pe-field-row">
                            <span className="pe-field-label">Nombre</span>
                            <div className="pe-field-value" title={dest.name}>{dest.name}</div>
                        </div>

                        <div className="pe-field-row">
                            <span className="pe-field-label">Correo</span>
                            <div className="pe-field-value" title={dest.email}>{dest.email}</div>
                        </div>

                        <div className="pe-field-row">
                            <span className="pe-field-label">Orden</span>
                            <div className="pe-field-value">{dest.routingOrder}</div>
                        </div>

                        <div className="pe-field-row">
                            <span className="pe-field-label">Estado</span>
                            <div className="pe-field-value">
                                {
                                    dest.status === "sent" ? "Enviado": 
                                    dest.status === "created" ? "En espera": 
                                    dest.status === "completed" ? "Completado":
                                    dest.status === "declined" ? "Rechazado":
                                    dest.status === "delivered" ? "Enviado":
                                    dest.status === "signed" ? "Firmado":
                                    dest.status
                                }
                            </div>
                        </div>

                    </div>
                ))}
                </div>
            </section>
            </div>

            {/* Footer */}
            <footer className="pe-footer">
                <button type="button" className="btn btn-primary btn-xs" onClick={() => handleReSend()}>{!loading ? "Reenviar" : "Reenviando..."}</button>
                <button type="button" className="pe-btn" onClick={onClose}>Cerrar</button>
            </footer>
        </div>
        </div>
    );
};

