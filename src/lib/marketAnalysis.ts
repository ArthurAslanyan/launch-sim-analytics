// LaunchIndex — Market Analysis Engine
// Combines reference-game matching with AI-powered market intelligence

import { GameConcept } from "@/lib/simulation";
import { findSimilarGames, computeMarketSaturation, MatchedGame, scoreGameMatch, ReferenceGame } from "@/lib/referenceGames";
import { fetchLiveGames, mergeLiveWithStatic } from "@/lib/slotCatalogApi";
import { REFERENCE_GAMES } from "@/lib/referenceGames";

let _mergedGamesCache: ReferenceGame[] | null = null;

async function getMergedGames(): Promise<ReferenceGame[]> {
  if (_mergedGamesCache) return _mergedGamesCache;
  const live = await fetchLiveGames();
  _mergedGamesCache = live.length > 0
    ? mergeLiveWithStatic(live, REFERENCE_GAMES)
    : REFERENCE_GAMES;
  return _mergedGamesCache;
}

// ─── Interfaces ──────────────────────────────────────────────

export interface ConceptClassification {
  themeCategory: string;
  gameplayStructure: string;
  featureDensity: string;
  inferredVolatility: string;
}

export interface SimilarGameEntry {
  name: string;
  provider: string;
  releaseYear: number;
  coreMechanics: string;
  marketPresence: string;
  matchScore: number;
  // Per-dimension similarity scores (0–100)
  themeScore: number;
  mechanicsScore: number;
  featureScore: number;
  volatilityScore: number;
  // Shared / missing feature comparison
  sharedFeatures: string[];
  missingFeatures: string[];
  uniqueFeatures: string[];
}

export interface SimilarityMatrix {
  games: Array<{ name: string; themeScore: number; mechanicsScore: number; featureScore: number; volatilityScore: number }>;
}

export interface MarketSaturation {
  level: string;
  recentReleases: number;
  narrative: string;
  gaugeValue: number; // 0–100
}

export interface CompetitivePositioning {
  thisGame: { volatilityScore: number; sessionFriendliness: number; label: string };
  referencePoints: Array<{ name: string; volatilityScore: number; sessionFriendliness: number }>;
}

export interface SessionBenchmark {
  simulatedAvgMinutes: number;
  typicalForSimilarMinutes: number;
  deltaMinutes: number;
  deltaPercent: number;
}

export interface ImprovementCard {
  issue: string;
  rootCause: string;
  suggestedImprovement: string;
  tradeOffNote: string;
}

export interface FinalVerdict {
  greenlightScore: number;
  conceptRiskIndex: number;
  marketDifferentiationScore: number;
  structuralRobustnessScore: number;
  recommendation: string;
  recommendationRationale: string;
}

export interface MarketAnalysis {
  conceptClassification: ConceptClassification;
  similarGames: SimilarGameEntry[];
  similarityMatrix: SimilarityMatrix;
  marketSaturation: MarketSaturation;
  competitivePositioning: CompetitivePositioning;
  sessionBenchmark: SessionBenchmark;
  improvementCards: ImprovementCard[];
  finalVerdict: FinalVerdict;
}

// ─── Helpers ─────────────────────────────────────────────────

function featureNames(game: GameConcept): string[] {
  const names = (game.features || []).map(f => f.name || f.type);
  if (game.specialMechanics?.length) names.push(...game.specialMechanics);
  return [...new Set(names.filter(Boolean))];
}

function volToScore(v: string): number {
  const m: Record<string, number> = { "Low": 2.5, "Medium": 5, "Medium-High": 6.5, "High": 7.5, "Very High": 9.5 };
  return m[v] ?? 5;
}

function sessionFriendlinessFromVol(v: string): number {
  const m: Record<string, number> = { "Low": 8, "Medium": 7, "Medium-High": 6, "High": 5, "Very High": 3.5 };
  return m[v] ?? 5;
}

// ─── Static fallback ─────────────────────────────────────────

function buildStaticAnalysis(game: GameConcept, matches: MatchedGame[], saturation: ReturnType<typeof computeMarketSaturation>): MarketAnalysis {
  const fNames = featureNames(game);
  const top3 = matches.slice(0, 3);
  const top4 = matches.slice(0, 4);

  const conceptClassification: ConceptClassification = {
    themeCategory: (() => {
      if (game.specialMechanics?.includes("Cascades")) return `${game.gameType} + Cascades`;
      if (game.gameType) return game.gameType;
      return "Unclassified";
    })(),
    gameplayStructure: game.gameType || "Paylines",
    featureDensity: fNames.length >= 4 ? "High" : fNames.length >= 2 ? "Medium" : "Low",
    inferredVolatility: game.volatility || "Medium",
  };

  const inputFeatsNorm = fNames.map(f => f.toLowerCase());
  // Use actual theme categories from the game concept
  const inputThemes = normalizeThemes(game.themeCategories ?? []);

  const similarGames: SimilarGameEntry[] = top4.map(g => {
    const refFeatsNorm = g.features.map(f => f.toLowerCase());

    // Per-dimension scoring
    const gtNorm = (game.gameType || "").toLowerCase();
    const structMatch = g.gameplayStructures.some(s => s.toLowerCase().includes(gtNorm) || gtNorm.includes(s.toLowerCase()));
    const mechanicsScore = structMatch ? 100 : (g.gameplayStructures.some(s => s.toLowerCase().includes("pay")) && gtNorm.includes("pay")) ? 60 : 20;

    // Normalize reference themes for consistent matching
    const refThemes = normalizeThemes(g.themeCategories);

    // Calculate theme overlap
    const themeHits = inputThemes.filter(t => refThemes.includes(t)).length;

    // Theme score: % of input themes found in reference game
    const themeScore = inputThemes.length > 0
      ? Math.min(100, Math.round((themeHits / inputThemes.length) * 100))
      : 0; // 0% if no themes specified

    const featureHits = inputFeatsNorm.filter(f => refFeatsNorm.some(rf => rf.includes(f) || f.includes(rf))).length;
    const featureScore = inputFeatsNorm.length > 0
      ? Math.min(100, Math.round((featureHits / Math.max(inputFeatsNorm.length, 1)) * 100))
      : 0;

    const volTier: Record<string, number> = { "low": 0, "medium": 1, "high": 2, "very high": 3 };
    const inputVol = volTier[(game.volatility || "medium").toLowerCase()] ?? 1;
    const refVol = volTier[(g.volatility || "Medium").toLowerCase()] ?? 1;
    const volatilityScore = Math.max(0, 100 - Math.abs(inputVol - refVol) * 40);

    // Feature comparison
    const sharedFeatures = inputFeatsNorm
      .filter(f => refFeatsNorm.some(rf => rf.includes(f) || f.includes(rf)))
      .map(f => fNames[inputFeatsNorm.indexOf(f)] || f);
    const missingFeatures = inputFeatsNorm
      .filter(f => !refFeatsNorm.some(rf => rf.includes(f) || f.includes(rf)))
      .map(f => fNames[inputFeatsNorm.indexOf(f)] || f);
    const uniqueFeatures = refFeatsNorm
      .filter(rf => !inputFeatsNorm.some(f => f.includes(rf) || rf.includes(f)))
      .map(rf => g.features[refFeatsNorm.indexOf(rf)] || rf);

    return {
      name: g.name,
      provider: g.provider,
      releaseYear: g.releaseYear,
      coreMechanics: g.gameplayStructures.join(", "),
      marketPresence: g.marketPresence,
      matchScore: g.matchScore,
      themeScore,
      mechanicsScore,
      featureScore,
      volatilityScore,
      sharedFeatures,
      missingFeatures: missingFeatures.slice(0, 5),
      uniqueFeatures: uniqueFeatures.slice(0, 5),
    };
  });

  const similarityMatrix: SimilarityMatrix = {
    games: similarGames.slice(0, 3).map(g => ({
      name: g.name,
      themeScore: g.themeScore,
      mechanicsScore: g.mechanicsScore,
      featureScore: g.featureScore,
      volatilityScore: g.volatilityScore,
    })),
  };

  const gaugeMap: Record<string, number> = { "Low": 20, "Medium": 45, "High": 70, "Very High": 90 };
  const marketSat: MarketSaturation = {
    level: saturation.level,
    recentReleases: matches.filter(g => g.releaseYear >= 2020).length,
    narrative: saturation.level === "Very High"
      ? "Highly saturated segment with multiple dominant titles. Strong differentiation is critical."
      : saturation.level === "High"
      ? "Competitive space with established titles. Consider unique mechanics or themes."
      : saturation.level === "Medium"
      ? "Moderately competitive space with room for differentiation through features or pacing."
      : "Low saturation — concept may be differentiated but market validation is limited.",
    gaugeValue: gaugeMap[saturation.level] ?? 45,
  };

  const thisVolScore = volToScore(game.volatility);
  const thisFriendliness = sessionFriendlinessFromVol(game.volatility);

  const competitivePositioning: CompetitivePositioning = {
    thisGame: { volatilityScore: thisVolScore, sessionFriendliness: thisFriendliness, label: game.gameName || "Your Concept" },
    referencePoints: top4.map(g => ({
      name: g.name,
      volatilityScore: g.volatilityScore,
      sessionFriendliness: g.sessionFriendliness,
    })),
  };

  const simAvg = game.volatility === "Low" || game.volatility === "Medium" ? 18 : 10;
  const typAvg = top3.length > 0
    ? Math.round(top3.reduce((s, g) => s + (g.sessionFriendliness > 6 ? 18 : g.sessionFriendliness > 4 ? 12 : 8), 0) / top3.length)
    : 12;
  const delta = simAvg - typAvg;

  const sessionBenchmark: SessionBenchmark = {
    simulatedAvgMinutes: simAvg,
    typicalForSimilarMinutes: typAvg,
    deltaMinutes: delta,
    deltaPercent: typAvg > 0 ? Math.round((delta / typAvg) * 100) : 0,
  };

  const improvementCards: ImprovementCard[] = [];
  if (game.deadSpinFrequency === "High") {
    improvementCards.push({ issue: "High dead spin frequency", rootCause: "Base game hit rate is too low relative to volatility", suggestedImprovement: "Increase micro-win frequency or add random wild triggers in base game", tradeOffNote: "May slightly reduce top-end volatility appeal" });
  }
  if (fNames.length <= 1) {
    improvementCards.push({ issue: "Low feature density", rootCause: "Single feature creates binary session experience", suggestedImprovement: "Add a secondary mechanic (e.g. collection or respin) to diversify session flow", tradeOffNote: "Increases development complexity and math balancing effort" });
  }
  if (improvementCards.length === 0) {
    improvementCards.push({ issue: "Session pacing could be tighter", rootCause: "Gap between base game wins and feature triggers may feel long", suggestedImprovement: "Consider adding mid-tier random events to bridge dead zones", tradeOffNote: "Must be balanced to avoid diluting feature impact" });
  }

  const stabilityScore = Math.max(20, Math.min(90, 70 - (saturation.level === "Very High" ? 20 : saturation.level === "High" ? 10 : 0)));
  const diffScore = Math.max(20, Math.min(90, matches[0]?.matchScore > 80 ? 30 : matches[0]?.matchScore > 60 ? 50 : 75));

  const finalVerdict: FinalVerdict = {
    greenlightScore: Math.round(stabilityScore * 0.4 + diffScore * 0.35 + (100 - Math.round(100 - stabilityScore)) * 0.25),
    conceptRiskIndex: Math.round(100 - stabilityScore),
    marketDifferentiationScore: diffScore,
    structuralRobustnessScore: stabilityScore,
    recommendation: stabilityScore >= 65 ? "Greenlight" : stabilityScore >= 45 ? "Revise Before Greenlight" : "Significant Revision Required",
    recommendationRationale: `Based on ${saturation.level.toLowerCase()} market saturation and ${matches[0]?.matchScore ?? 0}% similarity to the closest reference title, this concept ${stabilityScore >= 65 ? "shows strong structural foundation for launch" : "requires further refinement before market entry"}.`,
  };

  return { conceptClassification, similarGames, similarityMatrix, marketSaturation: marketSat, competitivePositioning, sessionBenchmark, improvementCards, finalVerdict };
}

// ─── AI-powered analysis via edge function ───────────────────

export async function runMarketAnalysis(game: GameConcept): Promise<MarketAnalysis> {
  const fNames = featureNames(game);

  // Fetch merged dataset (live API + static fallback)
  const mergedGames = await getMergedGames();

  // Use the scoring function with merged dataset
  const matches = mergedGames
    .map(ref => ({
      ...ref,
      matchScore: scoreGameMatch(
        ref,
        game.gameType,
        game.targetMarkets?.[0] ?? "",
        game.volatility,
        fNames,
        game.targetMarkets || []
      ),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 8);

  const saturation = computeMarketSaturation(game.gameType, game.volatility);

  return buildStaticAnalysis(game, matches as MatchedGame[], saturation);
}
