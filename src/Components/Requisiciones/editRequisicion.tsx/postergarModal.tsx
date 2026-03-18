import * as React from "react";
import "./postergar.css";

import type { requisiciones } from "../../../models/requisiciones";
import { toISODateFlex } from "../../../utils/Date";
import type { Holiday } from "festivos-colombianos";
import { calcularFechaSolucionRequisicion } from "../../../utils/ansRequisicion";
import { useMoverANS } from "../../../Funcionalidades/Requisiciones/moverANS";
import { useGraphServices } from "../../../graph/graphContext";
import { fetchHolidays } from "../../../Services/Festivos";

type Props = {
  open: boolean;

  primaryText?: string;
  secondaryText?: string;

  loading?: boolean;
  disablePrimary?: boolean;
  error?: string;

  onClose: () => void;
  onSubmit: (r: requisiciones) => Promise<void>;

  setField: <K extends keyof requisiciones>(k: K, v: requisiciones[K]) => void;

  requisicion: requisiciones;
};

export function PostergarModal(props: Props) {
    const {open, requisicion, primaryText = "Guardar", secondaryText = "Cancelar", loading = false, disablePrimary = false, error, onClose, onSubmit, setField: setFieldRequisicion,} = props;
    const { moverANS } = useGraphServices();
    const { state, cleanState, setField, handleCreate } = useMoverANS(moverANS);

    const [holidays, setHolidays] = React.useState<Holiday[]>([]);

  /* =========================
     Helpers
     ========================= */

    const closeOnBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const calcularNuevaFecha = (dias: number): string => {
        if (!requisicion.fechaInicioProceso) return "";

        const fechaFinal = calcularFechaSolucionRequisicion(new Date(requisicion.fechaInicioProceso), dias, holidays);

        return toISODateFlex(fechaFinal);
    };

    const postergarANS = async (): Promise<boolean>  => {
        const log = await handleCreate();
        if (log.ok) {
            await onSubmit(requisicion);
            cleanState();
            return true
        }
        return false
    };

  /* =========================
     Effects
     ========================= */

    // Recalcular fecha límite cuando cambian días o festivos
    React.useEffect(() => {
        const dias = Number(state.ANS || 0);
        const nuevaFechaISO = calcularNuevaFecha(dias);

        if (!nuevaFechaISO) return;

        setField("fechaLimite", nuevaFechaISO);
        setFieldRequisicion("fechaLimite", nuevaFechaISO);
        setFieldRequisicion("ANS", String(dias));
    }, [state.ANS, holidays, requisicion.fechaInicioProceso]);

  // Inicializar estado interno
    React.useEffect(() => {
        setField("ANS", requisicion.ANS ?? "0");
        setField("Title", requisicion.Id ?? "");
    }, []);

    // Cerrar con ESC
    React.useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

  // Cargar festivos
    React.useEffect(() => {
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

    if (!open) return null;

  /* =========================
     Render
     ========================= */

  return (
    <div className="m4-overlay" onMouseDown={closeOnBackdrop} role="dialog" aria-modal="true">
        <div className="m4-modal">
            <header className="m4-head">
                <div className="m4-head__text">
                    <h2 className="m4-title">Postergar ANS</h2>
                </div>

                <button type="button" className="m4-x" onClick={onClose} aria-label="Cerrar">
                    ✕
                </button>
            </header>

            <section className="m4-body">
                <div className="m4-grid">
                    <span><strong>Fecha de inicio</strong></span>
                    <input type="date" className="m4-input" value={toISODateFlex(requisicion.fechaInicioProceso)} readOnly/>

                    <span><strong>Días hábiles desde la fecha de inicio</strong></span>
                    <input type="number" min={-20} className="m4-input" value={Number(state.ANS || 0)} onChange={(e) => setField("ANS", e.target.value)}/>

                    <span><strong>Nueva fecha límite</strong></span>
                    <input type="date" className="m4-input" value={toISODateFlex(requisicion.fechaLimite)} readOnly/>

                    <span><strong>Especifique el motivo del cambio</strong></span>
                    <input type="text" className="m4-input" value={state.observacion || ""} onChange={(e) => setField("observacion", e.target.value)}/>
                </div>

                {error ? (
                    <div className="m4-error" role="alert">
                        {error}
                    </div>
                ) : null}
            </section>

            <footer className="m4-actions">
                <button type="button" className="m4-btn m4-btn--ghost" onClick={onClose} disabled={loading}>
                    {secondaryText}
                </button>

                <button type="button" className="m4-btn m4-btn--primary" onClick={async () => {const p =await postergarANS(); if(p) onClose()}} disabled={loading || disablePrimary}>
                    {loading ? "Guardando..." : primaryText}
                </button>
            </footer>
      </div>
    </div>
  );
}
