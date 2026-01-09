import type { GraphRecipient } from "../graph/graphRest";
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
