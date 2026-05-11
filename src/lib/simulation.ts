// LaunchIndex Deterministic Behavioral Simulation Engine
// All outputs are rule-based, computed from game math inputs

// ============================================
// DETERMINISTIC SEEDED RNG
// ============================================
// Same game inputs → same variance, ensuring reproducible results.

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getSeededRandom(game: GameConcept): () => number {
  const seedString = JSON.stringify(game);
  const seed = hashString(seedString);
  return mulberry32(seed);
}

// ============================================
// MATHEMATICAL CONSTRAINT UTILITIES
// ============================================

export function isHitFrequencyCompatible(
  hitFrequency: number,
  volatility: "Low" | "Medium" | "High" | "Very High"
): boolean {
  const ranges = {
    "Low": { minHF: 0.35, maxHF: 0.50 },
    "Medium": { minHF: 0.25, maxHF: 0.38 },
    "High": { minHF: 0.18, maxHF: 0.28 },
    "Very High": { minHF: 0.12, maxHF: 0.22 },
  };
  const r = ranges[volatility];
  return hitFrequency >= r.minHF && hitFrequency <= r.maxHF;
}

export function estimateVolatilityAfterRTPShift(
  currentRTPBreakdown: GameConcept["rtpBreakdown"],
  shiftAmount: number,
  from: "features" | "base",
  to: "features" | "base",
  currentVolatility: "Low" | "Medium" | "High" | "Very High"
): "Low" | "Medium" | "High" | "Very High" {
  if (!currentRTPBreakdown) return currentVolatility;

  const featureRTP = (currentRTPBreakdown.freeSpinsRtp || 0) +
                     (currentRTPBreakdown.respinRtp || 0) +
                     (currentRTPBreakdown.otherFeatureRtp || 0);
  const baseRTP = currentRTPBreakdown.baseGameRtp || 0;

  let newFeatureRTP = featureRTP;
  let newBaseRTP = baseRTP;
  if (from === "features" && to === "base") {
    newFeatureRTP -= shiftAmount;
    newBaseRTP += shiftAmount;
  } else if (from === "base" && to === "features") {
    newBaseRTP -= shiftAmount;
    newFeatureRTP += shiftAmount;
  }

  const totalRTP = newFeatureRTP + newBaseRTP +
    (currentRTPBreakdown.wildRtp || 0) + (currentRTPBreakdown.jackpotRtp || 0);
  const newFDI = totalRTP > 0 ? newFeatureRTP / totalRTP : 0.5;
  const oldFDI = (baseRTP + featureRTP) > 0 ? featureRTP / (baseRTP + featureRTP) : 0.5;

  const tierMap = { "Low": 1, "Medium": 2, "High": 3, "Very High": 4 } as const;
  const tierToVol: Record<number, "Low" | "Medium" | "High" | "Very High"> = {
    1: "Low", 2: "Medium", 3: "High", 4: "Very High",
  };
  const currentTier = tierMap[currentVolatility];
  const fdiChange = oldFDI - newFDI;
  const tierChange = Math.round(fdiChange / 0.1);
  const newTier = Math.max(1, Math.min(4, currentTier + tierChange));
  return tierToVol[newTier];
}

export function isRecommendationFeasible(
  action: string,
  game: GameConcept
): { feasible: boolean; reason?: string } {
  const a = action.toLowerCase();
  if (a.includes("cluster") && game.gameType !== "Cluster Pays") {
    return { feasible: false, reason: "Game is not Cluster Pays type" };
  }
  if ((a.includes("cascade") || a.includes("tumble")) &&
      game.gameType === "Paylines" &&
      !game.specialMechanics?.includes("Cascades")) {
    return { feasible: false, reason: "Cascades require game type change or special mechanic addition" };
  }
  if (a.includes("guaranteed") && !a.includes("near-miss")) {
    return { feasible: true, reason: "⚠️ Guaranteed outcomes may require RNG recertification in regulated markets" };
  }
  return { feasible: true };
}

export function computeEffectiveFDI(
  fdi: number,
  avgSessionMinutes: number,
  featureTriggerFrequency: string
): { effectiveFDI: number; triggerProbability: number } {
  const avgSessionSpins = avgSessionMinutes * 6;
  let triggerSpins = 100;
  if (featureTriggerFrequency.includes("200")) triggerSpins = 200;
  else if (featureTriggerFrequency.includes("150")) triggerSpins = 150;
  else if (featureTriggerFrequency.includes("100")) triggerSpins = 100;
  else if (featureTriggerFrequency.includes("80")) triggerSpins = 80;
  else if (featureTriggerFrequency.includes("50")) triggerSpins = 50;

  const triggerProbability = Math.min(1, 1 - Math.pow(1 - 1 / triggerSpins, avgSessionSpins));
  return { effectiveFDI: fdi * triggerProbability, triggerProbability };
}

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

// ============================================
// INPUT MODEL PROCESSING
// ============================================

export interface ComputedInputMetrics {
  totalRtp: number;
  featureRtpTotal: number;
  baseRtpRatio: number;
  featureDependencyIndex: number;
  jackpotWeight: number;
}

export function computeInputMetrics(game: GameConcept): ComputedInputMetrics {
  const bd = game.rtpBreakdown ?? { baseGameRtp: 0, wildRtp: 0, respinRtp: 0, freeSpinsRtp: 0, jackpotRtp: 0, otherFeatureRtp: 0 };
  const featureRtpTotal = bd.wildRtp + bd.respinRtp + bd.freeSpinsRtp + bd.jackpotRtp + bd.otherFeatureRtp;
  const totalRtp = game.rtpTarget || (bd.baseGameRtp + featureRtpTotal);
  const baseRtpRatio = totalRtp > 0 ? bd.baseGameRtp / totalRtp : 0;
  const featureDependencyIndex = totalRtp > 0 ? featureRtpTotal / totalRtp : 0;
  const jackpotWeight = totalRtp > 0 ? bd.jackpotRtp / totalRtp : 0;

  return {
    totalRtp,
    featureRtpTotal,
    baseRtpRatio,
    featureDependencyIndex,
    jackpotWeight,
  };
}

// ============================================
// ARCHETYPE SELECTION LOGIC
// ============================================

export interface ArchetypeSelection {
  archetype: string;
  reason: string;
}

export function selectArchetype(game: GameConcept, metrics: ComputedInputMetrics): ArchetypeSelection {

  // Feature-Focused: single dominant feature + very high feature dependency
  if (
    metrics.featureDependencyIndex > 0.65 &&
    game.features.filter(f => f.type).length <= 1
  ) {
    return {
      archetype: "Feature-Focused Player",
      reason: `Feature Dependency Index is ${(metrics.featureDependencyIndex * 100).toFixed(1)}% with a single dominant mechanic. Players engage primarily with that feature and disengage if it disappoints.`,
    };
  }

  // Budget-Constrained: low bankroll + low/medium volatility
  if (
    game.targetBankroll === "Low" &&
    (game.volatility === "Low" || game.volatility === "Medium")
  ) {
    return {
      archetype: "Budget-Constrained Player",
      reason: `Low target bankroll combined with ${game.volatility} volatility indicates a budget-conscious profile. Players prioritise controlled play, perceived fairness, and stopping at a fixed loss threshold.`,
    };
  }

  // Progress-Oriented: collection mechanics + functional base game
  if (
    game.specialMechanics?.includes("Collection Mechanics") &&
    game.baseGameStrength !== "Weak (feature-driven)"
  ) {
    return {
      archetype: "Progress-Oriented Player",
      reason: `Collection mechanics combined with a ${(game.baseGameStrength ?? "balanced").toLowerCase()} base game creates a progress-loop structure. Players are motivated by visible advancement and disengage if momentum stalls.`,
    };
  }

  // Bonus-Seeking: high feature dependency (broad)
  if (metrics.featureDependencyIndex > 0.45) {
    return {
      archetype: "Bonus-Seeking Player",
      reason: `Feature Dependency Index is ${(metrics.featureDependencyIndex * 100).toFixed(1)}% (> 45%). Players tolerate base-game losses while waiting for feature triggers and measure session value by bonus frequency.`,
    };
  }

  // Volatility-Seeking: high/very high vol + large top win
  if (
    (game.volatility === "High" || game.volatility === "Very High") &&
    game.topWin > 2000
  ) {
    return {
      archetype: "Volatility-Seeking Player",
      reason: `${game.volatility} volatility with a ${game.topWin}× top win. Players ignore small wins, accept long losing streaks, and play for rare large payouts.`,
    };
  }

  // Casual: strong base game returns
  if (metrics.baseRtpRatio > 0.55) {
    return {
      archetype: "Casual Player",
      reason: `Base RTP ratio is ${(metrics.baseRtpRatio * 100).toFixed(1)}% (> 55%). Consistent base-game returns suit players seeking low-stress entertainment with frequent small rewards.`,
    };
  }

  // Fallback
  return {
    archetype: "Casual Player",
    reason: "Balanced profile with no dominant structural signal. Broad player appeal with casual-friendly characteristics.",
  };
}

// ============================================
// GAMBLE FEATURE BEHAVIORAL IMPACT
// ============================================

export interface GambleImpact {
  archetypeFitAdjustments: Record<string, number>;
  sessionVarianceMultiplier: number;
  retentionD7Adjustment: number;
  notes: string[];
}

// ============================================
// CONFIGURATION VALIDATION
// ============================================

export function isGambleFeatureValid(gamble: GambleFeature | undefined): boolean {
  if (!gamble || !gamble.enabled) return false;
  if (!gamble.styles.color && !gamble.styles.suit) return false;
  return true;
}

export function isSymbolSwapFeatureValid(swap: SymbolSwapFeature | undefined): boolean {
  if (!swap || !swap.enabled) return false;
  if (!swap.swapRules || swap.swapRules.length === 0) return false;
  const hasValidRandom = (swap.triggerMode === "Random Non-Winning" || swap.triggerMode === "Both")
    && (swap.randomTriggerProbability ?? 0) > 0;
  const hasValidInterval = (swap.triggerMode === "Specific Interval" || swap.triggerMode === "Both")
    && (swap.intervalSpins ?? 0) >= 2;
  return hasValidRandom || hasValidInterval;
}

export function computeGambleImpact(game: GameConcept): GambleImpact {
  const gamble = game.gambleFeature;

  // Validate configuration — invalid config = no impact (treat as disabled)
  if (!isGambleFeatureValid(gamble)) {
    return {
      archetypeFitAdjustments: {},
      sessionVarianceMultiplier: 1.0,
      retentionD7Adjustment: 0,
      notes: [],
    };
  }

  const notes: string[] = [];
  notes.push(`Gamble Feature enabled (${gamble.triggerMode} mode)`);

  if (gamble.styles.color && gamble.styles.suit) {
    notes.push("Both Color (50/50, 2×) and Suit (25%, 4×) gamble styles available");
  } else if (gamble.styles.color) {
    notes.push("Color gamble only (50/50, 2×)");
  } else if (gamble.styles.suit) {
    notes.push("Suit gamble only (25%, 4×)");
  }

  if (gamble.multiStep.enabled) {
    const rounds = gamble.multiStep.maxRounds ? `${gamble.multiStep.maxRounds} max rounds` : "unlimited rounds";
    const cap = gamble.multiStep.winCap ? `, capped at ${gamble.multiStep.winCap}×` : ", no win cap";
    notes.push(`Multi-step gamble: ${rounds}${cap}`);
  }

  const archetypeFitAdjustments: Record<string, number> = {
    "Volatility-Seeking Player": 1.5,
    "Bonus-Seeking Player": 0.5,
    "Casual Player": -1.0,
    "Budget-Constrained Player": -2.0,
    "Progress-Oriented Player": -0.5,
    "Feature-Focused Player": 0.0,
  };

  const sessionVarianceMultiplier = 1.15;
  const retentionD7Adjustment = -3;

  return {
    archetypeFitAdjustments,
    sessionVarianceMultiplier,
    retentionD7Adjustment,
    notes,
  };
}

// ============================================
// SYMBOL SWAP BEHAVIORAL IMPACT
// ============================================

export interface SymbolSwapImpact {
  archetypeFitAdjustments: Record<string, number>;
  retentionD1Boost: number;
  retentionD7Boost: number;
  estimatedRtpContribution: number;
  estimatedWinFrequencyBoost: number;
  notes: string[];
}

export function computeSymbolSwapImpact(game: GameConcept): SymbolSwapImpact {
  const swap = game.symbolSwapFeature;

  // Validate configuration — invalid config = no impact (treat as disabled)
  if (!isSymbolSwapFeatureValid(swap)) {
    return {
      archetypeFitAdjustments: {},
      retentionD1Boost: 0,
      retentionD7Boost: 0,
      estimatedRtpContribution: 0,
      estimatedWinFrequencyBoost: 1.0,
      notes: [],
    };
  }

  const notes: string[] = [];
  notes.push(`Symbol Swap enabled (${swap.triggerMode})`);

  if (swap.triggerMode === "Random Non-Winning" || swap.triggerMode === "Both") {
    if (swap.randomTriggerProbability) {
      notes.push(`Random trigger: ${swap.randomTriggerProbability}% of spins`);
    }
  }

  if (swap.triggerMode === "Specific Interval" || swap.triggerMode === "Both") {
    if (swap.intervalSpins) {
      notes.push(`Interval trigger: every ${swap.intervalSpins} spins`);
    }
  }

  if (swap.swapRules.length > 0) {
    const ruleCount = swap.swapRules.length;
    notes.push(`${ruleCount} swap rule${ruleCount > 1 ? "s" : ""} defined`);
    swap.swapRules.forEach(rule => {
      const swapText = rule.swapCount === "all" ? "all instances" : `${rule.swapCount} instance${rule.swapCount !== 1 ? "s" : ""}`;
      notes.push(`  • Swap ${rule.sourceSymbol} → ${rule.targetSymbol} (${swapText})`);
    });
  }

  const archetypeFitAdjustments: Record<string, number> = {
    "Casual Player": 1.2,
    "Bonus-Seeking Player": 0.3,
    "Volatility-Seeking Player": -0.5,
    "Budget-Constrained Player": 0.8,
    "Progress-Oriented Player": 0.6,
    "Feature-Focused Player": 0.2,
  };

  const estimatedRtpContribution = swap.estimatedRtpContribution ?? 0.75;

  // Use form-provided value if specified, otherwise compute from rules
  const baseFrequencyBoost = 1.08;
  const frequencyMultiplier = Math.min(1.25, 1 + (swap!.swapRules.length * 0.03));
  const computedFrequencyBoost = baseFrequencyBoost * frequencyMultiplier;
  const estimatedWinFrequencyBoost = swap!.estimatedWinFrequencyBoost ?? computedFrequencyBoost;

  const retentionD1Boost = 2;
  const retentionD7Boost = 1;

  return {
    archetypeFitAdjustments,
    retentionD1Boost,
    retentionD7Boost,
    estimatedRtpContribution,
    estimatedWinFrequencyBoost,
    notes,
  };
}

// ============================================
// ARCHETYPE FIT SCORES (with modifiers)
// ============================================

export interface ArchetypeFitScore {
  archetype: string;
  baseScore: number;
  gambleAdjustment: number;
  symbolSwapAdjustment: number;
  finalScore: number;
  fitLabel: "Good fit" | "Moderate fit" | "Challenging";
}

export function computeArchetypeFitScores(game: GameConcept, metrics: ComputedInputMetrics): ArchetypeFitScore[] {
  const gambleImpact = computeGambleImpact(game);
  const swapImpact = computeSymbolSwapImpact(game);

  const archetypes: Array<{ name: string; baseScore: number; minClamp: number; maxClamp: number }> = [
    {
      name: "Casual Player",
      baseScore: (() => {
        const vol = game.volatility === "Low" ? 9 : game.volatility === "Medium" ? 7 : game.volatility === "High" ? 5 : 2;
        const fdi = metrics.featureDependencyIndex > 0.65 ? -2 : 0;
        return vol + fdi;
      })(),
      minClamp: 2, maxClamp: 10,
    },
    {
      name: "Bonus-Seeking Player",
      baseScore: (() => {
        const fdi = metrics.featureDependencyIndex >= 0.55 && metrics.featureDependencyIndex <= 0.75 ? 9 : 6;
        const vol = game.volatility === "High" || game.volatility === "Very High" ? 1 : 0;
        return fdi + vol;
      })(),
      minClamp: 4, maxClamp: 10,
    },
    {
      name: "Volatility-Seeking Player",
      baseScore: (() => {
        const vol = game.volatility === "Very High" ? 10 : game.volatility === "High" ? 8 : 4;
        const topWin = game.topWin >= 5000 ? 1 : -2;
        return vol + topWin;
      })(),
      minClamp: 3, maxClamp: 10,
    },
    {
      name: "Budget-Constrained Player",
      baseScore: (() => {
        const vol = game.volatility === "Low" || game.volatility === "Medium" ? 8 : 3;
        const bgt = (game.rtpBreakdown?.baseGameRtp ?? 0) < 45 ? -3 : 0;
        return vol + bgt;
      })(),
      minClamp: 2, maxClamp: 9,
    },
    {
      name: "Progress-Oriented Player",
      baseScore: (() => {
        const hasProgress = game.specialMechanics?.some(m => m.includes("Collection") || m.includes("Unlock")) ? 5 : 0;
        return 5 + hasProgress;
      })(),
      minClamp: 3, maxClamp: 9,
    },
  ];

  return archetypes.map(arch => {
    const gambleAdj = gambleImpact.archetypeFitAdjustments[arch.name] ?? 0;
    const swapAdj = swapImpact.archetypeFitAdjustments[arch.name] ?? 0;
    const rawScore = arch.baseScore + gambleAdj + swapAdj;
    const finalScore = Math.max(arch.minClamp, Math.min(arch.maxClamp, rawScore));
    const fitLabel: ArchetypeFitScore["fitLabel"] = finalScore >= 6 ? "Good fit" : finalScore >= 4 ? "Moderate fit" : "Challenging";

    return {
      archetype: arch.name,
      baseScore: arch.baseScore,
      gambleAdjustment: gambleAdj,
      symbolSwapAdjustment: swapAdj,
      finalScore,
      fitLabel,
    };
  });
}


export interface SessionBehavior {
  baseSessionLength: number;
  adjustedSessionLength: number;
  earlyExitProbability: number;
  survivalAt30: number;
  survivalAt60: number;
  survivalAt120: number;
}

export function computeSessionBehavior(game: GameConcept, metrics: ComputedInputMetrics): SessionBehavior {
  const baseMap: Record<string, number> = {
    Low: 5,
    Medium: 6,
    
    High: 8.5,
    "Very High": 9,
  };
  const baseSessionLength = baseMap[game.volatility] ?? 6;

  let adjustedSessionLength = baseSessionLength;
  if (metrics.featureDependencyIndex > 0.5) adjustedSessionLength += 1;
  if (metrics.baseRtpRatio < 0.45) adjustedSessionLength -= 1;

  let earlyExit = 20;
  const avgFeatureFreqIsLow = game.features.length === 0 || 
    game.features.filter(f => f.triggerFrequency === "Low" || f.triggerFrequency === "1 in 200").length > game.features.length / 2;
  if (avgFeatureFreqIsLow) earlyExit += 15;
  if (metrics.baseRtpRatio < 0.45) earlyExit += 10;
  if (metrics.jackpotWeight > 0.08) earlyExit += 10;
  if (game.deadSpinFrequency === "High") earlyExit += 5;
  earlyExit = Math.min(60, earlyExit);

  const survivalAt30 = 100 - earlyExit / 2;
  const survivalAt60 = 100 - earlyExit;
  const remaining = survivalAt60;
  const survivalAt120 = remaining * 0.5;

  return {
    baseSessionLength,
    adjustedSessionLength,
    earlyExitProbability: earlyExit,
    survivalAt30: Math.round(survivalAt30 * 10) / 10,
    survivalAt60: Math.round(survivalAt60 * 10) / 10,
    survivalAt120: Math.round(survivalAt120 * 10) / 10,
  };
}

// ============================================
// FEATURE INTERACTION
// ============================================

export interface FeatureInteraction {
  sessionsReachingFeature: number;
  sessionsReachingJackpot: number;
  sessionsEndingBeforeFeature: number;
}

export function computeFeatureInteraction(game: GameConcept, metrics: ComputedInputMetrics): FeatureInteraction {
  let sessionsReachingFeature = 50;
  const featureFreqIsLow = game.features.length === 0 || 
    game.features.filter(f => f.triggerFrequency === "Low" || f.triggerFrequency === "1 in 200").length > game.features.length / 2;
  if (featureFreqIsLow) sessionsReachingFeature -= 10;
  if (game.baseHitFrequency === "High") sessionsReachingFeature += 10;
  sessionsReachingFeature = Math.max(10, Math.min(90, sessionsReachingFeature));

  let sessionsReachingJackpot: number;
  if (metrics.jackpotWeight > 0.08) {
    sessionsReachingJackpot = 5;
  } else {
    sessionsReachingJackpot = 2.5;
  }

  const sessionsEndingBeforeFeature = 100 - sessionsReachingFeature;

  return {
    sessionsReachingFeature,
    sessionsReachingJackpot,
    sessionsEndingBeforeFeature,
  };
}

// ============================================
// ECONOMY BEHAVIOR
// ============================================

export interface EconomyBehavior {
  bankrollDepletion: number;
  lossDrivenExits: number;
}

export function computeEconomyBehavior(game: GameConcept, metrics: ComputedInputMetrics): EconomyBehavior {
  let bankrollDepletion = 35;
  if (game.volatility === "High" || game.volatility === "Very High") bankrollDepletion += 10;
  if (metrics.baseRtpRatio < 0.45) bankrollDepletion += 10;
  if (game.targetBankroll === "Low") bankrollDepletion += 5;

  let lossDrivenExits = 25;
  if (bankrollDepletion > 40) lossDrivenExits += 10;
  if (metrics.featureDependencyIndex > 0.50) lossDrivenExits += 5;

  return {
    bankrollDepletion: Math.min(90, bankrollDepletion),
    lossDrivenExits: Math.min(80, lossDrivenExits),
  };
}

// ============================================
// STOP REASONS DISTRIBUTION
// ============================================

export interface StopReasons {
  lossToleranceExceeded: number;
  noFeatureTrigger: number;
  timeLimit: number;
  bigWinExit: number;
}

export function computeStopReasons(game: GameConcept, metrics: ComputedInputMetrics): StopReasons {
  const lossTolerance = 30;
  let noFeature = 15;
  let bigWin = 10;
  const timeLimit = 45;

  if (metrics.featureDependencyIndex > 0.45) {
    noFeature = Math.max(noFeature, 25);
  }
  if (game.volatility === "High" || game.volatility === "Very High") {
    bigWin = Math.max(bigWin, 15);
  }

  const total = lossTolerance + noFeature + bigWin + timeLimit;
  return {
    lossToleranceExceeded: Math.round(lossTolerance / total * 100),
    noFeatureTrigger: Math.round(noFeature / total * 100),
    timeLimit: Math.round(timeLimit / total * 100),
    bigWinExit: Math.round(bigWin / total * 100),
  };
}

export interface ArchetypeStopReasons {
  archetype: string;
  boredomLowEngagement: number;
  lossToleranceExceeded: number;
  bankrollDepleted: number;
  sessionTimeLimit: number;
}

export function computeArchetypeStopReasons(
  game: GameConcept,
  metrics: ComputedInputMetrics
): ArchetypeStopReasons[] {
  const vol = game.volatility;
  const fdi = metrics.featureDependencyIndex;
  const hitFreq = game.baseHitFrequency;
  const deadSpinPressure = hitFreq === "Low" ? 0.8 : hitFreq === "High" ? 0.2 : 0.5;
  const lossPressure = (vol === "Very High" ? 0.9 : vol === "High" ? 0.7 : vol === "Medium" ? 0.4 : 0.2);
  const bankrollPressure = game.targetBankroll === "Low" ? 0.8 : game.targetBankroll === "High" ? 0.3 : 0.5;
  const featurePressure = fdi > 0.6 ? 0.8 : fdi > 0.4 ? 0.5 : 0.2;

  const archetypes = [
    {
      archetype: "Casual Player",
      boredom:    50 + deadSpinPressure * 15,
      loss:       20 + lossPressure * 12,
      bankroll:   10 + bankrollPressure * 5,
      time:       20 - deadSpinPressure * 5,
    },
    {
      archetype: "Bonus-Seeking Player",
      boredom:    45 + featurePressure * 10,
      loss:       25 + lossPressure * 8,
      bankroll:   12 + bankrollPressure * 5,
      time:       18 - featurePressure * 3,
    },
    {
      archetype: "Volatility-Seeking Player",
      boredom:    18 + deadSpinPressure * 3,
      loss:       42 + lossPressure * 10,
      bankroll:   28 + bankrollPressure * 8,
      time:       12,
    },
    {
      archetype: "Budget-Constrained Player",
      boredom:    8 + deadSpinPressure * 5,
      loss:       22 + lossPressure * 15,
      bankroll:   55 + bankrollPressure * 10,
      time:       15 - bankrollPressure * 5,
    },
    {
      archetype: "Progress-Oriented Player",
      boredom:    28 + deadSpinPressure * 8 + (featurePressure * 5),
      loss:       30 + lossPressure * 8,
      bankroll:   18 + bankrollPressure * 5,
      time:       24 - featurePressure * 3,
    },
  ];

  return archetypes.map(a => {
    const total = a.boredom + a.loss + a.bankroll + a.time;
    return {
      archetype: a.archetype,
      boredomLowEngagement:  Math.round((a.boredom   / total) * 100),
      lossToleranceExceeded: Math.round((a.loss       / total) * 100),
      bankrollDepleted:      Math.round((a.bankroll   / total) * 100),
      sessionTimeLimit:      Math.round((a.time       / total) * 100),
    };
  });
}

// ============================================
// BEHAVIORAL INTERPRETATION ENGINE
// ============================================

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

export function generateBehavioralInsights(
  game: GameConcept,
  metrics: ComputedInputMetrics,
  featureInteraction: FeatureInteraction
): BehavioralInsight[] {
  const insights: BehavioralInsight[] = [];

  if (metrics.featureDependencyIndex > 0.50 && featureInteraction.sessionsReachingFeature < 50) {
    insights.push({
      title: "Hope vs Delivery Mismatch",
      description: "Strong anticipation curve with weak reward delivery. Players expect feature triggers that don't arrive frequently enough.",
      type: "warning",
    });
  }

  if (metrics.baseRtpRatio < 0.45) {
    insights.push({
      title: "Base Game Reward Gap",
      description: "Base game does not provide sufficient reward support. Players experience extended low-return periods between features.",
      type: "warning",
    });
  }

  if (metrics.jackpotWeight > 0.08) {
    insights.push({
      title: "Jackpot Perception Distortion",
      description: "Jackpot heavily influences perceived value but has low session impact. Most players will never experience the jackpot reward.",
      type: "info",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Balanced Reward Distribution",
      description: "Game math shows a balanced distribution between base game and feature rewards, supporting consistent player engagement.",
      type: "positive",
    });
  }

  return insights;
}

// ============================================
// RISK FLAGS
// ============================================

export interface RiskFlag {
  flag: string;
  description: string;
  severity: "high" | "medium";
}

export function computeRiskFlags(
  metrics: ComputedInputMetrics,
  session: SessionBehavior,
  game: GameConcept
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (metrics.featureDependencyIndex > 0.50) {
    flags.push({
      flag: "HIGH FEATURE DEPENDENCY",
      description: `Feature Dependency Index at ${(metrics.featureDependencyIndex * 100).toFixed(1)}%. Over half of RTP is delivered through bonus features.`,
      severity: "high",
    });
  }

  if (session.earlyExitProbability > 45) {
    flags.push({
      flag: "EARLY SESSION FRAGILITY",
      description: `Early exit probability at ${session.earlyExitProbability}%. Nearly half of sessions may end before meaningful engagement.`,
      severity: "high",
    });
  }

  if (game.baseHitFrequency === "Medium" && metrics.baseRtpRatio < 0.45) {
    flags.push({
      flag: "DRY PERCEPTION RISK",
      description: "Medium hit frequency combined with low base RTP creates extended periods where players perceive no progress.",
      severity: "medium",
    });
  }

  // Early session risk from derived logic
  if (game.baseHitFrequency === "Low" && game.featureTriggerFrequency === "1 in 200") {
    flags.push({
      flag: "CRITICAL EARLY SESSION RISK",
      description: "Low hit frequency combined with very low feature trigger frequency creates high risk of early player disengagement.",
      severity: "high",
    });
  }

  return flags;
}

// ============================================
// WHAT WORKS WELL
// ============================================

export interface Strength {
  title: string;
  description: string;
}

export function computeStrengths(game: GameConcept, metrics: ComputedInputMetrics): Strength[] {
  const strengths: Strength[] = [];

  if (metrics.featureDependencyIndex > 0.45) {
    strengths.push({
      title: "Strong Feature Engagement",
      description: "High feature dependency drives strong engagement when bonus features trigger, creating memorable session peaks.",
    });
  }

  if (game.topWin > 2000) {
    strengths.push({
      title: "Aspirational Win Potential",
      description: `Top win of ${game.topWin}x provides clear aspirational value and jackpot appeal that attracts volatility-seeking players.`,
    });
  }

  if (metrics.baseRtpRatio >= 0.55) {
    strengths.push({
      title: "Solid Base Game Returns",
      description: "Strong base RTP ratio ensures consistent small wins that sustain player engagement between feature triggers.",
    });
  }

  if (game.baseHitFrequency === "High") {
    strengths.push({
      title: "High Hit Frequency",
      description: "Frequent base game wins maintain player engagement and reduce perceived volatility during extended sessions.",
    });
  }

  if (game.specialMechanics?.includes("Cascades")) {
    strengths.push({
      title: "Cascade Mechanic",
      description: "Cascade wins create chain reactions that increase perceived activity and excitement during base game.",
    });
  }

  if (strengths.length === 0) {
    strengths.push({
      title: "Balanced Design",
      description: "No single outstanding strength, but the overall design shows consistent balance across key metrics.",
    });
  }

  return strengths;
}

// ============================================
// IMPROVEMENT ENGINE
// ============================================

export interface Improvement {
  category: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export function generateImprovements(
  game: GameConcept,
  metrics: ComputedInputMetrics,
  session: SessionBehavior
): Improvement[] {
  const improvements: Improvement[] = [];

  if (session.earlyExitProbability > 40) {
    improvements.push({
      category: "Early Session Retention",
      suggestion: "Shift 5–8% RTP into the 1x–5x win range to provide more frequent small wins during early spins.",
      priority: "high",
    });
  }

  if (metrics.featureDependencyIndex > 0.45) {
    improvements.push({
      category: "Feature Dependency Reduction",
      suggestion: "Reduce feature RTP by 2–3% and redistribute to mid-tier wins in the base game to smooth the reward curve.",
      priority: "high",
    });
  }

  if (metrics.baseRtpRatio < 0.45) {
    improvements.push({
      category: "Base Game Enhancement",
      suggestion: "Strengthen base game reward frequency or add micro-features (e.g., random wilds, mini multipliers) to bridge gaps between bonuses.",
      priority: "medium",
    });
  }

  if (metrics.jackpotWeight > 0.08) {
    improvements.push({
      category: "Jackpot Rebalancing",
      suggestion: "Reduce jackpot RTP slightly and increase mid-tier reward density to improve perceived session value for the majority of players.",
      priority: "medium",
    });
  }

  return improvements;
}

// ============================================
// ONE-LINE DIAGNOSIS
// ============================================

export function generateDiagnosis(
  metrics: ComputedInputMetrics,
  session: SessionBehavior,
  riskFlags: RiskFlag[]
): string {
  if (riskFlags.length === 0) {
    return "Game math structure is well-balanced with no critical risk indicators — suitable for production validation.";
  }

  const highRisks = riskFlags.filter(f => f.severity === "high");
  if (highRisks.length >= 2) {
    return "Multiple structural risks detected — recommend significant game math revision before production commitment.";
  }

  if (session.earlyExitProbability > 45) {
    return "Early session fragility is the primary risk — redistribution of RTP toward base game small wins is recommended.";
  }

  if (metrics.featureDependencyIndex > 0.50) {
    return "High feature dependency creates inconsistent player experience — consider rebalancing RTP between base and feature layers.";
  }

  return "Minor structural concerns identified — targeted adjustments to game math will improve session stability.";
}

// ============================================
// BEHAVIORAL SIMULATION ENGINE
// Archetype survival over spins via decay functions
// ============================================

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

export function computeBehavioralSimulation(game: GameConcept): BehavioralSimulation {
  const volScoreMap: Record<string, number> = { Low: 0.3, Medium: 0.5, High: 0.8, "Very High": 1.0 };
  const hitScoreMap: Record<string, number> = { Low: 0.3, Medium: 0.5, High: 0.7 };

  function sdToScore(sd: number): number {
    return Math.min(1.0, Math.max(0.05, 1 - Math.exp(-sd / 28)));
  }
  const volatilityScore = (game.volatilityStdDev && game.volatilityStdDev > 0)
    ? sdToScore(game.volatilityStdDev)
    : volScoreMap[game.volatility] ?? 0.5;
  const hitScore = hitScoreMap[game.baseHitFrequency] ?? 0.5;

  const featureFreqCounts = { Low: 0, Medium: 0, High: 0 };
  const features = game.features ?? [];
  for (const f of features) {
    if (f.triggerFrequency in featureFreqCounts) {
      featureFreqCounts[f.triggerFrequency as keyof typeof featureFreqCounts]++;
    }
  }
  let featureFreq = "Low";
  if (features.length > 0) {
    const maxCount = Math.max(featureFreqCounts.Low, featureFreqCounts.Medium, featureFreqCounts.High);
    featureFreq = featureFreqCounts.High === maxCount ? "High" : featureFreqCounts.Medium === maxCount ? "Medium" : "Low";
  }
  const featureScoreMap: Record<string, number> = { Low: 0.2, Medium: 0.5, High: 0.8 };
  let featureScore = featureScoreMap[featureFreq] ?? 0.5;

  // Persistent / Pot feature handling — boost retention and progress signal
  let potRetentionBoost = 0;
  let hasProgressMeter = false;
  for (const f of features as ExtendedFeature[]) {
    if (f.type === "Pot / Perceived Persistent") {
      const pf = f as PersistentPotFeature;
      potRetentionBoost += (pf.pots ?? []).reduce((sum, pot) => {
        const prizeImpact =
          pot.prizeType === "Free Spins" ? 1.8 :
          pot.prizeType === "Hold & Spin" ? 1.5 :
          pot.prizeType === "Wild Transforms" ? 1.2 :
          pot.prizeType === "Multiplier Upgrade" ? 1.2 :
          pot.prizeType === "Respins" ? 1.3 :
          pot.prizeType === "Instant Win" ? 1.0 :
          pot.prizeType === "Grid Shuffle" ? 1.1 :
          pot.impactCategory === "Session Extension" ? 1.4 :
          pot.impactCategory === "Cash Prize" ? 1.0 :
          1.1;
        return sum + (pot.averageValue || 10) * prizeImpact;
      }, 0);
    }
    if (f.type === "Progress Meter / True Persistent") {
      hasProgressMeter = true;
    }
  }
  if (potRetentionBoost > 0) {
    featureScore = Math.min(1, featureScore + Math.min(0.25, potRetentionBoost / 400));
  }

  const baseRtp = (game.rtpBreakdown?.baseGameRtp ?? 0) / 100;
  const deadSpinPressure = 1 - hitScore;
  const lossPressure = volatilityScore * (1 - baseRtp);
  const featureAbsencePressure = 1 - featureScore;

  // Progress pressure: high when game lacks collection mechanics or base strength is weak
  const hasProgressSystem = hasProgressMeter ||
    game.specialMechanics?.includes("Collection Mechanics") ||
    game.specialMechanics?.includes("Progressive Jackpot");
  const progressPressure = hasProgressSystem ? (hasProgressMeter ? 0.1 : 0.2) : 0.7;

  // Bankroll pressure: derived from volatility and bankroll target
  const bankrollMap: Record<string, number> = { Low: 0.8, Medium: 0.5, High: 0.3 };
  const bankrollPressure = (bankrollMap[game.targetBankroll] ?? 0.5) * volatilityScore;

  const archetypeDefs = [
    {
      name: "Casual Player",
      key: "casual_survival" as const,
      lossSens: 0.95,
      deadSens: 1.05,
      featureSens: 0.55,
      progressSens: 0.4,
      bankrollSens: 0.6,
    },
    {
      name: "Bonus-Seeking Player",
      key: "bonus_survival" as const,
      lossSens: 0.50,
      deadSens: 0.45,
      featureSens: 1.45,
      progressSens: 0.5,
      bankrollSens: 0.5,
    },
    {
      name: "Volatility-Seeking Player",
      key: "volatility_survival" as const,
      lossSens: 0.28,
      deadSens: 0.20,
      featureSens: 0.42,
      progressSens: 0.2,
      bankrollSens: 0.3,
    },
    {
      name: "Budget-Constrained Player",
      key: "budget_survival" as const,
      lossSens: 1.55,
      deadSens: 0.85,
      featureSens: 0.65,
      progressSens: 0.5,
      bankrollSens: 1.6,
    },
    {
      name: "Progress-Oriented Player",
      key: "progress_survival" as const,
      lossSens: 0.65,
      deadSens: 0.80,
      featureSens: 0.85,
      progressSens: 1.35,
      bankrollSens: 0.55,
    },
  ];

  const archetypes: ArchetypeDecayInfo[] = archetypeDefs.map(a => {
    const decayRate = (
      lossPressure      * a.lossSens +
      deadSpinPressure  * a.deadSens +
      featureAbsencePressure * a.featureSens +
      progressPressure  * a.progressSens +
      bankrollPressure  * a.bankrollSens
    ) / 5;

    let label: string;
    if (decayRate > 0.7) label = "High early churn risk";
    else if (decayRate > 0.5) label = "Moderate retention";
    else if (decayRate > 0.3) label = "Good retention";
    else label = "Strong retention";

    return { name: a.name, decayRate, label };
  });

  const spinSteps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120];
  const survivalData: ArchetypeSurvivalRow[] = spinSteps.map(spin => {
    const row: ArchetypeSurvivalRow = {
      spin,
      casual_survival: 0,
      bonus_survival: 0,
      volatility_survival: 0,
      budget_survival: 0,
      progress_survival: 0,
    };
    for (const a of archetypes) {
      const raw = 100 * Math.exp(-a.decayRate * spin / 50);
      const clamped = Math.max(5, Math.min(100, Math.round(raw * 10) / 10));
      row[archetypeDefs.find(d => d.name === a.name)!.key] = clamped;
    }
    return row;
  });

  const sorted = [...archetypes].sort((a, b) => b.decayRate - a.decayRate);
  const fastestDropOff = sorted[0].name;
  const mostStable = sorted[sorted.length - 1].name;

  const pressures = [
    { name: "loss", value: lossPressure },
    { name: "dead spin", value: deadSpinPressure },
    { name: "feature absence", value: featureAbsencePressure },
    { name: "progress absence", value: progressPressure },
    { name: "bankroll", value: bankrollPressure },
  ].sort((a, b) => b.value - a.value);

  const dominantPressure = pressures[0].name;
  let retentionDriver: string;
  if (dominantPressure === "feature absence") {
    retentionDriver = "Feature-dependent retention — players leave when features don't trigger";
  } else if (dominantPressure === "dead spin") {
    retentionDriver = "Dead spin pressure dominates — low hit frequency drives disengagement";
  } else if (dominantPressure === "progress absence") {
    retentionDriver = "Progress-loop dependency — players disengage without visible advancement";
  } else if (dominantPressure === "bankroll") {
    retentionDriver = "Bankroll pressure dominates — volatility erodes budget before engagement peaks";
  } else {
    retentionDriver = "Loss pressure dominates — high volatility erodes bankroll confidence";
  }

  const casualAt30 = survivalData.find(r => r.spin === 30)?.casual_survival ?? 100;
  let earlySessionRisk: string;
  if (casualAt30 < 50) {
    earlySessionRisk = "Critical — majority of casual players exit within 30 spins";
  } else if (casualAt30 < 70) {
    earlySessionRisk = "Elevated — significant casual player drop-off in first 30 spins";
  } else {
    earlySessionRisk = "Manageable — most players survive initial 30 spins";
  }

  return {
    survivalData,
    archetypes,
    interpretation: {
      fastestDropOff,
      mostStable,
      earlySessionRisk,
      retentionDriver,
    },
  };
}

// ============================================
// MAIN SIMULATION ENTRY POINT
// ============================================

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

const POPULATION_MIDPOINTS: Record<PopulationRange, number> = {
  "100-1000":          500,
  "1000-5000":         3000,
  "5000-10000":        7500,
  "10000-50000":       30000,
  "50000-200000":      125000,
  "200000-500000":     350000,
  "500000-1000000":    750000,
  "1000000+":          1500000,
};

const POPULATION_LABELS: Record<PopulationRange, string> = {
  "100-1000":          "100 – 1,000 players",
  "1000-5000":         "1,000 – 5,000 players",
  "5000-10000":        "5,000 – 10,000 players",
  "10000-50000":       "10,000 – 50,000 players",
  "50000-200000":      "50,000 – 200,000 players",
  "200000-500000":     "200,000 – 500,000 players",
  "500000-1000000":    "500,000 – 1,000,000 players",
  "1000000+":          "1,000,000+ players",
};

export function computeSimulatedPopulation(
  game: GameConcept,
  sessionBehavior: SessionBehavior,
  metrics: ComputedInputMetrics,
  behavioralSim: BehavioralSimulation,
  archetypeStopReasons: Array<{
    archetype: string;
    boredomLowEngagement?: number;
    lossToleranceExceeded?: number;
    bankrollDepleted?: number;
    sessionTimeLimit?: number;
    boredom?: number;
  }>
): SimulatedPopulation {
  const range = game.populationRange ?? "10000-50000";
  const midpoint = POPULATION_MIDPOINTS[range];
  const rangeLabel = POPULATION_LABELS[range];

  // ═══ Variance Multiplier (deterministic seeded) ═══
  // Same game inputs produce same variance — reproducible results
  const seededRandom = getSeededRandom(game);
  const varianceMultiplier = 0.95 + seededRandom() * 0.1; // 0.95 to 1.05

  // ═══ Derive actual session metrics from simulation ═══
  const avgSessionMinutes = sessionBehavior.adjustedSessionLength;
  const spinsPerMinute = 6; // industry standard
  const avgRoundsPerSession = Math.round(avgSessionMinutes * spinsPerMinute);

  // ═══ Compute rounds per unique player from survival curve ═══
  // Use the median spin count where 50% of players are still active as a proxy
  const survivalCurve = behavioralSim.survivalData;
  const medianSpinIndex = survivalCurve.findIndex(d => d.casual_survival <= 50);
  const medianSpinCount = medianSpinIndex >= 0 ? survivalCurve[medianSpinIndex].spin : 60;

  // Average sessions per player: derived from how deep they go into the survival curve
  const avgSessionsPerPlayer =
    medianSpinCount > 70 ? 2.2 + (1 - metrics.featureDependencyIndex) * 0.8 :
    medianSpinCount > 50 ? 1.8 + (1 - metrics.featureDependencyIndex) * 0.6 :
    1.2 + (1 - metrics.featureDependencyIndex) * 0.4;

  const roundsPerUniquePlayer = Math.round(avgRoundsPerSession * avgSessionsPerPlayer);

  // ═══ Total rounds and bets ═══
  const totalRounds = Math.round(midpoint * roundsPerUniquePlayer * varianceMultiplier);
  const totalBets = totalRounds;

  // ═══ Early Churn — derived from archetypeStopReasons ═══
  let earlyChurnRate = 0;
  if (archetypeStopReasons && archetypeStopReasons.length > 0) {
    const avgBoredomRate = archetypeStopReasons.reduce((sum, arch) => {
      return sum + (arch.boredomLowEngagement ?? arch.boredom ?? 0);
    }, 0) / archetypeStopReasons.length;
    earlyChurnRate = Math.round(avgBoredomRate * varianceMultiplier);
  } else {
    earlyChurnRate = Math.round((metrics.featureDependencyIndex > 0.65 ? 45 : 25) * varianceMultiplier);
  }

  // ═══ D1 Retention — derived from survival at deep spins ═══
  const deepSpinData = survivalCurve[survivalCurve.length - 1] || survivalCurve[survivalCurve.length - 2];
  const casualDeepSurvival = deepSpinData?.casual_survival ?? 50;
  const bonusDeepSurvival = deepSpinData?.bonus_survival ?? 65;
  const volDeepSurvival = deepSpinData?.volatility_survival ?? 72;

  const d1Base = Math.round((casualDeepSurvival * 0.3 + bonusDeepSurvival * 0.4 + volDeepSurvival * 0.3) * 0.7);
  const symbolSwapImpact = computeSymbolSwapImpact(game);
  const d1WithBoosts = d1Base + symbolSwapImpact.retentionD1Boost;
  const retentionD1 = Math.max(10, Math.min(85, Math.round(d1WithBoosts * varianceMultiplier)));

  // ═══ D7 Retention — derived from D1 with volatility decay ═══
  const volDecayFactor =
    game.volatility === "Very High" ? 0.15 :
    game.volatility === "High" ? 0.25 :
    game.volatility === "Medium" ? 0.35 :
    0.45;

  const d7Base = Math.round(retentionD1 * (volDecayFactor + (1 - metrics.featureDependencyIndex) * 0.15));
  const gambleImpact = computeGambleImpact(game);
  const d7WithBonuses = d7Base + gambleImpact.retentionD7Adjustment + symbolSwapImpact.retentionD7Boost;
  // No second variance multiplication — D7 inherits variance from D1
  const retentionD7 = Math.max(5, Math.min(40, Math.round(d7WithBonuses)));

  // ═══ Churn Rate ═══
  const churnRate = Math.max(15, Math.min(95, earlyChurnRate));

  return {
    rangeLabel,
    midpoint,
    totalRounds,
    totalBets,
    totalPlayers: midpoint,
    avgSessionDurationMinutes: Math.round(avgSessionMinutes * 10) / 10,
    avgRoundsPerSession,
    roundsPerUniquePlayer,
    avgBetPerRound: 1.0,
    retentionD1,
    retentionD7,
    churnRate,
  };
}

export function computePerformanceScore(
  game: GameConcept,
  sessionBehavior: SessionBehavior,
  metrics: ComputedInputMetrics,
  pop: SimulatedPopulation,
  stabilityScore: number,
  earlyRiskScore: number
): PerformanceScore {
  const sessionBenchmark = 15;
  const sessionRatio = Math.min(1, pop.avgSessionDurationMinutes / sessionBenchmark);
  const earlyExitPenalty = pop.churnRate / 100;
  const sessionQuality = Math.round(Math.max(0, Math.min(10,
    (sessionRatio * 5) + ((1 - earlyExitPenalty) * 4) + (stabilityScore / 100)
  )) * 10) / 10;

  const playerRetention = Math.round(Math.max(0, Math.min(10,
    (pop.retentionD1 / 100) * 6 + (pop.retentionD7 / 100) * 4
  )) * 10) / 10;

  const featureEncounterRate = Math.max(10, Math.min(90,
    100 - (metrics.featureDependencyIndex * 40) - (earlyRiskScore * 0.3)
  ));
  const fdiBonus = (() => {
    const fdi = metrics.featureDependencyIndex;
    if (fdi >= 0.55 && fdi <= 0.75) return 3;
    if (fdi >= 0.40 && fdi < 0.55) return 2;
    if (fdi >= 0.30 && fdi < 0.40) return 1;
    if (fdi > 0.75) return 1.5;
    return 0.5;
  })();

  const featureEfficiency = Math.round(Math.max(0, Math.min(10,
    (featureEncounterRate / 100) * 5 +
    fdiBonus +
    (game.features.length > 0 && game.features.length <= 3 ? 2 : 1)
  )) * 10) / 10;

  const marketFit = Math.round(Math.max(0, Math.min(10,
    (stabilityScore / 100) * 5 +
    ((100 - earlyRiskScore) / 100) * 3 +
    (game.topWin > 2000 ? 1.5 : 0.8) +
    (game.features.length >= 2 ? 0.5 : 0)
  )) * 10) / 10;

  const overall = Math.round(
    (sessionQuality * 0.30 +
     playerRetention * 0.25 +
     featureEfficiency * 0.25 +
     marketFit * 0.20) * 10
  ) / 10;

  const label: PerformanceScore["label"] =
    overall >= 8 ? "Excellent" :
    overall >= 6 ? "Good" :
    overall >= 4 ? "Average" : "Poor";

  const summary =
    overall >= 8
      ? "Strong across all dimensions. High session quality with good retention indicators."
      : overall >= 6
      ? "Solid foundation with identifiable improvement areas. Review feature efficiency."
      : overall >= 4
      ? "Moderate performance. Session quality or retention needs structural improvement."
      : "Significant structural issues detected. Review volatility profile and feature pacing.";

  return { overall, sessionQuality, playerRetention, featureEfficiency, marketFit, label, summary };
}

export function generateDataInterpretation(
  game: GameConcept,
  results: Omit<SimulationResults, 'dataInterpretation' | 'stopReasons' | 'economyBehavior' | 'strengths'>
): DataInterpretation[] {
  const interpretations: DataInterpretation[] = [];

  const d1 = results.simulatedPopulation.retentionD1;
  const d7 = results.simulatedPopulation.retentionD7;
  const sessionMin = results.simulatedPopulation.avgSessionDurationMinutes;
  const spinsPerSession = results.simulatedPopulation.avgRoundsPerSession;
  const churn = results.simulatedPopulation.churnRate;
  const fdi = results.inputMetrics.featureDependencyIndex;
  const vol = game.volatility;
  const archetype = results.archetypeSelection.archetype;

  // ═══ 1. RETENTION ═══
  const d1Gap = Math.max(0, 55 - d1);
  const d7Gap = Math.max(0, 20 - d7);
  const retentionScore = results.performanceScore.playerRetention;

  let retentionPriority: DataInterpretation["priority"] = "Low";
  let retentionImpact: DataInterpretation["impact"] = "Minor";
  if (d1 < 40 || d7 < 15) { retentionPriority = "Critical"; retentionImpact = "Severe"; }
  else if (d1 < 50 || d7 < 18) { retentionPriority = "High"; retentionImpact = "Moderate"; }
  else if (d1 < 55 || d7 < 22) { retentionPriority = "Medium"; retentionImpact = "Moderate"; }

  let retentionRootCause = "";
  if (d1 < 40) {
    const causes: string[] = [];
    if (vol === "Very High" || vol === "High") causes.push("high volatility creating frustration in early spins");
    if (sessionMin < 8) causes.push("short sessions suggesting players aren't finding the hook");
    if (churn > 50) causes.push(`${churn}% early exit rate before experiencing core features`);
    if (game.baseHitFrequency === "Low") causes.push("infrequent wins in base game reducing satisfaction");
    retentionRootCause = `Low D1 (${d1}%) is driven by: ${causes.join(", ") || "structural weaknesses in early-session pacing"}.`;
  } else if (d7 < 15) {
    retentionRootCause = `D7 collapse (${d7}% from ${d1}% D1) indicates lack of long-term hooks. Players return day 1 but don't find reasons to stay. Common causes: no progression systems, repetitive gameplay loop, insufficient feature variety.`;
  } else if (d1 < 55) {
    retentionRootCause = `D1 of ${d1}% is ${d1Gap} points below benchmark. First-session experience is adequate but not compelling. Players need a stronger 'aha moment' in spins 20-60.`;
  } else {
    retentionRootCause = `Retention is healthy. D1 (${d1}%) and D7 (${d7}%) are within or above target ranges.`;
  }

  const retentionActions: ActionableInsight[] = [];
  if (d1 < 45) {
    const d1Lift = Math.min(10, d1Gap * 0.6);
    retentionActions.push({
      action: "Add 'near-miss' scatter animations at spins 15, 25, 35",
      expectedImpact: `+${d1Lift.toFixed(0)}-${(d1Lift + 3).toFixed(0)}% D1 retention`,
      difficulty: "Easy",
      priority: 1,
      reasoning: "Players need visual confirmation that features are reachable. Near-miss scatters (2/3 symbols) build anticipation without changing math. Most impactful in first 50 spins.",
      example: "Gates of Olympus shows potential scatter symbols with glow effects; Big Bass Bonanza teases fish appearances before feature triggers.",
    });
  }
  if (sessionMin < 10 && d1 < 50) {
    retentionActions.push({
      action: "Increase base game hit frequency to 28-32%",
      expectedImpact: "+2-3 min session length, +5-8% D1",
      difficulty: "Medium",
      priority: 1,
      reasoning: `Your ${game.baseHitFrequency} hit frequency is too low for ${vol} volatility. Players need consistent small wins (0.2-0.8× bet) to sustain engagement between features. Target: 1 win every 3-4 spins.`,
      example: "Sweet Bonanza maintains 30% hit frequency despite high volatility by using cluster mechanics with frequent 0.5× wins.",
    });
  }
  if (d7 < 18 && d1 > 45) {
    const d7Lift = Math.min(8, d7Gap * 0.5);
    retentionActions.push({
      action: "Add Daily Mission system (3 simple goals: trigger feature, hit X win, play Y spins)",
      expectedImpact: `+${d7Lift.toFixed(0)}-${(d7Lift + 2).toFixed(0)}% D7 retention`,
      difficulty: "Hard",
      priority: 2,
      reasoning: "D1 is solid but D7 collapses. Players need cross-session goals. Daily missions create habitual behavior without changing core math.",
      example: "Pragmatic Play 'Daily Drops' and 'Tournaments' drive +6-9% D7 lift per their 2023 data.",
    });
  }
  if (game.specialMechanics && !game.specialMechanics.some(m => m.includes("Collection"))) {
    retentionActions.push({
      action: "Add Collection Mechanic (e.g., collect 100 wilds → unlock 10 free spins)",
      expectedImpact: "+3-5% D7, +1-2 min session",
      difficulty: "Medium",
      priority: d7 < 15 ? 1 : 3,
      reasoning: "Collections create multi-session progression. Players return to complete progress.",
      example: "Fishin' Frenzy Megaways: collect fish symbols across sessions; Dog House Megaways: bone collection.",
    });
  }
  if (retentionActions.length === 0) {
    retentionActions.push({
      action: "Retention is structurally sound — focus on distribution and marketing",
      expectedImpact: "N/A",
      difficulty: "Easy",
      priority: 3,
      reasoning: "Your D1/D7 profile is competitive. Further improvements are marginal.",
    });
  }

  const comparativeContext = d1 >= 60
    ? `Your ${d1}% D1 matches tier-1 performers like Starburst (62%) and Book of Dead (58%). You're in the top 15% of the market.`
    : d1 >= 50
    ? `Your ${d1}% D1 is competitive with mid-tier hits like Sweet Bonanza (54%) and Gonzo's Quest (52%). Room to reach tier-1 (60%+).`
    : d1 >= 40
    ? `Your ${d1}% D1 is below average. Compare: Big Bass Bonanza (56%), Gates of Olympus (59%). Bottom 40% — fix is critical.`
    : `Your ${d1}% D1 is severely below market. Most successful games achieve 50-65% D1. Major redesign required.`;

  const retentionRisks: string[] = [];
  if (vol === "Very High" && d1 < 45) retentionRisks.push("⚠️ Very High volatility + weak D1 = death spiral. Reduce vol to High or boost hit frequency by 50%.");
  if (d7 < d1 * 0.25) retentionRisks.push(`⚠️ D7/D1 ratio is <25% (yours: ${((d7/Math.max(d1,1))*100).toFixed(0)}%). Week-1 retention collapse. Add progression mechanics immediately.`);
  if (sessionMin < 7 && d1 < 50) retentionRisks.push("⚠️ Short sessions + low D1 = compounding problem. Fix session length first.");

  interpretations.push({
    category: "Player Retention",
    priority: retentionPriority,
    impact: retentionImpact,
    metrics: [
      {
        name: "D1 Return Rate",
        value: `${d1}%`,
        explanation: "% of players who return the day after first session.",
        benchmark: d1 >= 60 ? "Excellent (top 15%)" : d1 >= 50 ? "Good (avg)" : d1 >= 40 ? "Below average" : "Poor (bottom 20%)",
        verdict: d1 >= 60 ? "excellent" : d1 >= 50 ? "good" : d1 >= 40 ? "average" : "poor",
      },
      {
        name: "D7 Return Rate",
        value: `${d7}%`,
        explanation: "% of D1 returners still engaged after 7 days.",
        benchmark: d7 >= 25 ? "Excellent" : d7 >= 18 ? "Good" : d7 >= 12 ? "Average" : "Poor",
        verdict: d7 >= 25 ? "excellent" : d7 >= 18 ? "good" : d7 >= 12 ? "average" : "poor",
      },
      {
        name: "Retention Score",
        value: `${retentionScore.toFixed(1)}/10`,
        explanation: "Composite: (D1×0.6 + D7×0.4) scaled to 10.",
        benchmark: "Target: 6.0+ (viable), 7.5+ (strong), 8.5+ (tier-1)",
        verdict: retentionScore >= 7.5 ? "excellent" : retentionScore >= 6 ? "good" : retentionScore >= 5 ? "average" : "poor",
      },
    ],
    narrative: `Your game's retention profile scores ${retentionScore.toFixed(1)}/10. ${
      retentionScore >= 7.5 ? "This is a strong retention profile."
      : retentionScore >= 6 ? "Viable but with clear improvement opportunities to reach tier-1 performance."
      : retentionScore >= 5 ? "Below target. Successful slots typically achieve 6.0+ retention scores."
      : "Critical issue. Scores below 5.0 indicate fundamental problems. Major redesign required."
    } Gap to benchmark: D1 needs +${d1Gap.toFixed(0)} points, D7 needs +${d7Gap.toFixed(0)} points.`,
    rootCause: retentionRootCause,
    actionable: retentionActions,
    comparativeContext,
    riskFlags: retentionRisks.length > 0 ? retentionRisks : undefined,
  });

  // ═══ 2. SESSION QUALITY ═══
  const sessionGap = Math.max(0, 12 - sessionMin);
  const sessionPriority: DataInterpretation["priority"] = sessionMin < 8 ? "High" : sessionMin < 10 ? "Medium" : "Low";
  const sessionImpact: DataInterpretation["impact"] = sessionMin < 7 ? "Severe" : sessionMin < 10 ? "Moderate" : "Minor";

  const sessionRootCause = sessionMin < 9
    ? `Short sessions (${sessionMin} min, ${spinsPerSession} spins) suggest early frustration. ${
        churn > 50 ? `High early churn (${churn}%) means many exit before engaging deeply. ` : ""
      }${
        spinsPerSession < 50 ? `Players exit at ~spin ${spinsPerSession}, before most feature triggers. ` : ""
      }Likely dead spin clusters in first 50 spins.`
    : `Sessions are healthy at ${sessionMin} minutes. Players engage long enough to experience core mechanics.`;

  const sessionActions: ActionableInsight[] = [];
  if (sessionMin < 9) {
    sessionActions.push({
      action: "Add guaranteed small win cluster at spins 20-30",
      expectedImpact: "+2-3 min session, +3-5% D1",
      difficulty: "Easy",
      priority: 1,
      reasoning: `Players exit at ~spin ${spinsPerSession}. A guaranteed positive moment at spin 25 prevents early abandonment.`,
      example: "Reactoonz places guaranteed 'Quantum Leap' wild at spin 25-35; Sugar Rush adds cascade multipliers at predictable intervals.",
    });
  }
  if (churn > 50 && sessionMin < 10) {
    sessionActions.push({
      action: "Reduce dead spin clusters in first 50 spins — target max 6 consecutive losses",
      expectedImpact: `-${Math.round((churn - 40) * 0.6)}% churn, +1-2 min session`,
      difficulty: "Medium",
      priority: 1,
      reasoning: `Your ${churn}% early churn is driven by frustrating dead runs. Shift 2-3% RTP from big wins to small wins in first 50 spins only.`,
      example: "Big Time Gaming Megaways titles use dynamic RTP distribution.",
    });
  }
  if (spinsPerSession < 60 && game.featureTriggerFrequency && game.featureTriggerFrequency.includes("150")) {
    sessionActions.push({
      action: "Add 'anticipation spins' with visual/audio escalation at 40, 60, 80 spin marks",
      expectedImpact: "+10-15 spins per session",
      difficulty: "Easy",
      priority: 2,
      reasoning: "Players exit at ~spin " + spinsPerSession + " but features trigger at ~150 spins. Communicate proximity.",
      example: "Book of Dead screen 'shakes' at 2-scatter lands; Gonzo's Quest anticipation meter.",
    });
  }
  if (sessionActions.length === 0) {
    sessionActions.push({
      action: "Session depth is healthy — maintain current pacing",
      expectedImpact: "N/A",
      difficulty: "Easy",
      priority: 3,
      reasoning: "Players are staying long enough to experience core gameplay.",
    });
  }

  const sessionComparative = sessionMin >= 15
    ? `Your ${sessionMin}-min sessions exceed the 15-min benchmark (Bonanza Megaways: 16 min, Dead or Alive 2: 17 min).`
    : sessionMin >= 12
    ? `Your ${sessionMin}-min sessions are within the healthy 12-15 min range (Book of Dead: 13, Starburst: 12).`
    : `Your ${sessionMin}-min sessions are ${sessionGap.toFixed(1)} min below baseline. Most successful games hit 12-18 min.`;

  const sessionRisks: string[] = [];
  if (sessionMin < 7 && game.featureTriggerFrequency && game.featureTriggerFrequency.includes("150")) {
    sessionRisks.push(`⚠️ Critical: Players exit at ~${spinsPerSession} spins but features trigger at ~150. <10% will see your main feature.`);
  }

  interpretations.push({
    category: "Session Quality",
    priority: sessionPriority,
    impact: sessionImpact,
    metrics: [
      {
        name: "Avg Session Length",
        value: `${sessionMin} min`,
        explanation: "Time players spend before exiting.",
        benchmark: sessionMin >= 15 ? "Excellent (15+ min)" : sessionMin >= 12 ? "Good (12-15 min)" : sessionMin >= 9 ? "Average (9-12 min)" : "Below target (<9 min)",
        verdict: sessionMin >= 15 ? "excellent" : sessionMin >= 12 ? "good" : sessionMin >= 9 ? "average" : "poor",
      },
      {
        name: "Spins Per Session",
        value: `${spinsPerSession}`,
        explanation: "Total spins before session end.",
        benchmark: spinsPerSession >= 90 ? "Deep" : spinsPerSession >= 60 ? "Moderate" : "Shallow",
        verdict: spinsPerSession >= 90 ? "excellent" : spinsPerSession >= 60 ? "good" : spinsPerSession >= 40 ? "average" : "poor",
      },
      {
        name: "Early Churn",
        value: `${churn}%`,
        explanation: "Players who exit before triggering a feature.",
        benchmark: churn < 30 ? "Low risk" : churn < 45 ? "Moderate" : "High risk",
        verdict: churn < 30 ? "excellent" : churn < 45 ? "good" : churn < 60 ? "average" : "poor",
      },
    ],
    narrative: `Average session of ${sessionMin} minutes (${spinsPerSession} spins) ${
      sessionMin >= 12 ? "is healthy."
      : sessionMin >= 9 ? "is adequate but improvable."
      : "is below industry standards. Compounds retention issues."
    }`,
    rootCause: sessionRootCause,
    actionable: sessionActions,
    comparativeContext: sessionComparative,
    riskFlags: sessionRisks.length > 0 ? sessionRisks : undefined,
  });

  // ═══ 3. FEATURE STRUCTURE ═══
  const featCount = game.features.length;
  let featurePriority: DataInterpretation["priority"] = "Medium";
  if (fdi > 0.75 || fdi < 0.30) featurePriority = "High";
  if (featCount === 0) featurePriority = "Critical";

  const featureRootCause =
    fdi > 0.75 ? `FDI of ${(fdi * 100).toFixed(0)}% is very high. 'Feast or famine' experience. Works for Volatility-Seekers but alienates Casual players.`
    : fdi > 0.60 ? `FDI of ${(fdi * 100).toFixed(0)}% indicates feature-driven design. Aligns with modern market trends (Gates of Olympus: 68%, Big Bass: 72%).`
    : fdi > 0.45 ? `FDI of ${(fdi * 100).toFixed(0)}% shows balanced design. Both base game and features contribute meaningfully.`
    : `FDI of ${(fdi * 100).toFixed(0)}% is low. Base game is primary value driver. Works for Casual (Starburst: 38%) but may underwhelm Bonus-Seekers.`;

  const featureActions: ActionableInsight[] = [];
  if (fdi > 0.75 && sessionMin < 10) {
    featureActions.push({
      action: "Shift 5-8% RTP from features to base game small wins (0.5-1.5× bet)",
      expectedImpact: "+2-3 min session, -5% churn, maintains RTP",
      difficulty: "Medium",
      priority: 1,
      reasoning: `Your ${(fdi * 100).toFixed(0)}% FDI creates long dry spells. Redistribute to sustain engagement.`,
      example: "Sweet Bonanza rebalanced 74%→68% FDI; session length +18%, no RTP change.",
    });
  }
  if (fdi < 0.35 && archetype.includes("Bonus-Seeking")) {
    featureActions.push({
      action: "Increase feature RTP to 50-55%",
      expectedImpact: "+8-12% D1 for Bonus-Seekers",
      difficulty: "Medium",
      priority: 1,
      reasoning: `${(fdi * 100).toFixed(0)}% FDI mismatches Bonus-Seeking archetype. Expect 55-70% feature RTP.`,
      example: "Legacy of Dead: 58% FDI; Reactoonz: 64%.",
    });
  }
  if (featCount === 0) {
    featureActions.push({
      action: "Add at least 1 primary feature (Free Spins recommended)",
      expectedImpact: "+15-25% D1, +3-5 min session",
      difficulty: "Hard",
      priority: 1,
      reasoning: "98% of successful 2020+ games have ≥1 feature. Free Spins is lowest-risk.",
      example: "Even Starburst has win-both-ways + re-spins as pseudo-features.",
    });
  }
  if (featCount > 4) {
    featureActions.push({
      action: "Consolidate features — merge similar mechanics",
      expectedImpact: "Clearer value proposition, -10% complexity",
      difficulty: "Medium",
      priority: 2,
      reasoning: `${featCount} features risk overwhelming players. Each dilutes the others.`,
      example: "NetEnt reduced Dead or Alive 2 from 6 features (prototype) to 3.",
    });
  }
  if (featureActions.length === 0) {
    featureActions.push({
      action: "Feature structure is well-balanced — maintain current design",
      expectedImpact: "N/A",
      difficulty: "Easy",
      priority: 3,
      reasoning: "FDI and feature count are in optimal ranges.",
    });
  }

  interpretations.push({
    category: "Feature Structure",
    priority: featurePriority,
    impact: fdi > 0.75 || fdi < 0.30 || featCount === 0 ? "Moderate" : "Minor",
    metrics: [
      {
        name: "Feature Dependency Index",
        value: `${(fdi * 100).toFixed(0)}%`,
        explanation: "Ratio of feature RTP to total RTP.",
        benchmark: fdi >= 0.55 && fdi <= 0.70 ? "Optimal (modern standard)" : fdi >= 0.45 && fdi < 0.55 ? "Balanced" : fdi >= 0.35 && fdi < 0.45 ? "Base-focused" : fdi > 0.70 ? "Feature-heavy" : "Feature-light",
        verdict: fdi >= 0.55 && fdi <= 0.70 ? "excellent" : fdi >= 0.45 && fdi <= 0.75 ? "good" : "average",
      },
      {
        name: "Feature Count",
        value: `${featCount}`,
        explanation: "Number of distinct triggered features.",
        benchmark: featCount >= 2 && featCount <= 4 ? "Optimal" : featCount === 1 ? "Single-focus" : featCount > 4 ? "Complex" : "No features",
        verdict: featCount >= 2 && featCount <= 4 ? "good" : featCount === 1 || featCount === 5 ? "average" : "poor",
      },
    ],
    narrative: `FDI of ${(fdi * 100).toFixed(0)}% with ${featCount} feature${featCount !== 1 ? "s" : ""} ${
      fdi >= 0.55 && fdi <= 0.70 && featCount >= 2 && featCount <= 4 ? "represents a well-balanced modern slot design."
      : "suggests opportunities for structural optimization."
    }`,
    rootCause: featureRootCause,
    actionable: featureActions,
    comparativeContext: fdi >= 0.65
      ? `Your ${(fdi * 100).toFixed(0)}% FDI matches feature-heavy games (Gates of Olympus 68%, Big Bass 72%, Dog House Megaways 70%).`
      : fdi >= 0.50
      ? `Your ${(fdi * 100).toFixed(0)}% FDI is in the balanced range (Book of Dead 58%, Gonzo's Quest 54%, Wolf Gold 52%).`
      : `Your ${(fdi * 100).toFixed(0)}% FDI is below modern standards. Most 2020+ releases aim for 55-70%.`,
  });

  // ═══ FEATURE ACCESSIBILITY (Effective FDI) ═══
  {
    const { effectiveFDI, triggerProbability } = computeEffectiveFDI(
      fdi,
      sessionMin,
      game.featureTriggerFrequency || "1 in 150"
    );

    if (fdi > 0.55 && triggerProbability < 0.50) {
      const accessActions: ActionableInsight[] = [{
        action: `Improve feature trigger frequency to 1-in-${Math.max(40, Math.round(sessionMin * 6 * 0.7))} to ensure 70% of sessions reach features`,
        expectedImpact: `+15-20% player satisfaction, effective FDI rises from ${(effectiveFDI * 100).toFixed(0)}% to ${(fdi * 0.70 * 100).toFixed(0)}%`,
        difficulty: "Medium",
        priority: 1,
        reasoning: `Your ${(fdi * 100).toFixed(0)}% FDI looks strong on paper, but only ${(triggerProbability * 100).toFixed(0)}% of sessions reach features (effective FDI = ${(effectiveFDI * 100).toFixed(0)}%). This creates a "hope vs delivery mismatch". Two solutions: (A) improve trigger frequency, or (B) reduce FDI to match reality.`,
        example: "Gates of Olympus: 68% FDI with 1-in-100 trigger = 72% trigger probability. Players get what the RTP promises.",
      }];

      interpretations.push({
        category: "Feature Accessibility",
        priority: "High",
        impact: "Moderate",
        metrics: [
          {
            name: "Feature Dependency Index",
            value: `${(fdi * 100).toFixed(0)}%`,
            explanation: "Percentage of RTP allocated to triggered features",
            benchmark: "55-70% for modern slots",
            verdict: fdi >= 0.55 && fdi <= 0.70 ? "good" : "average",
          },
          {
            name: "Effective FDI",
            value: `${(effectiveFDI * 100).toFixed(0)}%`,
            explanation: "FDI weighted by trigger probability — what players actually experience",
            benchmark: "Target: >40%",
            verdict: effectiveFDI >= 0.40 ? "good" : "poor",
          },
          {
            name: "Trigger Probability",
            value: `${(triggerProbability * 100).toFixed(0)}%`,
            explanation: "Likelihood of triggering a feature in an average session",
            benchmark: ">60% for feature-driven games",
            verdict: triggerProbability >= 0.60 ? "excellent" : triggerProbability >= 0.40 ? "average" : "poor",
          },
        ],
        narrative: `Your game allocates ${(fdi * 100).toFixed(0)}% of RTP to features, but with ${sessionMin}-minute sessions and ${game.featureTriggerFrequency || "1-in-150"} trigger frequency, only ${(triggerProbability * 100).toFixed(0)}% of players reach features. Effective FDI is ${(effectiveFDI * 100).toFixed(0)}% — significantly lower than designed.`,
        rootCause: "Mismatch between FDI (design promise) and trigger frequency (delivery). Sessions are too short or features trigger too rarely for the RTP allocation.",
        actionable: accessActions,
        comparativeContext: `Your ${(triggerProbability * 100).toFixed(0)}% trigger rate vs. successful games: Gates of Olympus (72%), Big Bass Bonanza (68%), Book of Dead (61%).`,
        riskFlags: triggerProbability < 0.40 ? [
          "⚠️ Less than 40% of players will ever see your main feature. They're paying for content they'll never experience."
        ] : undefined,
      });
    }
  }

  // ═══ 4. ARCHETYPE ALIGNMENT ═══
  const archetypeFit = results.archetypeFitScores?.find(a => a.archetype === archetype);
  const fitScore = archetypeFit?.finalScore || 5;
  const archetypePriority: DataInterpretation["priority"] = fitScore < 5 ? "High" : fitScore < 7 ? "Medium" : "Low";

  const archetypeActions: ActionableInsight[] = [];
  if (archetype === "Casual Player" && vol === "Very High") {
    archetypeActions.push({
      action: "Reduce volatility to High or add Ante Bet option",
      expectedImpact: "+10-15% Casual fit, +5-8% D1",
      difficulty: "Medium",
      priority: 1,
      reasoning: "Very High volatility frustrates Casual players (loss tolerance ~40%).",
      example: "Starburst: Low volatility, 96.1% RTP = Casual magnet (62% D1).",
    });
  }
  if (archetype === "Bonus-Seeking Player" && fdi < 0.45) {
    archetypeActions.push({
      action: "Increase feature RTP to 50-60% range",
      expectedImpact: "+1-2 archetype fit points",
      difficulty: "Medium",
      priority: 2,
      reasoning: "Bonus-Seekers expect features as primary reward.",
      example: "Legacy of Dead, Book of Ra: 55-62% feature RTP.",
    });
  }
  if (archetypeActions.length === 0) {
    archetypeActions.push({
      action: "Archetype alignment is strong — design matches expectations",
      expectedImpact: "N/A",
      difficulty: "Easy",
      priority: 3,
      reasoning: "Game structure naturally appeals to the identified archetype.",
    });
  }

  interpretations.push({
    category: "Archetype Alignment",
    priority: archetypePriority,
    impact: fitScore < 5 ? "Moderate" : "Minor",
    metrics: [
      {
        name: "Primary Archetype",
        value: archetype,
        explanation: "Dominant player type most attracted to this game's structure.",
        benchmark: "N/A",
        verdict: "good",
      },
      {
        name: "Archetype Fit Score",
        value: `${fitScore.toFixed(1)}/10`,
        explanation: "How well game design matches archetype expectations.",
        benchmark: fitScore >= 7 ? "Strong alignment" : fitScore >= 5 ? "Moderate" : "Weak alignment",
        verdict: fitScore >= 7 ? "excellent" : fitScore >= 5 ? "good" : "average",
      },
    ],
    narrative: `Primary audience: **${archetype}** with fit score ${fitScore.toFixed(1)}/10. ${
      fitScore >= 7 ? "Strong structural alignment."
      : fitScore >= 5 ? "Moderate alignment with room for optimization."
      : "Structural mismatch may limit commercial performance."
    }`,
    rootCause: fitScore >= 7
      ? "Game structure naturally aligns with archetype expectations."
      : `Mismatch driven by: ${vol} volatility + ${(fdi * 100).toFixed(0)}% FDI doesn't match ${archetype} preferences.`,
    actionable: archetypeActions,
  });

  // Apply feasibility checks to all recommendations
  for (const interpretation of interpretations) {
    interpretation.actionable = interpretation.actionable.map(action => {
      const feasibility = isRecommendationFeasible(action.action, game);
      if (!feasibility.feasible) {
        return {
          ...action,
          difficulty: "Hard" as const,
          reasoning: action.reasoning + ` ⚠️ Feasibility concern: ${feasibility.reason}. Requires structural game changes.`,
        };
      } else if (feasibility.reason) {
        return { ...action, reasoning: action.reasoning + ` ${feasibility.reason}` };
      }
      return action;
    });
  }

  return interpretations;
}

export function runSimulation(game: GameConcept): SimulationResults {
  const behavioralSimulation = computeBehavioralSimulation(game);
  const inputMetrics = computeInputMetrics(game);
  const gambleImpact = computeGambleImpact(game);
  const symbolSwapImpact = computeSymbolSwapImpact(game);
  const archetypeFitScores = computeArchetypeFitScores(game, inputMetrics);
  const archetypeSelection = selectArchetype(game, inputMetrics);
  const sessionBehavior = computeSessionBehavior(game, inputMetrics);
  const featureInteraction = computeFeatureInteraction(game, inputMetrics);
  const economyBehavior = computeEconomyBehavior(game, inputMetrics);
  const stopReasons = computeStopReasons(game, inputMetrics);
  const archetypeStopReasons = computeArchetypeStopReasons(game, inputMetrics);
  const behavioralInsights = generateBehavioralInsights(game, inputMetrics, featureInteraction);
  const riskFlags = computeRiskFlags(inputMetrics, sessionBehavior, game);
  const strengths = computeStrengths(game, inputMetrics);
  const improvements = generateImprovements(game, inputMetrics, sessionBehavior);
  const diagnosis = generateDiagnosis(inputMetrics, sessionBehavior, riskFlags);

  const stabilityBase = 70;
  const stabilityPenalties = riskFlags.length * 15 + (sessionBehavior.earlyExitProbability > 40 ? 10 : 0);
  const structuralStabilityScore = Math.max(0, Math.min(100, stabilityBase - stabilityPenalties));

  const earlySessionRiskScore = Math.min(100, Math.max(0, sessionBehavior.earlyExitProbability));

  const featureDependencyLevel: "Low" | "Medium" | "High" =
    inputMetrics.featureDependencyIndex > 0.50 ? "High" :
    inputMetrics.featureDependencyIndex > 0.30 ? "Medium" : "Low";

  const simulatedPopulation = computeSimulatedPopulation(game, sessionBehavior, inputMetrics, behavioralSimulation, archetypeStopReasons);
  const performanceScore = computePerformanceScore(
    game, sessionBehavior, inputMetrics, simulatedPopulation,
    structuralStabilityScore, earlySessionRiskScore
  );

  let recommendation: string;
  if (structuralStabilityScore >= 70 && earlySessionRiskScore <= 30) {
    recommendation = "Ready to Launch";
  } else if (structuralStabilityScore >= 50 && earlySessionRiskScore <= 50) {
    recommendation = "Launch with Adjustments";
  } else if (structuralStabilityScore >= 35) {
    recommendation = "Requires Significant Revision";
  } else {
    recommendation = "Redesign Recommended";
  }

  const dataInterpretation = generateDataInterpretation(game, {
    archetypeSelection,
    sessionBehavior,
    inputMetrics,
    behavioralSimulation,
    featureInteraction,
    structuralStabilityScore,
    earlySessionRiskScore,
    featureDependencyLevel,
    recommendation,
    diagnosis,
    improvements,
    behavioralInsights,
    riskFlags,
    archetypeStopReasons,
    simulatedPopulation,
    performanceScore,
    archetypeFitScores,
  });

  return {
    inputMetrics,
    archetypeSelection,
    sessionBehavior,
    featureInteraction,
    economyBehavior,
    stopReasons,
    archetypeStopReasons,
    behavioralInsights,
    riskFlags,
    strengths,
    improvements,
    diagnosis,
    recommendation,
    structuralStabilityScore,
    earlySessionRiskScore,
    featureDependencyLevel,
    behavioralSimulation,
    simulatedPopulation,
    performanceScore,
    dataInterpretation,
    gambleImpact,
    symbolSwapImpact,
    archetypeFitScores,
  };
}
