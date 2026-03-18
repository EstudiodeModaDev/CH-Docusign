export async function runWithConcurrency<T, R>(items: T[], worker: (item: T, index: number) => Promise<R>, concurrency = 2): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;

  async function runner() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, runner)
  );

  return results;
}