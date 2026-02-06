// src/utils/completion.ts
export type PasoLike = { EstadoPaso?: string | null };

export type GetAllSvc<T> = {
  getAll: (args: { filter?: string; orderby?: string }) => Promise<T[]>;
};

function odataEscape(v: string) {
  return v.replace(/'/g, "''");
}

async function pool<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;

  async function run() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx]);
    }
  }

  const runners = Array.from({ length: Math.max(1, concurrency) }, () => run());
  await Promise.all(runners);
  return results;
}

export async function computePctById(
  ids: string[],
  svc: GetAllSvc<PasoLike>,
  opts?: { concurrency?: number; titleField?: string }
): Promise<Record<string, number>> {
  const concurrency = opts?.concurrency ?? 10;
  const titleField = opts?.titleField ?? "fields/Title";

  const pairs = await pool(ids, concurrency, async (id) => {
    const safeId = odataEscape(String(id));

    const items = await svc.getAll({
      filter: `${titleField} eq '${safeId}'`,
      orderby: "fields/NumeroPaso asc",
    });

    const pct =
      items.length > 0
        ? (items.filter((i) => i.EstadoPaso === "Completado" || i.EstadoPaso?.toLocaleLowerCase() === "omitido").length / items.length) * 100
        : 0;

    return [id, Math.round(pct * 100) / 100] as const;
  });

  return Object.fromEntries(pairs);
}
