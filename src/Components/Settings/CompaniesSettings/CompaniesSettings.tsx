import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../graph/graphContext";
import { useEmpresasSelect } from "../../../Funcionalidades/Desplegables";
import type { campoUnico } from "../../../models/Desplegables";

export const EmpresasManager: React.FC = ({}) => {
    const { Empresa, } = useGraphServices();
    const { items, add, editItem, reload, remove} = useEmpresasSelect(Empresa);
    const [isEditing, setIsEditing] = React.useState(false);
    const [stateUnico, setStateUnico] = React.useState<campoUnico | null>(null)
    const [isAdding, setIsAdding] = React.useState<boolean>(false)

    const handleAddNew = () => {
        const payload = {
            Title: stateUnico?.Title
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
            <button type="button" className="btn btn-primary" onClick={() => {setIsAdding(true); setStateUnico({...stateUnico, Title: ""})}}>
                <span className="emp-add-btn__icon">＋</span>
                Añadir Empresas
            </button>
        </div>

        <div className="emp-layout">
            {/* Lista izquierda */}
            <section className="emp-list">
            {items.map((emp) => (
                <div key={emp.Id} className={ "emp-row"}>
                <button type="button" className="emp-row__name" onClick={() => {setIsEditing(true); setStateUnico(emp)}}>
                    {emp.Title}
                </button>

                <div className="emp-row__actions">
                    <button type="button" className="emp-icon-btn" title="Eliminar"  onClick={() => handleDelete(emp.Id ?? "")}>
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
                            <label className="emp-label" htmlFor="empresaNombre">Nombre de la empresa</label>
                            <input id="empresaNombre" type="text" className="emp-input" placeholder="Nombre de la empresa" value={stateUnico?.Title} onChange={(e) => setStateUnico({...stateUnico, Title: e.target.value})}/>
                        </div>
                        { isEditing &&
                            <div className="emp-actions">
                                <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                        console.table(stateUnico)
                                                                                        if(editItem){
                                                                                            await editItem({Title: stateUnico?.Title}, stateUnico!.Id ?? "", );
                                                                                            reload()
                                                                                        }
                                                                                        setIsEditing(false);}}>✔</button>
                            </div>
                        }
                        { isAdding &&
                            <div className="emp-actions">
                                <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                <button type="button" className="emp-btn emp-btn--ok" onClick={() => add ? add(handleAddNew()): null}>✔</button>
                            </div>
                        }
                    </section>
                </>
            }
        </div>
        </div>
    );
};
