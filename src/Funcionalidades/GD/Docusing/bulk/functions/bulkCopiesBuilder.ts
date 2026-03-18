
import {extractRoleColumns, validateBulkRows,} from "../utils/bulkValidation";
import type { BulkCopy } from "../../../../../models/Docusign";
import type { Row } from "../../../../../models/csv";

export function buildBulkCopiesFromGrid(columns: string[], rows: Row[]): BulkCopy[] {
  const roles = extractRoleColumns(columns);

  validateBulkRows(rows, roles);

  const roleCols = new Set<string>();
  roles.forEach((r) => {
    if (r.nameCol) roleCols.add(r.nameCol);
    if (r.emailCol) roleCols.add(r.emailCol);
  });

  const tabCols = columns.filter(
    (c) => c !== "ReferenceId" && !roleCols.has(c)
  );

  return rows.map((r) => {
    const referenceId = (r["ReferenceId"] ?? "").trim();

    const recipients = roles.map((role) => ({
      roleName: role.roleName,
      name: (r[role.nameCol] ?? "").trim(),
      email: (r[role.emailCol] ?? "").trim(),
    }));

    const textTabs = tabCols
      .map((tabLabel) => {
        const value = (r[tabLabel] ?? "").trim();
        return value ? { tabLabel, value } : null;
      })
      .filter((x): x is { tabLabel: string; value: string } => x !== null);

    return {
      recipients,
      tabs: textTabs.length ? { textTabs } : undefined,
      customFields: [{ name: "ReferenceId", value: referenceId, show: "false" }],
    };
  });
}