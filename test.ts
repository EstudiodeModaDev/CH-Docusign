export function normalizeProcessText(value: string) {
  return (value ?? "")
    .toString()
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

console.log(
  normalizeProcessText("Juan Pablo    Barcó Gañan    s")
)