import { getApiAccessToken } from "../../auth/msal";

const API_URL = 'https://api-ch-e5fuerbdf5hhcebc.canadacentral-01.azurewebsites.net/api/contracts/';


export async function getContractsByCO(co: string) {
  const token = await getApiAccessToken();

  console.log("starting")
  const response = await fetch(`${API_URL}/co/${encodeURIComponent(co)}?status=Activo`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  console.log(response)
  if (!response.ok) {
    throw new Error('Error al consultar contrato por CO');
  }
  return response.json();
}