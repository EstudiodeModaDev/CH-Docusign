import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../graph/graphContext";
import { useCargo, } from "../../../Funcionalidades/Desplegables";
import type { maestro } from "../../../models/Desplegables";

export const CargosManager: React.FC = () => {
    const { Maestro, } = useGraphServices();
    const { items, add, editItem, reload, remove} = useCargo(Maestro);
    const [isEditing, setIsEditing] = React.useState(false);
    const [state, setState] = React.useState<maestro>({ T_x00ed_tulo1: "", Abreviacion: "", Title: "", Codigo: ""})
    const [isAdding, setIsAdding] = React.useState<boolean>(false)

    const handleAddNew = () => {
        if(!state.T_x00ed_tulo1){
            alert("Rellene todos los campos")
        }
        const payload: maestro = {
            Abreviacion: "",
            Title: "Cargos",
            Codigo: "",
            T_x00ed_tulo1: state.T_x00ed_tulo1.toLocaleUpperCase()
        }
        setState({ T_x00ed_tulo1: "", Abreviacion: "", Title: "", Codigo: ""})
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
    }, [reload]);


    return (
        <div className="emp-page">
            {/* Botón superior */}
            <div className="emp-header">
                <button type="button" className="btn btn-primary btn-xs" onClick={() => {setIsAdding(true); setState({...state, T_x00ed_tulo1: ""})}}>
                    <span className="emp-add-btn__icon">＋</span>
                    Añadir nuevo cargo
                </button>
            </div>

            <div className="emp-layout">
                {/* Lista izquierda */}
                <section className="emp-list">
                {items.map((tipoDoc) => (
                    <div key={tipoDoc.Id} className={ "emp-row"}>
                    <button type="button" className="emp-row__name" onClick={() => {setIsEditing(true); setState(tipoDoc)}}>
                        {tipoDoc.T_x00ed_tulo1}
                    </button>

                    <div className="emp-row__actions">
                        <button type="button" className="emp-icon-btn" title="Eliminar"  onClick={() => handleDelete(tipoDoc.Id ?? "")}>
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
                                <label className="emp-label" htmlFor="empresaNombre">Cargos</label>
                                <input id="empresaNombre" type="text" className="emp-input" placeholder="Tipo de documento" value={state?.T_x00ed_tulo1} onChange={(e) => setState({...state, T_x00ed_tulo1: e.target.value})}/>
                            </div>
                            { isEditing &&
                                <div className="emp-actions">
                                    <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                    <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                            console.table(state)
                                                                                            if(editItem){
                                                                                                await editItem({Title: state?.T_x00ed_tulo1}, state!.Id ?? "", );
                                                                                                reload()
                                                                                            }
                                                                                            setIsEditing(false);}}>✔</button>
                                </div>
                            }
                            { isAdding &&
                                <div className="emp-actions">
                                    <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                    <button type="button" className="emp-btn emp-btn--ok" onClick={() => {add ? add(handleAddNew()) : null}}>✔</button>
                                </div>
                            }
                        </section>
                    </>
                }
            </div>
        </div>
    );
};
