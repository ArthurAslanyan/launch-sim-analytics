// Type definitions only — actual logic runs server-side in supabase/functions/run-simulation
// to protect intellectual property. Do not add runtime logic to this file.

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
