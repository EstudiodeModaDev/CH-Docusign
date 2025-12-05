import React from "react";
import type { PazSalvo, respuestaErrors, respuestas } from "../../models/PazSalvo";
import type { RespuestaService } from "../../Services/Respuesta.service";
import { useAuth } from "../../auth/authProvider";
import { FlowClient } from "../FlowClient";
import type { FirmaInline } from "../../models/Imagenes";
import { useGraphServices } from "../../graph/graphContext";

export function useRespuestasPazSalvos(respuestaSvc: RespuestaService, IdPazSalvo?: PazSalvo,) {
  const [rows, setRows] = React.useState<respuestas[]>([]);
  const {account} = useAuth() 
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState<string>("");
  const [state, setState] = React.useState<respuestas>({
    Title: account?.name ?? "",
    Correo: account?.username ?? "",
    Area: "",
    Estado: "",
    IdPazSalvo: IdPazSalvo?.Id ?? "",
    Respuesta: "",
  });
  const [errors, setErrors] = React.useState<respuestaErrors>({});  
  const { graph } = useGraphServices();

  const setField = <K extends keyof respuestas>(k: K, v: respuestas[K]) => setState((s) => ({ ...s, [k]: v }));
  const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cc78cbdc7e764c11a14b11efd32011fb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=--jCvPXdSRgwIpNxrZo8RXkkXecNt5TK2Gyms19Vn0c")
  const getFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/89d64252417d4a96b3fa8c87fc66e776/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=v-oDHxbLUjANTLzoOQRH5o9ks4BdL4LsEHuJNUNL4c4")
  
  const loadPazSalvoRespuestas = React.useCallback(async () => {
    setLoading(true)
    try {
      const items = await respuestaSvc.getAll({filter: `fields/IdPazSalvo eq '${IdPazSalvo?.Id}'`}); 
      setRows(items);
    } catch (e: any) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [respuestaSvc]);

  const loadUserRespuestas = React.useCallback(async (PazSalvoId: string) => {
    setLoading(true)
    try {
      const items = await respuestaSvc.getAll({filter: `fields/IdPazSalvo eq '${PazSalvoId}' and fields/Correo eq '${account?.username}' and fields/Estado eq 'Aprobado'`}); 
      return items
    } catch (e: any) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [respuestaSvc]);

  const loadUserRespuestasAll = React.useCallback(async (PazSalvoId: string) => {
    setLoading(true)
    try {
      const items = await respuestaSvc.getAll({filter: `fields/IdPazSalvo eq '${PazSalvoId}' and fields/Correo eq '${account?.username}'`}); 
      return items
    } catch (e: any) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [respuestaSvc]);

  React.useEffect(() => {
    loadPazSalvoRespuestas();
  }, [loadPazSalvoRespuestas,search]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadPazSalvoRespuestas(); }, [loadPazSalvoRespuestas]);
  const reloadAll  = React.useCallback(() => { loadPazSalvoRespuestas(); }, [loadPazSalvoRespuestas, search]);

  const validate = () => {
    const e: respuestaErrors = {};
    if(!state.Correo) e.Correo = "Obligatorio";
    if(!state.Title) e.Title = "Obligatorio";
    if(!state.Area) e.Area = "Obligatorio";
    if(!state.Respuesta) e.Respuesta = "Obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const cleanState = () => {
    setState({
        Correo: "",
        Title: "",
        Area: "",
        Estado: "",
        IdPazSalvo: "",
        Respuesta: ""
    })
  };

  // util para pasar File -> base64 (sin el prefijo data:...)
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const base64 = result.split(",").pop() ?? "";
          resolve(base64);
        } else {
          reject(new Error("No se pudo leer el archivo"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleSubmit = async (filesArray: FileList | null, firma: FirmaInline) => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: respuestas = {
        Correo: account?.username ?? "",
        Title: account?.name ?? "",
        Area: state.Area,
        Estado: state.Estado,
        IdPazSalvo: state.IdPazSalvo,
        Respuesta: state.Respuesta,
      };

      const created = await respuestaSvc.create(payload);

      // ---- Adjuntos al flujo ----
      if (filesArray && filesArray.length > 0 && created?.Id) {
        const filesForFlow = await Promise.all(
          Array.from(filesArray).map(async (f) => ({
            name: f.name,
            contentBytes: await fileToBase64(f),
          }))
        );

        await notifyFlow.invoke<any, any>({
          pazId: Number(created.Id),
          files: filesForFlow, // <-- AQUÍ ya es un ARRAY de objetos simples
        });
      }

      if(state.Estado === "Rechazado"){
        const toRecipients = [
          { emailAddress: { address: IdPazSalvo!.CorreoJefe } },
          { emailAddress: { address: IdPazSalvo!.Solicitante } },
        ];
        
        const htmlBody = `
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #ff0000;">
              <th style="padding: 8px; color: #ffffff;">Área</th>
              <th style="padding: 8px; color: #ffffff;">Nombre del Aprobador</th>
              <th style="padding: 8px; color: #ffffff;">Correo del Aprobador</th>
              <th style="padding: 8px; color: #ffffff;">Respuesta</th>
              <th style="padding: 8px; color: #ffffff;">Motivo</th>
            </tr>

            <tr>
              <td style="padding: 8px;">${state.Area}</td>
              <td style="padding: 8px;">${state.Title}</td>
              <td style="padding: 8px;">${state.Correo}</td>
              <td style="padding: 8px;">${state.Estado}</td>
              <td style="padding: 8px;">${state.Respuesta}</td>
            </tr>
          </table>
  
            ${firma ? `
            <br/>
            <p>Firma del solicitante:</p>
            <img src="cid:firma-usuario"
                alt="Firma del solicitante"
                style="max-width: 200px; max-height: 80px; object-fit: contain;" />
          `
          : ""
        }
        `;
        
        const from = account?.username ?? ""; // ajusta esto
  
        await graph.sendMail(from, {
          message: {
            subject: `Novedad paz y salvo - ${IdPazSalvo!.Nombre}  ${IdPazSalvo!.Title} `,
            body: {
              contentType: "HTML",
              content: htmlBody,
            },
            toRecipients,
          },
          saveToSentItems: true,
        });
      }

      const aprobados = await respuestaSvc.getAll({filter:  `fields/IdPazSalvo eq '${IdPazSalvo!.Id}' and fields/Estado eq 'Aprobado'`})
      const todos= await respuestaSvc.getAll({filter:  `fields/IdPazSalvo eq '${IdPazSalvo!.Id}'`})
      let cerrar
      if(aprobados.length >= IdPazSalvo!.Solicitados.length){
        cerrar = true
        const toRecipients = [
          { emailAddress: { address: IdPazSalvo!.CorreoJefe } },
          { emailAddress: { address: IdPazSalvo!.Solicitante } },
        ];
        
        const htmlBody = `
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr style="background-color: #ff0000;">
              <th style="padding: 8px; color: #ffffff;">Área</th>
              <th style="padding: 8px; color: #ffffff;">Nombre del Aprobador</th>
              <th style="padding: 8px; color: #ffffff;">Correo del Aprobador</th>
              <th style="padding: 8px; color: #ffffff;">Respuesta</th>
              <th style="padding: 8px; color: #ffffff;">Motivo</th>
            </tr>

            <tr>
              ${todos.map(a => `
                  <tr>
                    <td style="padding: 8px;">${a.Area}</td>
                    <td style="padding: 8px;">${a.Title}</td>
                    <td style="padding: 8px;">${a.Correo}</td>
                    <td style="padding: 8px;">${a.Estado}</td>
                    <td style="padding: 8px;">${a.Respuesta ?? ""}</td>
                  </tr>
                `)}
            </tr>
          </table>
  
            ${firma ? `
            <br/>
            <p>Firma del solicitante:</p>
            <img src="cid:firma-usuario"
                alt="Firma del solicitante"
                style="max-width: 200px; max-height: 80px; object-fit: contain;" />
          `
          : ""
        }
        `;
        
        const from = account?.username ?? ""; // ajusta esto
  
        await graph.sendMail(from, {
          message: {
            subject: `Novedad paz y salvo - ${IdPazSalvo!.Nombre}  ${IdPazSalvo!.Title} `,
            body: {
              contentType: "HTML",
              content: htmlBody,
            },
            toRecipients,
          },
          saveToSentItems: true,
        });
      }

      alert("Se ha registrado la respuesta con éxito");
      cleanState();
      return {
        created,
        cerrar
      };
    } finally {
      setLoading(false);
    }
  };

  const getAttachments = async (idRespuesta: string) => {

    setLoading(true);
    try {
        const res = await getFlow.invoke<any, any>({
          itemId: Number(idRespuesta)
        });
        return res
    } finally {
      setLoading(false);
    }
  };


  return {
    rows, loading, state, errors,
     applyRange, reloadAll, setSearch, setField, handleSubmit, cleanState, loadUserRespuestas, loadPazSalvoRespuestas, loadUserRespuestasAll, getAttachments
  };
}

