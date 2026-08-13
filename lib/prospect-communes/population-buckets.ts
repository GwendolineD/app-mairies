export type PopulationColorToken =
  | "mint"
  | "turquoise"
  | "aqua"
  | "sun"
  | "orange"
  | "coral";

export type PopulationBucket = {
  id: string;
  label: string;
  min: number;
  max: number;
  colorToken: PopulationColorToken;
};

export const POPULATION_BUCKETS: readonly PopulationBucket[] = [
  { id: "0-500", label: "0 – 500 hab.", min: 0, max: 500, colorToken: "mint" },
  {
    id: "501-800",
    label: "501 – 800 hab.",
    min: 501,
    max: 800,
    colorToken: "turquoise",
  },
  {
    id: "801-1000",
    label: "801 – 1 000 hab.",
    min: 801,
    max: 1000,
    colorToken: "aqua",
  },
  {
    id: "1001-1500",
    label: "1 001 – 1 500 hab.",
    min: 1001,
    max: 1500,
    colorToken: "sun",
  },
  {
    id: "1501-2000",
    label: "1 501 – 2 000 hab.",
    min: 1501,
    max: 2000,
    colorToken: "orange",
  },
  {
    id: "2000+",
    label: "2 000+ hab.",
    min: 2001,
    max: Number.MAX_SAFE_INTEGER,
    colorToken: "coral",
  },
] as const;

const BUCKET_BY_ID = new Map(POPULATION_BUCKETS.map((bucket) => [bucket.id, bucket]));

/** Hex colors aligned with design tokens in app/globals.css (map pins). */
export const POPULATION_COLOR_HEX: Record<PopulationColorToken, string> = {
  mint: "#74e3b2",
  turquoise: "#35d1d1",
  aqua: "#1bb9d9",
  sun: "#ffc93d",
  orange: "#ffb347",
  coral: "#ff6b6b",
};

export function getPopulationBucket(population: number): PopulationBucket {
  const bucket =
    POPULATION_BUCKETS.find(
      (entry) => population >= entry.min && population <= entry.max,
    ) ?? POPULATION_BUCKETS[POPULATION_BUCKETS.length - 1];
  return bucket;
}

export function getPopulationBucketById(id: string): PopulationBucket | undefined {
  return BUCKET_BY_ID.get(id);
}

export function buildPopulationOrFilter(bucketIds: string[]): string | null {
  const parts: string[] = [];
  for (const id of bucketIds) {
    const bucket = getPopulationBucketById(id);
    if (!bucket) continue;
    if (bucket.max >= Number.MAX_SAFE_INTEGER / 2) {
      parts.push(`population.gte.${bucket.min}`);
    } else {
      parts.push(`and(population.gte.${bucket.min},population.lte.${bucket.max})`);
    }
  }
  return parts.length > 0 ? parts.join(",") : null;
}
