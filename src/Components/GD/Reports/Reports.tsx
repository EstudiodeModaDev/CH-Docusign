import React from "react";
import "./Reports.css";
import type { DateRange, rsOption } from "../../../models/Commons";
import { useGraphServices } from "../../../graph/graphContext";
import { usePromocion } from "../../../Funcionalidades/GD/Promocion";
import { exportAllProcesosToExcel, exportCesacionesToExcel, exportEnviosToExcel, exportHabeasToExcel, exportNovedadesToExcel, exportPromocionesToExcel, exportRetailToExcel } from "../../../utils/ExcelActions/exportExcel";
import { useRetail } from "../../../Funcionalidades/GD/Retail";
import { useCesaciones } from "../../../Funcionalidades/GD/Cesaciones/hooks/useCesaciones";
import { useContratos } from "../../../Funcionalidades/GD/Contratos/hooks/useContratos";
import { useEnvios } from "../../../Funcionalidades/GD/Envios/hooks/useEnvios";
import { useHabeasData } from "../../../Funcionalidades/GD/Habeas/hooks/useHabeas";

export const ReporteFiltros: React.FC = () => {
  const [range, setRange] = React.useState<DateRange>({
    from: "",
    to: "",
  });

  const [tipo, setTipo] = React.useState<string>("Envios");
  const [enviadoPor, setEnviadoPor] = React.useState<string>("");
  const [destinatario, setDestinatario] = React.useState<string>("");
  const [plantilla, setPlantilla] = React.useState<string>("");
  const [ciudad, setCiudad] = React.useState<string>("");
  const [cargo, setCargo] = React.useState<string>("");
  const [empresa, setEmpresa] = React.useState<string>("");
  const [generando, setGenerando] = React.useState<boolean>(false)
  const { Promociones, DetallesPasosCesacion, DetallesPasosNovedades, detallesPasosRetail, DetallesPasosPromocion, Retail } = useGraphServices();
  const enviosController = useEnvios();
  const contratosController = useContratos();
  const { rows: rowsPromociones, loadToReport: loadPromocionesToReport } = usePromocion(Promociones);
  const cesacionController = useCesaciones();
  const { rows: rowsRetail, loadToReport: loadRetailToReport } = useRetail(Retail);
  const { rows: rowsHabeas, loadToReport: loadHabeasToReport } = useHabeasData();
  
  React.useEffect(() => {
    const { from, to } = range;

    const actions: Record<Exclude<string, "all">, () => void> = {
        Envios: () => enviosController.loadToReport(from, to, enviadoPor, destinatario, plantilla),

        novedad: () => contratosController.loadToReport(from, to, enviadoPor, cargo, empresa, ciudad),

        Promociones: () => loadPromocionesToReport(from, to, enviadoPor, cargo, empresa),

        Habeas: () => loadHabeasToReport(from, to, enviadoPor, ciudad),

        cesacion: () => cesacionController.loadToReport(from, to, enviadoPor, ciudad),

        retail: () => loadRetailToReport(from, to, enviadoPor, cargo, empresa),
    };

    if (tipo === "all") {
        Object.values(actions).forEach(action => action());
        return;
    }

    actions[tipo]?.();
    }, [tipo, range.from, range.to, enviadoPor, destinatario, cargo, ciudad, empresa, plantilla,]);

  const handleGenerar = () => {
    if(!range.from || !range.to){
        alert("Debe seleccionar como minimo un rango de fechas")
        return
    }

    if(range.from > range.to){
        alert("Debe seleccionar un rango valido")
        return
    }

    setGenerando(true)
    if (tipo === "Envios") {
      exportEnviosToExcel(enviosController.rows);
    } else if (tipo === "novedad"){
        exportNovedadesToExcel(contratosController.rows, DetallesPasosNovedades)
    } else if (tipo === "Promociones"){
        exportPromocionesToExcel(rowsPromociones, DetallesPasosPromocion)
    } else if (tipo === "Habeas"){
        exportHabeasToExcel(rowsHabeas)
    } else if (tipo === "cesacion"){
        exportCesacionesToExcel(cesacionController.rows, DetallesPasosCesacion)
    } else if (tipo === "retail"){
        exportRetailToExcel(rowsRetail, detallesPasosRetail)
    } else {
        exportAllProcesosToExcel({habeas: rowsHabeas, novedades: contratosController.rows, promociones: rowsPromociones, retail: rowsRetail, cesaciones: cesacionController.rows, detallesPasosCesacionSvc: DetallesPasosCesacion, detallesPasosNovedadSvc: DetallesPasosNovedades, detallesPasosPromocionSvc: DetallesPasosPromocion, detallesPasosRetailSvc: detallesPasosRetail,})
    }
    
    setGenerando(false)
  };


  /* ===========================
     Distinct según tipo
     =========================== */

  const baseValuesEnviadoPor: string[] =
    tipo === "Envios" ? enviosController.rows.map((e) => e.EnviadoPor ?? ""): 
    tipo === "novedad" ? contratosController.rows.map((e) => e.Informaci_x00f3_n_x0020_enviada_ ?? ""): 
    tipo === "Promociones" ? rowsPromociones.map((e) => e.InformacionEnviadaPor ?? "") :
    tipo === "Habeas" ? rowsHabeas.map((e) => e.Informacionreportadapor ?? "") : [];

  const baseValuesPlantilla: string[] =
    tipo === "Envios" ? enviosController.rows.map((e) => e.Title ?? "") : []

  const baseValuesCiudad: string[] =
    tipo === "Promociones" ? rowsPromociones.map((e) => e.Ciudad ?? "") : 
    tipo === "novedad" ? contratosController.rows.map((e) => e.CIUDAD ?? "") :
    tipo === "Habeas" ? rowsHabeas.map((e) => e.Ciudad ?? "") : [];

  const baseValuesCargo: string[] =
    tipo === "Promociones" ? rowsPromociones.map((e) => e.Cargo ?? ""): 
    tipo === "novedad" ? contratosController.rows.map((e) => e.CARGO ?? "") : [];

  const baseValuesEmpresaSolicitante: string[] =
    tipo === "Promociones" ? rowsPromociones.map((e) => e.EmpresaSolicitante ?? ""): 
    tipo === "novedad" ? contratosController.rows.map((e) => e.Empresa_x0020_que_x0020_solicita ?? "") : [];

  const enviadoPorOptions: rsOption[] = Array.from(new Set(baseValuesEnviadoPor.map((v) => v.trim()).filter((v) => v !== ""))).map((v) => ({ value: v, label: v }));
  const plantillasOption: rsOption[] = Array.from(new Set(baseValuesPlantilla.map((v) => v.trim()).filter((v) => v !== ""))).map((v) => ({ value: v, label: v }));
  const empresaSolicitante: rsOption[] = Array.from(new Set(baseValuesEmpresaSolicitante.map((v) => v.trim()).filter((v) => v !== ""))).map((v) => ({ value: v, label: v }));
  const destinatariosOptions: rsOption[] = Array.from(new Set(enviosController.rows.map((e) => (e.Receptor ?? "").trim()).filter((v) => v !== ""))).map((v) => ({ value: v, label: v }));
  const ciudadesOption: rsOption[] = Array.from(new Set(baseValuesCiudad.map((v) => v.trim()).filter((v) => v !== ""))).map((v) => ({ value: v, label: v }));
  const cargosOptions: rsOption[] = Array.from(new Set(baseValuesCargo.map((v) => v.trim()).filter((v) => v !== ""))).map((v) => ({ value: v, label: v }));

  const disabled = !range.from || !range.to

  /* ===========================
     Render
     =========================== */

  return (
    <div className="rep-container">
        <div className="rep-header">
            <h2>Generación de reportes</h2>

                <select className="rep-select-top" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    <option value="Envios">Envios</option>
                    <option value="novedad">Contrataciones</option>
                    <option value="Promociones">Promociones</option>
                    <option value="Habeas">Habeas Data</option>
                    <option value="cesacion">Cesaciones</option>
                    <option value="retail">Retail</option>
                    <option value="all">Consolidado</option>
                </select>
        </div>

        <div className="rep-form">
        <div className="rep-grid">
            {/* Filtros comunes */}
            <div className="rep-field">
                <label>Desde:</label>
                <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })}/>
            </div>

            <div className="rep-field">
                <label>Hasta:</label>
                <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })}/>
            </div>

            <div className="rep-field">
                <label>{tipo === "Envios" ? "Enviado por:" : "Reportado por"}</label>
                <select value={enviadoPor} disabled={disabled} onChange={(e) => setEnviadoPor(e.target.value)}>
                    <option value="">Seleccione</option>
                    {enviadoPorOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Solo envíos */}
            {tipo === "Envios" && (
            <>
                <div className="rep-field">
                    <label>Destinatario:</label>
                    <select value={destinatario} disabled={disabled} onChange={(e) => setDestinatario(e.target.value)}>
                        <option value="">Seleccione</option>
                        {destinatariosOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                            {o.label}
                            </option>
                        ))}
                    </select>
                </div>
   
                <div className="rep-field">
                    <label>Plantilla usada:</label>
                    <select value={plantilla} disabled={disabled} onChange={(e) => setPlantilla(e.target.value)}>
                        <option value="">Seleccione</option>
                        {plantillasOption.map((o) => (
                            <option key={o.value} value={o.value}>
                            {o.label}
                            </option>
                        ))}
                    </select>
                </div>
            </>
            )}

            {(tipo === "novedad" || tipo === "Promociones" || tipo=== "Habeas" || tipo === "cesacion" || tipo === "retail") && (
                <>
                    <div className="rep-field">
                        <label>Ciudad:</label>
                        <select value={ciudad} disabled={disabled} onChange={(e) => setCiudad(e.target.value)}>
                            <option value="">Seleccione</option>
                            {ciudadesOption.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {/* Novedades / Promociones */}
            {(tipo === "novedad" || tipo === "Promociones" || tipo === "cesacion" || tipo === "retail") && (
            <>
                <div className="rep-field">
                    <label>Cargo:</label>
                    <select value={cargo} disabled={disabled} onChange={(e) => setCargo(e.target.value)}>
                        <option value="">Seleccione</option>
                        {cargosOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                        ))}
                    </select>
                </div>

                <div className="rep-field">
                    <label>Empresa solicitante:</label>
                    <select value={empresa} disabled={disabled} onChange={(e) => setEmpresa(e.target.value)}>
                        <option value="">Seleccione</option>
                        {empresaSolicitante.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                        ))}
                    </select>
                </div>


            </>
            )}
        </div>

        <div className="rep-actions">
            <button type="button" className="rep-btn secondary" onClick={() => {
                                                                        setRange({ from: "", to: "" }); 
                                                                        setEnviadoPor(""); 
                                                                        setDestinatario(""); 
                                                                        setEmpresa("");         
                                                                        setCiudad("");
                                                                        setCargo("");}}>
            Limpiar
            </button>

            <button type="button" disabled={generando} className="rep-btn primary" onClick={() => {handleGenerar() }}>
                {generando ? "Generando..." : "Generar"}
            </button>
        </div>
        </div>
    </div>
  );
};
