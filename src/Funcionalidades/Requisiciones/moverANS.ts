import React from "react";
import type { DateRange, SortDir, SortField, } from "../../models/Commons";
import type { moverAns, moverANSErrors, requisiciones, } from "../../models/requisiciones";
import type { MoverANSService } from "../../Services/moverAns.service";
import { toISODateTimeFlex } from "../../utils/Date";

export function useMoverANS(requisicionSvc: MoverANSService, requisicion?: requisiciones) {
  const [rows, setRows] = React.useState<moverAns[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<DateRange>({ from: "", to: "" });
  const [pageSize, setPageSize] = React.useState<number>(10); 
  const [sorts, setSorts] = React.useState<Array<{field: SortField; dir: SortDir}>>([{ field: 'id', dir: 'desc' }]);
  const [search, setSearch] = React.useState<string>("");
  const [estado, setEstado] = React.useState<string>("todos");
  const [state, setState] = React.useState<moverAns>({
    ANS: requisicion?.ANS ?? "", 
    fechaComentario: toISODateTimeFlex(new Date()), 
    fechaLimite: requisicion?.fechaLimite ?? null, 
    Title: requisicion?.Id ?? "", 
    observacion: ""});
  const [errors, setErrors] = React.useState<moverANSErrors>({});
  const setField = React.useCallback(<K extends keyof moverAns>(k: K, v: moverAns[K]) => { setState((s) => ({ ...s, [k]: v }));}, []);

  const loadRequisicionEspecifica = React.useCallback(async () => {
    if(!requisicion?.Id) return

    setLoading(true);
    setError(null);

    try {
      const items = await requisicionSvc.getAll({filter: `fields/Title eq '${requisicion.Id}'`});
      setRows(items)
    } catch (e: any) {
      setError(e?.message ?? "Error cargando tickets");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [requisicionSvc, requisicion]);

  // Traer de Graph SOLO cuando cambie estado/rango (o cuando auth esté listo)
  React.useEffect(() => {
    loadRequisicionEspecifica();
  }, [loadRequisicionEspecifica,]);

  // recargas por cambios externos
  const applyRange = React.useCallback(() => { loadRequisicionEspecifica(); }, [loadRequisicionEspecifica]);
  const reloadAll  = React.useCallback(() => { loadRequisicionEspecifica(); }, [loadRequisicionEspecifica,]);

  const validate = () => {
    const e: moverANSErrors = {};
    if(!state.observacion) e.observacion = "Indique el motivo por el cual realiza el cambio"
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const cleanState = () => {
    setState({    
        ANS: requisicion?.ANS ?? "", 
        fechaComentario: toISODateTimeFlex(new Date()), 
        fechaLimite: requisicion?.fechaLimite ?? null, 
        Title: requisicion?.Id ?? "", 
        observacion: ""})
  };

  const handleCreate = async (): Promise<{created: string | null, ok: boolean}> => {
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
    const payload: moverAns = {
        ANS: state.ANS,
        fechaComentario: toISODateTimeFlex(state.fechaComentario),
        fechaLimite: toISODateTimeFlex(state.fechaLimite),
        observacion: state.observacion, 
        Title: state.Title,
    }
    try {
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


  return {
    rows, loading, error, pageSize, range, search, errors, sorts, state, estado,
    applyRange, reloadAll, setRange, setPageSize, setSearch, setSorts, setField, handleCreate, cleanState, setEstado, setState,
  };
}