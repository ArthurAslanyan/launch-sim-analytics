// ─── SlotCatalog API Integration ─────────────────────────────
// Endpoint: https://api.slotcatalog.com/api/v1.0/getGamesData
// Returns top-ranked live games. Merged with static reference DB.

const API_URL =
  "https://api.slotcatalog.com/api/v1.0/getGamesData?clientId=1030&token=efouGHBrUndOUsTrYaRDitackSITletH";

const CACHE_KEY = "launchindex_slotcatalog_cache";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

// ─── Raw API shape ────────────────────────────────────────────

export interface SlotCatalogGame {
  gameId: number;
  vendorName: string;
  gameName: string;
  gameSlug: string;
  type: string;
  releaseDate: string;
  rtp: number | null;
  rtpComments: string;
  volatility: "HIGH" | "MED" | "LOW" | "N/A" | null;
  volatilityComment: string | null;
  hitFrequency: number | null;
  hitFrequencyComment: string;
  payWays: number | null;
  layout: string;
  maxMultiplier: number | null;
  slotRank: number;
  dtLastUpdate: string;
  demoGameLink: string;
  imageSquare: string;
  imageLandscape: string;
  features: string[];
  themes: string[];
  tags: Array<{ group: string; values: string }>;
}

// ─── Our normalised shape (extends ReferenceGame) ─────────────

export interface LiveReferenceGame {
  name: string;
  provider: string;
  releaseYear: number;
  themeCategories: string[];
  gameplayStructures: string[];
  features: string[];
  volatility: "Low" | "Medium" | "High" | "Very High";
  volatilityScore: number;
  sessionFriendliness: number;
  featureDensity: "Low" | "Medium" | "High";
  topWin: number;
  rtpRange: string;
  marketPresence: "High" | "Medium" | "Low";
  targetMarkets: string[];
  gameId: number;
  hitFrequency: number | null;
  featureTriggerFrequency: string | null;
  demoLink: string;
  imageUrl: string;
  slotRank: number;
  lastUpdated: string;
  isLive: true;
}

// ─── Mapping helpers ──────────────────────────────────────────

function mapVolatility(v: string | null): "Low" | "Medium" | "High" | "Very High" {
  if (!v) return "Medium";
  const upper = v.toUpperCase();
  if (upper === "HIGH") return "High";
  if (upper === "MED" || upper === "MEDIUM") return "Medium";
  if (upper === "LOW") return "Low";
  return "Medium";
}

function volatilityToScore(v: "Low" | "Medium" | "High" | "Very High", comment: string | null): number {
  if (comment) {
    const match = comment.match(/([\d.]+)\s*\/\s*5/);
    if (match) return Math.round(parseFloat(match[1]) * 2);
  }
  const map = { Low: 2.5, Medium: 5, High: 7.5, "Very High": 9.5 };
  return map[v] ?? 5;
}

function volatilityToSessionFriendliness(v: "Low" | "Medium" | "High" | "Very High", hitFreq: number | null): number {
  if (hitFreq !== null) {
    if (hitFreq > 40) return 8;
    if (hitFreq > 30) return 7;
    if (hitFreq > 20) return 6;
    if (hitFreq > 10) return 5;
    return 4;
  }
  const map = { Low: 8, Medium: 6, High: 5, "Very High": 3 };
  return map[v] ?? 5;
}

function inferGameplayStructures(game: SlotCatalogGame): string[] {
  const structs: string[] = [];
  const feats = game.features.map(f => f.toLowerCase());

  if (feats.includes("megaways") || (game.layout && game.layout.includes("-"))) {
    structs.push("Megaways");
    if (feats.includes("cascading") || feats.includes("avalanche")) structs.push("Cascades");
    return structs;
  }
  if (feats.includes("cluster pays") || feats.some(f => f.includes("cluster"))) {
    structs.push("Cluster Pays");
    if (feats.includes("cascading") || feats.includes("avalanche")) structs.push("Cascades");
    return structs;
  }
  if (feats.includes("pay anywhere")) {
    structs.push("Cluster Pays");
    if (feats.includes("cascading") || feats.includes("avalanche")) structs.push("Cascades");
    return structs;
  }
  const pw = game.payWays ?? 0;
  if (pw >= 100000) { structs.push("Megaways"); }
  else if (pw === 243 || pw === 1024 || pw === 3125) { structs.push("Payways"); }
  else if (pw > 0) { structs.push("Paylines"); }
  else { structs.push("Paylines"); }

  if (feats.includes("cascading") || feats.includes("avalanche") || feats.includes("tumble")) {
    structs.push("Cascades");
  }
  return structs.length > 0 ? structs : ["Paylines"];
}

function mapFeaturesToOurTaxonomy(apiFeatures: string[]): string[] {
  const mapped = new Set<string>();
  const lower = apiFeatures.map(f => f.toLowerCase());

  if (lower.some(f => f.includes("free spin"))) mapped.add("Free Spins");
  if (lower.some(f => f.includes("wild") && !f.includes("megaways"))) mapped.add("Wild");
  if (lower.some(f => f.includes("expanding") || f.includes("expanding symbol"))) mapped.add("Expanding Wilds");
  if (lower.some(f => f.includes("sticky"))) mapped.add("Sticky Wilds");
  if (lower.some(f => f.includes("multiplier"))) mapped.add("Multipliers");
  if (lower.some(f => f.includes("scatter"))) mapped.add("Scatter symbols");
  if (lower.some(f => f.includes("cascad") || f.includes("avalanche") || f.includes("tumble"))) mapped.add("Cascades");
  if (lower.some(f => f.includes("megaways"))) mapped.add("Megaways");
  if (lower.some(f => f.includes("progressive jackpot") || f.includes("jackpot"))) mapped.add("Progressive Jackpot");
  if (lower.some(f => f.includes("buy feature") || f.includes("bonus buy"))) mapped.add("Bonus Buy");
  if (lower.some(f => f.includes("bonus bet") || f.includes("ante bet"))) mapped.add("Ante Bet");
  if (lower.some(f => f.includes("hold") || f.includes("respin") || f.includes("re-spin"))) mapped.add("Hold & Spin");
  if (lower.some(f => f.includes("collect") || f.includes("collection") || f.includes("cash collector"))) mapped.add("Collection Mechanics");
  if (lower.some(f => f.includes("pick bonus") || f.includes("bonus game"))) mapped.add("Pick Bonus");
  if (lower.some(f => f.includes("gamble") || f.includes("risk"))) mapped.add("Gamble Feature");

  return Array.from(mapped);
}

function computeFeatureDensity(features: string[]): "Low" | "Medium" | "High" {
  if (features.length >= 5) return "High";
  if (features.length >= 3) return "Medium";
  return "Low";
}

function slotRankToMarketPresence(rank: number): "High" | "Medium" | "Low" {
  if (rank <= 3) return "High";
  if (rank <= 7) return "Medium";
  return "Low";
}

function parseReleaseYear(dateStr: string): number {
  if (!dateStr) return 2020;
  return parseInt(dateStr.substring(0, 4)) || 2020;
}

function extractFreeTriggerFreq(comment: string): string | null {
  if (!comment) return null;
  const match = comment.match(/1\s*(?:in|\/)\s*([\d,.]+)/i);
  if (!match) return null;
  const n = Math.round(parseFloat(match[1].replace(",", "")));
  if (n <= 60) return "1 in 50";
  if (n <= 88) return "1 in 75";
  if (n <= 125) return "1 in 100";
  if (n <= 175) return "1 in 150";
  if (n <= 250) return "1 in 200";
  return "1 in 300";
}

// ─── Main transform ───────────────────────────────────────────

export function transformApiGame(g: SlotCatalogGame): LiveReferenceGame | null {
  if (g.type === "Live Casino Games") return null;
  if (!g.volatility || g.volatility === "N/A") return null;

  const vol = mapVolatility(g.volatility);
  const mappedFeatures = mapFeaturesToOurTaxonomy(g.features ?? []);
  const gameplayStructures = inferGameplayStructures(g);

  return {
    name: g.gameName,
    provider: g.vendorName,
    releaseYear: parseReleaseYear(g.releaseDate),
    themeCategories: g.themes && g.themes.length > 0 ? g.themes : ["Other"],
    gameplayStructures,
    features: mappedFeatures,
    volatility: vol,
    volatilityScore: volatilityToScore(vol, g.volatilityComment),
    sessionFriendliness: volatilityToSessionFriendliness(vol, g.hitFrequency),
    featureDensity: computeFeatureDensity(mappedFeatures),
    topWin: g.maxMultiplier ?? 1000,
    rtpRange: g.rtp ? `${g.rtp}%` : "—",
    marketPresence: slotRankToMarketPresence(g.slotRank),
    targetMarkets: ["Global"],
    gameId: g.gameId,
    hitFrequency: g.hitFrequency,
    featureTriggerFrequency: extractFreeTriggerFreq(g.hitFrequencyComment),
    demoLink: g.demoGameLink,
    imageUrl: g.imageSquare,
    slotRank: g.slotRank,
    lastUpdated: g.dtLastUpdate,
    isLive: true,
  };
}

// ─── Fetch with cache ─────────────────────────────────────────

interface CacheEntry {
  data: LiveReferenceGame[];
  timestamp: number;
}

export async function fetchLiveGames(): Promise<LiveReferenceGame[]> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const entry: CacheEntry = JSON.parse(cached);
      if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return entry.data;
      }
    }
  } catch {
    // ignore cache errors
  }

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`SlotCatalog API error: ${res.status}`);
    const json = await res.json();
    const rawGames: SlotCatalogGame[] = json?.data ?? [];

    const live = rawGames
      .map(transformApiGame)
      .filter((g): g is LiveReferenceGame => g !== null);

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: live, timestamp: Date.now() }));
    } catch {
      // ignore storage errors
    }

    return live;
  } catch (err) {
    console.warn("SlotCatalog API unavailable, using static data only:", err);
    return [];
  }
}

// ─── Merge live + static ──────────────────────────────────────

import type { ReferenceGame } from "./referenceGames";

export function mergeLiveWithStatic(
  live: LiveReferenceGame[],
  staticGames: ReferenceGame[]
): ReferenceGame[] {
  const updated = staticGames.map(sg => {
    const match = live.find(lg => lg.name.toLowerCase() === sg.name.toLowerCase());
    if (!match) return sg;
    return {
      ...sg,
      volatility: match.volatility,
      volatilityScore: match.volatilityScore,
      topWin: match.topWin,
      rtpRange: match.rtpRange,
      marketPresence: match.marketPresence,
      featureDensity: match.featureDensity,
      sessionFriendliness: match.hitFrequency !== null ? match.sessionFriendliness : sg.sessionFriendliness,
    } as ReferenceGame;
  });

  const newLive = live
    .filter(lg => !staticGames.some(sg => sg.name.toLowerCase() === lg.name.toLowerCase()))
    .map(lg => ({
      name: lg.name,
      provider: lg.provider,
      releaseYear: lg.releaseYear,
      themeCategories: lg.themeCategories,
      gameplayStructures: lg.gameplayStructures,
      features: lg.features,
      volatility: lg.volatility,
      volatilityScore: lg.volatilityScore,
      sessionFriendliness: lg.sessionFriendliness,
      featureDensity: lg.featureDensity,
      topWin: lg.topWin,
      rtpRange: lg.rtpRange,
      marketPresence: lg.marketPresence,
      targetMarkets: lg.targetMarkets,
    } as ReferenceGame));

  return [...updated, ...newLive];
}
