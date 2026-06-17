const CF_BASE = "https://codeforces.com/api";
const CF_HANDLE = "vishrudh_raj";

export interface CfProblemInfo {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
}

export interface CfRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

let problemCache: Map<string, CfProblemInfo> | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function fetchCfProblem(
  contestId: number,
  index: string
): Promise<CfProblemInfo | null> {
  try {
    const now = Date.now();
    if (!problemCache || now - cacheTime > CACHE_TTL) {
      const res = await fetch(`${CF_BASE}/problemset.problems`, {
        next: { revalidate: 3600 },
      });
      const json = await res.json();
      if (json.status !== "OK") return null;

      problemCache = new Map();
      for (const p of json.result.problems) {
        const key = `${p.contestId}-${p.index}`;
        problemCache.set(key, {
          contestId: p.contestId,
          index: p.index,
          name: p.name,
          rating: p.rating,
          tags: p.tags || [],
        });
      }
      cacheTime = now;
    }

    return problemCache.get(`${contestId}-${index}`) || null;
  } catch {
    return null;
  }
}

export async function fetchCfUserRating(): Promise<CfRatingChange[]> {
  try {
    const res = await fetch(
      `${CF_BASE}/user.rating?handle=${CF_HANDLE}`,
      { next: { revalidate: 300 } }
    );
    const json = await res.json();
    if (json.status !== "OK") return [];
    return json.result as CfRatingChange[];
  } catch {
    return [];
  }
}

export async function fetchCfUserInfo() {
  try {
    const res = await fetch(`${CF_BASE}/user.info?handles=${CF_HANDLE}`, {
      next: { revalidate: 300 },
    });
    const json = await res.json();
    if (json.status !== "OK") return null;
    return json.result[0];
  } catch {
    return null;
  }
}
