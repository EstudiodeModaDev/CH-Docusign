import type { CsvTemplateBuild } from "../../../../../models/csv";
import { downloadTextFile, toCsvLine } from "../../../../../utils/csv";

export function downloadCsvTemplate(build: CsvTemplateBuild,  opts: { fileName: string }) {
  const csv = `${toCsvLine(build.headers)}\n${toCsvLine(build.exampleRow)}\n`;
  downloadTextFile(opts.fileName, csv);
}