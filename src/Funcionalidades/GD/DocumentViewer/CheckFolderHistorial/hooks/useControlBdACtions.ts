import { useGestorServices } from "../../../../../graph/graphContext";
import type { HistorialRevisionCarpetas } from "../../../../../models/DocumentViewer";

export function useFolderHistorialActions() {
  const {historialRevisionCarpetas} = useGestorServices()

  const handleSubmitBd = async (state: Partial<HistorialRevisionCarpetas>): Promise<HistorialRevisionCarpetas> => {
    try {
      console.log("Enviando a creación con estado:", state);
      const created = await historialRevisionCarpetas.create(state);
      console.log("Se ha creado la entidad de la carpeta con éxito", created)
      return created
    } catch {
      throw new Error("Algo ha salido mal")
    }
  };

  return {
    handleSubmitBd,

  };
}



