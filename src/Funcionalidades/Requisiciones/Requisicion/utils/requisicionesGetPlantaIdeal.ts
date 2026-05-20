import type { plantaIdeal } from "../../../../models/Requisiciones/plantaIdeal";
import type { PlantaIdealService } from "../../../../Services/Requisiciones/PlantaIdeal.service";

type MesKey = keyof Omit<plantaIdeal, "Id" | "Title" | "Tienda">;

const mesKey: Record<number, MesKey> = {
  1: "_x0031_",
  2: "_x0032_",
  3: "_x0033_",
  4: "_x0034_",
  5: "_x0035_",
  6: "_x0036_",
  7: "_x0037_",
  8: "_x0038_",
  9: "_x0039_",
  10: "_x0031_0",
  11: "_x0031_1",
  12: "_x0031_2"
}

export async function lookPlantaIdeal(servicio: PlantaIdealService, tienda: string): Promise<number | null> {
  const actualMonth = (new Date().getMonth() + 1);
  const month = mesKey[actualMonth]
  console.log(actualMonth)

  const { items } = await servicio.getAll({
    filter: `fields/CO eq '${tienda}'`,
    top: 1,
  });

  console.log(items)

  const planta = items[0];
  if (!planta) return null;

  return planta[month];
}