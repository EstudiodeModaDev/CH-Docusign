import { numeroATexto } from "../../../../utils/Number";

export function auxilioHandlder(minimo: number, salario: number, auxTransporte: number): {valor: number, texto: string}{
  const dosSalarios = minimo*2

  let nextValor = 0
  let nextTexto = ""

  if (salario <= dosSalarios) {
    nextValor = auxTransporte;
    nextTexto = numeroATexto(Number(auxTransporte)).toLocaleUpperCase();

    return {
      texto: nextTexto,
      valor: nextValor
    }

    
  } else {
    nextValor = 48961;
    nextTexto = "Cuarenta y ocho mil novecientos secenta y un pesos";

    return {
      texto: nextTexto,
      valor: nextValor
    }
  }

}
