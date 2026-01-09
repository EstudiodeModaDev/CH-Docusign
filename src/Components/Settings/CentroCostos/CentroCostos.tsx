import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../graph/graphContext";
import { useCentroCostos, } from "../../../Funcionalidades/Desplegables";
import type { withCode } from "../../../models/Maestros";
import type { maestro } from "../../../models/Desplegables";
import { masiveCharge } from "../../../Funcionalidades/CargaMasiva";
import type { MaestrosService } from "../../../Services/Maestros.service";

export const CentroCostosManager: React.FC = () => {
    const { Maestro, } = useGraphServices();
    const { items, add, editItem, reload, remove} = useCentroCostos(Maestro);
    const [isEditing, setIsEditing] = React.useState(false);
    const [state, setState] = React.useState<withCode>({ Title: "", Codigo: ""})
    const [isAdding, setIsAdding] = React.useState<boolean>(false)
    const [plantilla, setPlantilla] = React.useState<boolean>(false)

    const handleAddNew = () => {
        if(!state.Title || !state.Codigo){
            alert("Rellene todos los campos")
        }
        const payload: maestro = {
            T_x00ed_tulo1: state?.Title,
            Codigo: state.Codigo,
            Abreviacion: "",
            Title: "Centro de costos",

        }
        return payload
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar este CC?")) return;
        setIsAdding(false)
        setIsEditing(false)
        if(remove){
            await remove(id);
        }
        reload()
    };

    React.useEffect(() => {
        reload();
    }, [reload]);


    return (
        <div className="emp-page">
            {/* Botón superior */}
            <div className="emp-header">
                <button type="button" className="btn btn-primary btn-xs" onClick={() => {setIsAdding(true); setState({...state, Title: "", Codigo: ""})}}>
                    <span className="emp-add-btn__icon">＋</span>
                    Añadir nuevo CC
                </button>
                <button type="button" className="btn btn-primary btn-xs" onClick={() => {setPlantilla(true); setState({...state, Title: "", Codigo: ""})}}>
                    <span className="emp-add-btn__icon">＋</span>
                    Añadir por plantilla
                </button>
            </div>

            <div className="emp-layout">
                {/* Lista izquierda */}
                <section className="emp-list">
                {items.map((CO) => (
                    <div key={CO.Id} className={ "emp-row"}>
                    <button type="button" className="emp-row__name" onClick={() => {setIsEditing(true); setState({Codigo: CO.Codigo, Title: CO.T_x00ed_tulo1, Id: CO.Id});}}>
                        {CO.T_x00ed_tulo1}
                    </button>

                    <div className="emp-row__actions">
                        <button type="button" className="emp-icon-btn" title="Eliminar"  onClick={() => handleDelete(CO.Id ?? "")}>
                            🗑
                        </button>
                    </div>
                    </div>
                ))}
                </section>


                { (isAdding || isEditing) &&
                    <>
                        <section className="emp-form">
                            <div className="emp-field">
                                <label className="emp-label" htmlFor="empresaNombre">Centro de costos</label>
                                <input id="empresaNombre" type="text" className="emp-input" placeholder="Centro de costos" value={state?.Title} onChange={(e) => setState({...state, Title: e.target.value.toUpperCase()})}/>
                            </div>
                            <div className="emp-field">
                                <label className="emp-label" htmlFor="empresaNombre">Codigo</label>
                                <input id="empresaNombre" type="text" className="emp-input" placeholder="Codigo" value={state?.Codigo} onChange={(e) => setState({...state, Codigo: e.target.value.toUpperCase()})}/>
                            </div>
                            { isEditing &&
                                <div className="emp-actions">
                                    <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                    <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                            console.table(state)
                                                                                            if(editItem){
                                                                                                await editItem({Title: "Centro de costos", T_x00ed_tulo1: state?.Title, Codigo: state.Codigo}, state!.Id ?? "", );
                                                                                                reload()
                                                                                                alert("Se ha editado con éxito el CC")
                                                                                                setIsAdding(false)
                                                                                                setIsEditing(false)
                                                                                            }
                                                                                            setIsEditing(false);}}>✔</button>
                                </div>
                            }
                            { isAdding &&
                                <div className="emp-actions">
                                    <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                    <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                                    try {
                                                                                                    if (!add) return;

                                                                                                    const payload = await handleAddNew(); // ✅ esperar
                                                                                                    if (!payload?.T_x00ed_tulo1?.trim()) return;

                                                                                                    await add(payload); // ✅ esperar
                                                                                                    alert("Se ha agregado con éxito el centro de costos");
                                                                                                    setIsEditing(false)
                                                                                                    setIsAdding(false)
                                                                                                    } catch (e: any) {
                                                                                                    console.error(e);
                                                                                                    alert("Error agregando el cargo: " + (e?.message ?? e));
                                                                                                    }
                                                                                                }}>✔</button>
                                </div>
                            }
                        </section>
                    </>
                }
            </div>
            <MasiveChargeModal open={plantilla} onClose={() => setPlantilla(false)} maestroSvc={Maestro} masiveCharge={masiveCharge} titulo={"Centro de costos"}/>
        </div>
    );
};

type Props = {
  open: boolean;
  onClose: () => void;
  maestroSvc: MaestrosService;
  masiveCharge: (file: File, maestro: MaestrosService) => void,
  titulo: string
};

export const MasiveChargeModal: React.FC<Props> = ({ open, onClose, maestroSvc, masiveCharge, titulo }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [doneMsg, setDoneMsg] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setError("");
      setDoneMsg("");
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [open]);

  if (!open) return null;

  const validateFile = (f: File | null) => {
    setError("");
    setDoneMsg("");

    if (!f) {
      setError("Selecciona un archivo .xlsx");
      return false;
    }

    // Validación por extensión (la más confiable en front)
    const okExt = f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".xls");
    if (!okExt) {
      setError("El archivo debe ser .xlsx");
      return false;
    }

    // Validación adicional por mime (no siempre viene bien)
    const allowedMimes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    ];

    const okMime =
    !f.type || allowedMimes.includes(f.type);

    if (!okMime) {
    setError("Tipo de archivo no válido. Debe ser un Excel (.xls o .xlsx)");
    return false;
    }

    return true;
  };

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    validateFile(f);
  };

  const onSubmit = async () => {
    setError("");
    setDoneMsg("");

    if (!validateFile(file)) return;

    try {
      setLoading(true);
      await masiveCharge(file!, maestroSvc);
      setDoneMsg("Carga masiva completada.");
      // si quieres cerrar automático:
      // onClose();
    } catch (err: any) {
      setError(err?.message ?? "Ocurrió un error durante la carga masiva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-modal__backdrop" role="dialog" aria-modal="true">
      <div className="mc-modal__card">
        <header className="mc-modal__header">
          <h2 className="mc-modal__title">Carga masiva ({titulo})</h2>

          <button type="button" className="mc-modal__close"  onClick={() => !loading && onClose()} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <div className="mc-modal__body">
          <label className="mc-modal__label" htmlFor="mcFile"> Archivo Excel (.xlsx)</label>

          <input ref={inputRef} id="mcFile" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onPickFile} disabled={loading} className="mc-modal__file"/>

          {file && (
            <div className="mc-modal__hint">
              Seleccionado: <b>{file.name}</b>
            </div>
          )}

          {error && <div className="mc-modal__error">{error}</div>}
          {doneMsg && <div className="mc-modal__success">{doneMsg}</div>}
        </div>

        <footer className="mc-modal__footer">
          <button type="button" className="mc-btn mc-btn--ghost"
            onClick={() => !loading && onClose()}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="mc-btn mc-btn--primary"
            onClick={onSubmit}
            disabled={loading || !file}
          >
            {loading ? "Cargando..." : "Cargar"}
          </button>
        </footer>
      </div>
    </div>
  );
};
