import type { GraphRecipient, GraphUserLite } from "../graph/graphRest";
import type { solicitud } from "../models/solicitudCambio";
import type { MailService } from "../Services/Mail.service";
import { spDateToDDMMYYYY } from "./Date";

export function createBody(user: string, modulo: string, nombre: string, cedula: string, cargo: string, fechaIngreso: string){
    const body = `<div style="font-family:Segoe UI, Roboto, Arial, sans-serif; background:#f6f7fb; padding:24px;">
                    <div style="max-width:720px; margin:0 auto; background:#ffffff; border:1px solid #e6e8ef; border-radius:14px; overflow:hidden;">
                        
                        <div style="padding:18px 22px; background:#0f172a;">
                        <h2 style="margin:0; font-size:18px; color:#ffffff; font-weight:700;">
                            Nuevo registro creado
                        </h2>
                        <p style="margin:6px 0 0; font-size:13px; color:#cbd5e1;">
                            Notificación automática del sistema
                        </p>
                        </div>

                        <div style="padding:22px;">
                        <p style="margin:0 0 14px; font-size:14px; color:#0f172a; line-height:1.5;">
                            Hola equipo,
                        </p>

                        <p style="margin:0 0 16px; font-size:14px; color:#0f172a; line-height:1.5;">
                            Les informo que <b>${user}</b> ha creado un nuevo registro en el módulo
                            <b>${modulo}</b> a nombre de:
                        </p>

                        <div style="border:1px solid #e6e8ef; border-radius:12px; padding:14px 16px; background:#fbfcff; margin:0 0 16px;">
                            <div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:8px;">
                                <span style="font-size:12px; color:#64748b; min-width:90px;">Cédula</span>
                                <span style="font-size:13px; color:#0f172a; font-weight:600;">${cedula}</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start;">
                                <span style="font-size:12px; color:#64748b; min-width:90px;">Nombre</span>
                                <span style="font-size:13px; color:#0f172a; font-weight:600;">${nombre}</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start;">
                                <span style="font-size:12px; color:#64748b; min-width:90px;">Cargo</span>
                                <span style="font-size:13px; color:#0f172a; font-weight:600;">${cargo ?? "N/A"}</span>
                            </div>
                            <div style="display:flex; gap:10px; align-items:flex-start;">
                                <span style="font-size:12px; color:#64748b; min-width:90px;">Fecha de ingreso</span>
                                <span style="font-size:13px; color:#0f172a; font-weight:600;">${fechaIngreso ? spDateToDDMMYYYY(fechaIngreso) : "N/A"}</span>
                            </div>
                        </div>

                        <p style="margin:0 0 6px; font-size:13px; color:#334155; line-height:1.5;">
                            Si requieren validar la información, por favor ingresen al módulo correspondiente y revisen el registro.
                        </p>

                        <p style="margin:0; font-size:13px; color:#64748b; line-height:1.5;">
                            Gracias.
                        </p>
                        </div>

                        <div style="padding:14px 22px; background:#f8fafc; border-top:1px solid #e6e8ef;">
                        <p style="margin:0; font-size:12px; color:#64748b; line-height:1.4;">
                            Este es un mensaje automático. Por favor no respondas a este correo.
                        </p>
                        </div>

                    </div>
                    </div>`;
    return body
}

export async function notifyTeam(mail: MailService, subject: string, body: string) {
  const to: GraphRecipient[] = [
    { emailAddress: { address: "auxiliarch@estudiodemoda.com.co" } },
    { emailAddress: { address: "nagomez@estudiodemoda.com.co" } },
    { emailAddress: { address: "parios@estudiodemoda.com.co" } },
    { emailAddress: { address: "dpalacios@estudiodemoda.com.co" } },
    { emailAddress: { address: "aprendizsst@estudiodemoda.com.co" } },
    { emailAddress: { address: "disaza@estudiodemoda.com.co" } },
  ];

  // ejemplo de uso:
  await mail.sendEmail({
    message: {
      subject: subject,
      body: { contentType: "HTML", content: body },
      toRecipients: to,
    },
  });
}

export function buildRecipients(emails: string[]): GraphRecipient[] {
  const unique = Array.from(
    new Set(
      (emails ?? [])
        .map(e => String(e ?? "").trim().toLowerCase())
        .filter(Boolean)
    )
  );

  return unique.map(address => ({ emailAddress: { address } }));
}

export function formatNIT(value?: string | number | null): string {
  if (!value) return "";

  // Deja solo números
  const digits = String(value).replace(/\D/g, "");

  if (digits.length < 2) return digits;

  const cuerpo = digits.slice(0, -1);
  const dv = digits.slice(-1);

  // separa miles con puntos
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${cuerpoFormateado}-${dv}`;
}

export async function notifyUpdateRequest(mail: MailService, modulo: string, usuario: string, cedula: string, groupMembers: GraphUserLite[],): Promise<void> {

  const body = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
          
      <h2 style="color: #2b6cb0;">Nueva solicitud de actualización</h2>

      <p>Se ha generado una nueva solicitud de modificación en el modulo ${modulo} que requiere su aprobación.</p>

      <hr style="border: none; border-top: 1px solid #eee;" />

      <h3 style="margin-bottom: 5px;">Información de la solicitud</h3>
      <p><strong>Tipo:</strong> ${modulo}</p>
      <p><strong>Cedula:</strong> ${cedula}</p>
      <p><strong>Solicitante:</strong> ${usuario}</p>

      <hr style="border: none; border-top: 1px solid #eee;" />

      <p>
        Por favor, ingrese al sistema para revisar y aprobar o rechazar esta solicitud.
      </p>

      <p style="margin-top: 20px; font-size: 12px; color: #888;">
        Este es un mensaje automático, por favor no responder.
      </p>

    </div>`;

  const to: GraphRecipient[] = groupMembers
    .map((member) => {
      const address = (member.mail ?? member.userPrincipalName ?? "").trim();

      if (!address) return null;

      return {
        emailAddress: {
          address,
        },
      };
    })
    .filter((recipient): recipient is GraphRecipient => recipient !== null);

  if (to.length === 0) {
    throw new Error("notifyUpdateRequest: no hay destinatarios válidos");
  }



  try{  
    await mail.sendEmail({
      message: {
        subject: `Solicitud de actualización pendiente - ${modulo} #${cedula}`,
        body: {
          contentType: "HTML",
          content: body,
        },
        toRecipients: to,
      },
    });
  } catch {
    alert("Fallo el correo")
  }
}

export async function notifyAceptedRequest(mail: MailService, modulo: string, solicitud: solicitud,): Promise<void> {

    const body = `
       <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        
        <h2 style="color: #2f855a;">Solicitud aprobada</h2>

        <p>
          La solicitud de actualización en el módulo <strong>${modulo}</strong> ha sido 
          <strong>aprobada exitosamente</strong>.
        </p>

        <hr style="border: none; border-top: 1px solid #eee;" />

        <h3 style="margin-bottom: 5px;">Información de la solicitud</h3>
        <p><strong>Tipo:</strong> ${modulo}</p>
        <p><strong>Aprobador:</strong> ${solicitud.Aprobador}</p>

        <h3 style="margin-bottom: 5px;">Comentario del aprobador</h3>
        <p>${solicitud.comentarioAprobador}</p>

        <hr style="border: none; border-top: 1px solid #eee;" />

        <p>
          Los cambios han sido aplicados correctamente en el sistema.
        </p>

        <p style="margin-top: 20px; font-size: 12px; color: #888;">
          Este es un mensaje automático, por favor no responder.
        </p>

    </div>`;

  const to: GraphRecipient[] = [{emailAddress: {address: solicitud.CorreoSolicitante}}]

  await mail.sendEmail({
    message: {
      subject: `Solicitud de actualización pendiente - ${modulo}`,
      body: {
        contentType: "HTML",
        content: body,
      },
      toRecipients: to,
    },
  });
}

export async function notifyRejectedRequest(mail: MailService, modulo: string, solicitud: solicitud,): Promise<void> {
  const comentario = solicitud.comentarioAprobador?.trim() || "Sin comentarios";

  const body = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
        
        <h2 style="color: #c53030;">Solicitud rechazada</h2>

        <p>
          La solicitud de actualización en el módulo <strong>${modulo}</strong> ha sido 
          <strong>rechazada</strong>.
        </p>

        <hr style="border: none; border-top: 1px solid #eee;" />

        <h3 style="margin-bottom: 5px;">Información de la solicitud</h3>
        <p><strong>Tipo:</strong> ${modulo}</p>
        <p><strong>Aprobador:</strong> ${solicitud.Aprobador ?? "No registrado"}</p>

        <h3 style="margin-bottom: 5px;">Motivo del rechazo</h3>
        <p>${comentario}</p>

        <hr style="border: none; border-top: 1px solid #eee;" />

        <p>
          Los cambios solicitados no fueron aplicados en el sistema.
        </p>

        <p style="margin-top: 20px; font-size: 12px; color: #888;">
          Este es un mensaje automático, por favor no responder.
        </p>

    </div>
  `;

  const address = (solicitud.CorreoSolicitante ?? "").trim();

  if (!address) {
    throw new Error("notifyRejectedRequest: correo del solicitante inválido");
  }

  const to: GraphRecipient[] = [
    {
      emailAddress: { address },
    },
  ];

  await mail.sendEmail({
    message: {
      subject: `Solicitud rechazada - ${modulo}`,
      body: {
        contentType: "HTML",
        content: body,
      },
      toRecipients: to,
    },
  });
}