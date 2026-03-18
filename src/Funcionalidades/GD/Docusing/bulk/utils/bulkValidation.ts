import type { ParsedRoleColumns, Row } from "../../../../../models/csv";

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email ?? "").trim());
}


export function extractRoleColumns(columns: string[]): ParsedRoleColumns[] {
  const roleMap = new Map<string, { nameCol: string; emailCol: string }>();

  for (const col of columns) {
    const mName = col.match(/^(.*)_Name$/);
    const mEmail = col.match(/^(.*)_Email$/);

    if (mName?.[1]) {
      const role = mName[1];
      const prev = roleMap.get(role) ?? { nameCol: "", emailCol: "" };
      roleMap.set(role, { ...prev, nameCol: col });
    }

    if (mEmail?.[1]) {
      const role = mEmail[1];
      const prev = roleMap.get(role) ?? { nameCol: "", emailCol: "" };
      roleMap.set(role, { ...prev, emailCol: col });
    }
  }

  return Array.from(roleMap.entries()).map(([roleName, cols]) => ({
    roleName,
    nameCol: cols.nameCol,
    emailCol: cols.emailCol,
  }));
}

export function validateBulkRows(rows: Row[], roles: ParsedRoleColumns[]) {
  if (!roles.length) {
    throw new Error(
      "No detecté roles. Asegúrate de tener columnas como COLABORADOR_Name y COLABORADOR_Email."
    );
  }

  const refSeen = new Set<string>();

  rows.forEach((r, idx) => {
    const rowNum = idx + 1;
    const ref = (r["ReferenceId"] ?? "").trim();

    if (!ref) throw new Error(`Fila ${rowNum}: ReferenceId vacío`);
    if (refSeen.has(ref)) {
      throw new Error(`Fila ${rowNum}: ReferenceId duplicado (${ref})`);
    }
    refSeen.add(ref);

    for (const role of roles) {
      const name = (r[role.nameCol] ?? "").trim();
      const email = (r[role.emailCol] ?? "").trim();

      if (!name) throw new Error(`Fila ${rowNum}: falta ${role.nameCol}`);
      if (!email) throw new Error(`Fila ${rowNum}: falta ${role.emailCol}`);
      if (!isValidEmail(email)) {
        throw new Error(`Fila ${rowNum}: email inválido (${email})`);
      }
    }
  });
}