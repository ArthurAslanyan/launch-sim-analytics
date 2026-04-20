// LaunchIndex Deterministic Behavioral Simulation Engine
// All outputs are rule-based, computed from game math inputs

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
  // Legacy compat
  visibility: string;
  winImpact: string;
  progressImpact: string;
}

export interface WinDistribution {
  sub1x: number;
  x1to5: number;
  x5to20: number;
  x20to100: number;
  x100plus: number;
}

export interface GameConcept {
  gameName: string;
  targetMarkets: string[];
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
  maxExposureCategory: string;
  rtpBreakdown: RtpBreakdown;
  winDistribution: WinDistribution;
  features: Feature[];
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

  // RTP detail
  respinsRtp?: number;
  wildContributionRtp?: number;

  // Feature options
  bonusBuyAvailable?: boolean;
  anteBetAvailable?: boolean;

  // Session
  winPacing?: "Front-loaded" | "Even" | "Bonus-dependent";
  requiresSimulation?: boolean;
  referenceGame?: string;
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
  const bd = game.rtpBreakdown;
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
      reason: `Collection mechanics combined with a ${game.baseGameStrength.toLowerCase()} base game creates a progress-loop structure. Players are motivated by visible advancement and disengage if momentum stalls.`,
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
// SESSION BEHAVIOR CALCULATION
// ============================================

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
    "Medium-High": 7,
    High: 8.5,
    "Very High": 9,
  };
  let baseSessionLength = baseMap[game.volatility] ?? 6;

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
  let lossTolerance = 30;
  let noFeature = 15;
  let bigWin = 10;
  let timeLimit = 45;

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

// ============================================
// BEHAVIORAL INTERPRETATION ENGINE
// ============================================

export interface BehavioralInsight {
  title: string;
  description: string;
  type: "warning" | "info" | "positive";
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
  const volScoreMap: Record<string, number> = { Low: 0.3, Medium: 0.5, "Medium-High": 0.65, High: 0.8, "Very High": 1.0 };
  const hitScoreMap: Record<string, number> = { Low: 0.3, Medium: 0.5, High: 0.7 };

  const volatilityScore = volScoreMap[game.volatility] ?? 0.5;
  const hitScore = hitScoreMap[game.baseHitFrequency] ?? 0.5;

  const featureFreqCounts = { Low: 0, Medium: 0, High: 0 };
  for (const f of game.features) {
    if (f.triggerFrequency in featureFreqCounts) {
      featureFreqCounts[f.triggerFrequency as keyof typeof featureFreqCounts]++;
    }
  }
  let featureFreq = "Low";
  if (game.features.length > 0) {
    const maxCount = Math.max(featureFreqCounts.Low, featureFreqCounts.Medium, featureFreqCounts.High);
    featureFreq = featureFreqCounts.High === maxCount ? "High" : featureFreqCounts.Medium === maxCount ? "Medium" : "Low";
  }
  const featureScoreMap: Record<string, number> = { Low: 0.2, Medium: 0.5, High: 0.8 };
  const featureScore = featureScoreMap[featureFreq] ?? 0.5;

  const baseRtp = game.rtpBreakdown.baseGameRtp / 100;
  const deadSpinPressure = 1 - hitScore;
  const lossPressure = volatilityScore * (1 - baseRtp);
  const featureAbsencePressure = 1 - featureScore;

  // Progress pressure: high when game lacks collection mechanics or base strength is weak
  const hasProgressSystem = game.specialMechanics?.includes("Collection Mechanics") ||
    game.specialMechanics?.includes("Progressive Jackpot");
  const progressPressure = hasProgressSystem ? 0.2 : 0.7;

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
}

export function runSimulation(game: GameConcept): SimulationResults {
  const behavioralSimulation = computeBehavioralSimulation(game);
  const inputMetrics = computeInputMetrics(game);
  const archetypeSelection = selectArchetype(game, inputMetrics);
  const sessionBehavior = computeSessionBehavior(game, inputMetrics);
  const featureInteraction = computeFeatureInteraction(game, inputMetrics);
  const economyBehavior = computeEconomyBehavior(game, inputMetrics);
  const stopReasons = computeStopReasons(game, inputMetrics);
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

  return {
    inputMetrics,
    archetypeSelection,
    sessionBehavior,
    featureInteraction,
    economyBehavior,
    stopReasons,
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
  };
}
