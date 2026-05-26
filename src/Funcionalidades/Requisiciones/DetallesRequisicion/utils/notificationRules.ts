import type { RequisicionesService } from "../../../../Services/Requisiciones/Requisiciones.service";
import { getCurrentMonthRange, toISODateTimeFlex } from "../../../../utils/Date";

export async function shouldNotifyAllStepsCompleted(requisicionId: string, requisicionSvc: RequisicionesService): Promise<boolean> {
  const requisicion = await requisicionSvc.get(requisicionId)
  const monthRange = getCurrentMonthRange()
  const monthlyRequisiciones = 
    await requisicionSvc.getAll({filter: 
      `fields/Created ge '${toISODateTimeFlex(monthRange.start)}' and 
      fields/Created lt '${toISODateTimeFlex(monthRange.end)}' and 
      fields/tipoRequisicion eq 'Retail' and 
      fields/correoSolicitante eq '${requisicion.correoSolicitante}'`
    })
  
  const monthlyRequisicionesApproved = monthlyRequisiciones.items.filter((r)=> !!r.notified)

  if(requisicion.tipoRequisicion === "Retail" && monthlyRequisicionesApproved.length > 0) return false

  return true
  
}