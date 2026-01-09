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

      if (filesArray?.length && created?.Id) {
        const filesForFlow = await Promise.all(
          Array.from(filesArray).map(async (f) => ({
            name: f.name,
            contentBytes: await fileToBase64(f),
          }))
        );

        await notifyFlow.invoke<any, any>({
          pazId: Number(created.Id),
          files: filesForFlow,
        });
      }

      // ========= Helpers =========
      const from = account?.username ?? "";
      const toRecipients = [
        { emailAddress: { address: IdPazSalvo!.CorreoJefe } },
        { emailAddress: { address: IdPazSalvo!.Solicitante } },
      ];

      const firmaHtml = firma
        ? `
          <br/>
          <p style="margin:12px 0 6px 0;">Firma del solicitante:</p>
          <img
            src="cid:firma-usuario"
            alt="Firma del solicitante"
            style="max-width:200px; max-height:80px; object-fit:contain; display:block;"
          />
        `
        : "";

      type TableVariant = "danger" | "warning" | "success";

      const headerStyleByVariant: Record<TableVariant, string> = {
        danger: "background-color:#f8d7da; color:#842029;",   // rojo suave
        warning: "background-color:#fff3cd; color:#664d03;",  // amarillo
        success: "background-color:#d1e7dd; color:#0f5132;",  // verde
      };

      const buildRowsHtml = (rows: any[]) =>
        rows
          .map(
            (a) => `
              <tr>
                <td style="padding:8px; border:1px solid #ddd;">${a.Area ?? ""}</td>
                <td style="padding:8px; border:1px solid #ddd;">${a.Title ?? ""}</td>
                <td style="padding:8px; border:1px solid #ddd;">${a.Correo ?? ""}</td>
                <td style="padding:8px; border:1px solid #ddd;">${a.Estado ?? ""}</td>
                <td style="padding:8px; border:1px solid #ddd;">${a.Respuesta ?? ""}</td>
              </tr>
            `
          )
          .join("");

      const buildTableHtml = (variant: TableVariant, rows: any[]) => `
        <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse; width:100%; font-family:Segoe UI, Arial, sans-serif; font-size:14px;">
          <thead>
            <tr style="${headerStyleByVariant[variant]}">
              <th style="padding:10px; border:1px solid #ddd; text-align:left;">Área</th>
              <th style="padding:10px; border:1px solid #ddd; text-align:left;">Nombre del aprobador</th>
              <th style="padding:10px; border:1px solid #ddd; text-align:left;">Correo del aprobador</th>
              <th style="padding:10px; border:1px solid #ddd; text-align:left;">Respuesta</th>
              <th style="padding:10px; border:1px solid #ddd; text-align:left;">Motivo</th>
            </tr>
          </thead>
          <tbody>
            ${buildRowsHtml(rows)}
          </tbody>
        </table>
        ${firmaHtml}
      `;

      const sendMailHtml = async (html: string, subject: string) => {
        await graph.sendMail(from, {
          message: {
            subject,
            body: { contentType: "HTML", content: html },
            toRecipients,
          },
          saveToSentItems: true,
        });
      };

      // ========= 3) Si el estado actual es Rechazado -> mail inmediato =========
      if (state.Estado === "Rechazado") {
        const singleRow = [
          {
            Area: state.Area,
            Title: state.Title,
            Correo: state.Correo,
            Estado: state.Estado,
            Respuesta: state.Respuesta,
          },
        ];

        await sendMailHtml(buildTableHtml("danger", singleRow), `Novedad paz y salvo - ${IdPazSalvo!.Nombre} ${IdPazSalvo!.Title}`);
      }

      if (state.Estado === "Novedad") {
        const singleRow = [
          {
            Area: state.Area,
            Title: state.Title,
            Correo: state.Correo,
            Estado: state.Estado,
            Respuesta: state.Respuesta,
          },
        ];

        await sendMailHtml(buildTableHtml("warning", singleRow), `Novedad paz y salvo - ${IdPazSalvo!.Nombre} ${IdPazSalvo!.Title}`);
      }

      // ========= 4) Calcular cierre (consultas en paralelo) =========
      const [aprobados, todos] = await Promise.all([
        respuestaSvc.getAll({
          filter: `fields/IdPazSalvo eq '${IdPazSalvo!.Id}' and fields/Estado eq 'Aprobado'`,
        }),
        respuestaSvc.getAll({
          filter: `fields/IdPazSalvo eq '${IdPazSalvo!.Id}'`,
        }),
      ]);

      let cerrar = false;

      if (aprobados.length >= IdPazSalvo!.Solicitados.length) {
        cerrar = true;
        const allApproved = todos.every((x: any) => String(x.Estado ?? "").toLowerCase() === "aprobado");
        const variant: TableVariant = allApproved ? "success" : "warning";

        await sendMailHtml(buildTableHtml(variant, todos), `Consolidado paz y salvo - ${IdPazSalvo!.Nombre} ${IdPazSalvo!.Title}`);
      }

      alert("Se ha registrado la respuesta con éxito");
      cleanState();

      return { created, cerrar };
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

