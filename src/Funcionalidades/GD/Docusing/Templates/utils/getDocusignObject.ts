import type { DocuSignVM } from "../../../../../models/DTO";
import { spDateToSpanishLong } from "../../../../../utils/Date";
import { formatPesosEsCO } from "../../../../../utils/Number";

export function pickValueFromLabel(raw: string, vm: DocuSignVM){
  const label = (raw ?? "").trim().toLowerCase();
  switch (label) {
    case "nombre":
    case "nombre_de_la_persona":
      return vm.nombre;

    case "tipo_de_documento":
    case "tipodoc":
      return vm.tipoDoc;

      case "fechacomp":
      case "fecha_de_ingreso":
      case "fechaingreso":
        return spDateToSpanishLong(vm.fechaIngreso);

      case "identificaci_n":
      case "identificación":
      case "numerodoc":
        return formatPesosEsCO(vm.identificacion);

      case "salario_en_letras":
      case "salarioletras":
        return vm.salarioLetras;

      case "salario_valor":
      case "salario":
        return formatPesosEsCO(vm.salarioValor);

      case "cargo":
        return vm.cargo;

      case "ciudad":
        return vm.ciudad;

      case "conectividad_en_letras":
      case "auxconectividadletras":
        return vm.conectividadLetras;

      case "conectividad_valor":
      case "auxconectividadnumero":
      case "auxconectividadnu":
      case "auxconectividad":
        return formatPesosEsCO(vm.conectividadValor);

      case "garantizado_valor":
      case "garantizadonumero":
      case "garantizadonu":
        return formatPesosEsCO(vm.garantizadoValor);

      case "garantizado":
      case "garantizadoletras":
      case "garantizadoalfabetico":
        return vm.garantizadoLetras;

      case "tipodoccort":
        return vm.tipoDocCorto;

      case "universidad":
        return vm.universidad;

      case "nituniversidad":
        return vm.nitUniversidad;

      case "coordinadorpracticas":
        return vm.coordinador;

      case "fechanac":
        return vm.fechaNac;

      case "fechafin":
        return vm.fechaFinal;

      case "fechainiciolectiva":
        return vm.fechaInicioLectiva;

      case "fechafinallectiva":
        return vm.fechaFinalLectiva;

      case "fechainicioproductiva":
        return vm.fechaInicioProductiva;

      case "fechafinalproductiva":
        return vm.fechaFinalProductiva;

      case "etapa":
        return vm.etapa;

      case "especialidad":
      case "programa":
        return vm.especialidad;

      case "tipotel":
        return vm.tipoTel;

      case "ciudadexpe":
        return vm.ciudadExpedicion;

      case "fechaletras":
        return vm.FechaLetras;
      
      case "departamento":
        return vm.departamento

      default:
        return "";
    }
}