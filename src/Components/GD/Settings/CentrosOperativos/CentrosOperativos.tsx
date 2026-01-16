import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../../graph/graphContext";
import { useCentroOperativo, } from "../../../../Funcionalidades/Desplegables";
import type { withCode } from "../../../../models/Maestros";
import type { maestro } from "../../../../models/Desplegables";
import { MasiveChargeModal } from "../CentroCostos/CentroCostos";
import { masiveChargeCO } from "../../../../Funcionalidades/CargaMasiva";

export const CentroOperativoManager: React.FC = () => {
    const { Maestro, } = useGraphServices();
    const { items, add, editItem, reload, remove} = useCentroOperativo(Maestro);
    const [isEditing, setIsEditing] = React.useState(false);
    const [state, setState] = React.useState<withCode>({ Title: "", Codigo: ""})
    const [isAdding, setIsAdding] = React.useState<boolean>(false)
    const [plantilla, setPlantilla] = React.useState<boolean>(false)


    const handleAddNew = () => {
        if(!state.Title){
            alert("Rellene todos los campos")
        }
        const payload: maestro = {
            T_x00ed_tulo1: state?.Title,
            Codigo: state.Codigo,
            Abreviacion: "",
            Title: "Centros operativos"
        }
        return payload
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar esta empresa?")) return;
        setIsAdding(false)
        setIsEditing(false)
        if(remove){
            await remove(id);
        }
        reload()
    };

    React.useEffect(() => {
        reload();
    }, [ reload]);


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
                                <label className="emp-label" htmlFor="empresaNombre">Centro Operativo</label>
                                <input id="empresaNombre" type="text" className="emp-input" placeholder="Centro Operativo" value={state?.Title} onChange={(e) => setState({...state, Title: e.target.value.toUpperCase()})}/>
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
                                                                                                await editItem({Title: "Centros operativos", T_x00ed_tulo1: state?.Title}, state!.Id ?? "", );
                                                                                                alert("Se ha editado con éxito el CO")
                                                                                                setIsAdding(false)
                                                                                                setIsEditing(false)
                                                                                                reload()
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
                                                                                                    alert("Se ha agregado con éxito el CO");
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
            <MasiveChargeModal open={plantilla} onClose={() => setPlantilla(false)} maestroSvc={Maestro} masiveCharge={masiveChargeCO} titulo={"Centros Operativos"}/>

        </div>
    );
};


