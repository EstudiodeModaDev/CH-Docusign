export function appendSegment(base: string, segment: string): string {
  const cleanBase = base.replace(/^\/|\/$/g, "");
  const cleanSeg = segment.replace(/^\/|\/$/g, "");
  if (!cleanBase) return cleanSeg;
  return `${cleanBase}/${cleanSeg}`;
}

export function parentPathOf(path: string): string {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

export function calculateDepth(path: string): number {
  if (!path) return 0;
  return path.split("/").filter(Boolean).length;
}