type ReturnType = {
  ok: boolean
  message: string
}

export function validateFields(props: {proceso: string, templateId: string, Cedula: string, receptor: string, correoReceptor: string, asunto: string}): ReturnType  {

  const {proceso, templateId, Cedula, receptor, correoReceptor, asunto} = props

  if (!proceso) {
    return {
      message: "Selecciona un proceso.",
      ok: false
    }
  }
  if (!templateId) {
    return {
      message: "Selecciona un formato.",
      ok: false
    }
  }

  if (!Cedula || !receptor || !correoReceptor) {
    return{
      message: "Por favor rellene todos los datos del tercero",
      ok: false
    }; 
  }

  if(!asunto){
    return{
      message: "Por favor escriba el asunto del correo",
      ok: false
    }
  }

  return{
    ok: true,
    message: ""
  }


};
