import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../graph/graphContext";
import { useUnidadNegocio, } from "../../../Funcionalidades/Desplegables";
import type { withCode } from "../../../models/Maestros";

export const UnidadNegocioManager: React.FC = () => {
    const { UnidadNegocio, } = useGraphServices();
    const { items, add, editItem, reload, remove} = useUnidadNegocio(UnidadNegocio);
    const [isEditing, setIsEditing] = React.useState(false);
    const [state, setState] = React.useState<withCode>({ Title: "", Codigo: ""})
    const [isAdding, setIsAdding] = React.useState<boolean>(false)

    const handleAddNew = () => {
        if(!state.Title){
            alert("Rellene todos los campos")
        }
        const payload = {
            Title: state?.Title,
            Codigo: state.Codigo
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
    }, [reload]);


    return (
        <div className="emp-page">
            {/* Botón superior */}
            <div className="emp-header">
                <button type="button" className="btn btn-primary btn-xs" onClick={() => {setIsAdding(true); setState({...state, Title: "", Codigo: ""})}}>
                    <span className="emp-add-btn__icon">＋</span>
                    Añadir nueva UN
                </button>
            </div>

            <div className="emp-layout">
                {/* Lista izquierda */}
                <section className="emp-list">
                {items.map((CO) => (
                    <div key={CO.Id} className={ "emp-row"}>
                    <button type="button" className="emp-row__name" onClick={() => {setIsEditing(true); setState({Codigo: CO.Abreviacion, Title: CO.Title, Id: CO.Id});}}>
                        {CO.Title}
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
                                <label className="emp-label" htmlFor="empresaNombre">Unidad de negocio</label>
                                <input id="empresaNombre" type="text" className="emp-input" placeholder="Unidad de negocio" value={state?.Title} onChange={(e) => setState({...state, Title: e.target.value})}/>
                            </div>
                            <div className="emp-field">
                                <label className="emp-label" htmlFor="empresaNombre">Codigo</label>
                                <input id="empresaNombre" type="text" className="emp-input" placeholder="Codigo" value={state?.Codigo} onChange={(e) => setState({...state, Codigo: e.target.value})}/>
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
