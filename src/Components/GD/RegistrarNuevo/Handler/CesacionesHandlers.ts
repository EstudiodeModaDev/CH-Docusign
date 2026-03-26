import { numeroATexto } from "../../../../utils/Number";

export function auxilioHandlder(minimo: number, salario: number, auxTransporte: number): {valor: number, texto: string}{
  const dosSalarios = minimo*2

  let nextValor = 0
  let nextTexto = ""

  console.log(minimo)
  console.log(salario)
  console.log(auxTransporte)
  console.log(dosSalarios)

  if (salario <= dosSalarios) {
    nextValor = auxTransporte;
    nextTexto = numeroATexto(Number(auxTransporte)).toLocaleUpperCase();

    console.log("LLego aqui")
    return {
      texto: nextTexto,
      valor: nextValor
    }

    
  } else {
    nextValor = 48961;
    nextTexto = "Cuarenta y ocho mil novecientos secenta y un pesos";

    console.log("LLego aqui")
    return {
      texto: nextTexto,
      valor: nextValor
    }
  }

}
