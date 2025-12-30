import * as React from "react";
import "../Empresas.css";
import { useGraphServices } from "../../../graph/graphContext";
import { useEmpresasSelect } from "../../../Funcionalidades/Desplegables";
import type { maestro } from "../../../models/Desplegables";

export const EmpresasManager: React.FC = ({}) => {
    const { Maestro, } = useGraphServices();
    const { items, add, editItem, reload, remove} = useEmpresasSelect(Maestro);
    const [isEditing, setIsEditing] = React.useState(false);
    const [state, setState] = React.useState<maestro>({ T_x00ed_tulo1: "", Abreviacion: "", Title: "", Codigo: ""})
    const [isAdding, setIsAdding] = React.useState<boolean>(false)

    const handleAddNew = () => {
        const payload: maestro = {
            Abreviacion: "",
            Title: "Empresas",
            Codigo: "",
            T_x00ed_tulo1: state.T_x00ed_tulo1,
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
            <button type="button" className="btn btn-primary" onClick={() => {setIsAdding(true); setState({...state, T_x00ed_tulo1: ""})}}>
                <span className="emp-add-btn__icon">＋</span>
                Añadir Empresas
            </button>
        </div>

        <div className="emp-layout">
            {/* Lista izquierda */}
            <section className="emp-list">
            {items.map((emp) => (
                <div key={emp.Id} className={ "emp-row"}>
                <button type="button" className="emp-row__name" onClick={() => {setIsEditing(true); setState(emp)}}>
                    {emp.T_x00ed_tulo1}
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
                            <input id="empresaNombre" type="text" className="emp-input" placeholder="Nombre de la empresa" value={state?.T_x00ed_tulo1} onChange={(e) => setState({...state, T_x00ed_tulo1: e.target.value.toUpperCase()})}/>
                        </div>
                        { isEditing &&
                            <div className="emp-actions">
                                <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                <button type="button" className="emp-btn emp-btn--ok" onClick={async () => {
                                                                                        if(editItem){
                                                                                            await editItem({Title: "Empresas", T_x00ed_tulo1: state.T_x00ed_tulo1.toUpperCase()}, state!.Id ?? "", );
                                                                                            alert("Se ha editado con éxito la empresa")
                                                                                            setIsEditing(false)
                                                                                            setIsAdding(false)
                                                                                            reload()
                                                                                        }
                                                                                        setIsEditing(false);}}>✔</button>
                            </div>
                        }
                        { isAdding &&
                            <div className="emp-actions">
                                <button type="button" className="emp-btn emp-btn--cancel" onClick={() => {setIsEditing(false); setIsAdding(false)}}>✕</button>
                                <button type="button" className="emp-btn emp-btn--ok"  onClick={async () => {
                                                                                                    try {
                                                                                                    if (!add) return;

                                                                                                    const payload = await handleAddNew(); // ✅ esperar
                                                                                                    if (!payload?.T_x00ed_tulo1?.trim()) return;

                                                                                                    await add(payload); // ✅ esperar
                                                                                                    alert("Se ha agregado con éxito el cargo");
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
        </div>
    );
};
