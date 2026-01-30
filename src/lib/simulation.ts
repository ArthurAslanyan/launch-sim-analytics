// LaunchIndex Behavioral Simulation Engine
// Rule-based mechanics simulation for slot game evaluation

export interface GameConcept {
  gameName: string;
  targetMarkets: string[];
  playerFocus: string[];
  gridLayout: string;
  payStructure: string;
  cascades: string;
  baseHitFrequency: string;
  volatility: string;
  rtpTarget?: number;
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

// Player Archetype Definitions
interface ArchetypeProfile {
  name: string;
  startingBankroll: { min: number; max: number };
  lossTolerancePercent: number;
  deadSpinTolerance: number;
  featureSensitivity: number; // 0-1, how much they care about features
  volatilityPreference: number; // -1 to 1, negative = low vol, positive = high vol
  sessionPatienceMultiplier: number;
}

const ARCHETYPES: ArchetypeProfile[] = [
  {
    name: "Casual",
    startingBankroll: { min: 50, max: 100 },
    lossTolerancePercent: 40,
    deadSpinTolerance: 12,
    featureSensitivity: 0.3,
    volatilityPreference: -0.5,
    sessionPatienceMultiplier: 0.8,
  },
  {
    name: "Bonus-Seeking",
    startingBankroll: { min: 100, max: 200 },
    lossTolerancePercent: 50,
    deadSpinTolerance: 20,
    featureSensitivity: 0.9,
    volatilityPreference: 0.2,
    sessionPatienceMultiplier: 1.2,
  },
  {
    name: "Volatility-Seeking",
    startingBankroll: { min: 150, max: 300 },
    lossTolerancePercent: 70,
    deadSpinTolerance: 25,
    featureSensitivity: 0.5,
    volatilityPreference: 0.8,
    sessionPatienceMultiplier: 1.0,
  },
  {
    name: "Budget-Constrained",
    startingBankroll: { min: 30, max: 60 },
    lossTolerancePercent: 25,
    deadSpinTolerance: 8,
    featureSensitivity: 0.4,
    volatilityPreference: -0.7,
    sessionPatienceMultiplier: 0.6,
  },
  {
    name: "Progress-Oriented",
    startingBankroll: { min: 80, max: 150 },
    lossTolerancePercent: 45,
    deadSpinTolerance: 15,
    featureSensitivity: 0.7,
    volatilityPreference: 0,
    sessionPatienceMultiplier: 1.1,
  },
];

// Outcome probability calculation based on game mechanics
function calculateOutcomeProbabilities(game: GameConcept) {
  const gridMultiplier = {
    "3×5": 0.9,
    "4×5": 1.0,
    "5×5": 1.1,
    "6×5": 1.2,
  }[game.gridLayout] || 1.0;

  const payStructureModifier = {
    Lines: { deadSpin: 0.55, smallWin: 0.30, meaningfulWin: 0.10 },
    Ways: { deadSpin: 0.45, smallWin: 0.38, meaningfulWin: 0.12 },
    Cluster: { deadSpin: 0.50, smallWin: 0.32, meaningfulWin: 0.13 },
  }[game.payStructure] || { deadSpin: 0.50, smallWin: 0.33, meaningfulWin: 0.12 };

  const volatilityModifier = {
    Low: { deadSpinMod: 0.85, meaningfulMod: 0.7 },
    Medium: { deadSpinMod: 1.0, meaningfulMod: 1.0 },
    "Medium-High": { deadSpinMod: 1.1, meaningfulMod: 1.3 },
    High: { deadSpinMod: 1.2, meaningfulMod: 1.6 },
  }[game.volatility] || { deadSpinMod: 1.0, meaningfulMod: 1.0 };

  const hitFreqModifier = {
    Low: 1.15,
    Medium: 1.0,
    High: 0.85,
  }[game.baseHitFrequency] || 1.0;

  const cascadeBonus = game.cascades === "Yes" ? 0.92 : 1.0;

  // Calculate base feature trigger probability
  const avgFeatureTrigger = game.features.length > 0
    ? game.features.reduce((sum, f) => {
        const freqProb = { Low: 0.005, Medium: 0.015, High: 0.03 }[f.triggerFrequency] || 0.015;
        return sum + freqProb;
      }, 0) / game.features.length
    : 0.01;

  return {
    deadSpin: Math.min(0.75, payStructureModifier.deadSpin * volatilityModifier.deadSpinMod * hitFreqModifier * cascadeBonus * gridMultiplier),
    smallWin: Math.max(0.15, payStructureModifier.smallWin * (2 - hitFreqModifier)),
    meaningfulWin: Math.max(0.05, payStructureModifier.meaningfulWin * volatilityModifier.meaningfulMod / gridMultiplier),
    featureTrigger: avgFeatureTrigger,
  };
}

// Session outcome types
type SessionEndReason = 
  | "boredom"
  | "loss_tolerance"
  | "bankroll_depleted"
  | "no_bonus"
  | "time_limit";

interface SessionResult {
  spins: number;
  duration: number; // minutes
  endReason: SessionEndReason;
  finalBankroll: number;
  startingBankroll: number;
  featureTriggered: boolean;
  peakBankroll: number;
}

interface ArchetypeResults {
  archetype: string;
  sessions: SessionResult[];
  avgDuration: number;
  medianDuration: number;
  survivalAt30: number;
  survivalAt60: number;
  survivalAt120: number;
  endReasonDistribution: Record<SessionEndReason, number>;
  avgBankrollDepletion: number;
  avgDurationWithFeature: number;
  avgDurationWithoutFeature: number;
}

export interface SimulationResults {
  archetypeResults: ArchetypeResults[];
  structuralStabilityScore: number;
  earlySessionRiskScore: number;
  featureDependencyLevel: "Low" | "Medium" | "High";
  overallFit: Record<string, { robustness: string; volatilityTolerance: string; bankrollSensitivity: string; overallFit: string }>;
  recommendation: string;
  riskSummary: string;
}

// Pseudo-random with seed for deterministic results
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function runSession(
  archetype: ArchetypeProfile,
  probs: ReturnType<typeof calculateOutcomeProbabilities>,
  game: GameConcept,
  random: () => number
): SessionResult {
  const startingBankroll = archetype.startingBankroll.min + 
    random() * (archetype.startingBankroll.max - archetype.startingBankroll.min);
  
  let bankroll = startingBankroll;
  let peakBankroll = startingBankroll;
  let spins = 0;
  let consecutiveDeadSpins = 0;
  let featureTriggered = false;
  let totalSpinsWithoutFeature = 0;
  const betSize = startingBankroll * 0.02; // 2% of starting bankroll per spin
  
  const maxSpins = {
    Short: 100,
    Medium: 180,
    Long: 300,
  }[game.sessionLength] || 180;

  const adjustedMaxSpins = Math.floor(maxSpins * archetype.sessionPatienceMultiplier);
  const lossThreshold = startingBankroll * (1 - archetype.lossTolerancePercent / 100);
  
  // Feature expectation based on archetype
  const featurePatience = archetype.featureSensitivity > 0.7 ? 80 : 150;

  let endReason: SessionEndReason = "time_limit";

  while (spins < adjustedMaxSpins && bankroll > betSize) {
    spins++;
    bankroll -= betSize;
    totalSpinsWithoutFeature++;

    const roll = random();
    let cumProb = 0;

    cumProb += probs.deadSpin;
    if (roll < cumProb) {
      // Dead spin
      consecutiveDeadSpins++;
      if (consecutiveDeadSpins > archetype.deadSpinTolerance) {
        endReason = "boredom";
        break;
      }
    } else {
      consecutiveDeadSpins = 0;
      cumProb += probs.smallWin;
      if (roll < cumProb) {
        // Small win
        const winMultiplier = 0.5 + random() * 1.5;
        bankroll += betSize * winMultiplier;
      } else {
        cumProb += probs.meaningfulWin;
        if (roll < cumProb) {
          // Meaningful win
          const winMultiplier = 3 + random() * 15;
          bankroll += betSize * winMultiplier;
        } else {
          // Feature trigger
          featureTriggered = true;
          totalSpinsWithoutFeature = 0;
          const featureMultiplier = 10 + random() * 50;
          bankroll += betSize * featureMultiplier;
        }
      }
    }

    peakBankroll = Math.max(peakBankroll, bankroll);

    // Check stop conditions
    if (bankroll <= 0) {
      endReason = "bankroll_depleted";
      break;
    }

    if (bankroll < lossThreshold) {
      endReason = "loss_tolerance";
      break;
    }

    if (!featureTriggered && totalSpinsWithoutFeature > featurePatience && archetype.featureSensitivity > 0.6) {
      endReason = "no_bonus";
      break;
    }
  }

  // Duration: ~3 seconds per spin average
  const duration = (spins * 3) / 60;

  return {
    spins,
    duration: Math.min(duration, 10), // Cap at 10 minutes
    endReason,
    finalBankroll: Math.max(0, bankroll),
    startingBankroll,
    featureTriggered,
    peakBankroll,
  };
}

function calculateMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function runArchetypeSimulation(
  archetype: ArchetypeProfile,
  game: GameConcept,
  probs: ReturnType<typeof calculateOutcomeProbabilities>,
  seed: number
): ArchetypeResults {
  const random = seededRandom(seed);
  const sessions: SessionResult[] = [];
  
  for (let i = 0; i < 500; i++) {
    sessions.push(runSession(archetype, probs, game, random));
  }

  const durations = sessions.map(s => s.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const medianDuration = calculateMedian(durations);

  const spins = sessions.map(s => s.spins);
  const survivalAt30 = sessions.filter(s => s.spins >= 30).length / sessions.length * 100;
  const survivalAt60 = sessions.filter(s => s.spins >= 60).length / sessions.length * 100;
  const survivalAt120 = sessions.filter(s => s.spins >= 120).length / sessions.length * 100;

  const endReasonDistribution: Record<SessionEndReason, number> = {
    boredom: 0,
    loss_tolerance: 0,
    bankroll_depleted: 0,
    no_bonus: 0,
    time_limit: 0,
  };

  sessions.forEach(s => {
    endReasonDistribution[s.endReason]++;
  });

  Object.keys(endReasonDistribution).forEach(key => {
    endReasonDistribution[key as SessionEndReason] = 
      (endReasonDistribution[key as SessionEndReason] / sessions.length) * 100;
  });

  const avgBankrollDepletion = sessions.reduce((sum, s) => {
    return sum + ((s.startingBankroll - s.finalBankroll) / s.startingBankroll) * 100;
  }, 0) / sessions.length;

  const sessionsWithFeature = sessions.filter(s => s.featureTriggered);
  const sessionsWithoutFeature = sessions.filter(s => !s.featureTriggered);

  const avgDurationWithFeature = sessionsWithFeature.length > 0
    ? sessionsWithFeature.reduce((sum, s) => sum + s.duration, 0) / sessionsWithFeature.length
    : 0;
  
  const avgDurationWithoutFeature = sessionsWithoutFeature.length > 0
    ? sessionsWithoutFeature.reduce((sum, s) => sum + s.duration, 0) / sessionsWithoutFeature.length
    : avgDuration;

  return {
    archetype: archetype.name,
    sessions,
    avgDuration,
    medianDuration,
    survivalAt30,
    survivalAt60,
    survivalAt120,
    endReasonDistribution,
    avgBankrollDepletion,
    avgDurationWithFeature,
    avgDurationWithoutFeature,
  };
}

export function runSimulation(game: GameConcept): SimulationResults {
  const probs = calculateOutcomeProbabilities(game);
  const baseSeed = game.gameName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const archetypeResults = ARCHETYPES.map((archetype, index) => 
    runArchetypeSimulation(archetype, game, probs, baseSeed + index * 1000)
  );

  // Calculate cross-archetype metrics
  const avgSurvival60 = archetypeResults.reduce((sum, r) => sum + r.survivalAt60, 0) / archetypeResults.length;
  const avgBoredomRate = archetypeResults.reduce((sum, r) => sum + r.endReasonDistribution.boredom, 0) / archetypeResults.length;
  const avgBankrollDepletion = archetypeResults.reduce((sum, r) => sum + r.avgBankrollDepletion, 0) / archetypeResults.length;

  // Structural Stability Score (0-100)
  const structuralStabilityScore = Math.round(
    Math.min(100, Math.max(0,
      50 +
      (avgSurvival60 - 50) * 0.5 +
      (50 - avgBoredomRate) * 0.3 +
      (70 - avgBankrollDepletion) * 0.3
    ))
  );

  // Early Session Risk Score (0-100, higher = more risk)
  const avgSurvival30 = archetypeResults.reduce((sum, r) => sum + r.survivalAt30, 0) / archetypeResults.length;
  const casualResult = archetypeResults.find(r => r.archetype === "Casual");
  const budgetResult = archetypeResults.find(r => r.archetype === "Budget-Constrained");
  
  const earlyDropoff = 100 - avgSurvival30;
  const casualBoredom = casualResult?.endReasonDistribution.boredom || 0;
  const budgetDepletion = budgetResult?.endReasonDistribution.bankroll_depleted || 0;

  const earlySessionRiskScore = Math.round(
    Math.min(100, Math.max(0,
      earlyDropoff * 0.4 +
      casualBoredom * 0.3 +
      budgetDepletion * 0.3
    ))
  );

  // Feature Dependency Level
  const avgDurationDiff = archetypeResults.reduce((sum, r) => {
    return sum + (r.avgDurationWithFeature - r.avgDurationWithoutFeature);
  }, 0) / archetypeResults.length;

  const featureDependencyLevel: "Low" | "Medium" | "High" = 
    avgDurationDiff > 3 ? "High" :
    avgDurationDiff > 1.5 ? "Medium" : "Low";

  // Overall fit per archetype
  const overallFit: SimulationResults["overallFit"] = {};
  
  archetypeResults.forEach(r => {
    const robustness = r.survivalAt60 > 60 ? "High" : r.survivalAt60 > 40 ? "Medium" : "Low";
    const volatilityTolerance = r.endReasonDistribution.loss_tolerance < 20 ? "High" : 
      r.endReasonDistribution.loss_tolerance < 35 ? "Medium" : "Low";
    const bankrollSensitivity = r.avgBankrollDepletion < 50 ? "Low" : 
      r.avgBankrollDepletion < 70 ? "Medium" : "High";
    
    const fitScore = (robustness === "High" ? 3 : robustness === "Medium" ? 2 : 1) +
                     (volatilityTolerance === "High" ? 3 : volatilityTolerance === "Medium" ? 2 : 1) +
                     (bankrollSensitivity === "Low" ? 3 : bankrollSensitivity === "Medium" ? 2 : 1);
    
    const overallFitValue = fitScore >= 7 ? "Good" : fitScore >= 5 ? "Moderate" : "Poor";

    overallFit[r.archetype] = {
      robustness,
      volatilityTolerance,
      bankrollSensitivity,
      overallFit: overallFitValue,
    };
  });

  // Generate recommendation
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

  // Generate risk summary
  const risks: string[] = [];
  
  if (earlySessionRiskScore > 40) {
    risks.push("High early-session dropout risk detected. Consider increasing hit frequency or adding early engagement mechanics.");
  }
  
  if (featureDependencyLevel === "High") {
    risks.push("Strong feature dependency observed. Sessions without bonus triggers are significantly shorter.");
  }
  
  if (avgBoredomRate > 25) {
    risks.push("Elevated boredom-driven exits. Dead spin sequences may be too long for target audience.");
  }
  
  if (budgetResult && budgetResult.endReasonDistribution.bankroll_depleted > 40) {
    risks.push("Budget-constrained players face high bankroll depletion risk. Consider lower volatility options.");
  }

  const opportunities: string[] = [];
  
  if (structuralStabilityScore >= 60) {
    opportunities.push("Core mechanics show solid engagement potential across archetypes.");
  }
  
  if (probs.featureTrigger > 0.02) {
    opportunities.push("Feature trigger frequency supports bonus-seeking player retention.");
  }

  const riskSummary = [
    ...risks.map(r => `• Risk: ${r}`),
    ...opportunities.map(o => `• Opportunity: ${o}`),
  ].join("\n") || "• No significant structural issues detected. Game mechanics are well-balanced for target player segments.";

  return {
    archetypeResults,
    structuralStabilityScore,
    earlySessionRiskScore,
    featureDependencyLevel,
    overallFit,
    recommendation,
    riskSummary,
  };
}

// Survival curve data for charts
export function getSurvivalCurveData(results: SimulationResults) {
  const spinPoints = [0, 10, 20, 30, 40, 50, 60, 80, 100, 120, 150, 180];
  
  return spinPoints.map(spin => {
    const dataPoint: Record<string, number | string> = { spins: spin };
    
    results.archetypeResults.forEach(ar => {
      const survival = ar.sessions.filter(s => s.spins >= spin).length / ar.sessions.length * 100;
      dataPoint[ar.archetype] = Math.round(survival * 10) / 10;
    });
    
    return dataPoint;
  });
}

// Session end reason data for charts  
export function getEndReasonData(results: SimulationResults) {
  return results.archetypeResults.map(ar => ({
    archetype: ar.archetype,
    "Low Engagement": Math.round(ar.endReasonDistribution.boredom * 10) / 10,
    "Loss Tolerance": Math.round(ar.endReasonDistribution.loss_tolerance * 10) / 10,
    "Bankroll Depleted": Math.round(ar.endReasonDistribution.bankroll_depleted * 10) / 10,
    "No Bonus": Math.round(ar.endReasonDistribution.no_bonus * 10) / 10,
    "Time Limit": Math.round(ar.endReasonDistribution.time_limit * 10) / 10,
  }));
}

// Feature impact data
export function getFeatureImpactData(results: SimulationResults) {
  return results.archetypeResults.map(ar => ({
    archetype: ar.archetype,
    "With Feature": Math.round(ar.avgDurationWithFeature * 100) / 100,
    "Without Feature": Math.round(ar.avgDurationWithoutFeature * 100) / 100,
  }));
}

// Bankroll depletion data
export function getBankrollDepletionData(results: SimulationResults) {
  return results.archetypeResults.map(ar => ({
    archetype: ar.archetype,
    depletion: Math.round(ar.avgBankrollDepletion * 10) / 10,
  }));
}

// Duration data
export function getDurationData(results: SimulationResults) {
  return results.archetypeResults.map(ar => ({
    archetype: ar.archetype,
    average: Math.round(ar.avgDuration * 100) / 100,
    median: Math.round(ar.medianDuration * 100) / 100,
  }));
}
