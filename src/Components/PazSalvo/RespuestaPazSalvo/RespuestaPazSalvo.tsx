import React from "react";
import "./RespuestaPazSalvo.css";
import RichTextBase64 from "../RichText/RichText";
import { useGraphServices } from "../../../graph/graphContext";
import { useRespuestasPazSalvos } from "../../../Funcionalidades/PazSalvos/Respuesta";
import type { PazSalvo } from "../../../models/PazSalvo";
import { useFirmaUsuario } from "../../../Funcionalidades/PazSalvos/Firmas";
import { useAuth } from "../../../auth/authProvider";
import { usePazSalvo } from "../../../Funcionalidades/PazSalvos/PazSalvos";

type Props = {
  IdPazSalvo: PazSalvo;
  onBack?: () => void; // opcional, por si quieres volver a la tabla
};

export const MotivoAdjuntosForm: React.FC<Props> = ({ IdPazSalvo, onBack }) => {
  const { Respuesta, Firmas, PazSalvos, mail } = useGraphServices();
  const [files, setFiles] = React.useState<FileList | null>(null)
  const { state, setField, handleSubmit, loading } = useRespuestasPazSalvos(Respuesta, IdPazSalvo);
  const {updatePazSalvo} = usePazSalvo(PazSalvos, mail)
  const {account} = useAuth()
  const { getFirmaInline } = useFirmaUsuario(Firmas, account?.username ?? "");

  const onChangeEstado = (estado: string) => {
    if (estado === "Rechazado") {
      setField(
        "Respuesta",
        `<p>
          El usuario <strong>${IdPazSalvo.Nombre}</strong> presenta los siguientes pendientes con el área <strong>${state.Area}</strong>:
        </p>
        <ol>
          <li>
          </li>
        </ol>`
      );
    } else if (estado === "Aprobado") {
      setField(
        "Respuesta",
        `<p>El usuario <strong>${IdPazSalvo.Nombre}</strong> está a paz y salvo con el área <strong>${state.Area}</strong>.</p>`
      );
    } else {
      setField("Respuesta", "");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    const Firma = await getFirmaInline()
    let respuesta
    if(Firma){
        respuesta =  await handleSubmit(files!, Firma);
        if(respuesta?.cerrar){
          await updatePazSalvo(e, IdPazSalvo.Id ?? "")
        }
    }
  };

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selected = e.target.files; // FileList | null
  if (!selected || selected.length === 0) {
    setFiles(null); // opcional: limpiar si no hay nada
    return;
  }
  setFiles(selected);
};


  const disableEstado = state.Area === "";
  const disableGuardar =
    disableEstado || !state.Estado || loading; // sin área o sin estado no tiene sentido guardar

  return (
    <div className="ps-root">
      {/* Fila Área / Estado */}
      <div className="ps-row ps-row--two">
        <div className="ps-field">
          <label className="ps-label" htmlFor="area">Área</label>
          <input id="area" className="ps-input" value={state.Area} onChange={(e) => setField("Area", e.target.value)} placeholder=""/>
        </div>

        <div className="ps-field">
          <label className="ps-label" htmlFor="estado">Estado</label>
          <div className="ps-select-wrapper">
            <select id="estado" className="ps-select" value={state.Estado} disabled={disableEstado} onChange={(e) => {
                                                                                                                        setField("Estado", e.target.value);
                                                                                                                        onChangeEstado(e.target.value);
                                                                                                                    }}>
              <option value="">Buscar elementos</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Aprobado">Aprobado</option>
            </select>
            <span className="ps-select-arrow">▾</span>
          </div>
        </div>
      </div>

      {/* Motivo (editor “rich”) */}
      <div className="ps-row">
        <div className="ps-field">
          <label className="ps-label" htmlFor="motivo">Motivo</label>
          <div className="ps-editor">
            <RichTextBase64 value={state.Respuesta} onChange={(html) => setField("Respuesta", html)}/>
          </div>
        </div>
      </div>

      {/* Datos adjuntos */}
        <div className="ps-row">
            <div className="ps-field">
                <label className="ps-label">Datos adjuntos</label>
                <div className="ps-attachments">
                    {files && files.length > 0 ? (
                        <ul className="ps-attachments-list">
                            {Array.from(files).map((file, idx) => (
                            <li key={idx} className="ps-attachments-item">
                                <span className="ps-file-name">{file.name}</span>
                                <span className="ps-file-size">
                                    {(file.size / 1024).toFixed(1)} KB
                                </span>
                            </li>
                            ))}
                        </ul>
            ) : (
              <p className="ps-attachments-empty">No hay nada adjunto.</p>
            )}

            <label className="ps-attachments-add">
              <span className="ps-clip-icon">📎</span>
              <span>Adjuntar un archivo</span>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="ps-file-input"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="ps-row ps-row--actions">
        <div className="ps-actions">
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => onBack?.()} disabled={loading}>
            Volver
          </button>

          <button type="button" className="btn btn-primary btn-xs" onClick={(e) => handleCreate(e)} disabled={disableGuardar}>
            Guardar respuesta
          </button>
        </div>
      </div>
    </div>
  );
};
