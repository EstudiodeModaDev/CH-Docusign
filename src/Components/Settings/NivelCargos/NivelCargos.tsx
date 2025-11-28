import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../graph/graphContext";
import { useNivelCargo, } from "../../../Funcionalidades/Desplegables";
import type { campoUnico } from "../../../models/Desplegables";

export const NivelCargosManager: React.FC = () => {
    const { NivelCargo, } = useGraphServices();
    const { items, add, editItem, reload, remove} = useNivelCargo(NivelCargo);
    const [isEditing, setIsEditing] = React.useState(false);
    const [state, setState] = React.useState<campoUnico>({ Title: ""})
    const [isAdding, setIsAdding] = React.useState<boolean>(false)
    const [search, setSearch] = React.useState<string>("")

    const handleAddNew = () => {
        if(!state.Title){
            alert("Rellene todos los campos")
        }
        const payload = {
            Title: state?.Title,
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
        reload(search);
    }, [search, reload]);


    return (
        <div className="emp-page">
            {/* Botón superior */}
            <div className="emp-header">
                <button type="button" className="btn btn-primary btn-xs" onClick={() => {setIsAdding(true); setState({...state, Title: ""})}}>
                    <span className="emp-add-btn__icon">＋</span>
                    Añadir nuevo nivel
                </button>
            </div>

            <div className="emp-layout">
                {/* Lista izquierda */}
                <section className="emp-list">
                {items.map((tipoDoc) => (
                    <div key={tipoDoc.Id} className={ "emp-row"}>
                    <button type="button" className="emp-row__name" onClick={() => {setIsEditing(true); setState(tipoDoc)}}>
                        {tipoDoc.Title}
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
                                <input id="empresaNombre" type="text" className="emp-input" placeholder="Tipo de documento" value={state?.Title} onChange={(e) => setState({...state, Title: e.target.value})}/>
                            </div>
                            { isEditing &&
                                <div className="emp-actions">
                                    <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                    <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                            console.table(state)
                                                                                            if(editItem){
                                                                                                await editItem({Title: state?.Title}, state!.Id ?? "", );
                                                                                                reload()
                                                                                            }
                                                                                            setIsEditing(false);}}>✔</button>
                                </div>
                            }
                            { isAdding &&
                                <div className="emp-actions">
                                    <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                    <button type="button" className="emp-btn emp-btn--ok" onClick={() => add ? add(handleAddNew()) : null}>✔</button>
                                </div>
                            }
                        </section>
                    </>
                }
            </div>
        </div>
    );
};
