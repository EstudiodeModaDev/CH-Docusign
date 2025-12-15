/*function filtrarNuevosYDuplicados<TExcel, TDestino>(filasExcel: TExcel[], existentesDestino: TDestino[], getKeyExcel: (row: TExcel) => string, getKeyDestino: (row: TDestino) => string) {
  const existentes = new Set<string>(
    existentesDestino.map((r) => getKeyDestino(r))
  );

  const nuevos: TExcel[] = [];
  const duplicados: TExcel[] = [];

  // 2) Recorrer cada fila del Excel
  for (const fila of filasExcel) {
    const key = getKeyExcel(fila);

    if (existentes.has(key)) {
      duplicados.push(fila);
    } else {
      nuevos.push(fila);
      existentes.add(key); // para evitar repetir dentro del mismo Excel
    }
  }

  return { nuevos, duplicados };
}
*/