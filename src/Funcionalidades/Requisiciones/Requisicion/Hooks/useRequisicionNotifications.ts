import { useGraphServices } from "../../../../graph/graphContext";
import type { requisiciones } from "../../../../models/requisiciones";
import { buildRecipients } from "../../../../utils/mail";
import { emailsArray } from "../../../../utils/text";

export function useNotifyRequisiciones() {
  const graph = useGraphServices()
 
  const notifyAsignacion = async (created: requisiciones) => {

    const htmlBody = `
      Cordial saludo,<br> 
      <br> Por favor gestionar la siguiente requisición: <br> <br> <br>
      <strong>Cargo</strong>: ${created.Title} <br> <br> 
      <strong>Ciudad:</strong> ${created.Ciudad} <br> <br> 
      <strong>Fecha de inicio:</strong> ${created.fechaInicioProceso} <br> <br> 
      <strong>Fecha límite:</strong> ${created.fechaLimite} <br> <br> 
      <strong>Tienda:</strong> ${created.descripcionCentroOperativo} <br> 
      <strong>Área:</strong> ${created.Area} <br> <br> 
      <strong>Jefatura:</strong> ${created.direccion}
    `;

    const toRecipients = buildRecipients([created.correoProfesional])

    const mailPayload: any = {
      message: {
        subject: `Requisión asignada ID - ${created.Id}`,
        body: { contentType: "HTML", content: htmlBody },
      toRecipients,
    },
    saveToSentItems: true,
  };
    
  await graph.mail.sendEmail(mailPayload);
   
  };

  const notificarMotivo = async (motivo: string, coCodigo: string, coNombre: string) => {
    const opciones = await graph.maestrosMotivos.getAll({filter: `fields/Title eq '${motivo}'`})
    const final = opciones[0]

    if(!final) return
    
    switch(final.realVsPpto){
      case "todos": 
        const htmlBody = `${final.notificacion} <br> <br> <strong>Centro Operativo:</strong> ${coCodigo} - ${coNombre}`;
        const toRecipients = buildRecipients(emailsArray(final.destinatarios))

          const mailPayload: any = {
            message: {
              subject: `Advertencia: ${final.notificacion}`,
              body: { contentType: "HTML", content: htmlBody },
            toRecipients,
          },
            saveToSentItems: true,
          };  
        await graph.mail.sendEmail(mailPayload);
      break

      //TODO: Añadir validacion de planta real vs planta 

    }
  }



  return {
    notificarMotivo, notifyAsignacion
  };
}



