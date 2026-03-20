import React from "react";
import type { DocusignRecipient } from "../../../../models/Docusign";
import type { DocuSignVM } from "../../../../models/DTO";

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