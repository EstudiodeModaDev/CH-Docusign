import * as React from "react";
import "../PasosPromocion.css";
import { useGraphServices } from "../../../../graph/graphContext";
import { usePasosPromocion, useDetallesPasosPromocion,} from "../../../../Funcionalidades/PasosPromocion";
import type { Promocion } from "../../../../models/Promociones";
import type { DetallesPasos, PasosProceso } from "../../../../models/Cesaciones";

type Props = {
  titulo: string;
  selectedPromocion: Promocion;
  onChangeActionValue?: (detalle: DetallesPasos, value: string) => void;
  onClose: () => void
};

export const PromotionSteps: React.FC<Props> = ({titulo, selectedPromocion, onClose}) => {
  const { DetallesPasosPromocion: DetallesSvc, ColaboradoresDH, ColaboradoresEDM} = useGraphServices();
  const { loading: loadingPasos, error: errorPasos, byId: pasosById, decisiones, motivos, setMotivos, setDecisiones, handleCompleteStep} = usePasosPromocion();
  const { rows: detallesRows, loading: loadingDetalles, error: errorDetalles, loadDetallesPromocion} = useDetallesPasosPromocion(DetallesSvc, selectedPromocion.Id ?? "");
  
  const handleSubmit = async (detalle: any) => {
    await handleCompleteStep(detalle)
    await  loadDetallesPromocion()  
  };
  
  const handleUploadClick = async (detalle: DetallesPasos) => {const idDetalle = detalle.Id ?? ""; const file = files[idDetalle];

    if (!file) {
      alert("Debes seleccionar un archivo antes de subirlo");
      return;
    }

    const empresa = selectedPromocion.EmpresaSolicitante?.toLocaleLowerCase().trim() ?? "";
    const servicioColaboradores = empresa === "dh retail" ? ColaboradoresDH : ColaboradoresEDM;
    const type = file.name.split(".")
    const fileName = `${pasosById[detalle.NumeroPaso].NombreEvidencia}.${type[type.length - 1]}`
    

    const renamedFile = new File([file], fileName, {
      type: file.type,
      lastModified: file.lastModified,
    });

    try {
      // Carpeta destino, por ejemplo usando el número de documento
      const carpeta = `Colaboradores Activos/${selectedPromocion.NumeroDoc} - ${selectedPromocion.NombreSeleccionado}`;

      const item = await servicioColaboradores.uploadFile(carpeta, renamedFile);

      console.log("Archivo subido:", item.webUrl);
      alert("Archivo subido correctamente");

      // si quieres, aquí llamas a tu handleCompleteStep(detalle)
      // await handleCompleteStep(detalle);
    } catch (e: any) {
      console.error(e);
      alert("Error subiendo archivo: " + e.message);
    }
  };
  const [files, setFiles] = React.useState<Record<string, File | null>>({});

  if (loadingPasos || loadingDetalles) {
    return <div>Cargando pasos…</div>;
  }

  if (errorPasos || errorDetalles) {
    return (
      <div>
        Error cargando la información de la promoción.
        <br />
        {errorPasos ?? errorDetalles}
      </div>
    );
  }

  return (
    <section className="promo-steps">
      <header className="promo-steps__header">
        <h2 className="promo-steps__title">{titulo}</h2>
      </header>

      <div className="promo-steps__grid">
        {detallesRows.map((detalle, index) => {
          const idDetalle = detalle.Id ?? "";
          const paso: PasosProceso | null = pasosById[detalle.NumeroPaso] ?? null; // Paso = Id PasoPromocion
          const previous = detallesRows[index - 1];
          const isVisible = index === 0 || previous?.EstadoPaso === "Completado";

          if (!isVisible) {
            // No renderizamos las tarjetas futuras hasta que toque
            return null;
          }

          const isCompleted = detalle.EstadoPaso === "Completado";
          const requiereEvidencia = paso?.TipoPaso === "SubidaArchivos";
          const requiereNotas = paso?.TipoPaso !== "SubidaArchivos";
          const decision = decisiones[idDetalle] ?? "";

          return (
            <article key={idDetalle} className="step-card">
              <div className="step-card__header">
                <h3 className="step-card__name">
                  {paso?.NombrePaso ?? "Paso sin nombre"}
                </h3>

                <span className={`step-card__status step-card__status--${isCompleted ? "done" : "pending"}`}>
                  {detalle.EstadoPaso}
                </span>
              </div>

              <div className="step-card__body">
                {requiereNotas && !isCompleted && 
                  (
                  <select className="step-card__select" defaultValue=""  onChange={(e) => {
                                                                          const value = e.target.value as | "" | "Aceptado" | "Rechazado";
                                                                          setDecisiones((prev) => ({
                                                                            ...prev,
                                                                            [idDetalle]: value,
                                                                          }));
                                                                        }}>
                    <option value="">Seleccione…</option>
                    <option value="Aceptado">Aceptado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select> 
                  
                )}

                {requiereNotas && isCompleted && (
                  <div className="step-card__notes">
                    <p className="step-card__note">{detalle.Notas}</p>
                  </div>
                )}

                {decision === "Rechazado" && (
                    <input type="text" className="step-card__input" placeholder="Motivo del rechazo" value={motivos[idDetalle]} onChange={(e) => {
                                                                                                                                  const motivo = e.target.value
                                                                                                                                  setMotivos((prev) => ({
                                                                                                                                    ...prev, [idDetalle]: motivo
                                                                                                                                  }))
                                                                                                                                }}/>
                )}
                
                {requiereEvidencia && !isCompleted && (
                  <div className="step-card__upload-wrapper">

                    <input
                      id={`file-${idDetalle}`}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="step-card__file-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setFiles((prev) => ({
                          ...prev,
                          [idDetalle]: file,
                        }));
                      }}
                    />

                    <label
                      htmlFor={`file-${idDetalle}`}
                      className="step-card__upload-btn"
                    >
                      Seleccionar archivo
                    </label>

                    {files[idDetalle] && (
                      <span className="step-card__file-name">
                        {files[idDetalle].name}
                      </span>
                    )}

                  </div>
                )}
                
                {!isCompleted && !requiereEvidencia &&
                  <button type="button" className={`step-card__check ${isCompleted ? "step-card__check--active" : ""}`} disabled={isCompleted} onClick={() =>{handleSubmit(detalle)}}>
                    ✓
                  </button>
                }

                {!isCompleted && requiereEvidencia &&
                  <button type="button" className="btn btn-xs" disabled={isCompleted} onClick={async() =>{
                                                                                                await handleUploadClick(detalle); 
                                                                                                const carpeta = `${selectedPromocion.NumeroDoc}`
                                                                                                await handleCompleteStep(detalle, carpeta)}}>
                    ✓
                  </button>
                }
              </div>
            </article>
          );
        })}
      </div>
      <button className="btn btn-xs" onClick={() => {onClose()}}>Cerrar </button>
    </section>
  );
};
