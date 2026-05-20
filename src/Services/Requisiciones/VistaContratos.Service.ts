const API_URL = 'http://localhost:3000/api/contracts';

export async function getContracts() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Error al consultar contratos');
  }
  return response.json();
}

export async function getContractsByCO(co: string) {
  console.log("starting")
  const response = await fetch(`${API_URL}/co/${co}`);
  console.log(response)
  if (!response.ok) {
    throw new Error('Error al consultar contrato por CO');
  }
  return response.json();
}