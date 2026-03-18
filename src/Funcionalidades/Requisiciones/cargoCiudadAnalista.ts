import React from "react";
import type { DateRange, SortDir, SortField, } from "../../models/Commons";
import type { cargoCiudadAnalista, cargoCiudadAnalistaErrors, } from "../../models/requisiciones";
import type { cargoCiudadAnalistaService } from "../../Services/cargoCiudadAnalista.service";

export function useCargoCiudadAnalista(requisicionSvc: cargoCiudadAnalistaService,) {
  const [rows, setRows] = React.useState<cargoCiudadAnalista[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });
  const [pageSize, setPageSize] = React.useState<number>(10); 
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [search, setSearch] = React.useState<string>("");
  const [estado, setEstado] = React.useState<string>("todos");
  const [state, setState] = React.useState<cargoCiudadAnalista>({Cargo: "", Ciudad: "", nombreAnalista: "", Title: ""});
  const [errors, setErrors] = React.useState<cargoCiudadAnalistaErrors>({});
  const setField = React.useCallback(<K extends keyof cargoCiudadAnalista>(k: K, v: cargoCiudadAnalista[K]) => { setState((s) => ({ ...s, [k]: v }));}, []);

  const loadANS = React.useCallback(async () => {

    setLoading(true);
    setError(null);

    try {
      const items = await requisicionSvc.getAll();
      setRows(items)
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [requisicionSvc]);

  // Traer de Graph SOLO cuando cambie estado/rango (o cuando auth esté listo)
  React.useEffect(() => {
    loadANS();
  }, [loadANS,]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadANS(); }, [loadANS]);
  const reloadAll  = React.useCallback(() => { loadANS(); }, [loadANS, range, search]);

  const validate = () => {
    const e: cargoCiudadAnalistaErrors = {};
    if(!state.Cargo) e.Cargo = "Seleccione un cargo"
    if(!state.Ciudad) e.Ciudad = "Seleccione la ciudad"
    if(!state.Title) e.Title = "Seleccione el analista encargado"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const cleanState = () => {
    setState({Cargo: "", Ciudad: "", nombreAnalista: "", Title: ""})
  };

  const handleCreate = async (payload: cargoCiudadAnalista): Promise<{created: string | null, ok: boolean}> => {
    if (!validate()) { 
      alert("Hay campos sin rellenar")
      console.log(errors)
      return {
        created: null,
        ok: false        
      }
    };
    console.log(state)
    setLoading(true);
    try {
      const exists = await requisicionSvc.getAll({filter: `fields/Cargo eq '${state.Cargo}' and fields/Ciudad eq '${state.Ciudad}'`});
      if(exists.length > 0){
        alert("Ya existe la combinacion de este cargo y ciudad")
        return{
            created: null,
            ok: false
        }
      }
      const created = await requisicionSvc.create(payload);
      alert("Se ha creado el registro con éxito")
      return {
        created: created.Id ?? "",
        ok: true        
      }
    } catch{
      return {
        created: null,
        ok: false        
      }
    }finally {
        setLoading(false);
      }
  };

  /*const handleEdit = async (e: React.FormEvent, cargoSeleccionado: ansRequisicion) => {
    e.preventDefault();
    if (!validate()) { return};
    setLoading(true);
    try {  
      const payload: ansRequisicion = {
        AplicaVDPNuevo: cargoSeleccionado.AplicaVDPNuevo !== state.AplicaVDPNuevo ? state.AplicaVDPNuevo : cargoSeleccionado.AplicaVDPNuevo,
        AplicaVDPPromocion: cargoSeleccionado.AplicaVDPPromocion !== state.AplicaVDPPromocion ? state.AplicaVDPPromocion : cargoSeleccionado.AplicaVDPPromocion,
        Cargo: cargoSeleccionado.Cargo !== state.Cargo ? state.Cargo : cargoSeleccionado.Cargo,
        diasHabiles0: Number(cargoSeleccionado.diasHabiles0) !== Number(state.diasHabiles0) ? Number(state.diasHabiles0) : Number(cargoSeleccionado.diasHabiles0),
        Title: state.Title,
      };

      await requisicionSvc.update(cargoSeleccionado.Id!, payload);
      alert("Se ha actualizado el registro con éxito")
    } finally {
        setLoading(false);
      }
  };*/

  const handleDelete = async (e: React.FormEvent, cargoSeleccionado: string) => {
    e.preventDefault();
    if (!validate()) return;

    const ok = window.confirm(
      `¿Seguro que deseas eliminar esta combinación? Esta acción no se puede deshacer.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      await requisicionSvc.delete(cargoSeleccionado);
      alert("Registro eliminado con éxito");
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el registro. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const lookForAnalistaEncargado = async (cargoSeleccionado: string, ciudadSeleccionada: string): Promise<cargoCiudadAnalista> => {
    const ANS = await requisicionSvc.getAll({filter: `fields/Cargo eq '${cargoSeleccionado}' and fields/Ciudad eq '${ciudadSeleccionada}'`})
    const final = ANS[0]
    return final
  }

  return {
    rows, loading, error, pageSize, range, search, errors, sorts, state, estado,
    applyRange, reloadAll, setRange, setPageSize, setSearch, setSorts, setField, handleCreate, cleanState, setEstado, handleDelete, setState, lookForAnalistaEncargado
  };
}