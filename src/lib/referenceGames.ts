// LaunchIndex — Reference Games Dataset & Matching Engine

export interface ReferenceGame {
  name: string;
  provider: string;
  releaseYear: number;
  themeCategories: string[];
  gameplayStructures: string[];
  features: string[];
  volatility: string;
  volatilityScore: number;
  sessionFriendliness: number; // 0-100
  featureDensity: number; // 0-100
  topWin: number;
  rtpRange: string;
  marketPresence: "Low" | "Medium" | "High";
  targetMarkets: string[];
}

// ─── Static Dataset ───────────────────────────────────────────

export const REFERENCE_GAMES: ReferenceGame[] = [
  {
    name: "Starburst",
    provider: "NetEnt",
    releaseYear: 2012,
    themeCategories: ["Space", "Gems", "Classic"],
    gameplayStructures: ["Paylines"],
    features: ["Expanding Wilds", "Respins"],
    volatility: "Low",
    volatilityScore: 0.3,
    sessionFriendliness: 90,
    featureDensity: 25,
    topWin: 500,
    rtpRange: "96.1%",
    marketPresence: "High",
    targetMarkets: ["UK", "Nordics", "EU", "Global"],
  },
  {
    name: "Book of Dead",
    provider: "Play'n GO",
    releaseYear: 2016,
    themeCategories: ["Egypt", "Adventure"],
    gameplayStructures: ["Paylines"],
    features: ["Free Spins", "Expanding Wilds"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 40,
    featureDensity: 45,
    topWin: 5000,
    rtpRange: "96.2%",
    marketPresence: "High",
    targetMarkets: ["UK", "EU", "Global"],
  },
  {
    name: "Sweet Bonanza",
    provider: "Pragmatic Play",
    releaseYear: 2019,
    themeCategories: ["Candy", "Fun", "Colorful"],
    gameplayStructures: ["Cluster Pays"],
    features: ["Free Spins", "Multipliers", "Cascades"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 45,
    featureDensity: 70,
    topWin: 21100,
    rtpRange: "96.5%",
    marketPresence: "High",
    targetMarkets: ["EU", "LATAM", "Global"],
  },
  {
    name: "Gonzo's Quest",
    provider: "NetEnt",
    releaseYear: 2011,
    themeCategories: ["Adventure", "Jungle", "History"],
    gameplayStructures: ["Paylines"],
    features: ["Cascades", "Multipliers", "Free Spins"],
    volatility: "Medium",
    volatilityScore: 0.5,
    sessionFriendliness: 65,
    featureDensity: 60,
    topWin: 2500,
    rtpRange: "95.97%",
    marketPresence: "High",
    targetMarkets: ["UK", "Nordics", "EU", "Global"],
  },
  {
    name: "Reactoonz",
    provider: "Play'n GO",
    releaseYear: 2017,
    themeCategories: ["Aliens", "Fun", "Sci-Fi"],
    gameplayStructures: ["Cluster Pays"],
    features: ["Cascades", "Collection Mechanics", "Expanding Wilds"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 50,
    featureDensity: 80,
    topWin: 4570,
    rtpRange: "96.51%",
    marketPresence: "High",
    targetMarkets: ["Nordics", "EU", "Global"],
  },
  {
    name: "Big Bass Bonanza",
    provider: "Pragmatic Play",
    releaseYear: 2020,
    themeCategories: ["Fishing", "Nature", "Fun"],
    gameplayStructures: ["Paylines"],
    features: ["Free Spins", "Sticky Symbols", "Collection Mechanics"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 45,
    featureDensity: 55,
    topWin: 2100,
    rtpRange: "96.71%",
    marketPresence: "High",
    targetMarkets: ["UK", "EU", "LATAM", "Global"],
  },
  {
    name: "Jammin' Jars",
    provider: "Push Gaming",
    releaseYear: 2018,
    themeCategories: ["Fruit", "Fun", "Colorful"],
    gameplayStructures: ["Cluster Pays"],
    features: ["Cascades", "Multipliers", "Sticky Symbols"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 40,
    featureDensity: 75,
    topWin: 20000,
    rtpRange: "96.83%",
    marketPresence: "Medium",
    targetMarkets: ["UK", "EU"],
  },
  {
    name: "Dead or Alive 2",
    provider: "NetEnt",
    releaseYear: 2019,
    themeCategories: ["Western", "Adventure"],
    gameplayStructures: ["Paylines"],
    features: ["Free Spins", "Sticky Symbols", "Multipliers"],
    volatility: "Very High",
    volatilityScore: 1.0,
    sessionFriendliness: 25,
    featureDensity: 50,
    topWin: 111111,
    rtpRange: "96.8%",
    marketPresence: "High",
    targetMarkets: ["Nordics", "EU", "Global"],
  },
  {
    name: "Razor Shark",
    provider: "Push Gaming",
    releaseYear: 2019,
    themeCategories: ["Ocean", "Nature", "Adventure"],
    gameplayStructures: ["Paylines"],
    features: ["Free Spins", "Expanding Wilds", "Multipliers"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 35,
    featureDensity: 55,
    topWin: 50000,
    rtpRange: "96.7%",
    marketPresence: "Medium",
    targetMarkets: ["EU", "Nordics"],
  },
  {
    name: "Gates of Olympus",
    provider: "Pragmatic Play",
    releaseYear: 2021,
    themeCategories: ["Mythology", "Greek", "Fantasy"],
    gameplayStructures: ["Payways"],
    features: ["Cascades", "Multipliers", "Free Spins"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 40,
    featureDensity: 75,
    topWin: 5000,
    rtpRange: "96.5%",
    marketPresence: "High",
    targetMarkets: ["EU", "LATAM", "Global"],
  },
  {
    name: "Lightning Roulette",
    provider: "Evolution",
    releaseYear: 2018,
    themeCategories: ["Classic", "Casino"],
    gameplayStructures: ["Paylines"],
    features: ["Multipliers", "Progressive Jackpot"],
    volatility: "Medium",
    volatilityScore: 0.5,
    sessionFriendliness: 70,
    featureDensity: 30,
    topWin: 500,
    rtpRange: "97.3%",
    marketPresence: "High",
    targetMarkets: ["UK", "EU", "Global"],
  },
  {
    name: "Buffalo King Megaways",
    provider: "Pragmatic Play",
    releaseYear: 2020,
    themeCategories: ["Animals", "Nature", "Wild West"],
    gameplayStructures: ["Payways"],
    features: ["Free Spins", "Multipliers", "Cascades"],
    volatility: "Very High",
    volatilityScore: 1.0,
    sessionFriendliness: 30,
    featureDensity: 65,
    topWin: 93750,
    rtpRange: "96.52%",
    marketPresence: "Medium",
    targetMarkets: ["EU", "Global"],
  },
  {
    name: "Fruit Party",
    provider: "Pragmatic Play",
    releaseYear: 2020,
    themeCategories: ["Fruit", "Fun", "Colorful"],
    gameplayStructures: ["Cluster Pays"],
    features: ["Cascades", "Multipliers", "Free Spins"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 45,
    featureDensity: 70,
    topWin: 5000,
    rtpRange: "96.47%",
    marketPresence: "Medium",
    targetMarkets: ["EU", "LATAM"],
  },
  {
    name: "Aztec Gems",
    provider: "Pragmatic Play",
    releaseYear: 2018,
    themeCategories: ["Aztec", "Gems", "Classic"],
    gameplayStructures: ["Paylines"],
    features: ["Respins", "Multipliers"],
    volatility: "Medium",
    volatilityScore: 0.5,
    sessionFriendliness: 75,
    featureDensity: 20,
    topWin: 375,
    rtpRange: "96.52%",
    marketPresence: "Low",
    targetMarkets: ["LATAM", "EU"],
  },
  {
    name: "Immortal Romance",
    provider: "Microgaming",
    releaseYear: 2011,
    themeCategories: ["Fantasy", "Romance", "Dark"],
    gameplayStructures: ["Paylines"],
    features: ["Free Spins", "Multipliers", "Collection Mechanics"],
    volatility: "Medium",
    volatilityScore: 0.5,
    sessionFriendliness: 60,
    featureDensity: 65,
    topWin: 12150,
    rtpRange: "96.86%",
    marketPresence: "High",
    targetMarkets: ["UK", "EU", "Global"],
  },
  {
    name: "Bonanza Megaways",
    provider: "Big Time Gaming",
    releaseYear: 2016,
    themeCategories: ["Mining", "Adventure"],
    gameplayStructures: ["Payways"],
    features: ["Cascades", "Free Spins", "Multipliers"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 35,
    featureDensity: 70,
    topWin: 10000,
    rtpRange: "96%",
    marketPresence: "High",
    targetMarkets: ["UK", "Nordics", "EU", "Global"],
  },
  {
    name: "Fire Joker",
    provider: "Play'n GO",
    releaseYear: 2016,
    themeCategories: ["Classic", "Retro"],
    gameplayStructures: ["Paylines"],
    features: ["Respins", "Multipliers"],
    volatility: "Low",
    volatilityScore: 0.3,
    sessionFriendliness: 85,
    featureDensity: 20,
    topWin: 800,
    rtpRange: "96.15%",
    marketPresence: "Medium",
    targetMarkets: ["Nordics", "EU"],
  },
  {
    name: "The Dog House",
    provider: "Pragmatic Play",
    releaseYear: 2019,
    themeCategories: ["Animals", "Fun", "Colorful"],
    gameplayStructures: ["Paylines"],
    features: ["Free Spins", "Sticky Symbols", "Multipliers"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 40,
    featureDensity: 60,
    topWin: 6750,
    rtpRange: "96.51%",
    marketPresence: "High",
    targetMarkets: ["EU", "LATAM", "Global"],
  },
  {
    name: "Money Train 2",
    provider: "Relax Gaming",
    releaseYear: 2020,
    themeCategories: ["Western", "Steampunk", "Adventure"],
    gameplayStructures: ["Paylines"],
    features: ["Respins", "Multipliers", "Sticky Symbols", "Collection Mechanics"],
    volatility: "Very High",
    volatilityScore: 1.0,
    sessionFriendliness: 30,
    featureDensity: 75,
    topWin: 50000,
    rtpRange: "96.4%",
    marketPresence: "High",
    targetMarkets: ["EU", "Nordics", "Global"],
  },
  {
    name: "Starlight Princess",
    provider: "Pragmatic Play",
    releaseYear: 2022,
    themeCategories: ["Anime", "Fantasy", "Colorful"],
    gameplayStructures: ["Payways"],
    features: ["Cascades", "Multipliers", "Free Spins"],
    volatility: "High",
    volatilityScore: 0.8,
    sessionFriendliness: 40,
    featureDensity: 75,
    topWin: 5000,
    rtpRange: "96.5%",
    marketPresence: "High",
    targetMarkets: ["EU", "LATAM", "Global"],
  },
];

// ─── Matching Engine ──────────────────────────────────────────

export interface MatchInput {
  gameType: string;
  theme: string;
  volatility: string;
  features: string[];
  targetMarkets: string[];
}

export interface MatchedGame {
  game: ReferenceGame;
  score: number;
  breakdown: {
    gameplay: number;
    theme: number;
    volatility: number;
    features: number;
    market: number;
  };
}

export interface SaturationResult {
  totalSimilar: number;
  highPresenceCount: number;
  level: "Low" | "Medium" | "High" | "Very High";
  interpretation: string;
}

export interface MarketInsight {
  type: "warning" | "positive" | "info";
  text: string;
}

// Broad theme mapping for category matching
const THEME_CATEGORIES: Record<string, string[]> = {
  "Space": ["Sci-Fi", "Aliens", "Cosmic"],
  "Egypt": ["History", "Adventure", "Ancient"],
  "Candy": ["Fun", "Colorful", "Fruit"],
  "Mythology": ["Greek", "Fantasy", "Norse"],
  "Western": ["Adventure", "Cowboy"],
  "Ocean": ["Nature", "Underwater", "Fish"],
  "Animals": ["Nature", "Wildlife"],
  "Fantasy": ["Magic", "Dark", "Mythology"],
  "Classic": ["Retro", "Traditional", "Casino"],
  "Adventure": ["Exploration", "Action"],
  "Fruit": ["Classic", "Fun", "Colorful"],
  "Asian": ["Oriental", "Culture"],
  "Gems": ["Classic", "Jewels"],
  "Fishing": ["Nature", "Ocean", "Fun"],
  "Anime": ["Japanese", "Fantasy", "Colorful"],
  "Steampunk": ["Western", "Retro", "Adventure"],
};

function getExpandedThemes(theme: string): string[] {
  const lower = theme.toLowerCase();
  const expanded: string[] = [theme];
  for (const [key, related] of Object.entries(THEME_CATEGORIES)) {
    if (lower.includes(key.toLowerCase()) || related.some(r => lower.includes(r.toLowerCase()))) {
      expanded.push(key, ...related);
    }
  }
  return [...new Set(expanded.map(t => t.toLowerCase()))];
}

function computeGameplayScore(input: MatchInput, game: ReferenceGame): number {
  return game.gameplayStructures.some(g => g.toLowerCase() === input.gameType.toLowerCase()) ? 100 : 0;
}

function computeThemeScore(input: MatchInput, game: ReferenceGame): number {
  if (!input.theme) return 30; // neutral if no theme specified
  const expanded = getExpandedThemes(input.theme);
  const gameThemes = game.themeCategories.map(t => t.toLowerCase());
  const matches = gameThemes.filter(t => expanded.includes(t)).length;
  if (matches === 0) return 0;
  return Math.min(100, (matches / gameThemes.length) * 100);
}

function computeVolatilityScore(input: MatchInput, game: ReferenceGame): number {
  const volMap: Record<string, number> = { "Low": 0.3, "Medium": 0.5, "High": 0.8, "Very High": 1.0 };
  const inputVol = volMap[input.volatility] ?? 0.5;
  const gameVol = game.volatilityScore;
  const diff = Math.abs(inputVol - gameVol);
  return Math.max(0, 100 - diff * 200);
}

function computeFeatureScore(input: MatchInput, game: ReferenceGame): number {
  if (input.features.length === 0) return 30;
  const gameFeats = game.features.map(f => f.toLowerCase());
  const inputFeats = input.features.map(f => f.toLowerCase());
  const overlap = inputFeats.filter(f => gameFeats.some(gf => gf.includes(f) || f.includes(gf))).length;
  return Math.min(100, (overlap / inputFeats.length) * 100);
}

function computeMarketScore(input: MatchInput, game: ReferenceGame): number {
  if (input.targetMarkets.length === 0) return 50;
  const gameMarkets = game.targetMarkets.map(m => m.toLowerCase());
  const overlap = input.targetMarkets.filter(m => gameMarkets.includes(m.toLowerCase())).length;
  return Math.min(100, (overlap / input.targetMarkets.length) * 100);
}

export function findSimilarGames(input: MatchInput): MatchedGame[] {
  const weights = { gameplay: 0.30, theme: 0.20, volatility: 0.20, features: 0.20, market: 0.10 };

  const scored = REFERENCE_GAMES.map(game => {
    const breakdown = {
      gameplay: computeGameplayScore(input, game),
      theme: computeThemeScore(input, game),
      volatility: computeVolatilityScore(input, game),
      features: computeFeatureScore(input, game),
      market: computeMarketScore(input, game),
    };
    const score = Math.round(
      breakdown.gameplay * weights.gameplay +
      breakdown.theme * weights.theme +
      breakdown.volatility * weights.volatility +
      breakdown.features * weights.features +
      breakdown.market * weights.market
    );
    return { game, score, breakdown };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}

export function computeSaturation(matches: MatchedGame[]): SaturationResult {
  const totalSimilar = matches.filter(m => m.score >= 40).length;
  const highPresenceCount = matches.filter(m => m.game.marketPresence === "High" && m.score >= 40).length;

  let level: SaturationResult["level"];
  let interpretation: string;

  if (highPresenceCount >= 4) {
    level = "Very High";
    interpretation = "Highly saturated segment with multiple dominant titles. Strong differentiation is critical.";
  } else if (highPresenceCount >= 2) {
    level = "High";
    interpretation = "Competitive space with established titles. Consider unique mechanics or themes for positioning.";
  } else if (totalSimilar >= 3) {
    level = "Medium";
    interpretation = "Moderately competitive space with room for differentiation through features or pacing.";
  } else {
    level = "Low";
    interpretation = "Low saturation — concept may be differentiated but market validation is limited.";
  }

  return { totalSimilar, highPresenceCount, level, interpretation };
}

export function generateMarketInsights(matches: MatchedGame[], input: MatchInput): MarketInsight[] {
  const insights: MarketInsight[] = [];
  const highPresence = matches.filter(m => m.game.marketPresence === "High" && m.score >= 40);

  if (highPresence.length >= 3) {
    insights.push({ type: "warning", text: "High competition — differentiation required to stand out in this segment." });
  }

  if (matches[0]?.score < 30) {
    insights.push({ type: "info", text: "Concept may be differentiated but largely unvalidated by existing market data." });
  }

  const volMap: Record<string, number> = { "Low": 0.3, "Medium": 0.5, "High": 0.8, "Very High": 1.0 };
  const inputVol = volMap[input.volatility] ?? 0.5;
  const avgMatchVol = matches.reduce((sum, m) => sum + m.game.volatilityScore, 0) / matches.length;
  if (Math.abs(inputVol - avgMatchVol) > 0.3) {
    insights.push({ type: "info", text: "Volatility positioning deviates from dominant patterns in this segment." });
  }

  if (highPresence.length === 0 && matches[0]?.score >= 50) {
    insights.push({ type: "positive", text: "Similar games exist but none dominate — opportunity for market capture." });
  }

  if (matches.some(m => m.breakdown.features >= 80 && m.game.marketPresence === "High")) {
    insights.push({ type: "warning", text: "Feature set closely matches a dominant title — consider adding unique mechanics." });
  }

  if (insights.length === 0) {
    insights.push({ type: "positive", text: "Balanced competitive position with reasonable market opportunity." });
  }

  return insights;
}
