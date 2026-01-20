import * as React from "react";
import { useState, useEffect } from "react";
import type { TZDate } from "@date-fns/tz";
import { TicketsService } from "../Services/Tickets.service";
import { toGraphDateTime } from "../utils/Date";
import type { Holiday } from "festivos-colombianos";
import { FlowClient } from "./FlowClient";
import type { FlowToUser } from "../models/FlujosPA"
import type { FormErrors, FormState,} from "../models/tickets";
import { calcularFechaSolucion, calculoANS } from "../utils/ans";
import { fetchHolidays } from "../Services/Festivos";
import { useAuth } from "../auth/authProvider";
import type { LogService } from "../Services/Log.service";


type Svc = {
  Tickets?: TicketsService;
  Logs: LogService
}; 

export const first = (...vals: any[]) => vals.find((v) => v !== undefined && v !== null && v !== "");

export function useNuevoTicketForm(services: Svc) {
  const { Tickets, Logs} = services;
  const {account} = useAuth()
  const [state, setState] = useState<FormState>({
    solicitante: account?.name ?? "",
    correoSolicitante: account?.username ?? "",
    usarFechaApertura: false,
    fechaApertura: null,
    fuente: "",
    motivo: "",
    descripcion: "",
    categoria: "",    
    subcategoria: "", 
    articulo: "",     
    ANS: "",
    archivo: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [fechaSolucion, setFechaSolucion] = useState<Date | null>(null);

  // ---- Instancia del servicio de Flow (useRef para no depender de React.*)
  const notifyFlow = new FlowClient("https://defaultcd48ecd97e154f4b97d9ec813ee42b.2c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a21d66d127ff43d7a940369623f0b27d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0ptZLGTXbYtVNKdmIvLdYPhw1Wcqb869N3AOZUf2OH4")

  // Carga de festivos inicial
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const hs = await fetchHolidays();
        if (!cancel) setHolidays(hs);
      } catch (e) {
        if (!cancel) console.error("Error festivos:", e);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  /* ============================
     Helpers de formulario
     ============================ */
  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const e: FormErrors = {};
    if (!state.motivo.trim()) e.motivo = "Ingrese el motivo";
    if (!state.descripcion.trim()) e.descripcion = "Describa el problema";
    if (!state.categoria) e.categoria = "Seleccione una categoría";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      alert("Hay campos sin llenar correctamente.");
      return
    };

    setSubmitting(true);
    try {
      const apertura = state.usarFechaApertura && state.fechaApertura ? new Date(state.fechaApertura) : new Date();

      const horasPorANS: Record<string, number> = {
        "ANS 1": 8,
        "ANS 2": 64,
        "ANS 3": 56,
        "ANS 4": 240,
      };
      let solucion: TZDate | null = null;

      const ANS = calculoANS(state.categoria, state.subcategoria, state.articulo);
      const horasAns = horasPorANS[ANS] ?? 0;

      if (horasAns > 0) {
        solucion = calcularFechaSolucion(apertura, horasAns, holidays);
        setFechaSolucion(solucion);
      }

      const aperturaISO  = toGraphDateTime(apertura);           
      const tiempoSolISO = toGraphDateTime(solucion as any);      

      // Objeto de creación
      const payload = {
        Title: state.motivo,
        Descripcion: state.descripcion,
        FechaApertura: aperturaISO,
        TiempoSolucion: tiempoSolISO,
        Fuente: "Aplicación",
        Categoria: state.categoria,       
        SubCategoria: state.subcategoria, 
        SubSubCategoria: state.articulo,  
        Nombreresolutor: "Daniel Palacios Viveros",
        Correoresolutor: "dpalacios@estudiodemoda.com.co",
        Solicitante: state.solicitante,
        CorreoSolicitante: state.correoSolicitante,
        Estadodesolicitud: "En Atención",
        ANS: ANS
      };

      // === Crear ticket (usa el servicio inyectado)
      let createdId: string | number = "";
      if (!Tickets?.create) {
        console.error("Tickets service no disponible. Verifica el GraphServicesProvider.");
      } else {
        const created = await Tickets.create(payload);

        createdId = created?.ID ?? "";
        console.log("Ticket creado con ID:", createdId);

        const idTexto = String(createdId || "—");
        const fechaSolTexto = solucion ? new Date(solucion as unknown as string).toLocaleString() : "No aplica";
        const solicitanteEmail = state.correoSolicitante
        const resolutorEmail = created.Correoresolutor

        //Crear Log
        Logs.create({Actor: "Sitema", Descripcion:  `Se ha creado un nuevo ticket para el siguiente requerimiento: ${idTexto}`, CorreoActor: "", Tipo_de_accion:"Creacion", Title: idTexto})

        setSubmitting(false);
       
          // Notificar solicitante
        if (solicitanteEmail) {
          const title = `Asignación de Caso - ${idTexto}`;
          const message = `
          <p>¡Hola ${payload.Solicitante ?? ""}!<br><br>
          Tu solicitud ha sido registrada exitosamente y ha sido asignada a un técnico para su gestión. Estos son los detalles del caso:<br><br>
          <strong>ID del Caso:</strong> ${idTexto}<br>
          <strong>Asunto del caso:</strong> ${payload.Title}<br>
          <strong>Resolutor asignado:</strong> ${payload.Nombreresolutor ?? "—"}<br>
          <strong>Fecha máxima de solución:</strong> ${fechaSolTexto}<br><br>
          El resolutor asignado se pondrá en contacto contigo en el menor tiempo posible para darte solución a tu requerimiento.<br><br>
          Este es un mensaje automático, por favor no respondas.
          </p>`.trim();

          try {
            await notifyFlow.invoke<FlowToUser, any>({
              recipient: solicitanteEmail,
              title,
              message,
              mail: true, 
            });
          } catch (err) {
            console.error("[Flow] Error enviando a solicitante:", err);
          }
        }

        // Notificar resolutor    
        if (resolutorEmail) {
          const title = `Nuevo caso asignado - ${idTexto}`;
          const message = `
          <p>¡Hola!<br><br>
          Tienes un nuevo caso asignado con estos detalles:<br><br>
          <strong>ID del Caso:</strong> ${idTexto}<br>
          <strong>Solicitante:</strong> ${payload.Solicitante ?? "—"}<br>
          <strong>Correo del Solicitante:</strong> ${payload.CorreoSolicitante ?? "—"}<br>
          <strong>Asunto:</strong> ${payload.Title}<br>
          <strong>Fecha máxima de solución:</strong> ${fechaSolTexto}<br><br>
          Por favor, contacta al usuario para brindarle solución.<br><br>
          Este es un mensaje automático, por favor no respondas.
          </p>`.trim();

          try {
            await notifyFlow.invoke<FlowToUser, any>({
              recipient: `${resolutorEmail}; cesanchez@estudiodemoda.com.co`, 
              title,
              message,
              mail: true,
            });
          } catch (err) {
            console.error("[Flow] Error enviando a resolutor:", err);
          }
        }


      
        //Limpiar formularior
        setState({correoSolicitante: "", solicitante: "", usarFechaApertura: false, fechaApertura: null, fuente: "", motivo: "", descripcion: "", categoria: "", subcategoria: "", articulo: "",  ANS: "", archivo: null,})
        setErrors({})
      }
      } finally {
        
      }
    };

  return {
    state, errors, submitting, fechaSolucion,
    handleSubmit, setField,
  };
}



