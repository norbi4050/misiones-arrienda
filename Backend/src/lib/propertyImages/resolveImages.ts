// Resiliente a valores inválidos en runtime
export function resolveImages(input: { apiImages: unknown; bucketImages: unknown }): string[] {
  // Normalizo a arrays de strings
  const toArr = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
    if (typeof v === 'string') return v.trim() ? [v] : [];
    return [];
  };

  const api = toArr(input.apiImages);
  const bucket = toArr(input.bucketImages);

  // Prioridad: bucket > api
  const combined = [...bucket, ...api];

  // Dedupe preservando orden
  const seen = new Set<string>();
  const unique = combined.filter((url) => {
    if (!url) return false;
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  return unique;
}
