import { useCoreGraphServices, useRequisicionesServices } from "../../../../graph/graphContext";
import type { requisiciones } from "../../../../models/Requisiciones/requisiciones";
import { spDateToDDMMYYYY } from "../../../../utils/Date";
import { buildRecipients } from "../../../../utils/mail";
import { emailsArray } from "../../../../utils/text";

export function useNotifyRequisiciones() {
  const { maestrosMotivos } = useRequisicionesServices();
  const { mail } = useCoreGraphServices();

  const formatDate = (value?: string | null) => {
    if (!value) return "No definida";

    try {
      return spDateToDDMMYYYY(value);
    } catch {
      return value;
    }
  };

  const notifyAsignacion = async (created: requisiciones) => {
    if(created.motivo === "Apertura de tienda") {
      notifyAsignacionNuevaTienda(created)
      return
    }

    notifyAsignacionNormal(created)
  };

  const notifyAsignacionNormal = async (created: requisiciones) => {
    const detailsRows = [
      ["Cargo", created.Title],
      ["Ciudad", created.Ciudad],
      ["Inicio estimado", formatDate(created.fechaInicioProceso)],
      ["Fecha limite de cobertura", formatDate(created.fechaLimite)],
      ["Area", created.descripcionCentroCosto],
      ["Jefatura", created.direccion],
    ];

    if (created.tipoRequisicion === "Retail" && created.tienda) {
      detailsRows.splice(4, 0, ["Ubicacion", created.tienda]);
    }

    const htmlBody = `
      <div style="font-family: Segoe UI, Roboto, Arial, sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="padding: 22px 24px; background: linear-gradient(135deg, #0f766e, #0ea5a4);">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #ccfbf1;">
              Notificacion automatica
            </p>
            <h2 style="margin: 8px 0 0; font-size: 22px; line-height: 1.3; color: #ffffff;">
              Nueva requisicion asignada
            </h2>
            <p style="margin: 10px 0 0; font-size: 13px; line-height: 1.6; color: #d1fae5;">
              ID ${created.Id ?? "Sin ID"} - ${created.tipoRequisicion || "Tipo no definido"}
            </p>
          </div>

          <div style="padding: 24px;">
            <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #0f172a;">
              Cordial saludo,
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #334155;">
              Tienes una nueva requisicion pendiente por gestionar. A continuacion encontraras la informacion principal para iniciar el proceso.
            </p>

            <div style="margin: 0 0 20px; padding: 14px 16px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px;">
              <p style="margin: 0; font-size: 13px; color: #115e59;">
                <strong>Accion requerida:</strong> Inicia la gestion lo antes posible para asegurar el cumplimiento de la fecha objetivo de cobertura.
              </p>
            </div>

            <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <tbody>
                ${detailsRows
                  .map(
                    ([label, value], index) => `
                      <tr>
                        <td style="padding: 12px 16px; ${index < detailsRows.length - 1 ? "border-bottom: 1px solid #e2e8f0;" : ""} color: #475569; font-size: 13px; width: 34%;">
                          ${label}
                        </td>
                        <td style="padding: 12px 16px; ${index < detailsRows.length - 1 ? "border-bottom: 1px solid #e2e8f0;" : ""} color: #0f172a; font-size: 13px; font-weight: 600;">
                          ${value || "No definido"}
                        </td>
                      </tr>
                    `,
                  )
                  .join("")}
              </tbody>
            </table>

            <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Gracias por tu gestion y apoyo en el seguimiento de esta vacante.
            </p>

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
        subject: `Nueva requisicion asignada ID: ${created.Id}`,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients,
      },
      saveToSentItems: true,
    };

    await mail.sendEmail(mailPayload);
  };

  const notifyAsignacionNuevaTienda = async (created: requisiciones) => {
    const htmlBody = `
      Hola,

      Se genero una nueva requisicion asociada a la proxima apertura de tienda:

      Motivo: Nueva tienda proxima a apertura
      Centro operativo: ${created.codigoCentroOperativo}

      Accion requerida:
      Iniciar gestion prioritaria para garantizar la cobertura de la vacante antes de la apertura.

      Vamos con toda.
    `;

    const toRecipients = buildRecipients([created.correoProfesional]);

    const mailPayload: any = {
      message: {
        subject: `Nueva requisicion asignada ID: ${created.Id}`,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients,
      },
      saveToSentItems: true,
    };

    await mail.sendEmail(mailPayload);
  };

  const notifcacionPlantaIdeal = async (
    motivo: string,
    coCodigo: string,
    planta: { actual: number; aprobada: number },
  ) => {
    const opciones = await maestrosMotivos.getAll({ filter: `fields/Title eq '${motivo}'` });
    const final = opciones[0];

    if (!final) return;

    const htmlBody = `
      <div style="font-family: Segoe UI, Roboto, Arial, sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="padding: 20px 24px; background: #7c2d12;">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #fed7aa;">
              Notificacion automatica
            </p>
            <h2 style="margin: 8px 0 0; font-size: 22px; line-height: 1.3; color: #ffffff;">
              Alerta de planta ideal
            </h2>
          </div>

          <div style="padding: 24px;">
            <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #0f172a;">
              Cordial saludo,
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #334155;">
              Se genero una alerta relacionada con la planta de personal. Por favor revise la informacion reportada para validar si la requisicion requiere ajuste antes de continuar con el proceso.
            </p>

            <div style="margin: 0 0 20px; padding: 14px 16px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px;">
              <p style="margin: 0; font-size: 13px; color: #9a3412;">
                <strong>Accion requerida:</strong> Validar la disponibilidad de planta y gestionar el ajuste correspondiente en la requisicion.
              </p>
            </div>

            <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <tbody>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; width: 34%;">
                    Motivo
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${motivo || "No definido"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px;">
                    Planta aprobada
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${planta.aprobada}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px;">
                    Planta actual
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${planta.actual}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #475569; font-size: 13px;">
                    Centro operativo
                  </td>
                  <td style="padding: 12px 16px; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${coCodigo || "No definido"}
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
    const toRecipients = buildRecipients(emailsArray(final.destinatarios));

    const mailPayload: any = {
      message: {
        subject: `Advertencia: ${final.notificacion}`,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients,
      },
      saveToSentItems: true,
    };

    await mail.sendEmail(mailPayload);
  };

  const notifyEncuestaSatisfaccion = async (created: requisiciones) => {
    const htmlBody = `
      <div style="font-family: Segoe UI, Roboto, Arial, sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="padding: 22px 24px; background: linear-gradient(135deg, #1d4ed8, #06b6d4);">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #dbeafe;">
              Notificacion automatica
            </p>
            <h2 style="margin: 8px 0 0; font-size: 22px; line-height: 1.3; color: #ffffff;">
              Queremos conocer tu experiencia
            </h2>
            <p style="margin: 10px 0 0; font-size: 13px; line-height: 1.6; color: #e0f2fe;">
              Requisicion ID ${created.Id ?? "Sin ID"}
            </p>
          </div>

          <div style="padding: 24px;">
            <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #0f172a;">
              Cordial saludo,
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #334155;">
              Tu opinion es muy importante para nosotros. Te invitamos a responder una breve encuesta sobre tu experiencia con el proceso de la requisicion.
            </p>

            <div style="margin: 0 0 20px; padding: 14px 16px; background: #f0f9ff; border: 1px solid #7dd3fc; border-radius: 12px;">
              <p style="margin: 0; font-size: 13px; color: #0c4a6e;">
                <strong>Tiempo estimado:</strong> Menos de 2 minutos. Tu respuesta nos ayuda a seguir mejorando.
              </p>
            </div>

            <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
              <tbody>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; width: 34%;">
                    ID requisicion
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${created.Id ?? "No definido"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #475569; font-size: 13px;">
                    Cargo
                  </td>
                  <td style="padding: 12px 16px; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${created.Title || "No definido"}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style="text-align: center; margin: 0 0 20px;">
              <a
                href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=2exIzRV-S0-X2eyBPuQrLF3m5FzsBdxHhLUgg6x-S0RUMzNOWU41TVFaUDFGUTdES0xCRjJRUjlDUC4u"
                style="display: inline-block; padding: 12px 20px; background: #0284c7; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;"
              >
                Responder encuesta
              </a>
            </div>

            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Gracias por tu tiempo y apoyo.
            </p>

            <p style="margin: 20px 0 0; font-size: 12px; line-height: 1.6; color: #64748b;">
              Este es un mensaje automatico generado por el sistema. Por favor no responder a este correo.
            </p>
          </div>
        </div>
      </div>
    `;
    const toRecipients = buildRecipients([created.correoSolicitante]);

    const mailPayload: any = {
      message: {
        subject: `Queremos conocer tu experiencia`,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients,
      },
      saveToSentItems: true,
    };

    await mail.sendEmail(mailPayload);
  };

  const notifyInconveniente = async (created: requisiciones, tipoError: string, explicacion: string) => {
    const htmlBody = `
      <div style="font-family: Segoe UI, Roboto, Arial, sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
          <div style="padding: 22px 24px; background: linear-gradient(135deg, #b91c1c, #f97316);">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #fee2e2;">
              Notificacion automatica
            </p>
            <h2 style="margin: 8px 0 0; font-size: 22px; line-height: 1.3; color: #ffffff;">
              Novedad detectada en la requisicion
            </h2>
            <p style="margin: 10px 0 0; font-size: 13px; line-height: 1.6; color: #ffedd5;">
              Requisicion ID ${created.Id ?? "Sin ID"}
            </p>
          </div>

          <div style="padding: 24px;">
            <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #0f172a;">
              Cordial saludo,
            </p>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #334155;">
              Identificamos una novedad en la requisicion creada. Por favor revisa la informacion para realizar los ajustes necesarios y continuar con el proceso.
            </p>

            <div style="margin: 0 0 20px; padding: 14px 16px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 12px;">
              <p style="margin: 0; font-size: 13px; color: #9a3412;">
                <strong>Accion requerida:</strong> Ingresa a la requisicion, valida la informacion registrada y corrige el inconveniente reportado.
              </p>
            </div>

            <table role="presentation" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <tbody>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px; width: 34%;">
                    ID requisicion
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${created.Id ?? "No definido"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 13px;">
                    Cargo
                  </td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${created.Title || "No definido"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #475569; font-size: 13px;">
                    Tipo de error
                  </td>
                  <td style="padding: 12px 16px; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${tipoError || "No definido"}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 16px; color: #475569; font-size: 13px;">
                    Explicación del error
                  </td>

                  <td style="padding: 12px 16px; color: #0f172a; font-size: 13px; font-weight: 600;">
                    ${explicacion || "No definido"}
                  </td>
                </tr>
              </tbody>
            </table>

            <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Si necesitas apoyo, estamos atentos para ayudarte.
            </p>

            <p style="margin: 20px 0 0; font-size: 12px; line-height: 1.6; color: #64748b;">
              Este es un mensaje automatico generado por el sistema. Por favor no responder a este correo.
            </p>
          </div>
        </div>
      </div>
    `;
    const toRecipients = buildRecipients([created.correoSolicitante]);

    const mailPayload: any = {
      message: {
        subject: `Novedad en requisicion ID: ${created.Id}`,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients,
      },
      saveToSentItems: true,
    };

    await mail.sendEmail(mailPayload);
  };

  return {
    notifcacionPlantaIdeal,
    notifyAsignacion,
    notifyEncuestaSatisfaccion,
    notifyInconveniente
  };
}
