import type { log } from "../../models/log";
import type { LogService } from "../../Services/Log.service";

export async function createlogEntry(service: LogService, payload: log) {
  if(!payload){
    throw new Error("No se ha enviado la información necesaria")
  }

  service.create(payload)
}