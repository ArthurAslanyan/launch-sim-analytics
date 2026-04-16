// LaunchIndex — Reference Games Dataset & Matching Engine (v2)

export interface ReferenceGame {
  name: string;
  provider: string;
  releaseYear: number;
  themeCategories: string[];
  gameplayStructures: string[];
  features: string[];
  volatility: "Low" | "Medium" | "High" | "Very High";
  volatilityScore: number; // 1–10
  sessionFriendliness: number; // 1–10
  featureDensity: "Low" | "Medium" | "High";
  topWin: number;
  rtpRange: string;
  marketPresence: "High" | "Medium" | "Low";
  targetMarkets: string[];
}

// ─── Static Dataset (30 titles) ───────────────────────────────

export const REFERENCE_GAMES: ReferenceGame[] = [
  { name: "Sweet Bonanza", provider: "Pragmatic Play", releaseYear: 2019, themeCategories: ["Candy", "Fruit", "Colorful"], gameplayStructures: ["Cluster Pays", "Tumble"], features: ["Free Spins", "Multipliers", "Cascades"], volatility: "High", volatilityScore: 7.5, sessionFriendliness: 6, featureDensity: "High", topWin: 21100, rtpRange: "96.48–96.51%", marketPresence: "High", targetMarkets: ["EU", "LATAM", "Global"] },
  { name: "Jammin' Jars", provider: "Push Gaming", releaseYear: 2018, themeCategories: ["Fruit", "Retro", "Colorful"], gameplayStructures: ["Cluster Pays", "Cascades"], features: ["Cascades", "Multipliers", "Sticky Symbols"], volatility: "High", volatilityScore: 8, sessionFriendliness: 5, featureDensity: "High", topWin: 20000, rtpRange: "96.83%", marketPresence: "High", targetMarkets: ["UK", "EU"] },
  { name: "Fruit Party", provider: "Pragmatic Play", releaseYear: 2020, themeCategories: ["Fruit", "Fun", "Colorful"], gameplayStructures: ["Cluster Pays"], features: ["Cascades", "Multipliers", "Free Spins"], volatility: "High", volatilityScore: 7, sessionFriendliness: 6, featureDensity: "High", topWin: 5000, rtpRange: "96.47%", marketPresence: "Medium", targetMarkets: ["EU", "LATAM"] },
  { name: "Reactoonz", provider: "Play'n GO", releaseYear: 2017, themeCategories: ["Sci-Fi", "Alien", "Fun"], gameplayStructures: ["Cluster Pays", "Cascades"], features: ["Cascades", "Collection Mechanics", "Expanding Wilds"], volatility: "High", volatilityScore: 8, sessionFriendliness: 5, featureDensity: "High", topWin: 4570, rtpRange: "96.51%", marketPresence: "High", targetMarkets: ["Nordics", "EU", "Global"] },
  { name: "Jammin' Jars 2", provider: "Push Gaming", releaseYear: 2021, themeCategories: ["Fruit", "Retro", "Colorful"], gameplayStructures: ["Cluster Pays"], features: ["Cascades", "Multipliers", "Free Spins", "Giga Jar"], volatility: "Very High", volatilityScore: 9, sessionFriendliness: 4, featureDensity: "High", topWin: 25000, rtpRange: "96.40%", marketPresence: "Medium", targetMarkets: ["UK", "EU"] },
  { name: "Book of Dead", provider: "Play'n GO", releaseYear: 2016, themeCategories: ["Ancient Egypt", "Adventure"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Expanding Wilds"], volatility: "High", volatilityScore: 8, sessionFriendliness: 5, featureDensity: "Medium", topWin: 5000, rtpRange: "96.21%", marketPresence: "High", targetMarkets: ["UK", "EU", "Global"] },
  { name: "Gates of Olympus", provider: "Pragmatic Play", releaseYear: 2021, themeCategories: ["Mythology", "Greek", "Fantasy"], gameplayStructures: ["Payways", "Tumble"], features: ["Cascades", "Multipliers", "Free Spins"], volatility: "Very High", volatilityScore: 9.5, sessionFriendliness: 4, featureDensity: "High", topWin: 5000, rtpRange: "96.50%", marketPresence: "High", targetMarkets: ["EU", "LATAM", "Global"] },
  { name: "The Dog House", provider: "Pragmatic Play", releaseYear: 2019, themeCategories: ["Animal", "Cartoon", "Fun"], gameplayStructures: ["Payways"], features: ["Free Spins", "Sticky Symbols", "Multipliers"], volatility: "High", volatilityScore: 7.5, sessionFriendliness: 6, featureDensity: "High", topWin: 6750, rtpRange: "96.51%", marketPresence: "High", targetMarkets: ["EU", "LATAM", "Global"] },
  { name: "Starburst", provider: "NetEnt", releaseYear: 2012, themeCategories: ["Gem", "Space", "Classic"], gameplayStructures: ["Paylines"], features: ["Expanding Wilds", "Respins"], volatility: "Low", volatilityScore: 2, sessionFriendliness: 9, featureDensity: "Low", topWin: 500, rtpRange: "96.09%", marketPresence: "High", targetMarkets: ["UK", "Nordics", "EU", "Global"] },
  { name: "Gonzo's Quest", provider: "NetEnt", releaseYear: 2011, themeCategories: ["Adventure", "Jungle", "History"], gameplayStructures: ["Paylines", "Cascades"], features: ["Cascades", "Multipliers", "Free Spins"], volatility: "Medium", volatilityScore: 5, sessionFriendliness: 7, featureDensity: "Medium", topWin: 2500, rtpRange: "95.97%", marketPresence: "High", targetMarkets: ["UK", "Nordics", "EU", "Global"] },
  { name: "Big Bass Bonanza", provider: "Pragmatic Play", releaseYear: 2020, themeCategories: ["Fishing", "Nature", "Fun"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Sticky Symbols", "Collection Mechanics"], volatility: "High", volatilityScore: 7.5, sessionFriendliness: 6, featureDensity: "Medium", topWin: 2100, rtpRange: "96.71%", marketPresence: "High", targetMarkets: ["UK", "EU", "LATAM", "Global"] },
  { name: "Wolf Gold", provider: "Pragmatic Play", releaseYear: 2017, themeCategories: ["Nature", "Animal", "Wild West"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Respins", "Progressive Jackpot"], volatility: "Medium", volatilityScore: 5.5, sessionFriendliness: 7, featureDensity: "Medium", topWin: 2500, rtpRange: "96.01%", marketPresence: "High", targetMarkets: ["EU", "LATAM", "Global"] },
  { name: "Bonanza Megaways", provider: "Big Time Gaming", releaseYear: 2016, themeCategories: ["Mining", "Adventure"], gameplayStructures: ["Megaways", "Cascades"], features: ["Cascades", "Free Spins", "Multipliers"], volatility: "Very High", volatilityScore: 9, sessionFriendliness: 4, featureDensity: "High", topWin: 10000, rtpRange: "96.00%", marketPresence: "High", targetMarkets: ["UK", "Nordics", "EU", "Global"] },
  { name: "Razor Shark", provider: "Push Gaming", releaseYear: 2019, themeCategories: ["Ocean", "Animal", "Adventure"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Expanding Wilds", "Multipliers"], volatility: "High", volatilityScore: 8, sessionFriendliness: 5, featureDensity: "Medium", topWin: 50000, rtpRange: "96.70%", marketPresence: "Medium", targetMarkets: ["EU", "Nordics"] },
  { name: "Extra Chilli", provider: "Big Time Gaming", releaseYear: 2018, themeCategories: ["Food", "Mexican", "Colorful"], gameplayStructures: ["Megaways"], features: ["Cascades", "Free Spins", "Multipliers", "Gamble Feature"], volatility: "Very High", volatilityScore: 9.5, sessionFriendliness: 3, featureDensity: "High", topWin: 20000, rtpRange: "96.15%", marketPresence: "Medium", targetMarkets: ["UK", "EU"] },
  { name: "Dead or Alive 2", provider: "NetEnt", releaseYear: 2019, themeCategories: ["Western", "Adventure"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Sticky Symbols", "Multipliers"], volatility: "Very High", volatilityScore: 10, sessionFriendliness: 3, featureDensity: "Medium", topWin: 111111, rtpRange: "96.82%", marketPresence: "High", targetMarkets: ["Nordics", "EU", "Global"] },
  { name: "Fishin' Frenzy", provider: "Blueprint Gaming", releaseYear: 2015, themeCategories: ["Fishing", "Nature", "Classic"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Collection Mechanics"], volatility: "Low", volatilityScore: 3, sessionFriendliness: 8, featureDensity: "Low", topWin: 500, rtpRange: "96.12%", marketPresence: "High", targetMarkets: ["UK", "EU"] },
  { name: "Age of the Gods", provider: "Playtech", releaseYear: 2016, themeCategories: ["Mythology", "Greek", "Fantasy"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Progressive Jackpot", "Multipliers"], volatility: "Medium", volatilityScore: 5, sessionFriendliness: 7, featureDensity: "Medium", topWin: 5000, rtpRange: "95.02%", marketPresence: "High", targetMarkets: ["UK", "EU", "Global"] },
  { name: "Immortal Romance", provider: "Microgaming", releaseYear: 2011, themeCategories: ["Vampire", "Romance", "Dark", "Fantasy"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Multipliers", "Collection Mechanics"], volatility: "Medium", volatilityScore: 5.5, sessionFriendliness: 7, featureDensity: "Medium", topWin: 12150, rtpRange: "96.86%", marketPresence: "High", targetMarkets: ["UK", "EU", "Global"] },
  { name: "Fire Joker", provider: "Play'n GO", releaseYear: 2016, themeCategories: ["Fruit", "Classic", "Retro"], gameplayStructures: ["Paylines"], features: ["Respins", "Multipliers"], volatility: "High", volatilityScore: 7, sessionFriendliness: 6, featureDensity: "Low", topWin: 800, rtpRange: "96.15%", marketPresence: "Medium", targetMarkets: ["Nordics", "EU"] },
  { name: "Legacy of Dead", provider: "Play'n GO", releaseYear: 2020, themeCategories: ["Ancient Egypt", "Adventure"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Expanding Wilds"], volatility: "Very High", volatilityScore: 9, sessionFriendliness: 4, featureDensity: "Medium", topWin: 5000, rtpRange: "96.58%", marketPresence: "High", targetMarkets: ["EU", "Global"] },
  { name: "Sticky Bandits", provider: "Quickspin", releaseYear: 2018, themeCategories: ["Western", "Cartoon", "Humor"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Sticky Symbols", "Expanding Wilds"], volatility: "High", volatilityScore: 7.5, sessionFriendliness: 6, featureDensity: "Medium", topWin: 17040, rtpRange: "96.58%", marketPresence: "Medium", targetMarkets: ["EU", "Nordics"] },
  { name: "Rainbow Riches", provider: "Barcrest", releaseYear: 2014, themeCategories: ["Irish", "Classic", "Fun"], gameplayStructures: ["Paylines"], features: ["Pick Bonus", "Multipliers", "Free Spins"], volatility: "Medium", volatilityScore: 4, sessionFriendliness: 8, featureDensity: "Medium", topWin: 500, rtpRange: "95.00%", marketPresence: "High", targetMarkets: ["UK", "EU"] },
  { name: "Megaways Jack", provider: "iSoftBet", releaseYear: 2020, themeCategories: ["Fairy Tale", "Adventure"], gameplayStructures: ["Megaways"], features: ["Cascades", "Free Spins", "Multipliers"], volatility: "Very High", volatilityScore: 9, sessionFriendliness: 4, featureDensity: "High", topWin: 25000, rtpRange: "96.28%", marketPresence: "Low", targetMarkets: ["EU"] },
  { name: "Dragon Kingdom", provider: "Pragmatic Play", releaseYear: 2019, themeCategories: ["Dragon", "Fantasy", "Asian"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Multipliers"], volatility: "High", volatilityScore: 7, sessionFriendliness: 6, featureDensity: "Medium", topWin: 2500, rtpRange: "96.47%", marketPresence: "Medium", targetMarkets: ["EU", "Asia"] },
  { name: "Temujin Treasures", provider: "Pragmatic Play", releaseYear: 2020, themeCategories: ["Historical", "Asian", "Adventure"], gameplayStructures: ["Payways"], features: ["Free Spins", "Respins", "Collection Mechanics"], volatility: "High", volatilityScore: 7.5, sessionFriendliness: 5, featureDensity: "Medium", topWin: 5000, rtpRange: "96.55%", marketPresence: "Low", targetMarkets: ["EU", "Asia"] },
  { name: "Fat Banker", provider: "Push Gaming", releaseYear: 2022, themeCategories: ["Cartoon", "Humor", "Fun"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Multipliers", "Collection Mechanics"], volatility: "Very High", volatilityScore: 9.5, sessionFriendliness: 4, featureDensity: "High", topWin: 50000, rtpRange: "96.45%", marketPresence: "Medium", targetMarkets: ["UK", "EU"] },
  { name: "Pirate Gold", provider: "Pragmatic Play", releaseYear: 2019, themeCategories: ["Pirate", "Adventure", "Ocean"], gameplayStructures: ["Paylines"], features: ["Free Spins", "Respins", "Progressive Jackpot"], volatility: "High", volatilityScore: 7, sessionFriendliness: 6, featureDensity: "Medium", topWin: 4500, rtpRange: "96.50%", marketPresence: "Low", targetMarkets: ["EU", "LATAM"] },
  { name: "Wildz", provider: "Relax Gaming", releaseYear: 2020, themeCategories: ["Fantasy", "Magic", "Colorful"], gameplayStructures: ["Payways"], features: ["Cascades", "Expanding Wilds", "Free Spins"], volatility: "High", volatilityScore: 7.5, sessionFriendliness: 5.5, featureDensity: "Medium", topWin: 5000, rtpRange: "96.35%", marketPresence: "Low", targetMarkets: ["EU", "Nordics"] },
  { name: "Star Bounty", provider: "Pragmatic Play", releaseYear: 2021, themeCategories: ["Adventure", "Space", "Western"], gameplayStructures: ["Megaways"], features: ["Cascades", "Free Spins", "Multipliers"], volatility: "Very High", volatilityScore: 9, sessionFriendliness: 4, featureDensity: "High", topWin: 10000, rtpRange: "96.60%", marketPresence: "Medium", targetMarkets: ["EU", "Global"] },
];

// ─── Theme Category Groups ───────────────────────────────────

const THEME_GROUPS: Record<string, string[]> = {
  "candy": ["candy", "fruit", "food", "colorful"],
  "mythology": ["mythology", "fantasy", "ancient", "dragon", "greek"],
  "egypt": ["egypt", "ancient egypt", "historical", "adventure"],
  "animal": ["animal", "nature", "outdoor", "fishing", "ocean"],
  "western": ["western", "cartoon", "humor"],
  "space": ["space", "sci-fi", "gem", "alien"],
};

function normalise(s: string): string {
  return s.toLowerCase().trim();
}

function themeGroupsFor(theme: string): Set<string> {
  const t = normalise(theme);
  const out = new Set<string>([t]);
  for (const [, members] of Object.entries(THEME_GROUPS)) {
    if (members.some(m => t.includes(m) || m.includes(t))) {
      members.forEach(m => out.add(m));
    }
  }
  return out;
}

// ─── Scoring ─────────────────────────────────────────────────

export function scoreGameMatch(
  ref: ReferenceGame,
  gameType: string,
  theme: string,
  volatility: string,
  features: string[],
  targetMarkets: string[],
): number {
  // Gameplay structure match — 35 pts
  const gtNorm = normalise(gameType);
  const structureMatch = ref.gameplayStructures.some(s => normalise(s).includes(gtNorm) || gtNorm.includes(normalise(s)));
  const gameplayPts = structureMatch ? 35 : 0;

  // Theme match — 25 pts
  let themePts = 0;
  if (theme) {
    const expanded = themeGroupsFor(theme);
    const refThemes = ref.themeCategories.map(normalise);
    const hits = refThemes.filter(t => [...expanded].some(e => t.includes(e) || e.includes(t))).length;
    themePts = Math.min(25, Math.round((hits / Math.max(refThemes.length, 1)) * 25));
  }

  // Volatility match — 20 pts
  const volTier: Record<string, number> = { "low": 0, "medium": 1, "high": 2, "very high": 3 };
  const inputTier = volTier[normalise(volatility)] ?? 1;
  const refTier = volTier[normalise(ref.volatility)] ?? 1;
  const volDiff = Math.abs(inputTier - refTier);
  const volPts = Math.max(0, 20 - volDiff * 10);

  // Feature overlap — 20 pts (7 pts per match, capped)
  const refFeats = ref.features.map(normalise);
  const inputFeats = features.map(normalise);
  const featureHits = inputFeats.filter(f => refFeats.some(rf => rf.includes(f) || f.includes(rf))).length;
  const featurePts = Math.min(20, featureHits * 7);

  // Market overlap — 5 pts
  const refMkts = ref.targetMarkets.map(normalise);
  const inputMkts = targetMarkets.map(normalise);
  const mktHits = inputMkts.filter(m => refMkts.includes(m)).length;
  const marketPts = Math.min(5, mktHits > 0 ? Math.round((mktHits / Math.max(inputMkts.length, 1)) * 5) : 0);

  return Math.min(100, gameplayPts + themePts + volPts + featurePts + marketPts);
}

// ─── Find Similar Games ──────────────────────────────────────

export interface MatchedGame extends ReferenceGame {
  matchScore: number;
}

export function findSimilarGames(
  gameType: string,
  theme: string,
  volatility: string,
  features: string[],
  targetMarkets: string[],
  topN = 5,
): MatchedGame[] {
  const scored = REFERENCE_GAMES.map(ref => ({
    ...ref,
    matchScore: scoreGameMatch(ref, gameType, theme, volatility, features, targetMarkets),
  }));
  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored.slice(0, topN);
}

// ─── Market Saturation ───────────────────────────────────────

export interface SaturationResult {
  count: number;
  highPresenceCount: number;
  level: "Low" | "Medium" | "High" | "Very High";
}

export function computeMarketSaturation(gameType: string, volatility: string): SaturationResult {
  const gtNorm = normalise(gameType);
  const matching = REFERENCE_GAMES.filter(g =>
    g.gameplayStructures.some(s => normalise(s).includes(gtNorm) || gtNorm.includes(normalise(s)))
  );

  const volTier: Record<string, number> = { "low": 0, "medium": 1, "high": 2, "very high": 3 };
  const inputTier = volTier[normalise(volatility)] ?? 1;
  const volFiltered = matching.filter(g => {
    const rTier = volTier[normalise(g.volatility)] ?? 1;
    return Math.abs(rTier - inputTier) <= 1;
  });

  const highPresenceCount = volFiltered.filter(g => g.marketPresence === "High").length;
  const count = volFiltered.length;

  let level: SaturationResult["level"];
  if (highPresenceCount >= 4) level = "Very High";
  else if (highPresenceCount >= 2) level = "High";
  else if (count >= 3) level = "Medium";
  else level = "Low";

  return { count, highPresenceCount, level };
}

// ─── Backward-compatible exports used by MarketIntelligence ──

export interface MatchInput {
  gameType: string;
  theme: string;
  volatility: string;
  features: string[];
  targetMarkets: string[];
}

export interface MatchedGameLegacy {
  game: ReferenceGame;
  score: number;
  breakdown: { gameplay: number; theme: number; volatility: number; features: number; market: number };
}

export interface MarketInsight {
  type: "warning" | "positive" | "info";
  text: string;
}

export function findSimilarGamesLegacy(input: MatchInput): MatchedGameLegacy[] {
  const top = findSimilarGames(input.gameType, input.theme, input.volatility, input.features, input.targetMarkets, 5);
  return top.map(g => ({
    game: g,
    score: g.matchScore,
    breakdown: {
      gameplay: g.gameplayStructures.some(s => normalise(s).includes(normalise(input.gameType))) ? 100 : 0,
      theme: Math.round((g.matchScore / 100) * 80),
      volatility: Math.round((g.matchScore / 100) * 90),
      features: Math.round((g.matchScore / 100) * 70),
      market: Math.round((g.matchScore / 100) * 60),
    },
  }));
}

export function computeSaturation(matches: MatchedGameLegacy[]): { totalSimilar: number; highPresenceCount: number; level: "Low" | "Medium" | "High" | "Very High"; interpretation: string } {
  const totalSimilar = matches.filter(m => m.score >= 40).length;
  const highPresenceCount = matches.filter(m => m.game.marketPresence === "High" && m.score >= 40).length;
  let level: "Low" | "Medium" | "High" | "Very High";
  let interpretation: string;
  if (highPresenceCount >= 4) { level = "Very High"; interpretation = "Highly saturated segment with multiple dominant titles. Strong differentiation is critical."; }
  else if (highPresenceCount >= 2) { level = "High"; interpretation = "Competitive space with established titles. Consider unique mechanics or themes."; }
  else if (totalSimilar >= 3) { level = "Medium"; interpretation = "Moderately competitive space with room for differentiation."; }
  else { level = "Low"; interpretation = "Low saturation — concept may be differentiated but market validation is limited."; }
  return { totalSimilar, highPresenceCount, level, interpretation };
}

export function generateMarketInsights(matches: MatchedGameLegacy[], input: MatchInput): MarketInsight[] {
  const insights: MarketInsight[] = [];
  const highPresence = matches.filter(m => m.game.marketPresence === "High" && m.score >= 40);
  if (highPresence.length >= 3) insights.push({ type: "warning", text: "High competition — differentiation required to stand out." });
  if (matches[0]?.score < 30) insights.push({ type: "info", text: "Concept may be differentiated but largely unvalidated by existing market data." });
  if (highPresence.length === 0 && matches[0]?.score >= 50) insights.push({ type: "positive", text: "Similar games exist but none dominate — opportunity for market capture." });
  if (insights.length === 0) insights.push({ type: "positive", text: "Balanced competitive position with reasonable market opportunity." });
  return insights;
}
