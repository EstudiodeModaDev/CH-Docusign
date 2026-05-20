import { useGraphServices } from "../../../../graph/graphContext";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import { spDateToDDMMYYYY } from "../../../../utils/Date";
import { buildRecipients } from "../../../../utils/mail";
import { emailsArray } from "../../../../utils/text";

export function useNotifyRequisiciones() {
  const graph = useGraphServices();

  const formatDate = (value?: string | null) => {
    if (!value) return "No definida";

    try {
      return spDateToDDMMYYYY(value);
    } catch {
      return value;
    }
  };

  const notifyAsignacion = async (created: requisiciones) => {
    const tipoDetalleLabel = created.tipoRequisicion === "Retail" ? "Marca" : "Area";
    const tiendaHtml = created.tipoRequisicion === "Retail"
      ? `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; width: 34%;">
            Tienda
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
            ${created.tienda || "No definida"}
          </td>
        </tr>
      `
      : "";

    const htmlBody = `
      <div style="font-family: Segoe UI, Roboto, Arial, sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="padding: 20px 24px; background: #0f172a;">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #cbd5e1;">
              Notificacion automatica
            </p>
            <h2 style="margin: 8px 0 0; font-size: 22px; line-height: 1.3; color: #ffffff;">
              Requisicion asignada para gestion
            </h2>
          </div>

          <div style="padding: 24px;">
            <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #0f172a;">
              Cordial saludo,
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #334155;">
              Se ha asignado la siguiente requisicion para su gestion. Por favor revise la informacion y continue con el proceso correspondiente.
            </p>

            <div style="margin: 0 0 20px; padding: 14px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;">
              <p style="margin: 0; font-size: 13px; color: #1d4ed8;">
                <strong>ID de requisicion:</strong> ${created.Id}
              </p>
            </div>

            <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <tbody>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; width: 34%;">
                    Cargo
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${created.Title || "No definido"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px;">
                    Tipo de requisicion
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${created.tipoRequisicion || "No definido"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px;">
                    Ciudad
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${created.Ciudad || "No definida"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px;">
                    Fecha de inicio
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${formatDate(created.fechaInicioProceso)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px;">
                    Fecha limite
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${formatDate(created.fechaLimite)}
                  </td>
                </tr>
                ${tiendaHtml}
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px;">
                    ${tipoDetalleLabel}
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${created.descripcionCentroCosto || "No definida"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #475569; font-size: 13px;">
                    Jefatura
                  </td>
                  <td style="padding: 12px 16px; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${created.direccion || "No definida"}
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="margin: 20px 0 0; font-size: 12px; line-height: 1.6; color: #64748b;">
              Este es un mensaje automatico generado por el sistema. Por favor no responder a este correo.
            </p>
          </div>
        </div>
      </div>
    `;

    const toRecipients = buildRecipients([created.correoProfesional]);

    const mailPayload: any = {
      message: {
        subject: `Requisicion asignada ID - ${created.Id}`,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients,
      },
      saveToSentItems: true,
    };

    await graph.mail.sendEmail(mailPayload);
  };

  const notificarMotivo = async (motivo: string, coCodigo: string, coNombre: string) => {
    const opciones = await graph.maestrosMotivos.getAll({ filter: `fields/Title eq '${motivo}'` });
    const final = opciones[0];

    if (!final) return;

    switch (final.realVsPpto) {
      case "todos": {
        const htmlBody = `${final.notificacion} <br> <br> <strong>Centro Operativo:</strong> ${coCodigo} - ${coNombre}`;
        const toRecipients = buildRecipients(emailsArray(final.destinatarios));

        const mailPayload: any = {
          message: {
            subject: `Advertencia: ${final.notificacion}`,
            body: { contentType: "HTML", content: htmlBody },
            toRecipients,
          },
          saveToSentItems: true,
        };
        await graph.mail.sendEmail(mailPayload);
        break;
      }

      // TODO: Anadir validacion de planta real vs planta
    }
  };

  return {
    notificarMotivo, notifyAsignacion
  };
}
