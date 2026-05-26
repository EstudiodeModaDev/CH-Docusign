import type { AccountInfo } from "@azure/msal-browser";
import type { GraphRest, } from "../../graph/graphRest";
import { notify } from '../../utils/notify';

//Validar si el usuario pertenece al grupo de autorizado para acciones administrativas
export async function isAdmin(graph: GraphRest, correo: AccountInfo): Promise<boolean> {

    const groupMembers = await graph.getAllGroupMembers("3dc57761-477f-4096-99c8-e533b6fd7423",);

    const currentEmail = (correo?.username ?? "").toLowerCase();

    const isMember = groupMembers.some(user => (user.mail || user.userPrincipalName || "").toLowerCase() === currentEmail);

    if(!isMember){
      notify.auto("No tienes permisos para aprobar")
      return false
    }

    return true
};


