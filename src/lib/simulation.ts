// Type definitions only — actual logic runs server-side in supabase/functions/run-simulation
// to protect intellectual property. Do not add runtime logic to this file.

export interface RtpBreakdown {
  baseGameRtp: number;
  wildRtp: number;
  respinRtp: number;
  freeSpinsRtp: number;
  jackpotRtp: number;
  otherFeatureRtp: number;
}

export interface Feature {
  id: string;
  type: string;
  name: string;
  triggerCondition: string;
  triggerFrequency: string;
  averageValue: number;
  maxValue: number;
  featureVolatility: string;
  rtpContribution?: number;
  /** @deprecated Legacy field — not used in current simulation. Kept for backward compatibility with stored sessions. */
  visibility?: string;
  /** @deprecated Legacy field — not used in current simulation. Kept for backward compatibility with stored sessions. */
  winImpact?: string;
  /** @deprecated Legacy field — not used in current simulation. Kept for backward compatibility with stored sessions. */
  progressImpact?: string;
}

export interface PotLevel {
  name: string;
  prizeType: string;
  averageValue: number;
  numberOfSpins?: number;
  numberOfWilds?: number;
  multiplierValue?: number;
  duration?: number;
  reEvaluationCount?: number;
  description?: string;
  impactCategory?: string;
}

export interface PersistentPotFeature extends Omit<Feature, 'type'> {
  type: "Pot / Perceived Persistent";
  collector: string;
  collectionPositionsNeeded: number;
  averageSymbolsPerSpin: number;
  pots: PotLevel[];
}

export interface ProgressThreshold {
  symbolsRequired: number;
  awardType: string;
  awardValue?: number;
  numberOfSpins?: number;
  numberOfWilds?: number;
  multiplierValue?: number;
  duration?: number;
  reEvaluationCount?: number;
  description?: string;
  impactCategory?: string;
}

export interface TruePersistentFeature extends Omit<Feature, 'type'> {
  type: "Progress Meter / True Persistent";
  collector: string;
  collectionPositionsNeeded: number;
  averageSymbolsPerSpin: number;
  progressionStyle: "Single Threshold" | "Multi-Threshold";
  entryMode?: "Quick Setup" | "Manual Milestones";
  totalSections?: number;
  startingPrize?: number;
  finalPrize?: number;
  escalationType?: "Linear" | "Exponential";
  finalTriggerAward?: string;
  finalTriggerSpins?: number;
  thresholds?: ProgressThreshold[];
}

export type ExtendedFeature = Feature | PersistentPotFeature | TruePersistentFeature;

export interface WinDistribution {
  sub1x: number;
  x1to5: number;
  x5to20: number;
  x20to100: number;
  x100plus: number;
}

export interface GambleFeature {
  enabled: boolean;
  triggerMode: "Per-Win" | "Feature-End" | "Both";
  styles: {
    color: boolean;  // 50/50, 2× multiplier (Red/Black)
    suit: boolean;   // 25%, 4× multiplier (Spade/Heart/Diamond/Club)
  };
  multiStep: {
    enabled: boolean;
    maxRounds?: number;
    winCap?: number;
  };
}

export interface SymbolSwapRule {
  id: string;
  sourceSymbol: string;
  targetSymbol: string;
  swapCount: "all" | number;
}

export interface SymbolSwapFeature {
  enabled: boolean;
  triggerMode: "Random Non-Winning" | "Specific Interval" | "Both";
  randomTriggerProbability?: number;
  intervalSpins?: number;
  swapRules: SymbolSwapRule[];
  estimatedRtpContribution?: number;
  estimatedWinFrequencyBoost?: number;
}

export interface GameConcept {
  gameName: string;
  targetMarkets: string[];
  themeCategories?: string[]; // e.g., ["Egyptian", "Adventure", "Mythology"]
  playerFocus: string[];
  gridLayout: string;
  gridRows: number;
  gridColumns: number;
  gameType: string;
  waysOrLines: number;
  payStructure: string;
  cascades: string;
  baseHitFrequency: string;
  baseHitFrequencyDetail: string;
  featureTriggerFrequency: string;
  volatility: string;
  rtpTarget: number;
  topWin: number;
  volatilityStdDev?: number;  // Actual standard deviation per spin (in units of bet). Optional — improves simulation accuracy when provided.
  maxExposureCategory: string;
  rtpBreakdown: RtpBreakdown;
  winDistribution: WinDistribution;
  features: ExtendedFeature[];
  baseGameStrength: string;
  averageBaseWin: number;
  deadSpinFrequency: string;
  targetBankroll: string;
  targetSessionLength: number;
  specialMechanics: string[];
  primaryGoal: string;
  targetAudience: string;
  sessionLength: string;
  bonusImportance: string;
  earlyExcitement: string;

  // Structure
  reelType?: "Classic" | "Video";
  paylineCount?: number;
  waysConstant?: number;
  irregularWindow?: boolean;
  megawaysMaxWays?: number;
  minClusterSize?: number;

  // Wild
  hasWild?: boolean;
  wildType?: "Standard" | "Expanding" | "Sticky" | "Multiplier" | "Expanding + Multiplier" | "Sticky + Multiplier";
  expandingWildScope?: "All reels" | "Middle reel only" | "Free game only";
  stickyWildMode?: "Until end of feature" | "Moves each spin" | "Until win";
  multiplierWildValueType?: "Fixed" | "Random";

  // Scatter & free game
  hasScatter?: boolean;
  scatterThreshold?: number;
  scatterMultiplePerReel?: boolean;
  hasRetrigger?: boolean;
  retriggerFrequency?: string;
  freeSpinCount?: number;
  freeGameReels?: "Same as base game" | "Different reels";

  // Multiplier symbol
  hasMultiplierSymbol?: boolean;
  multiplierSymbolType?: "Spin multiplier" | "Win multiplier" | "Progressive (adds each cascade)";

  // RTP detail (deprecated — kept for backward compatibility)
  /** @deprecated Use rtpBreakdown.respinRtp instead */
  respinsRtp?: number;
  /** @deprecated Use rtpBreakdown.wildRtp instead */
  wildContributionRtp?: number;

  // Feature options
  bonusBuyAvailable?: boolean;
  anteBetAvailable?: boolean;

  // Session
  winPacing?: "Front-loaded" | "Even" | "Bonus-dependent";
  requiresSimulation?: boolean;
  gambleFeature?: GambleFeature;
  symbolSwapFeature?: SymbolSwapFeature;
  populationRange?: PopulationRange;
  referenceGame?: string;
}

export type PopulationRange =
  | "100-1000"
  | "1000-5000"
  | "5000-10000"
  | "10000-50000"
  | "50000-200000"
  | "200000-500000"
  | "500000-1000000"
  | "1000000+";

export interface SimulatedPopulation {
  rangeLabel: string;
  midpoint: number;
  totalRounds: number;
  totalBets: number;
  totalPlayers: number;
  avgSessionDurationMinutes: number;
  avgRoundsPerSession: number;
  roundsPerUniquePlayer: number;
  avgBetPerRound: number;
  retentionD1: number;
  retentionD7: number;
  churnRate: number;
}

export interface PerformanceScore {
  overall: number;
  sessionQuality: number;
  playerRetention: number;
  featureEfficiency: number;
  marketFit: number;
  label: "Poor" | "Average" | "Good" | "Excellent";
  summary: string;
}

export interface ComputedInputMetrics {
  totalRtp: number;
  featureRtpTotal: number;
  baseRtpRatio: number;
  featureDependencyIndex: number;
  jackpotWeight: number;
}

export interface ArchetypeSelection {
  archetype: string;
  reason: string;
}

export interface GambleImpact {
  archetypeFitAdjustments: Record<string, number>;
  sessionVarianceMultiplier: number;
  retentionD7Adjustment: number;
  notes: string[];
}

export interface SymbolSwapImpact {
  archetypeFitAdjustments: Record<string, number>;
  retentionD1Boost: number;
  retentionD7Boost: number;
  estimatedRtpContribution: number;
  estimatedWinFrequencyBoost: number;
  notes: string[];
}

export interface ArchetypeFitScore {
  archetype: string;
  baseScore: number;
  gambleAdjustment: number;
  symbolSwapAdjustment: number;
  finalScore: number;
  fitLabel: "Good fit" | "Moderate fit" | "Challenging";
}

export interface SessionBehavior {
  baseSessionLength: number;
  adjustedSessionLength: number;
  earlyExitProbability: number;
  survivalAt30: number;
  survivalAt60: number;
  survivalAt120: number;
}

export interface FeatureInteraction {
  sessionsReachingFeature: number;
  sessionsReachingJackpot: number;
  sessionsEndingBeforeFeature: number;
}

export interface EconomyBehavior {
  bankrollDepletion: number;
  lossDrivenExits: number;
}

export interface StopReasons {
  lossToleranceExceeded: number;
  noFeatureTrigger: number;
  timeLimit: number;
  bigWinExit: number;
}

export interface ArchetypeStopReasons {
  archetype: string;
  boredomLowEngagement: number;
  lossToleranceExceeded: number;
  bankrollDepleted: number;
  sessionTimeLimit: number;
}

export interface BehavioralInsight {
  title: string;
  description: string;
  type: "warning" | "info" | "positive";
}

export interface ActionableInsight {
  action: string;
  expectedImpact: string;
  difficulty: "Easy" | "Medium" | "Hard";
  priority: 1 | 2 | 3;
  reasoning: string;
  example?: string;
}

export interface DataInterpretation {
  category: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  impact: "Severe" | "Moderate" | "Minor";
  metrics: Array<{
    name: string;
    value: string;
    explanation: string;
    benchmark: string;
    verdict: "excellent" | "good" | "average" | "poor";
  }>;
  narrative: string;
  rootCause: string;
  actionable: ActionableInsight[];
  comparativeContext?: string;
  riskFlags?: string[];
}

export interface RiskFlag {
  flag: string;
  description: string;
  severity: "high" | "medium";
}

export interface Strength {
  title: string;
  description: string;
}

export interface Improvement {
  category: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export interface ArchetypeSurvivalRow {
  spin: number;
  casual_survival: number;
  bonus_survival: number;
  volatility_survival: number;
  budget_survival: number;
  progress_survival: number;
}

export interface ArchetypeDecayInfo {
  name: string;
  decayRate: number;
  label: string;
}

export interface BehavioralSimulation {
  survivalData: ArchetypeSurvivalRow[];
  archetypes: ArchetypeDecayInfo[];
  interpretation: {
    fastestDropOff: string;
    mostStable: string;
    earlySessionRisk: string;
    retentionDriver: string;
  };
}

export interface SimulationResults {
  inputMetrics: ComputedInputMetrics;
  archetypeSelection: ArchetypeSelection;
  sessionBehavior: SessionBehavior;
  featureInteraction: FeatureInteraction;
  economyBehavior: EconomyBehavior;
  stopReasons: StopReasons;
  archetypeStopReasons: ArchetypeStopReasons[];
  behavioralInsights: BehavioralInsight[];
  riskFlags: RiskFlag[];
  strengths: Strength[];
  improvements: Improvement[];
  diagnosis: string;
  recommendation: string;
  behavioralSimulation: BehavioralSimulation;
  structuralStabilityScore: number;
  earlySessionRiskScore: number;
  featureDependencyLevel: "Low" | "Medium" | "High";
  simulatedPopulation: SimulatedPopulation;
  performanceScore: PerformanceScore;
  dataInterpretation: DataInterpretation[];
  gambleImpact?: GambleImpact;
  symbolSwapImpact?: SymbolSwapImpact;
  archetypeFitScores: ArchetypeFitScore[];
}
