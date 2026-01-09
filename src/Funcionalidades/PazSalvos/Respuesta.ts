import React from "react";
import type { PazSalvo, respuestaErrors, respuestas } from "../../models/PazSalvo";
import type { RespuestaService } from "../../Services/Respuesta.service";
import { useAuth } from "../../auth/authProvider";
import { FlowClient } from "../FlowClient";
import type { FirmaInline } from "../../models/Imagenes";
import { useGraphServices } from "../../graph/graphContext";

export function useRespuestasPazSalvos(respuestaSvc: RespuestaService, IdPazSalvo?: PazSalvo) {
  const [rows, setRows] = React.useState<respuestas[]>([]);
  const { account } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState<string>("");

  const [state, setState] = React.useState<respuestas>({Title: account?.name ?? "", Correo: account?.username ?? "", Area: "", Estado: "", IdPazSalvo: IdPazSalvo?.Id ?? "", Respuesta: "",});

  const [errors, setErrors] = React.useState<respuestaErrors>({});
  const { graph } = useGraphServices();

  const setField = <K extends keyof respuestas>(k: K, v: respuestas[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/cc78cbdc7e764c11a14b11efd32011fb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=--jCvPXdSRgwIpNxrZo8RXkkXecNt5TK2Gyms19Vn0c");

  const getFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/89d64252417d4a96b3fa8c87fc66e776/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=v-oDHxbLUjANTLzoOQRH5o9ks4BdL4LsEHuJNUNL4c4");

  // =========================
  // Helpers
  // =========================

  const validate = () => {
    const e: respuestaErrors = {};
    if (!state.Correo) e.Correo = "Obligatorio";
    if (!state.Title) e.Title = "Obligatorio";
    if (!state.Area) e.Area = "Obligatorio";
    if (!state.Respuesta) e.Respuesta = "Obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const cleanState = () => {
    setState({Correo: "", Title: "", Area: "", Estado: "", IdPazSalvo: "", Respuesta: "",});
  };

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

  const stripDataUrl = (b64: string) => {
    const i = b64.indexOf("base64,");
    return i >= 0 ? b64.slice(i + "base64,".length) : b64;
  };

  const guessMimeFromName = (name?: string) => {
    const n = (name ?? "").toLowerCase();
    if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
    if (n.endsWith(".png")) return "image/png";
    if (n.endsWith(".webp")) return "image/webp";
    if (n.endsWith(".gif")) return "image/gif";
    return "image/png";
  };

  const buildInlineFirmaAttachment = (firma?: FirmaInline | null) => {
    const hasFirma = !!firma?.contentBytes;
    const contentId = "firma-usuario";

    if (!hasFirma) {
      return {
        hasFirma: false as const,
        contentId,
        firmaHtml: "",
        attachments: [] as any[],
      };
    }

    const fileName = firma?.fileName || "firma.png";
    const contentType = guessMimeFromName(fileName);

    // base64 PURO (sin data:image/...;base64,)
    const base64Pure = stripDataUrl(String(firma!.contentBytes)).replace(/\s+/g, "");

    if (base64Pure.length < 50) {
      console.warn("[DEBUG] Firma base64 muy corta. Revisa la fuente.", base64Pure.slice(0, 30));
    }

    const attachments = [
      {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: fileName,
        contentType,
        contentBytes: base64Pure,
        isInline: true,
        contentId,
      },
    ];

    const firmaHtml = `
      <br/>
      <p style="margin:12px 0 6px 0;"><strong>Firma del solicitante:</strong></p>
      <img
        src="cid:${contentId}"
        alt="Firma del solicitante"
        style="max-width:200px; max-height:80px; object-fit:contain; display:block;"
      />
    `;

    return { hasFirma: true as const, contentId, firmaHtml, attachments };
  };

  type TableVariant = "danger" | "warning" | "success";

  const headerStyleByVariant: Record<TableVariant, string> = {
    danger: "background-color:#f8d7da; color:#842029;", // rojo suave
    warning: "background-color:#fff3cd; color:#664d03;", // amarillo
    success: "background-color:#d1e7dd; color:#0f5132;", // verde
  };

  const buildRowsHtml = (arr: any[]) =>
    arr
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

  const buildTableHtml = (variant: TableVariant, arr: any[]) => `
    <table border="0" cellspacing="0" cellpadding="0"
      style="border-collapse:collapse; width:100%; font-family:Segoe UI, Arial, sans-serif; font-size:14px;">
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
        ${buildRowsHtml(arr)}
      </tbody>
    </table>
  `;

  const sendMailHtml = async (html: string, subject: string, firma?: FirmaInline | null) => {
    const from = account?.username ?? "";

    const toRecipients = [
      { emailAddress: { address: IdPazSalvo!.CorreoJefe } },
      { emailAddress: { address: IdPazSalvo!.Solicitante } },
    ];

    const { attachments, firmaHtml } = buildInlineFirmaAttachment(firma);

    await graph.sendMail(from, {
      message: {
        subject,
        body: { contentType: "HTML", content: html + firmaHtml },
        toRecipients,
        ...(attachments.length ? { attachments } : {}),
      },
      saveToSentItems: true,
    });
  };

  // =========================
  // Loads
  // =========================

  const loadPazSalvoRespuestas = React.useCallback(async () => {
    setLoading(true);
    try {
      const items = await respuestaSvc.getAll({
        filter: `fields/IdPazSalvo eq '${IdPazSalvo?.Id}'`,
      });
      setRows(items);
    } catch (e: any) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [respuestaSvc, IdPazSalvo?.Id]);

  const loadUserRespuestas = React.useCallback(
    async (PazSalvoId: string) => {
      setLoading(true);
      try {
        const items = await respuestaSvc.getAll({
          filter: `fields/IdPazSalvo eq '${PazSalvoId}' and fields/Correo eq '${account?.username}' and fields/Estado eq 'Aprobado' or fields/Estado eq 'Novedad'`,
        });
        return items;
      } catch (e: any) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [respuestaSvc, account?.username]
  );

  const loadUserRespuestasAll = React.useCallback(
    async (PazSalvoId: string) => {
      setLoading(true);
      try {
        const items = await respuestaSvc.getAll({
          filter: `fields/IdPazSalvo eq '${PazSalvoId}' and fields/Correo eq '${account?.username}'`,
        });
        return items;
      } catch (e: any) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [respuestaSvc, account?.username]
  );

  React.useEffect(() => {
    loadPazSalvoRespuestas();
  }, [loadPazSalvoRespuestas, search]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => {
    loadPazSalvoRespuestas();
  }, [loadPazSalvoRespuestas]);

  const reloadAll = React.useCallback(() => {
    loadPazSalvoRespuestas();
  }, [loadPazSalvoRespuestas]);

  // =========================
  // Submit
  // =========================

  const handleSubmit = async (filesArray: FileList | null, firma: FirmaInline | null): Promise<{ created: respuestas | null; cerrar: boolean }> => {
    if (!IdPazSalvo?.Id) {
      alert("No hay paz y salvo seleccionado.");
      return { created: null, cerrar: false };
    }

    if (!validate()) {
      return { created: null, cerrar: false };
    }

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

      // Adjuntos al flow
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

      const subjectBase = `Novedad paz y salvo - ${IdPazSalvo!.Nombre} ${IdPazSalvo!.Title}`;

      // Correo inmediato dependiendo del estado
      if (state.Estado === "Rechazado" || state.Estado === "Novedad") {
        const variant: TableVariant = state.Estado === "Rechazado" ? "danger" : "warning";

        const singleRow = [
          {
            Area: state.Area,
            Title: state.Title,
            Correo: state.Correo,
            Estado: state.Estado,
            Respuesta: state.Respuesta,
          },
        ];

        await sendMailHtml(buildTableHtml(variant, singleRow), subjectBase, firma);
      }

      // Consultas en paralelo para cierre
      const [aprobados, todos] = await Promise.all([
        respuestaSvc.getAll({filter: `fields/IdPazSalvo eq '${IdPazSalvo!.Id}' and fields/Estado eq 'Aprobado'`,}),
        respuestaSvc.getAll({filter: `fields/IdPazSalvo eq '${IdPazSalvo!.Id}'`,}),
      ]);

      let cerrar = false;

      if (aprobados.length >= (IdPazSalvo!.Solicitados?.length ?? 0)) {
        cerrar = true;

        const allApproved = todos.every(
          (x: any) => String(x?.Estado ?? "").toLowerCase() === "aprobado"
        );

        const variant: TableVariant = allApproved ? "success" : "warning";
        const subject = `Consolidado paz y salvo - ${IdPazSalvo!.Nombre} ${IdPazSalvo!.Title}`;

        await sendMailHtml(buildTableHtml(variant, todos), subject, firma);
      }

      alert("Se ha registrado la respuesta con éxito");
      cleanState();

      return { created, cerrar };
    } catch (e: any) {
      console.error(e);
      alert("Error registrando la respuesta: " + (e?.message ?? e));
      return { created: null, cerrar: false };
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Attachments getter
  // =========================

  const getAttachments = async (idRespuesta: string) => {
    setLoading(true);
    try {
      const res = await getFlow.invoke<any, any>({
        itemId: Number(idRespuesta),
      });
      return res;
    } finally {
      setLoading(false);
    }
  };

  return {
    rows,
    loading,
    state,
    errors,

    applyRange,
    reloadAll,
    setSearch,
    setField,

    handleSubmit,
    cleanState,

    loadUserRespuestas,
    loadPazSalvoRespuestas,
    loadUserRespuestasAll,

    getAttachments,
  };
}
