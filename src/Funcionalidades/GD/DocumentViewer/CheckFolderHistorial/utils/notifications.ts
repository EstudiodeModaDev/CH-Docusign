import type { GraphRecipient, GraphUserLite } from "../../../../../graph/graphRest";
import type { MailService } from "../../../../../Services/Mail.service";

export async function notifyFolderReady(mail: MailService, folderInfo: {cedula: string, nombre: string, fullname: string, path: string},): Promise<void> {
  const body = `  
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; margin: 0; padding: 30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.08);">
          
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #1d4ed8, #2563eb); padding: 32px 40px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; line-height: 32px; color: #ffffff; font-weight: bold;">
                  Carpeta lista para revisión
                </h1>
                <p style="margin: 10px 0 0; font-size: 14px; line-height: 22px; color: #dbeafe;">
                  Notificación automática del sistema
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 18px; font-size: 16px; line-height: 26px;">
                  Cordial saludo,
                </p>

                <p style="margin: 0 0 18px; font-size: 16px; line-height: 26px;">
                  Se informa que la carpeta
                  <strong style="color: #2563eb;">${folderInfo.fullname}</strong>
                  ya se encuentra lista para la revisión y posterior visto bueno por parte del área de
                  <strong>Gestión Documental</strong>.
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 8px; font-size: 14px; color: #1d4ed8; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                        Detalle
                      </p>
                      <p style="margin: 0; font-size: 15px; line-height: 24px; color: #374151;">
                        La carpeta ha sido marcada como preparada para continuar con el proceso de validación documental.
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 18px; font-size: 16px; line-height: 26px;">Agradecemos realizar la revisión correspondiente para continuar con el flujo establecido.</p>

                <p style="margin: 0; font-size: 16px; line-height: 26px;">Quedamos atentos.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">
                Este es un mensaje generado automáticamente, por favor no responder a este correo.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © Gestión Documental
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  `;

  const to: GraphRecipient[] = [
    {
      emailAddress: { address: "gestiondocumental@estudiodemoda.com.co" },
    },
  ];

  await mail.sendEmail({
    message: {
      subject: `Revisión pendiente – Carpeta ${folderInfo.fullname}`,
      body: {
        contentType: "HTML",
        content: body,
      },
      toRecipients: to,
    },
  });
}

export async function notifyReturnedFolder(mail: MailService, folderInfo: { cedula: string; nombre: string; fullname: string; path: string }, motivo: string, groupMembers: GraphUserLite[]): Promise<void> {
  const body = `  
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; margin: 0; padding: 30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.08);">
          
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px 40px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; line-height: 32px; color: #ffffff; font-weight: bold;">
                  Carpeta devuelta
                </h1>
                <p style="margin: 10px 0 0; font-size: 14px; line-height: 22px; color: #fee2e2;">
                  Acción requerida
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 18px; font-size: 16px; line-height: 26px;">
                  Cordial saludo,
                </p>

                <p style="margin: 0 0 18px; font-size: 16px; line-height: 26px;">
                  La carpeta <strong style="color: #dc2626;">${folderInfo.fullname}</strong> ha sido revisada por el área de <strong>Gestión Documental</strong> y  <strong>ha sido devuelta para ajustes</strong>.
                </p>

                <!-- Motivo -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 8px; font-size: 14px; color: #b91c1c; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                        Motivo de devolución
                      </p>
                      <p style="margin: 0; font-size: 15px; line-height: 24px; color: #374151;">
                        ${motivo || "No se especificó un motivo."}
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 18px; font-size: 16px; line-height: 26px;">
                  Por favor realizar las correcciones indicadas y volver a enviar la carpeta para continuar con el proceso de validación.
                </p>

                <p style="margin: 0; font-size: 16px; line-height: 26px;">
                  Quedamos atentos.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">
                  Este es un mensaje generado automáticamente, por favor no responder a este correo.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  `;

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

  await mail.sendEmail({
    message: {
      subject: `Carpeta devuelta – ${folderInfo.fullname}`,
      body: {
        contentType: "HTML",
        content: body,
      },
      toRecipients: to,
    },
  });
}

export async function notifyApprovedFolder(mail: MailService, folderInfo: { cedula: string; nombre: string; fullname: string; path: string }, aprobador: string, groupMembers: GraphUserLite[]): Promise<void> {
  const body = `  
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; margin: 0; padding: 30px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.08);">
          
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 32px 40px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; line-height: 32px; color: #ffffff; font-weight: bold;">
                  Carpeta aprobada
                </h1>
                <p style="margin: 10px 0 0; font-size: 14px; line-height: 22px; color: #dcfce7;">
                  Proceso completado correctamente
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                <p style="margin: 0 0 18px; font-size: 16px; line-height: 26px;">
                  Cordial saludo,
                </p>

                <p style="margin: 0 0 18px; font-size: 16px; line-height: 26px;">
                  La carpeta <strong style="color: #16a34a;">${folderInfo.fullname}</strong> ha sido revisada por el área de <strong>Gestión Documental</strong> y 
                  <strong>aprobada satisfactoriamente</strong>.
                </p>

                <!-- Info -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <p style="margin: 0 0 8px; font-size: 14px; color: #166534; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                        Detalles de aprobación
                      </p>
                      <p style="margin: 0; font-size: 15px; line-height: 24px; color: #374151;">
                        <strong>Aprobado por:</strong> ${aprobador || "No especificado"}
                      </p>
                      <p style="margin: 6px 0 0; font-size: 15px; line-height: 24px; color: #374151;">
                        <strong>Cédula:</strong> ${folderInfo.cedula}
                      </p>
                      <p style="margin: 6px 0 0; font-size: 15px; line-height: 24px; color: #374151;">
                        <strong>Nombre:</strong> ${folderInfo.nombre}
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 18px; font-size: 16px; line-height: 26px;">
                  No se requieren acciones adicionales. La carpeta ha finalizado correctamente su proceso de validación.
                </p>

                <p style="margin: 0; font-size: 16px; line-height: 26px;">
                  Gracias por su gestión.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">
                  Este es un mensaje generado automáticamente, por favor no responder a este correo.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  `;

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

  await mail.sendEmail({
    message: {
      subject: `Carpeta aprobada – ${folderInfo.fullname}`,
      body: {
        contentType: "HTML",
        content: body,
      },
      toRecipients: to,
    },
  });
}