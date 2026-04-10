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

export interface GameConcept {
  gameName: string;
  targetMarkets: string[];
  playerFocus: string[];
  gridLayout: string;
  payStructure: string;
  cascades: string;
  baseHitFrequency: string;
  volatility: string;
  rtpTarget: number;
  topWin: number;
  rtpBreakdown: RtpBreakdown;
  features: Feature[];
  sessionLength: string;
  bonusImportance: string;
  earlyExcitement: string;
  referenceGames?: string;
}

export interface Feature {
  id: string;
  type: string;
  triggerFrequency: string;
  visibility: string;
  winImpact: string;
  progressImpact: string;
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
  if (metrics.featureDependencyIndex > 0.45) {
    return {
      archetype: "Bonus-Seeking Player",
      reason: `Feature Dependency Index is ${(metrics.featureDependencyIndex * 100).toFixed(1)}% (> 45%), indicating heavy reliance on bonus features for RTP delivery.`,
    };
  }
  if (game.volatility === "High" && game.topWin > 2000) {
    return {
      archetype: "Volatility-Seeking Player",
      reason: `High volatility combined with top win of ${game.topWin}x (> 2000x) appeals to risk-tolerant, high-reward seekers.`,
    };
  }
  if (metrics.baseRtpRatio > 0.60) {
    return {
      archetype: "Casual Player",
      reason: `Base RTP ratio is ${(metrics.baseRtpRatio * 100).toFixed(1)}% (> 60%), suggesting consistent base game returns suited for casual players.`,
    };
  }
  return {
    archetype: "Balanced Player",
    reason: "No dominant feature dependency, volatility, or base game bias detected. Game appeals broadly across player types.",
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
  // Base session length
  const baseMap: Record<string, number> = {
    Low: 5,
    Medium: 6,
    "Medium-High": 7,
    High: 8.5,
  };
  let baseSessionLength = baseMap[game.volatility] ?? 6;

  let adjustedSessionLength = baseSessionLength;
  if (metrics.featureDependencyIndex > 0.5) adjustedSessionLength += 1;
  if (metrics.baseRtpRatio < 0.45) adjustedSessionLength -= 1;

  // Early exit probability
  let earlyExit = 20;
  // Feature trigger probability is "low" if average feature trigger freq is Low
  const avgFeatureFreqIsLow = game.features.length === 0 || 
    game.features.filter(f => f.triggerFrequency === "Low").length > game.features.length / 2;
  if (avgFeatureFreqIsLow) earlyExit += 15;
  if (metrics.baseRtpRatio < 0.45) earlyExit += 10;
  if (metrics.jackpotWeight > 0.08) earlyExit += 10;
  earlyExit = Math.min(60, earlyExit);

  // Survival curve
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
    game.features.filter(f => f.triggerFrequency === "Low").length > game.features.length / 2;
  if (featureFreqIsLow) sessionsReachingFeature -= 10;
  if (game.baseHitFrequency === "High") sessionsReachingFeature += 10;
  sessionsReachingFeature = Math.max(10, Math.min(90, sessionsReachingFeature));

  let sessionsReachingJackpot: number;
  if (metrics.jackpotWeight > 0.08) {
    sessionsReachingJackpot = 5; // 4-6% range, use midpoint
  } else {
    sessionsReachingJackpot = 2.5; // 2-3% range, use midpoint
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
  if (game.volatility === "Medium-High" || game.volatility === "High") bankrollDepletion += 10;
  if (metrics.baseRtpRatio < 0.45) bankrollDepletion += 10;

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
  if (game.volatility === "High") {
    bigWin = Math.max(bigWin, 15);
  }

  // Normalize to 100
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

  // Hope vs Delivery
  if (metrics.featureDependencyIndex > 0.50 && featureInteraction.sessionsReachingFeature < 50) {
    insights.push({
      title: "Hope vs Delivery Mismatch",
      description: "Strong anticipation curve with weak reward delivery. Players expect feature triggers that don't arrive frequently enough.",
      type: "warning",
    });
  }

  // Mid-layer weakness
  if (metrics.baseRtpRatio < 0.45) {
    insights.push({
      title: "Base Game Reward Gap",
      description: "Base game does not provide sufficient reward support. Players experience extended low-return periods between features.",
      type: "warning",
    });
  }

  // Jackpot distortion
  if (metrics.jackpotWeight > 0.08) {
    insights.push({
      title: "Jackpot Perception Distortion",
      description: "Jackpot heavily influences perceived value but has low session impact. Most players will never experience the jackpot reward.",
      type: "info",
    });
  }

  // If no issues detected
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
  // Derived game variables
  const volScoreMap: Record<string, number> = { Low: 0.3, Medium: 0.5, "Medium-High": 0.65, High: 0.8 };
  const hitScoreMap: Record<string, number> = { Low: 0.3, Medium: 0.5, High: 0.7 };

  const volatilityScore = volScoreMap[game.volatility] ?? 0.5;
  const hitScore = hitScoreMap[game.baseHitFrequency] ?? 0.5;

  // Feature frequency: derive from features array
  const featureFreqCounts = { Low: 0, Medium: 0, High: 0 };
  for (const f of game.features) {
    if (f.triggerFrequency in featureFreqCounts) {
      featureFreqCounts[f.triggerFrequency as keyof typeof featureFreqCounts]++;
    }
  }
  let featureFreq: string;
  if (game.features.length === 0) {
    featureFreq = "Low";
  } else {
    const maxCount = Math.max(featureFreqCounts.Low, featureFreqCounts.Medium, featureFreqCounts.High);
    featureFreq = featureFreqCounts.High === maxCount ? "High" : featureFreqCounts.Medium === maxCount ? "Medium" : "Low";
  }
  const featureScoreMap: Record<string, number> = { Low: 0.2, Medium: 0.5, High: 0.8 };
  const featureScore = featureScoreMap[featureFreq] ?? 0.5;

  // Pressure values
  const baseRtp = game.rtpBreakdown.baseGameRtp / 100; // normalize to 0-1
  const deadSpinPressure = 1 - hitScore;
  const lossPressure = volatilityScore * (1 - baseRtp);
  const featureAbsencePressure = 1 - featureScore;

  // Archetype definitions
  const archetypeDefs = [
    { name: "Casual Player", key: "casual_survival" as const, lossSens: 0.9, deadSens: 1.0, featureSens: 0.6 },
    { name: "Bonus-Seeking Player", key: "bonus_survival" as const, lossSens: 0.7, deadSens: 0.6, featureSens: 1.2 },
    { name: "Volatility-Seeking Player", key: "volatility_survival" as const, lossSens: 0.4, deadSens: 0.3, featureSens: 0.5 },
  ];

  // Compute decay rates
  const archetypes: ArchetypeDecayInfo[] = archetypeDefs.map(a => {
    const decayRate = (
      lossPressure * a.lossSens +
      deadSpinPressure * a.deadSens +
      featureAbsencePressure * a.featureSens
    ) / 3;

    let label: string;
    if (decayRate > 0.7) label = "High early churn risk";
    else if (decayRate > 0.5) label = "Moderate retention";
    else if (decayRate > 0.3) label = "Good retention";
    else label = "Strong retention";

    return { name: a.name, decayRate, label };
  });

  // Survival curve
  const spinSteps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120];
  const survivalData: ArchetypeSurvivalRow[] = spinSteps.map(spin => {
    const row: ArchetypeSurvivalRow = { spin, casual_survival: 0, bonus_survival: 0, volatility_survival: 0 };
    for (const a of archetypes) {
      const raw = 100 * Math.exp(-a.decayRate * spin / 50);
      const clamped = Math.max(5, Math.min(100, Math.round(raw * 10) / 10));
      row[archetypeDefs.find(d => d.name === a.name)!.key] = clamped;
    }
    return row;
  });

  // Interpretation
  const sorted = [...archetypes].sort((a, b) => b.decayRate - a.decayRate);
  const fastestDropOff = sorted[0].name;
  const mostStable = sorted[sorted.length - 1].name;

  // Determine dominant pressure
  const pressures = [
    { name: "loss", value: lossPressure },
    { name: "dead spin", value: deadSpinPressure },
    { name: "feature absence", value: featureAbsencePressure },
  ].sort((a, b) => b.value - a.value);

  const dominantPressure = pressures[0].name;
  let retentionDriver: string;
  if (dominantPressure === "feature absence") {
    retentionDriver = "Feature-dependent retention — players leave when features don't trigger";
  } else if (dominantPressure === "dead spin") {
    retentionDriver = "Dead spin pressure dominates — low hit frequency drives disengagement";
  } else {
    retentionDriver = "Loss pressure dominates — high volatility erodes bankroll confidence";
  }

  // Early session risk (0-30 spins) based on casual player
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
  // Legacy compat for charts
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

  // Structural Stability Score
  const stabilityBase = 70;
  const stabilityPenalties = riskFlags.length * 15 + (sessionBehavior.earlyExitProbability > 40 ? 10 : 0);
  const structuralStabilityScore = Math.max(0, Math.min(100, stabilityBase - stabilityPenalties));

  // Early Session Risk Score
  const earlySessionRiskScore = Math.min(100, Math.max(0, sessionBehavior.earlyExitProbability));

  // Feature dependency level
  const featureDependencyLevel: "Low" | "Medium" | "High" =
    inputMetrics.featureDependencyIndex > 0.50 ? "High" :
    inputMetrics.featureDependencyIndex > 0.30 ? "Medium" : "Low";

  // Recommendation
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
