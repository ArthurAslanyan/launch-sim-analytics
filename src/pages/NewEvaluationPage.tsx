import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Info,
  Grid3X3,
  Sparkles,
  Plus,
  Trash2,
  Play,
  PieChart,
  FileUp,
  BarChart3,
  TrendingUp,
  Wallet,
  Zap,
  Target,
  ChevronDown,
  HelpCircle,
  Cpu,
  Layers,
  BookOpen,
  AlertTriangle,
  Users,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FormField, FormRow } from "@/components/FormSection";
import { MultiSelect, SelectButtons } from "@/components/MultiSelect";
import { GameConcept, Feature, ExtendedFeature, PersistentPotFeature, TruePersistentFeature, RtpBreakdown, WinDistribution, runSimulation, PopulationRange } from "@/lib/simulation";
import { DocumentUpload, ExtractedGameData } from "@/components/DocumentUpload";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PlayerArchetypeConfig } from "@/components/PlayerArchetypeConfig";

const TARGET_MARKETS = ["UK", "Nordics", "EU", "LATAM", "Global"];
const PLAYER_FOCUS = ["Casual", "Bonus-Seeking", "Volatility-Seeking", "Budget-Constrained", "Progress-Oriented"];
const GAME_TYPES = ["Paylines", "Payways", "Megaways", "Cluster Pays", "Grid"];
const REEL_TYPES: Array<"Classic" | "Video"> = ["Classic", "Video"];
const VOLATILITIES = ["Low", "Medium", "High", "Very High"];
const HIT_FREQUENCIES = ["Low (<20%)", "Medium (20–35%)", "High (>35%)"];
const HIT_FREQ_MAP: Record<string, string> = {
  "Low (<20%)": "Low", "Medium (20–35%)": "Medium", "High (>35%)": "High",
};
const FEATURE_TRIGGER_OPTIONS = ["1 in 50", "1 in 75", "1 in 100", "1 in 150", "1 in 200", "1 in 300"];
const FEATURE_TYPES_LIST = [
  "Free Spins", "Respins", "Hold & Spin", "Pick Bonus",
  "Progressive Jackpot", "Collection Mechanic", "Cascading Mode", "Bonus Buy Entry",
  "Pot / Perceived Persistent", "Progress Meter / True Persistent",
];
const FEATURE_VOL = ["Low", "Medium", "High"];
const WILD_TYPES = ["Standard", "Expanding", "Sticky", "Multiplier", "Expanding + Multiplier", "Sticky + Multiplier"];
const EXPANDING_WILD_SCOPES = ["All reels", "Middle reel only", "Free game only"];
const STICKY_WILD_MODES = ["Until end of feature", "Moves each spin", "Until win"];
const SCATTER_THRESHOLDS = ["2", "3", "4", "5"];
const FREE_SPIN_COUNTS = ["5", "8", "10", "12", "15", "20", "25", "30"];
const FREE_GAME_REELS = ["Same as base game", "Different reels"];
const MULTIPLIER_SYMBOL_TYPES = ["Spin multiplier", "Win multiplier", "Progressive (adds each cascade)"];
const WIN_PACING_OPTIONS = ["Front-loaded", "Even", "Bonus-dependent"];
const BASE_GAME_STRENGTHS = ["Weak (feature-driven)", "Balanced", "Strong"];
const DEAD_SPIN_FREQ = ["Low", "Medium", "High"];
const BANKROLL_TARGETS = ["Low", "Medium", "High"];
const PRIMARY_GOALS = ["High engagement", "Long sessions", "Big win excitement", "Frequent rewards"];
const TARGET_AUDIENCES = ["Casual", "Bonus seekers", "High volatility players"];
const SPECIAL_MECHANICS = [
  "Cascades", "Expanding Wilds", "Sticky Wilds", "Multiplier Symbols",
  "Split Symbols", "Progressive Jackpot", "Collection Mechanics",
  "Bonus Buy", "Ante Bet", "Megacluster",
];

const createEmptyFeature = (): Feature => ({
  id: crypto.randomUUID(),
  type: "",
  name: "",
  triggerCondition: "",
  triggerFrequency: "",
  averageValue: 0,
  maxValue: 0,
  featureVolatility: "",
  visibility: "",
  winImpact: "",
  progressImpact: "",
  rtpContribution: 0,
});

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, description, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="form-section animate-fade-in">
        <CollapsibleTrigger className="group flex w-full items-start justify-between text-left">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-primary">{icon}</span>
              <span className="form-section-title !mb-0">{title}</span>
            </div>
            {description && <p className="form-section-description mt-1">{description}</p>}
          </div>
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform mt-1", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-4 space-y-4">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors" aria-label="Help">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}

export default function NewEvaluationPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic
  const [gameName, setGameName] = useState("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);
  const [playerFocus, setPlayerFocus] = useState<string[]>([]);

  // Game Structure
  const [gameType, setGameType] = useState("");
  const [gridRows, setGridRows] = useState("3");
  const [gridColumns, setGridColumns] = useState("5");
  const [showGridPreview, setShowGridPreview] = useState(true);
  const [waysOrLines, setWaysOrLines] = useState("243");

  // Structure (new)
  const [reelType, setReelType] = useState<"Classic" | "Video">("Video");
  const [irregularWindow, setIrregularWindow] = useState(false);

  // Wild
  const [hasWild, setHasWild] = useState(true);
  const [wildType, setWildType] = useState("");
  const [expandingWildScope, setExpandingWildScope] = useState("");
  const [stickyWildMode, setStickyWildMode] = useState("");
  const [multiplierWildValueType, setMultiplierWildValueType] = useState("");

  // Scatter
  const [hasScatter, setHasScatter] = useState(true);
  const [scatterThreshold, setScatterThreshold] = useState("3");
  const [scatterMultiplePerReel, setScatterMultiplePerReel] = useState(false);
  const [hasRetrigger, setHasRetrigger] = useState(false);
  const [retriggerFrequency, setRetriggerFrequency] = useState("");
  const [freeSpinCount, setFreeSpinCount] = useState("10");
  const [freeGameReels, setFreeGameReels] = useState("");

  // Multiplier symbol
  const [hasMultiplierSymbol, setHasMultiplierSymbol] = useState(false);
  const [multiplierSymbolType, setMultiplierSymbolType] = useState("");

  // RTP
  const [rtpTarget, setRtpTarget] = useState("96.5");
  const [baseGameRtp, setBaseGameRtp] = useState("45");
  const [freeSpinsRtp, setFreeSpinsRtp] = useState("25");
  const [holdSpinRtp, setHoldSpinRtp] = useState("0");
  const [otherFeatureRtp, setOtherFeatureRtp] = useState("0");

  // Feature extras
  const [bonusBuyAvailable, setBonusBuyAvailable] = useState(false);
  const [anteBetAvailable, setAnteBetAvailable] = useState(false);

  // Hit Frequency
  const [overallHitFreq, setOverallHitFreq] = useState("");
  const [baseHitFreq, setBaseHitFreq] = useState("");
  const [featureTriggerFreq, setFeatureTriggerFreq] = useState("");

  // Session
  const [winPacing, setWinPacing] = useState("");
  const [referenceGame, setReferenceGame] = useState("");

  // Volatility
  const [volatility, setVolatility] = useState("");
  const [topWin, setTopWin] = useState("5000");
  const [volatilityStdDev, setVolatilityStdDev] = useState("");

  // Win Distribution
  const [winSub1x, setWinSub1x] = useState("50");
  const [win1to5, setWin1to5] = useState("30");
  const [win5to20, setWin5to20] = useState("12");
  const [win20to100, setWin20to100] = useState("6");
  const [win100plus, setWin100plus] = useState("2");

  // Features
  const [features, setFeatures] = useState<ExtendedFeature[]>([createEmptyFeature()]);

  // Base Game Strength
  const [baseGameStrength, setBaseGameStrength] = useState("");
  const [averageBaseWin, setAverageBaseWin] = useState("");
  const [deadSpinFrequency, setDeadSpinFrequency] = useState("");

  // Bankroll
  const [targetBankroll, setTargetBankroll] = useState("");
  const [targetSessionLength, setTargetSessionLength] = useState("15");

  // Special Mechanics
  const [specialMechanics, setSpecialMechanics] = useState<string[]>([]);

  // Gamble Feature
  const [gambleEnabled, setGambleEnabled] = useState(false);
  const [gambleTriggerMode, setGambleTriggerMode] = useState<"Per-Win" | "Feature-End" | "Both">("Per-Win");
  const [gambleColorEnabled, setGambleColorEnabled] = useState(true);
  const [gambleSuitEnabled, setGambleSuitEnabled] = useState(false);
  const [gambleMultiStepEnabled, setGambleMultiStepEnabled] = useState(false);
  const [gambleMaxRounds, setGambleMaxRounds] = useState("");
  const [gambleWinCap, setGambleWinCap] = useState("");

  // Symbol Swap Feature
  const [symbolSwapEnabled, setSymbolSwapEnabled] = useState(false);
  const [symbolSwapTriggerMode, setSymbolSwapTriggerMode] = useState<"Random Non-Winning" | "Specific Interval" | "Both">("Random Non-Winning");
  const [symbolSwapRandomProbability, setSymbolSwapRandomProbability] = useState("30");
  const [symbolSwapIntervalSpins, setSymbolSwapIntervalSpins] = useState("");
  const [symbolSwapRules, setSymbolSwapRules] = useState<Array<{ id: string; sourceSymbol: string; targetSymbol: string; swapCount: "all" | number }>>([]);
  const [symbolSwapRtpContribution, setSymbolSwapRtpContribution] = useState("0.75");
  const [symbolSwapWinFrequencyBoost, setSymbolSwapWinFrequencyBoost] = useState("1.08");

  // Design Intent
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [populationRange, setPopulationRange] = useState<PopulationRange>("10000-50000");

  // Computed values
  const rtpNum = parseFloat(rtpTarget) || 0;
  const baseRtpNum = parseFloat(baseGameRtp) || 0;
  const freeSpinsRtpNum = parseFloat(freeSpinsRtp) || 0;
  const holdSpinRtpNum = parseFloat(holdSpinRtp) || 0;
  const otherFeatureRtpNum = parseFloat(otherFeatureRtp) || 0;
  const featureRtpNum = freeSpinsRtpNum + holdSpinRtpNum + otherFeatureRtpNum;
  const rtpSumValid = Math.abs(baseRtpNum + featureRtpNum - rtpNum) < 0.1;
  const rtpInRange = rtpNum >= 85 && rtpNum <= 99;

  const winTotal = (parseFloat(winSub1x) || 0) + (parseFloat(win1to5) || 0) + (parseFloat(win5to20) || 0) + (parseFloat(win20to100) || 0) + (parseFloat(win100plus) || 0);
  const winTotalValid = Math.abs(winTotal - 100) < 0.5;

  const topWinNum = parseFloat(topWin) || 0;
  const maxExposureCategory = topWinNum < 500 ? "<500×" : topWinNum <= 2000 ? "500–2000×" : "2000×+";

  const featureDependency = rtpNum > 0 ? featureRtpNum / rtpNum : 0;
  const riskFlagFeatureHeavy = featureDependency > 0.6;

  const isFormValid = (() => {
    if (!gameName.trim()) return false;
    if (!gameType) return false;
    if (!volatility) return false;
    if (rtpNum < 85 || rtpNum > 99) return false;
    return true;
  })();

  const validationMessage = (() => {
    if (!gameName.trim()) return "Game name is required";
    if (!gameType) return "Game type must be selected";
    if (!volatility) return "Volatility must be selected";
    if (rtpNum < 85 || rtpNum > 99) return "RTP target must be between 85% and 99%";
    return "";
  })();

  const requiresSimulation =
    (specialMechanics.includes("Cascades") && ["Megaways", "Cluster Pays", "Grid"].includes(gameType)) ||
    wildType === "Sticky" || wildType === "Sticky + Multiplier";

  const retriggerRateMap: Record<string, number> = {
    "1 in 50": 1/50, "1 in 75": 1/75, "1 in 100": 1/100,
    "1 in 150": 1/150, "1 in 200": 1/200, "1 in 300": 1/300,
  };
  const baseTriggerRate = retriggerRateMap[featureTriggerFreq] || 0;
  const retriggerRate = hasRetrigger ? (retriggerRateMap[retriggerFrequency] || 0) : 0;
  const infiniteSeriesValid = retriggerRate < 1;
  const expectedFeatureTimes = baseTriggerRate > 0 && infiniteSeriesValid
    ? (baseTriggerRate / (1 - retriggerRate)).toFixed(5)
    : retriggerRate >= 1 ? "∞ (invalid)" : "—";

  const wildDescription: Record<string, string> = {
    "Standard": "Landing events = symbol_count + wild_count per reel. Additive to hit frequency.",
    "Expanding": "Covers entire reel on landing. RTP must be calculated per payline separately. Usually restricted to free game to keep base RTP manageable.",
    "Sticky": "Position persists across spins. Creates 2ᴺ distinct game states — analytical calculation is possible only for fixed-spin features. Variable-spin sticky wilds require Monte Carlo simulation.",
    "Multiplier": "Multiplies payouts of winning lines it appears in. Random multiplier values increase variance significantly.",
    "Expanding + Multiplier": "Full reel expansion plus multiplier. High RTP impact — per-payline modeling required.",
    "Sticky + Multiplier": "Sticky position plus multiplier value. Simulation required due to state complexity.",
  };

  const handleExtracted = useCallback((data: ExtractedGameData) => {
    if (data.game_name) setGameName(data.game_name);
    if (data.target_market?.length) {
      const mapped = data.target_market.map(m => {
        const lower = m.toLowerCase();
        return TARGET_MARKETS.find(t => t.toLowerCase() === lower) || m;
      }).filter(Boolean);
      setTargetMarkets(mapped);
    }
    if (data.grid_size) {
      const parts = data.grid_size.replace("×", "x").split("x");
      if (parts.length === 2) {
        setGridColumns(parts[0].trim());
        setGridRows(parts[1].trim());
      }
    }
    if (data.pay_mechanic) {
      const pm = data.pay_mechanic.toLowerCase();
      if (pm.includes("megaway")) setGameType("Megaways");
      else if (pm.includes("line")) setGameType("Paylines");
      else if (pm.includes("way")) setGameType("Payways");
      else if (pm.includes("cluster")) setGameType("Cluster Pays");
      else if (pm.includes("grid")) setGameType("Grid");
    }
    if (data.volatility) {
      const vol = data.volatility.toLowerCase();
      const match = VOLATILITIES.find(v => v.toLowerCase() === vol);
      if (match) setVolatility(match);
    }
    if (data.rtp != null) setRtpTarget(String(data.rtp));
    if (data.features?.length) {
      const mappedFeatures = data.features.map(f => {
        const feat = createEmptyFeature();
        feat.name = f;
        const lower = f.toLowerCase();
        if (lower.includes("free spin")) feat.type = "Free Spins";
        else if (lower.includes("respin")) feat.type = "Respins";
        else if (lower.includes("hold")) feat.type = "Hold & Spin";
        else if (lower.includes("pick") || lower.includes("bonus")) feat.type = "Pick Bonus";
        else if (lower.includes("progress")) feat.type = "Progressive Jackpot";
        return feat;
      });
      setFeatures(mappedFeatures);
    }
  }, []);

  const addFeature = () => setFeatures([...features, createEmptyFeature()]);
  const removeFeature = (id: string) => { if (features.length > 1) setFeatures(features.filter(f => f.id !== id)); };
  const updateFeature = (id: string, field: string, value: string | number) => {
    setFeatures(features.map(f => f.id === id ? { ...f, [field]: value } as ExtendedFeature : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const rtpBreakdown: RtpBreakdown = {
      baseGameRtp: baseRtpNum,
      wildRtp: 0,
      respinRtp: holdSpinRtpNum,
      freeSpinsRtp: freeSpinsRtpNum,
      jackpotRtp: 0,
      otherFeatureRtp: otherFeatureRtpNum,
    };

    const winDistribution: WinDistribution = {
      sub1x: parseFloat(winSub1x) || 0,
      x1to5: parseFloat(win1to5) || 0,
      x5to20: parseFloat(win5to20) || 0,
      x20to100: parseFloat(win20to100) || 0,
      x100plus: parseFloat(win100plus) || 0,
    };

    const gameConcept: GameConcept = {
      gameName: gameName || "Untitled Game",
      targetMarkets,
      playerFocus,
      gridLayout: `${gridColumns}×${gridRows}`,
      gridRows: parseInt(gridRows) || 3,
      gridColumns: parseInt(gridColumns) || 5,
      gameType,
      waysOrLines: parseInt(waysOrLines) || 243,
      payStructure: gameType === "Paylines" ? "Lines" : gameType === "Payways" ? "Ways" : "Cluster",
      cascades: specialMechanics.includes("Cascades") ? "Yes" : "No",
      baseHitFrequency: HIT_FREQ_MAP[overallHitFreq] || HIT_FREQ_MAP[baseHitFreq] || "Medium",
      baseHitFrequencyDetail: baseHitFreq,
      featureTriggerFrequency: featureTriggerFreq,
      volatility,
      rtpTarget: rtpNum,
      topWin: topWinNum,
      volatilityStdDev: volatilityStdDev ? parseFloat(volatilityStdDev) : undefined,
      maxExposureCategory,
      rtpBreakdown,
      winDistribution,
      features: features.filter(f => f.type),
      baseGameStrength,
      averageBaseWin: parseFloat(averageBaseWin) || 0,
      deadSpinFrequency,
      targetBankroll,
      targetSessionLength: parseInt(targetSessionLength) || 15,
      specialMechanics,
      primaryGoal,
      targetAudience,
      sessionLength: parseInt(targetSessionLength) > 20 ? "Long" : parseInt(targetSessionLength) > 10 ? "Medium" : "Short",
      bonusImportance: featureDependency > 0.5 ? "Core" : featureDependency > 0.3 ? "Important" : "Decorative",
      earlyExcitement: overallHitFreq.includes("High") ? "High" : overallHitFreq.includes("Low") ? "Low" : "Moderate",
      reelType,
      irregularWindow: gameType === "Payways" ? irregularWindow : undefined,
      hasWild,
      wildType: hasWild ? (wildType as GameConcept["wildType"]) : undefined,
      expandingWildScope: (wildType === "Expanding" || wildType === "Expanding + Multiplier") ? (expandingWildScope as GameConcept["expandingWildScope"]) : undefined,
      stickyWildMode: (wildType === "Sticky" || wildType === "Sticky + Multiplier") ? (stickyWildMode as GameConcept["stickyWildMode"]) : undefined,
      multiplierWildValueType: wildType?.includes("Multiplier") ? (multiplierWildValueType as GameConcept["multiplierWildValueType"]) : undefined,
      hasScatter,
      scatterThreshold: hasScatter ? parseInt(scatterThreshold) || 3 : undefined,
      scatterMultiplePerReel: hasScatter ? scatterMultiplePerReel : undefined,
      hasRetrigger: hasScatter ? hasRetrigger : undefined,
      retriggerFrequency: hasRetrigger ? retriggerFrequency : undefined,
      freeSpinCount: hasScatter ? parseInt(freeSpinCount) || 10 : undefined,
      freeGameReels: hasScatter ? (freeGameReels as GameConcept["freeGameReels"]) : undefined,
      hasMultiplierSymbol,
      multiplierSymbolType: hasMultiplierSymbol ? (multiplierSymbolType as GameConcept["multiplierSymbolType"]) : undefined,
      bonusBuyAvailable,
      anteBetAvailable,
      winPacing: winPacing as GameConcept["winPacing"],
      requiresSimulation,
      gambleFeature: {
        enabled: gambleEnabled,
        triggerMode: gambleTriggerMode,
        styles: {
          color: gambleColorEnabled,
          suit: gambleSuitEnabled,
        },
        multiStep: {
          enabled: gambleMultiStepEnabled,
          maxRounds: gambleMaxRounds ? parseInt(gambleMaxRounds) : undefined,
          winCap: gambleWinCap ? parseInt(gambleWinCap) : undefined,
        },
      },
      populationRange,
      referenceGame,
    };

    const results = runSimulation(gameConcept);
    sessionStorage.setItem("launchindex_game", JSON.stringify(gameConcept));
    sessionStorage.setItem("launchindex_results", JSON.stringify(results));

    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSubmitting(false);
    navigate("/results");
  };

  return (
    <DashboardLayout
      title="New Concept Evaluation"
      subtitle="Complete the math profile. Required fields marked *."
    >
      <div className="mx-auto max-w-4xl mb-4 flex justify-end">
        <Link to="/evaluate/advanced" className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium transition-colors">
          Switch to Advanced Math Input →
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-4">
        {/* SECTION 1 — Upload */}
        <CollapsibleSection title="Upload Game Brief (Auto-Fill)" icon={<FileUp className="h-5 w-5" />} description="Upload a game design document to auto-fill the form below" defaultOpen={false}>
          <DocumentUpload onExtracted={handleExtracted} />
        </CollapsibleSection>

        {/* SECTION 2 — Game Identity */}
        <CollapsibleSection title="Game Identity" icon={<Info className="h-5 w-5" />}>
          <FormField label="Game Name *" required>
            <Input value={gameName} onChange={e => setGameName(e.target.value)}
              placeholder="e.g. Solar Wilds, Dragon Fortune" className="max-w-md" />
          </FormField>
          <FormField label={<span className="inline-flex items-center gap-1.5">Reference Game <Tip text="If your concept is inspired by an existing game, naming it improves the quality of market comparison and benchmark accuracy." /></span>}>
            <Input value={referenceGame} onChange={e => setReferenceGame(e.target.value)}
              placeholder="e.g. Book of Dead, Sweet Bonanza" className="max-w-md" />
            <p className="text-xs text-muted-foreground mt-1">Optional. Entering a reference game significantly improves market comparison accuracy.</p>
          </FormField>
          <FormField label="Target Markets">
            <MultiSelect options={TARGET_MARKETS} selected={targetMarkets} onChange={setTargetMarkets} />
          </FormField>
          <FormField label={<span className="inline-flex items-center gap-1.5">Intended Player Focus <Tip text="Drives archetype weighting in the behavioral simulation." /></span>}>
            <MultiSelect options={PLAYER_FOCUS} selected={playerFocus} onChange={setPlayerFocus} />
            <p className="text-xs text-muted-foreground mt-1">Select all that apply. Drives archetype weighting in the behavioral simulation.</p>
          </FormField>
        </CollapsibleSection>

        {/* SECTION 3 — Game Structure */}
        <CollapsibleSection
          title="Game Structure"
          icon={<Grid3X3 className="h-5 w-5" />}
          description="Defines the pay calculation model and determines whether analytical math or simulation is required."
        >
          <FormField label="Game Type *" required>
            <SelectButtons options={GAME_TYPES} value={gameType} onChange={setGameType} />
          </FormField>

          <FormField label={<span className="inline-flex items-center gap-1.5">Reel Type * <Tip text="Classic reels are mechanical 3-row strips; video reels allow custom layouts and animations." /></span>} required>
            <SelectButtons options={REEL_TYPES as unknown as string[]} value={reelType} onChange={(v) => setReelType(v as "Classic" | "Video")} />
          </FormField>

          <FormRow>
            <FormField label="Grid Columns">
              <Input type="number" min="1" max="12" value={gridColumns} onChange={e => setGridColumns(e.target.value)} className="max-w-24" />
            </FormField>
            <FormField label="Grid Rows">
              <Input type="number" min="1" max="12" value={gridRows} onChange={e => setGridRows(e.target.value)} className="max-w-24" />
            </FormField>
            <FormField label="Total Positions">
              <div className="flex h-10 items-center rounded-md border bg-secondary/50 px-3 text-sm font-medium">
                {gridColumns}×{gridRows} = {(parseInt(gridColumns) || 0) * (parseInt(gridRows) || 0)} positions
              </div>
            </FormField>
          </FormRow>

          {/* Dynamic Grid Preview */}
          <div className="mt-6 rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold">Grid Preview</h4>
              <button
                type="button"
                onClick={() => setShowGridPreview(v => !v)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showGridPreview ? "Hide" : "Show"}
              </button>
            </div>

            {showGridPreview && (
              <>
                <div className="overflow-auto">
                  <div className="inline-block">
                    <div className="flex gap-0.5 mb-0.5 ml-12">
                      {Array.from({ length: parseInt(gridColumns) || 0 }).map((_, colIdx) => (
                        <div
                          key={`col-header-${colIdx}`}
                          className="w-8 h-8 flex items-center justify-center text-xs font-bold text-muted-foreground"
                        >
                          C{colIdx + 1}
                        </div>
                      ))}
                    </div>

                    {Array.from({ length: parseInt(gridRows) || 0 }).map((_, rowIdx) => (
                      <div key={`row-${rowIdx}`} className="flex gap-0.5 mb-0.5 items-center">
                        <div className="w-10 h-8 flex items-center justify-center text-xs font-bold text-muted-foreground border-r pr-2">
                          R{rowIdx + 1}
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: parseInt(gridColumns) || 0 }).map((_, colIdx) => (
                            <div
                              key={`cell-${rowIdx}-${colIdx}`}
                              className="w-8 h-8 rounded-sm border-2 transition-colors"
                              style={{
                                borderColor: "hsl(var(--border))",
                                backgroundColor: "hsl(160,45%,35%,0.08)",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex flex-wrap gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground font-bold">R1, R2, R3...</div>
                    <span className="text-muted-foreground">= Rows (vertical)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground font-bold">C1, C2, C3...</div>
                    <span className="text-muted-foreground">= Columns (horizontal)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-sm border-2"
                      style={{
                        borderColor: "hsl(var(--border))",
                        backgroundColor: "hsl(160,45%,35%,0.08)",
                      }}
                    />
                    <span className="text-muted-foreground">= Symbol Position</span>
                  </div>
                </div>

                <div className="mt-3 p-2 rounded bg-secondary/30 text-xs text-muted-foreground">
                  {(parseInt(gridColumns) || 0) > 0 && (parseInt(gridRows) || 0) > 0 ? (
                    <>
                      Your grid is <span className="font-bold text-foreground">{gridColumns} columns × {gridRows} rows</span> = <span className="font-bold text-foreground">{(parseInt(gridColumns) || 0) * (parseInt(gridRows) || 0)}</span> total symbol positions
                    </>
                  ) : (
                    "Enter grid dimensions above to see preview"
                  )}
                </div>
              </>
            )}
          </div>


          {gameType === "Paylines" && (
            <FormField label={<span className="inline-flex items-center gap-1.5">Number of Paylines * <Tip text="Standard 5×3: 20–40 paylines. Max theoretical for 5×3: 243." /></span>} required>
              <Input type="number" min="1" value={waysOrLines} onChange={e => setWaysOrLines(e.target.value)} className="max-w-32" />
              <p className="text-xs text-muted-foreground mt-1">Standard 5×3: 20–40 paylines. Max theoretical for 5×3: 243.</p>
            </FormField>
          )}

          {gameType === "Payways" && (
            <>
              <FormField label={<span className="inline-flex items-center gap-1.5">Ways Constant * <Tip text="Total ways = product of symbols on each reel (e.g. 3×3×3×3×3 = 243)." /></span>} required>
                <Input type="number" min="1" value={waysOrLines} onChange={e => setWaysOrLines(e.target.value)} className="max-w-32" />
              </FormField>
              <FormField label={<span className="inline-flex items-center gap-1.5">Irregular Window Shape <Tip text="Some Payways games use different row counts per reel, e.g. 3-4-5-4-3." /></span>}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={irregularWindow} onCheckedChange={(c) => setIrregularWindow(!!c)} />
                  <span className="text-sm">Yes — different row counts per reel (e.g. 3-4-5-4-3)</span>
                </label>
              </FormField>
            </>
          )}

          {gameType === "Megaways" && (
            <>
              <FormField label={<span className="inline-flex items-center gap-1.5">Max Ways * <Tip text="The Megaways patent peaks at 117,649 ways (7^6). Some implementations cap lower." /></span>} required>
                <Input type="number" min="1" value={waysOrLines} onChange={e => setWaysOrLines(e.target.value)} className="max-w-40" />
              </FormField>
              <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-3 text-sm">
                <p className="text-foreground/90">
                  ⚠ Megaways with Cascades cannot be solved analytically. Excel modeling is only valid <em>without</em> the cascading feature enabled — use that as a sanity check, then enable simulation for final RTP.
                </p>
              </div>
            </>
          )}

          {(gameType === "Cluster Pays" || gameType === "Grid") && (
            <>
              <FormField label={<span className="inline-flex items-center gap-1.5">Minimum Symbols for Win * <Tip text={gameType === "Grid" ? "Grid: any positions count." : "Cluster: requires adjacent matching symbols."} /></span>} required>
                <Input type="number" min="3" max="20" value={waysOrLines} onChange={e => setWaysOrLines(e.target.value)} className="max-w-24" />
                <p className="text-xs text-muted-foreground mt-1">
                  {gameType === "Grid" ? "Grid: no adjacency required — any positions count." : "Cluster: adjacent symbols only."}
                </p>
              </FormField>
              {gameType === "Grid" && (
                <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-3 text-sm">
                  <p className="text-foreground/90">
                    ⚠ Grid slots with Cascades require simulation. Without cascades, analytical RTP (using event counting or BINOM.DIST per symbol) can be used as a baseline verification before enabling the cascade feature.
                  </p>
                </div>
              )}
            </>
          )}

          <FormField label={<span className="inline-flex items-center gap-1.5">Cascading Feature <Tip text="Tumble / cascade mechanics replace winning symbols. Combined with Megaways/Cluster/Grid, RTP requires simulation." /></span>}>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={specialMechanics.includes("Cascades")}
                onCheckedChange={(checked) => {
                  if (checked) setSpecialMechanics([...specialMechanics.filter(m => m !== "Cascades"), "Cascades"]);
                  else setSpecialMechanics(specialMechanics.filter(m => m !== "Cascades"));
                }}
              />
              <span className="text-sm">This game includes a cascading / tumble mechanic</span>
            </label>
            {specialMechanics.includes("Cascades") && ["Megaways", "Cluster Pays", "Grid"].includes(gameType) && (
              <div className="mt-2 rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-3 text-sm">
                <p className="text-foreground/90">
                  ⚠ Cascades + {gameType}: Analytical RTP calculation is insufficient. This configuration requires Monte Carlo simulation. RTP entered below will be used as design targets only.
                </p>
              </div>
            )}
          </FormField>
        </CollapsibleSection>

        {/* SECTION 4 — Symbol Configuration */}
        <CollapsibleSection
          title="Symbol Configuration"
          icon={<Layers className="h-5 w-5" />}
          description="Wild and scatter symbols are the primary levers for controlling RTP, hit frequency, and feature trigger rate."
        >
          {/* Wild Symbols */}
          <div className="rounded-lg border bg-secondary/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Wild Symbols</h4>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={hasWild} onCheckedChange={(c) => setHasWild(!!c)} />
                <span>Present in this game</span>
              </label>
            </div>
            {hasWild && (
              <div className="space-y-4">
                <FormField label={<span className="inline-flex items-center gap-1.5">Wild Type * <Tip text="Wild type drives whether RTP can be calculated analytically or requires simulation." /></span>} required>
                  <Select value={wildType} onValueChange={setWildType}>
                    <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select wild type" /></SelectTrigger>
                    <SelectContent>
                      {WILD_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {wildType && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{wildDescription[wildType]}</p>
                  )}
                </FormField>
                {(wildType === "Expanding" || wildType === "Expanding + Multiplier") && (
                  <FormField label={<span className="inline-flex items-center gap-1.5">Expanding Scope <Tip text="Restricting expansion to free games keeps base RTP within target range." /></span>}>
                    <Select value={expandingWildScope} onValueChange={setExpandingWildScope}>
                      <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select scope" /></SelectTrigger>
                      <SelectContent>
                        {EXPANDING_WILD_SCOPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
                {(wildType === "Sticky" || wildType === "Sticky + Multiplier") && (
                  <>
                    <FormField label={<span className="inline-flex items-center gap-1.5">Sticky Behaviour <Tip text="Determines how long a sticky wild persists." /></span>}>
                      <Select value={stickyWildMode} onValueChange={setStickyWildMode}>
                        <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select behaviour" /></SelectTrigger>
                        <SelectContent>
                          {STICKY_WILD_MODES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormField>
                    <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-3 text-sm">
                      <p className="text-foreground/90">
                        Sticky wilds with variable-length features require simulation. For fixed free game rounds (e.g. 10 spins), you can model analytically: calculate RTP for each of the 2ᴺ sticky positions per spin, weight by probability, sum across all spins.
                      </p>
                    </div>
                  </>
                )}
                {wildType?.includes("Multiplier") && (
                  <FormField label={<span className="inline-flex items-center gap-1.5">Multiplier Value Type <Tip text="Random multipliers significantly increase variance and require distribution modeling." /></span>}>
                    <Select value={multiplierWildValueType} onValueChange={setMultiplierWildValueType}>
                      <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                        <SelectItem value="Random">Random</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              </div>
            )}
          </div>

          {/* Scatter Symbols */}
          <div className="rounded-lg border bg-secondary/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Scatter Symbols</h4>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={hasScatter} onCheckedChange={(c) => setHasScatter(!!c)} />
                <span>Present in this game</span>
              </label>
            </div>
            {hasScatter && (
              <div className="space-y-4">
                <FormRow>
                  <FormField label={<span className="inline-flex items-center gap-1.5">Trigger Threshold * <Tip text="Number of scatters required to trigger the bonus." /></span>} required>
                    <Select value={scatterThreshold} onValueChange={setScatterThreshold}>
                      <SelectTrigger className="max-w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SCATTER_THRESHOLDS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label={<span className="inline-flex items-center gap-1.5">Free Spins Count <Tip text="Number of free spins awarded on trigger." /></span>}>
                    <Select value={freeSpinCount} onValueChange={setFreeSpinCount}>
                      <SelectTrigger className="max-w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FREE_SPIN_COUNTS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                </FormRow>
                <FormField label={<span className="inline-flex items-center gap-1.5">Multiple Scatters Per Reel <Tip text="If scatter can land more than once per reel, trigger probability uses BINOM.DIST." /></span>}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={scatterMultiplePerReel} onCheckedChange={(c) => setScatterMultiplePerReel(!!c)} />
                    <span className="text-sm">Scatter can land more than once on the same reel</span>
                  </label>
                </FormField>
                <FormField label={<span className="inline-flex items-center gap-1.5">Free Game Reels <Tip text="Different free game reels allow custom scatter / wild distributions during the bonus." /></span>}>
                  <Select value={freeGameReels} onValueChange={setFreeGameReels}>
                    <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {FREE_GAME_REELS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label={<span className="inline-flex items-center gap-1.5">Feature Retrigger <Tip text="Retrigger probability is added to expected feature spins via geometric series." /></span>}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={hasRetrigger} onCheckedChange={(c) => setHasRetrigger(!!c)} />
                    <span className="text-sm">Feature can retrigger during the free game</span>
                  </label>
                </FormField>
                {hasRetrigger && (
                  <FormField label="Retrigger Frequency">
                    <Select value={retriggerFrequency} onValueChange={setRetriggerFrequency}>
                      <SelectTrigger className="max-w-48"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                      <SelectContent>
                        {FEATURE_TRIGGER_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {retriggerRate >= 1 && (
                      <p className="text-xs text-destructive mt-1">⚠ Retrigger rate ≥ 1 — this would loop indefinitely. This is an invalid configuration.</p>
                    )}
                  </FormField>
                )}
              </div>
            )}
          </div>

          {/* Multiplier Symbols */}
          <div className="rounded-lg border bg-secondary/20 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Multiplier Symbols</h4>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox checked={hasMultiplierSymbol} onCheckedChange={(c) => setHasMultiplierSymbol(!!c)} />
                <span>Present in this game</span>
              </label>
            </div>
            {hasMultiplierSymbol && (
              <FormField label={<span className="inline-flex items-center gap-1.5">Multiplier Type <Tip text="Spin = applies once per spin. Win = applies to each win. Progressive = accumulates across cascades." /></span>}>
                <Select value={multiplierSymbolType} onValueChange={setMultiplierSymbolType}>
                  <SelectTrigger className="max-w-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {MULTIPLIER_SYMBOL_TYPES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
            )}
          </div>
        </CollapsibleSection>

        {/* SECTION 5 — RTP Distribution */}
        <CollapsibleSection
          title="RTP Distribution"
          icon={<PieChart className="h-5 w-5" />}
          description="Target RTP must be between 95–97% for most regulated markets. Feature dependency above 60% is a risk flag."
        >
          <FormField label="Total RTP (%) *" required>
            <Input type="number" step="0.01" min="85" max="99" value={rtpTarget} onChange={e => setRtpTarget(e.target.value)} className="max-w-32" />
            {!rtpInRange && rtpTarget && <p className="text-xs text-destructive mt-1">Must be between 85% and 99%</p>}
          </FormField>
          <FormRow>
            <FormField label="Base Game RTP (%)">
              <Input
                type="number" step="0.1" min="0" max="99"
                value={baseGameRtp}
                onChange={e => setBaseGameRtp(e.target.value)}
                className="max-w-32"
              />
            </FormField>
          </FormRow>

          <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Feature RTP Breakdown
              <span className="ml-2 font-normal normal-case">
                (these three must sum to: <span className="font-mono font-semibold text-foreground">{(rtpNum - baseRtpNum).toFixed(1)}%</span>)
              </span>
            </p>
            <FormRow columns={3}>
              <FormField
                label={
                  <span className="inline-flex items-center gap-1.5">
                    Free Spins RTP (%)
                    <Tip text="RTP delivered through free spins and free game features. Typically the largest feature component." />
                  </span>
                }
              >
                <Input
                  type="number" step="0.1" min="0"
                  value={freeSpinsRtp}
                  onChange={e => setFreeSpinsRtp(e.target.value)}
                  className="max-w-28"
                  placeholder="e.g. 55"
                />
              </FormField>
              <FormField
                label={
                  <span className="inline-flex items-center gap-1.5">
                    Hold & Spin RTP (%)
                    <Tip text="RTP from Hold & Spin, respins, and lock-and-spin mechanics." />
                  </span>
                }
              >
                <Input
                  type="number" step="0.1" min="0"
                  value={holdSpinRtp}
                  onChange={e => setHoldSpinRtp(e.target.value)}
                  className="max-w-28"
                  placeholder="e.g. 15"
                />
              </FormField>
              <FormField
                label={
                  <span className="inline-flex items-center gap-1.5">
                    Other Feature RTP (%)
                    <Tip text="RTP from all other features: bonus games, jackpots, multiplier wilds, pick games, and collection mechanics." />
                  </span>
                }
              >
                <Input
                  type="number" step="0.1" min="0"
                  value={otherFeatureRtp}
                  onChange={e => setOtherFeatureRtp(e.target.value)}
                  className="max-w-28"
                  placeholder="e.g. 8"
                />
              </FormField>
            </FormRow>
            {!rtpSumValid && baseGameRtp && (freeSpinsRtp || holdSpinRtp || otherFeatureRtp) && (
              <p className="text-xs text-destructive">
                Base RTP + Free Spins RTP + Hold & Spin RTP + Other must equal Total RTP ({rtpNum}%). Currently: {(baseRtpNum + featureRtpNum).toFixed(1)}%
              </p>
            )}
          </div>

          {/* Computed summary */}
          <div className="rounded-lg bg-secondary/50 p-4 text-sm mt-2">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-muted-foreground">Feature Dependency</span>
                <p className="text-lg font-semibold">{(featureDependency * 100).toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className={cn("text-lg font-semibold", riskFlagFeatureHeavy ? "text-destructive" : "text-[hsl(var(--badge-success-text))]")}>
                  {riskFlagFeatureHeavy ? "⚠ Feature Heavy" : "✓ Balanced"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">RTP Match</span>
                <p className={cn("text-lg font-semibold", rtpSumValid ? "text-[hsl(var(--badge-success-text))]" : "text-destructive")}>
                  {rtpSumValid ? "✓ Valid" : "✗ Mismatch"}
                </p>
              </div>
            </div>
          </div>

          {requiresSimulation && (
            <div className="rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-4">
              <h4 className="font-semibold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Simulation Required</h4>
              <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                This configuration requires Monte Carlo simulation for final RTP. The RTP values entered here are design targets. Behavioral simulation will proceed using these targets, but final validation must use Python or equivalent simulation.
              </p>
            </div>
          )}

          {featureTriggerFreq && (
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Free Game Math Preview</h4>
              <p className="text-xs text-muted-foreground">Formula: Expected feature spins per base spin = base_trigger / (1 − retrigger_rate)</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Base trigger rate</p>
                  <p className="font-semibold">{baseTriggerRate.toFixed(5)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Retrigger rate</p>
                  <p className="font-semibold">{hasRetrigger ? retriggerRate.toFixed(5) : "0"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expected feature times</p>
                  <p className={cn("font-semibold", retriggerRate >= 1 ? "text-destructive" : "text-primary")}>
                    {expectedFeatureTimes}
                  </p>
                </div>
              </div>
              {hasRetrigger && infiniteSeriesValid && (
                <p className="text-xs text-muted-foreground italic border-t pt-2">
                  Free Game RTP ≈ {freeSpinCount} spins × free_game_symbols_RTP × {expectedFeatureTimes} expected triggers
                </p>
              )}
            </div>
          )}
        </CollapsibleSection>

        {/* SECTION 6 — Hit Frequency & Pacing */}
        <CollapsibleSection title="Hit Frequency & Pacing" icon={<BarChart3 className="h-5 w-5" />}>
          <FormField label="Overall Hit Frequency *" required>
            <SelectButtons options={HIT_FREQUENCIES} value={overallHitFreq} onChange={setOverallHitFreq} />
          </FormField>
          <FormField label="Base Game Hit Frequency (optional)">
            <SelectButtons options={HIT_FREQUENCIES} value={baseHitFreq} onChange={setBaseHitFreq} />
          </FormField>
          <FormField label="Feature Trigger Frequency">
            <Select value={featureTriggerFreq} onValueChange={setFeatureTriggerFreq}>
              <SelectTrigger className="max-w-48">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FEATURE_TRIGGER_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label={<span className="inline-flex items-center gap-1.5">Win Pacing <Tip text="Front-loaded games reward early in sessions. Bonus-dependent games concentrate wins inside features." /></span>}>
            <SelectButtons options={WIN_PACING_OPTIONS} value={winPacing} onChange={setWinPacing} />
          </FormField>
          {HIT_FREQ_MAP[overallHitFreq] === "Low" && featureTriggerFreq === "1 in 200" && (
            <div className="rounded-lg border-l-4 border-destructive bg-destructive/10 p-3 text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-foreground/90">
                <span className="font-semibold">Critical early-session risk:</span> low base hit frequency combined with infrequent feature triggers creates extended dry periods. High churn probability across all archetypes.
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* SECTION 7 — Volatility Profile */}
        <CollapsibleSection title="Volatility Profile" icon={<TrendingUp className="h-5 w-5" />}>
          <FormField label="Volatility *" required>
            <SelectButtons options={VOLATILITIES} value={volatility} onChange={setVolatility} />
          </FormField>
          <FormField
            label={
              <span className="inline-flex items-center gap-1.5">
                Std Dev / Variance Score
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                <Tip text="Standard deviation per spin in units of bet, from your math tool or simulation output. When provided, this sharpens the behavioral decay model. Leave blank to use the volatility label above. Typical ranges: Low ~2–5, Medium ~5–9, High ~7–18, Very High ~15–40." />
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={volatilityStdDev}
                onChange={e => setVolatilityStdDev(e.target.value)}
                placeholder="e.g. 12.5"
                className="max-w-32"
              />
              {volatilityStdDev && parseFloat(volatilityStdDev) > 0 && (
                <span className="text-xs text-[hsl(var(--badge-success-text))] bg-[hsl(var(--badge-success-bg))] px-2 py-1 rounded-full font-medium">
                  ✓ Enhanced precision active
                </span>
              )}
            </div>
          </FormField>
          <FormRow>
            <FormField label="Top Win (× bet)">
              <Input type="number" min="10" max="100000" value={topWin} onChange={e => setTopWin(e.target.value)} className="max-w-32" />
            </FormField>
            <FormField label="Max Exposure Category">
              <div className="flex h-10 items-center rounded-md border bg-secondary/50 px-3 text-sm font-medium">
                {maxExposureCategory}
              </div>
            </FormField>
          </FormRow>
        </CollapsibleSection>

        {/* SECTION 8 — Win Distribution */}
        <CollapsibleSection title="Win Distribution" icon={<BarChart3 className="h-5 w-5" />} description="How wins are spread across multiplier ranges (must total 100%)">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <FormField label="Wins <1× (%)">
              <Input type="number" step="0.1" min="0" max="100" value={winSub1x} onChange={e => setWinSub1x(e.target.value)} className="max-w-24" />
            </FormField>
            <FormField label="Wins 1–5× (%)">
              <Input type="number" step="0.1" min="0" max="100" value={win1to5} onChange={e => setWin1to5(e.target.value)} className="max-w-24" />
            </FormField>
            <FormField label="Wins 5–20× (%)">
              <Input type="number" step="0.1" min="0" max="100" value={win5to20} onChange={e => setWin5to20(e.target.value)} className="max-w-24" />
            </FormField>
            <FormField label="Wins 20–100× (%)">
              <Input type="number" step="0.1" min="0" max="100" value={win20to100} onChange={e => setWin20to100(e.target.value)} className="max-w-24" />
            </FormField>
            <FormField label="Wins 100×+ (%)">
              <Input type="number" step="0.1" min="0" max="100" value={win100plus} onChange={e => setWin100plus(e.target.value)} className="max-w-24" />
            </FormField>
          </div>
          <div className={cn("rounded-lg p-3 text-sm font-medium", winTotalValid ? "bg-[hsl(var(--badge-success-bg))] text-[hsl(var(--badge-success-text))]" : "bg-destructive/10 text-destructive")}>
            Total: {winTotal.toFixed(1)}% {winTotalValid ? "✓" : `— must equal 100%`}
          </div>
        </CollapsibleSection>

        {/* SECTION 9 — Feature Structure */}
        <CollapsibleSection title="Feature Structure" icon={<Sparkles className="h-5 w-5" />} description="Define bonus features and their characteristics">
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={feature.id} className="relative rounded-lg border border-dashed border-border bg-secondary/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Feature {index + 1}</span>
                  {features.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(feature.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Feature Name">
                    <Input value={feature.name} onChange={e => updateFeature(feature.id, "name", e.target.value)} placeholder="e.g., Mega Free Spins" />
                  </FormField>
                  <FormField label="Feature Type">
                    <Select value={feature.type} onValueChange={v => updateFeature(feature.id, "type", v)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {FEATURE_TYPES_LIST.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Trigger Condition">
                    <Input value={feature.triggerCondition} onChange={e => updateFeature(feature.id, "triggerCondition", e.target.value)} placeholder="e.g., 3 Scatter symbols" />
                  </FormField>
                  <FormField label="Trigger Frequency">
                    <Select value={feature.triggerFrequency} onValueChange={v => updateFeature(feature.id, "triggerFrequency", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {FEATURE_TRIGGER_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Average Value (× bet)">
                    <Input type="number" step="0.1" min="0" value={feature.averageValue || ""} onChange={e => updateFeature(feature.id, "averageValue", e.target.value)} placeholder="e.g., 50" />
                  </FormField>
                  <FormField label="Max Value (× bet, optional)">
                    <Input type="number" step="0.1" min="0" value={feature.maxValue || ""} onChange={e => updateFeature(feature.id, "maxValue", e.target.value)} placeholder="e.g., 500" />
                  </FormField>
                  <FormField label="Feature Volatility">
                    <SelectButtons options={FEATURE_VOL} value={feature.featureVolatility} onChange={v => updateFeature(feature.id, "featureVolatility", v)} />
                  </FormField>
                  <FormField
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        RTP Contribution (%)
                        <Tip text="What share of the total game RTP does this feature deliver? Free spins typically contribute 40–65%. Leave 0 if unknown — this field is used for reference only and does not affect simulation." />
                      </span>
                    }
                  >
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={feature.rtpContribution ?? ""}
                      onChange={e => updateFeature(feature.id, "rtpContribution", parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 55"
                      className="max-w-28"
                    />
                  </FormField>
                </div>
                {feature.type === "Hold & Spin" && (
                  <div className="mt-3 rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-xs leading-relaxed">
                    Hold & Spin uses BINOM.DIST across each spin state. Divide events into groups by number of sticky symbols (0 to all positions). For each group: calculate the rate × expected value, then use MMULT to propagate across spins.
                  </div>
                )}
                {feature.type === "Cascading Mode" && (
                  <div className="mt-3 rounded-lg border-l-4 border-amber-500 bg-amber-500/10 p-3 text-xs leading-relaxed">
                    ⚠ Cascading mode requires simulation when combined with Megaways, Cluster, or Grid game types. Analytical RTP (without cascades) can be calculated as a baseline check in Excel.
                  </div>
                )}
                {feature.type === "Free Spins" && (
                  <div className="mt-3">
                    <FormField label={<span className="inline-flex items-center gap-1.5">Free Game Reels <Tip text="Different free game reels allow custom symbol distributions during the bonus." /></span>}>
                      <SelectButtons options={FREE_GAME_REELS} value={feature.triggerCondition} onChange={(v) => updateFeature(feature.id, "triggerCondition", v)} />
                    </FormField>
                  </div>
                )}
                {feature.type === "Pot / Perceived Persistent" && (
                  <div className="space-y-4 mt-4 p-4 rounded-lg border bg-secondary/10">
                    <FormField label="Collector (what's being collected)">
                      <Input
                        placeholder="e.g., Coins, Fish, Scarabs"
                        value={(feature as PersistentPotFeature).collector || ""}
                        onChange={(e) => {
                          const updated = [...features];
                          (updated[index] as PersistentPotFeature).collector = e.target.value;
                          setFeatures(updated);
                        }}
                      />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label="Collection Positions Needed">
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 15"
                          value={(feature as PersistentPotFeature).collectionPositionsNeeded || ""}
                          onChange={(e) => {
                            const updated = [...features];
                            (updated[index] as PersistentPotFeature).collectionPositionsNeeded = parseInt(e.target.value);
                            setFeatures(updated);
                          }}
                        />
                      </FormField>
                      <FormField label="Avg Symbols Per Spin">
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="e.g., 2.5"
                          value={(feature as PersistentPotFeature).averageSymbolsPerSpin || ""}
                          onChange={(e) => {
                            const updated = [...features];
                            (updated[index] as PersistentPotFeature).averageSymbolsPerSpin = parseFloat(e.target.value);
                            setFeatures(updated);
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {(feature as PersistentPotFeature).collectionPositionsNeeded && (feature as PersistentPotFeature).averageSymbolsPerSpin
                            ? `Estimated trigger: every ${Math.ceil((feature as PersistentPotFeature).collectionPositionsNeeded / (feature as PersistentPotFeature).averageSymbolsPerSpin)} spins`
                            : ""}
                        </p>
                      </FormField>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-semibold">Pots</h5>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updated = [...features];
                            const f = updated[index] as PersistentPotFeature;
                            if (!f.pots) f.pots = [];
                            f.pots.push({
                              name: `Pot ${f.pots.length + 1}`,
                              prizeType: "Instant Win",
                              averageValue: 10,
                            });
                            setFeatures(updated);
                          }}
                        >
                          + Add Pot
                        </Button>
                      </div>
                      {((feature as PersistentPotFeature).pots || []).map((pot, potIndex) => (
                        <div key={potIndex} className="p-3 rounded border bg-card space-y-3">
                          <div className="flex items-center justify-between">
                            <Input
                              placeholder="Pot name (e.g., Mini, Major)"
                              value={pot.name}
                              onChange={(e) => {
                                const updated = [...features];
                                (updated[index] as PersistentPotFeature).pots[potIndex].name = e.target.value;
                                setFeatures(updated);
                              }}
                              className="max-w-[200px]"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = [...features];
                                (updated[index] as PersistentPotFeature).pots.splice(potIndex, 1);
                                setFeatures(updated);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                          <FormField label="Prize Type">
                            <select
                              value={pot.prizeType}
                              onChange={(e) => {
                                const updated = [...features];
                                (updated[index] as PersistentPotFeature).pots[potIndex].prizeType = e.target.value;
                                setFeatures(updated);
                              }}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="Instant Win">Instant Win</option>
                              <option value="Free Spins">Free Spins</option>
                              <option value="Hold & Spin">Hold & Spin</option>
                              <option value="Respins">Respins</option>
                              <option value="Wild Transforms">Wild Transforms</option>
                              <option value="Multiplier Upgrade">Multiplier Upgrade</option>
                              <option value="Grid Shuffle">Grid Shuffle</option>
                              <option value="Symbol Upgrade">Symbol Upgrade</option>
                              <option value="Other">Other</option>
                            </select>
                          </FormField>
                          {(pot.prizeType === "Instant Win" || pot.prizeType === "Free Spins" || pot.prizeType === "Hold & Spin") && (
                            <FormField label="Average Value (× bet)">
                              <Input
                                type="number"
                                min="1"
                                value={pot.averageValue || ""}
                                onChange={(e) => {
                                  const updated = [...features];
                                  (updated[index] as PersistentPotFeature).pots[potIndex].averageValue = parseInt(e.target.value);
                                  setFeatures(updated);
                                }}
                              />
                            </FormField>
                          )}
                          {(pot.prizeType === "Free Spins" || pot.prizeType === "Hold & Spin" || pot.prizeType === "Respins") && (
                            <FormField label={pot.prizeType === "Respins" ? "Number of Respins" : "Number of Spins"}>
                              <Input
                                type="number"
                                min="1"
                                value={pot.numberOfSpins || ""}
                                onChange={(e) => {
                                  const updated = [...features];
                                  (updated[index] as PersistentPotFeature).pots[potIndex].numberOfSpins = parseInt(e.target.value);
                                  setFeatures(updated);
                                }}
                              />
                            </FormField>
                          )}
                          {pot.prizeType === "Wild Transforms" && (
                            <>
                              <FormField label="Number of Wilds Added">
                                <Input
                                  type="number"
                                  min="1"
                                  value={pot.numberOfWilds || ""}
                                  onChange={(e) => {
                                    const updated = [...features];
                                    (updated[index] as PersistentPotFeature).pots[potIndex].numberOfWilds = parseInt(e.target.value);
                                    setFeatures(updated);
                                  }}
                                />
                              </FormField>
                              <FormField label="Duration (spins)">
                                <Input
                                  type="number"
                                  min="1"
                                  value={pot.duration || ""}
                                  onChange={(e) => {
                                    const updated = [...features];
                                    (updated[index] as PersistentPotFeature).pots[potIndex].duration = parseInt(e.target.value);
                                    setFeatures(updated);
                                  }}
                                />
                              </FormField>
                            </>
                          )}
                          {pot.prizeType === "Multiplier Upgrade" && (
                            <>
                              <FormField label="Multiplier Value (e.g., 2, 5)">
                                <Input
                                  type="number"
                                  min="1"
                                  value={pot.multiplierValue || ""}
                                  onChange={(e) => {
                                    const updated = [...features];
                                    (updated[index] as PersistentPotFeature).pots[potIndex].multiplierValue = parseInt(e.target.value);
                                    setFeatures(updated);
                                  }}
                                />
                              </FormField>
                              <FormField label="Duration (spins)">
                                <Input
                                  type="number"
                                  min="1"
                                  value={pot.duration || ""}
                                  onChange={(e) => {
                                    const updated = [...features];
                                    (updated[index] as PersistentPotFeature).pots[potIndex].duration = parseInt(e.target.value);
                                    setFeatures(updated);
                                  }}
                                />
                              </FormField>
                            </>
                          )}
                          {pot.prizeType === "Grid Shuffle" && (
                            <FormField label="Re-evaluation Count">
                              <Input
                                type="number"
                                min="1"
                                value={pot.reEvaluationCount || ""}
                                onChange={(e) => {
                                  const updated = [...features];
                                  (updated[index] as PersistentPotFeature).pots[potIndex].reEvaluationCount = parseInt(e.target.value);
                                  setFeatures(updated);
                                }}
                              />
                            </FormField>
                          )}
                          {(pot.prizeType === "Symbol Upgrade" || pot.prizeType === "Other") && (
                            <>
                              <FormField label="Description">
                                <Input
                                  placeholder="Describe what this does"
                                  value={pot.description || ""}
                                  onChange={(e) => {
                                    const updated = [...features];
                                    (updated[index] as PersistentPotFeature).pots[potIndex].description = e.target.value;
                                    setFeatures(updated);
                                  }}
                                />
                              </FormField>
                              {pot.prizeType === "Symbol Upgrade" && (
                                <FormField label="Duration (spins)">
                                  <Input
                                    type="number"
                                    min="1"
                                    value={pot.duration || ""}
                                    onChange={(e) => {
                                      const updated = [...features];
                                      (updated[index] as PersistentPotFeature).pots[potIndex].duration = parseInt(e.target.value);
                                      setFeatures(updated);
                                    }}
                                  />
                                </FormField>
                              )}
                            </>
                          )}
                          {pot.prizeType === "Other" && (
                            <FormField label="Impact Category">
                              <select
                                value={pot.impactCategory || ""}
                                onChange={(e) => {
                                  const updated = [...features];
                                  (updated[index] as PersistentPotFeature).pots[potIndex].impactCategory = e.target.value;
                                  setFeatures(updated);
                                }}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                <option value="">Select category</option>
                                <option value="Cash Prize">Cash Prize</option>
                                <option value="Session Extension">Session Extension</option>
                                <option value="Modifier">Modifier</option>
                              </select>
                            </FormField>
                          )}
                          {pot.prizeType === "Other" && pot.impactCategory === "Cash Prize" && (
                            <FormField label="Average Value (× bet)">
                              <Input
                                type="number"
                                min="1"
                                value={pot.averageValue || ""}
                                onChange={(e) => {
                                  const updated = [...features];
                                  (updated[index] as PersistentPotFeature).pots[potIndex].averageValue = parseInt(e.target.value);
                                  setFeatures(updated);
                                }}
                              />
                            </FormField>
                          )}
                          {pot.prizeType === "Other" && pot.impactCategory === "Session Extension" && (
                            <FormField label="Session Extension (spins/respins)">
                              <Input
                                type="number"
                                min="1"
                                value={pot.numberOfSpins || ""}
                                onChange={(e) => {
                                  const updated = [...features];
                                  (updated[index] as PersistentPotFeature).pots[potIndex].numberOfSpins = parseInt(e.target.value);
                                  setFeatures(updated);
                                }}
                              />
                            </FormField>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {feature.type === "Progress Meter / True Persistent" && (
                  <div className="space-y-4 mt-4 p-4 rounded-lg border bg-secondary/10">
                    <FormField label="Collector (what's being collected)">
                      <Input
                        placeholder="e.g., Scarabs, Gems, Symbols"
                        value={(feature as TruePersistentFeature).collector || ""}
                        onChange={(e) => {
                          const updated = [...features];
                          (updated[index] as TruePersistentFeature).collector = e.target.value;
                          setFeatures(updated);
                        }}
                      />
                    </FormField>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField label={<span className="inline-flex items-center gap-1.5">Collection Positions Needed <Tip text="Total collected symbols required to fill the meter and trigger the persistent reward." /></span>}>

                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 48"
                          value={(feature as TruePersistentFeature).collectionPositionsNeeded || ""}
                          onChange={(e) => {
                            const updated = [...features];
                            (updated[index] as TruePersistentFeature).collectionPositionsNeeded = parseInt(e.target.value);
                            setFeatures(updated);
                          }}
                        />
                      </FormField>
                      <FormField label="Avg Symbols Per Spin">
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="e.g., 1.5"
                          value={(feature as TruePersistentFeature).averageSymbolsPerSpin || ""}
                          onChange={(e) => {
                            const updated = [...features];
                            (updated[index] as TruePersistentFeature).averageSymbolsPerSpin = parseFloat(e.target.value);
                            setFeatures(updated);
                          }}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {(feature as TruePersistentFeature).collectionPositionsNeeded && (feature as TruePersistentFeature).averageSymbolsPerSpin
                            ? `Estimated trigger: every ${Math.ceil((feature as TruePersistentFeature).collectionPositionsNeeded / (feature as TruePersistentFeature).averageSymbolsPerSpin)} spins`
                            : ""}
                        </p>
                      </FormField>
                    </div>
                    <FormField label={<span className="inline-flex items-center gap-1.5">Progression Style <Tip text="Single Threshold = one final reward when the meter fills. Multi-Threshold = multiple milestones along the way, each granting an upgrade." /></span>}>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={(feature as TruePersistentFeature).progressionStyle === "Single Threshold"}
                            onChange={() => {
                              const updated = [...features];
                              (updated[index] as TruePersistentFeature).progressionStyle = "Single Threshold";
                              setFeatures(updated);
                            }}
                          />
                          <span className="text-sm">Single Threshold</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={(feature as TruePersistentFeature).progressionStyle === "Multi-Threshold"}
                            onChange={() => {
                              const updated = [...features];
                              (updated[index] as TruePersistentFeature).progressionStyle = "Multi-Threshold";
                              setFeatures(updated);
                            }}
                          />
                          <span className="text-sm">Multi-Threshold</span>
                        </label>
                      </div>
                    </FormField>
                    {(feature as TruePersistentFeature).progressionStyle === "Multi-Threshold" && (
                      <>
                        <FormField label="Entry Mode">
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={(feature as TruePersistentFeature).entryMode === "Quick Setup"}
                                onChange={() => {
                                  const updated = [...features];
                                  (updated[index] as TruePersistentFeature).entryMode = "Quick Setup";
                                  setFeatures(updated);
                                }}
                              />
                              <span className="text-sm">Quick Setup (formula-based)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={(feature as TruePersistentFeature).entryMode === "Manual Milestones"}
                                onChange={() => {
                                  const updated = [...features];
                                  (updated[index] as TruePersistentFeature).entryMode = "Manual Milestones";
                                  setFeatures(updated);
                                }}
                              />
                              <span className="text-sm">Manual Milestones (define each)</span>
                            </label>
                          </div>
                        </FormField>
                        {(feature as TruePersistentFeature).entryMode === "Quick Setup" && (
                          <div className="space-y-3 p-3 rounded border">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FormField label="Total Sections">
                                <Input
                                  type="number"
                                  min="1"
                                  value={(feature as TruePersistentFeature).totalSections || ""}
                                  onChange={(e) => {
                                    const updated = [...features];
                                    (updated[index] as TruePersistentFeature).totalSections = parseInt(e.target.value);
                                    setFeatures(updated);
                                  }}
                                />
                              </FormField>
                              <FormField label="Escalation Type">
                                <select
                                  value={(feature as TruePersistentFeature).escalationType || "Linear"}
                                  onChange={(e) => {
                                    const updated = [...features];
                                    (updated[index] as TruePersistentFeature).escalationType = e.target.value as "Linear" | "Exponential";
                                    setFeatures(updated);
                                  }}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                  <option value="Linear">Linear</option>
                                  <option value="Exponential">Exponential</option>
                                </select>
                              </FormField>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <FormField label="Starting Prize (× multiplier)">
                                <Input
                                  type="number"
                                  min="1"
                                  value={(feature as TruePersistentFeature).startingPrize || ""}
                                  onChange={(e) => {
                                    const updated = [...features];
                                    (updated[index] as TruePersistentFeature).startingPrize = parseInt(e.target.value);
                                    setFeatures(updated);
                                  }}
                                />
                              </FormField>
                              <FormField label="Final Prize (× multiplier)">
                                <Input
                                  type="number"
                                  min="1"
                                  value={(feature as TruePersistentFeature).finalPrize || ""}
                                  onChange={(e) => {
                                    const updated = [...features];
                                    (updated[index] as TruePersistentFeature).finalPrize = parseInt(e.target.value);
                                    setFeatures(updated);
                                  }}
                                />
                              </FormField>
                            </div>
                            <FormField label="Final Trigger Award">
                              <select
                                value={(feature as TruePersistentFeature).finalTriggerAward || ""}
                                onChange={(e) => {
                                  const updated = [...features];
                                  (updated[index] as TruePersistentFeature).finalTriggerAward = e.target.value;
                                  setFeatures(updated);
                                }}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                <option value="">Select award type</option>
                                <option value="Free Spins">Free Spins</option>
                                <option value="Mega Free Spins">Mega Free Spins</option>
                                <option value="Respins">Respins</option>
                                <option value="Hold & Spin">Hold & Spin</option>
                              </select>
                            </FormField>
                            {(feature as TruePersistentFeature).finalTriggerAward && (
                              <FormField label="Number of Spins">
                                <Input
                                  type="number"
                                  min="1"
                                  value={(feature as TruePersistentFeature).finalTriggerSpins || ""}
                                  onChange={(e) => {
                                    const updated = [...features];
                                    (updated[index] as TruePersistentFeature).finalTriggerSpins = parseInt(e.target.value);
                                    setFeatures(updated);
                                  }}
                                />
                              </FormField>
                            )}
                          </div>
                        )}
                        {(feature as TruePersistentFeature).entryMode === "Manual Milestones" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-semibold">Milestones</h5>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updated = [...features];
                                  const f = updated[index] as TruePersistentFeature;
                                  if (!f.thresholds) f.thresholds = [];
                                  f.thresholds.push({
                                    symbolsRequired: 12,
                                    awardType: "Multiplier Upgrade",
                                    multiplierValue: 2,
                                  });
                                  setFeatures(updated);
                                }}
                              >
                                + Add Milestone
                              </Button>
                            </div>
                            {((feature as TruePersistentFeature).thresholds || []).map((threshold, thresholdIndex) => (
                              <div key={thresholdIndex} className="p-3 rounded border bg-card space-y-3">
                                <div className="flex items-center justify-between">
                                  <FormField label="Symbols Required">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={threshold.symbolsRequired}
                                      onChange={(e) => {
                                        const updated = [...features];
                                        (updated[index] as TruePersistentFeature).thresholds![thresholdIndex].symbolsRequired = parseInt(e.target.value);
                                        setFeatures(updated);
                                      }}
                                      className="max-w-[120px]"
                                    />
                                  </FormField>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updated = [...features];
                                      (updated[index] as TruePersistentFeature).thresholds!.splice(thresholdIndex, 1);
                                      setFeatures(updated);
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                                <FormField label="Award Type">
                                  <select
                                    value={threshold.awardType}
                                    onChange={(e) => {
                                      const updated = [...features];
                                      (updated[index] as TruePersistentFeature).thresholds![thresholdIndex].awardType = e.target.value;
                                      setFeatures(updated);
                                    }}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  >
                                    <option value="Multiplier Upgrade">Multiplier Upgrade</option>
                                    <option value="Free Spins">Free Spins</option>
                                    <option value="Respins">Respins</option>
                                    <option value="Wild Transforms">Wild Transforms</option>
                                    <option value="Grid Shuffle">Grid Shuffle</option>
                                    <option value="Symbol Upgrade">Symbol Upgrade</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </FormField>
                                {threshold.awardType === "Multiplier Upgrade" && (
                                  <FormField label="Multiplier Value">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={threshold.multiplierValue || ""}
                                      onChange={(e) => {
                                        const updated = [...features];
                                        (updated[index] as TruePersistentFeature).thresholds![thresholdIndex].multiplierValue = parseInt(e.target.value);
                                        setFeatures(updated);
                                      }}
                                    />
                                  </FormField>
                                )}
                                {(threshold.awardType === "Free Spins" || threshold.awardType === "Respins") && (
                                  <>
                                    <FormField label="Award Value (× bet)">
                                      <Input
                                        type="number"
                                        min="1"
                                        value={threshold.awardValue || ""}
                                        onChange={(e) => {
                                          const updated = [...features];
                                          (updated[index] as TruePersistentFeature).thresholds![thresholdIndex].awardValue = parseInt(e.target.value);
                                          setFeatures(updated);
                                        }}
                                      />
                                    </FormField>
                                    <FormField label="Number of Spins">
                                      <Input
                                        type="number"
                                        min="1"
                                        value={threshold.numberOfSpins || ""}
                                        onChange={(e) => {
                                          const updated = [...features];
                                          (updated[index] as TruePersistentFeature).thresholds![thresholdIndex].numberOfSpins = parseInt(e.target.value);
                                          setFeatures(updated);
                                        }}
                                      />
                                    </FormField>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {(feature as TruePersistentFeature).progressionStyle === "Single Threshold" && (
                      <div className="space-y-3 p-3 rounded border">
                        <FormField label="Award Type">
                          <select
                            value={((feature as TruePersistentFeature).thresholds?.[0]?.awardType) || ""}
                            onChange={(e) => {
                              const updated = [...features];
                              const f = updated[index] as TruePersistentFeature;
                              if (!f.thresholds) {
                                f.thresholds = [{ symbolsRequired: 0, awardType: e.target.value }];
                              } else {
                                f.thresholds[0].awardType = e.target.value;
                              }
                              setFeatures(updated);
                            }}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Select type</option>
                            <option value="Free Spins">Free Spins</option>
                            <option value="Respins">Respins</option>
                            <option value="Wild Transforms">Wild Transforms</option>
                            <option value="Multiplier Upgrade">Multiplier Upgrade</option>
                            <option value="Other">Other</option>
                          </select>
                        </FormField>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addFeature} className="w-full border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Add Another Feature
            </Button>
          </div>
        </CollapsibleSection>

        {/* SECTION 10 — Base Game Dynamics */}
        <CollapsibleSection title="Base Game Dynamics" icon={<Zap className="h-5 w-5" />}>
          <FormField label="Base Game Strength *" required>
            <SelectButtons options={BASE_GAME_STRENGTHS} value={baseGameStrength} onChange={setBaseGameStrength} />
          </FormField>
          <FormRow>
            <FormField label="Average Base Win (× bet, optional)">
              <Input type="number" step="0.1" min="0" value={averageBaseWin} onChange={e => setAverageBaseWin(e.target.value)} placeholder="e.g., 1.5" className="max-w-32" />
            </FormField>
            <FormField label="Dead Spin Frequency">
              <SelectButtons options={DEAD_SPIN_FREQ} value={deadSpinFrequency} onChange={setDeadSpinFrequency} />
            </FormField>
          </FormRow>
          <FormField label={<span className="inline-flex items-center gap-1.5">Bonus Buy Available <Tip text="Bonus Buy lets players pay directly to enter the feature. Affects RTP calculation and player segmentation." /></span>}>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={bonusBuyAvailable} onCheckedChange={(c) => setBonusBuyAvailable(!!c)} />
              <span className="text-sm">This game includes a Bonus Buy feature</span>
            </label>
          </FormField>
          <FormField label={<span className="inline-flex items-center gap-1.5">Ante Bet Available <Tip text="Ante Bet is an optional surcharge that doubles trigger probability." /></span>}>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={anteBetAvailable} onCheckedChange={(c) => setAnteBetAvailable(!!c)} />
              <span className="text-sm">This game includes an Ante Bet option</span>
            </label>
          </FormField>
        </CollapsibleSection>

        {/* SECTION 11 — Bankroll & Session */}
        <CollapsibleSection title="Bankroll & Session" icon={<Wallet className="h-5 w-5" />}>
          <FormField label="Target Player Bankroll">
            <SelectButtons options={BANKROLL_TARGETS} value={targetBankroll} onChange={setTargetBankroll} />
          </FormField>
          <FormField label="Target Session Length (minutes)">
            <Input type="number" min="1" max="120" value={targetSessionLength} onChange={e => setTargetSessionLength(e.target.value)} className="max-w-32" />
          </FormField>
        </CollapsibleSection>

        {/* SECTION 12 — Special Mechanics */}
        <CollapsibleSection title="Special Mechanics" icon={<Sparkles className="h-5 w-5" />}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SPECIAL_MECHANICS.map(mech => (
              <label key={mech} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
                <Checkbox
                  checked={specialMechanics.includes(mech)}
                  onCheckedChange={(checked) => {
                    if (checked) setSpecialMechanics([...specialMechanics, mech]);
                    else setSpecialMechanics(specialMechanics.filter(m => m !== mech));
                  }}
                />
                <span className="text-sm font-medium">{mech}</span>
              </label>
            ))}
          </div>

          {/* Gamble Feature */}
          <div className="mt-6 rounded-lg border bg-secondary/10 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Gamble Feature
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Allows players to risk wins for a chance to multiply them
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={gambleEnabled}
                  onCheckedChange={(c) => setGambleEnabled(!!c)}
                />
                <span className="text-sm font-medium">Enable</span>
              </label>
            </div>

            {gambleEnabled && (
              <div className="space-y-4 pt-3 border-t">
                <FormField label="Trigger Mode">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(["Per-Win", "Feature-End", "Both"] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setGambleTriggerMode(mode)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm transition-colors text-left",
                          gambleTriggerMode === mode
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border bg-card text-foreground hover:bg-secondary/50"
                        )}
                      >
                        <div className="font-medium">{mode}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {mode === "Per-Win" && "After every base game win"}
                          {mode === "Feature-End" && "After feature completion"}
                          {mode === "Both" && "Per-win AND feature-end"}
                        </div>
                      </button>
                    ))}
                  </div>
                </FormField>

                <FormField label="Available Gamble Styles">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-start gap-3 rounded-lg border bg-card p-3 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <Checkbox
                        checked={gambleColorEnabled}
                        onCheckedChange={(c) => setGambleColorEnabled(!!c)}
                      />
                      <div>
                        <div className="text-sm font-semibold">Color (Red/Black)</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          50/50 odds · 2× multiplier · Lower risk
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border bg-card p-3 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <Checkbox
                        checked={gambleSuitEnabled}
                        onCheckedChange={(c) => setGambleSuitEnabled(!!c)}
                      />
                      <div>
                        <div className="text-sm font-semibold">Suit (♠♥♦♣)</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          25% odds · 4× multiplier · Higher risk
                        </div>
                      </div>
                    </label>
                  </div>
                  {!gambleColorEnabled && !gambleSuitEnabled && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      ⚠ At least one gamble style should be enabled
                    </p>
                  )}
                </FormField>

                <FormField
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      Multi-Step Gamble
                      <Tip text="Allow players to gamble winnings consecutively up to N rounds" />
                    </span>
                  }
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={gambleMultiStepEnabled}
                      onCheckedChange={(c) => setGambleMultiStepEnabled(!!c)}
                    />
                    <span className="text-sm">Allow consecutive gambles</span>
                  </label>

                  {gambleMultiStepEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pl-6">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          Max Rounds (leave empty for unlimited)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 5"
                          value={gambleMaxRounds}
                          onChange={(e) => setGambleMaxRounds(e.target.value)}
                          className="max-w-32"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          Win Cap × bet (leave empty for no cap)
                        </label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 2500"
                          value={gambleWinCap}
                          onChange={(e) => setGambleWinCap(e.target.value)}
                          className="max-w-32"
                        />
                      </div>
                    </div>
                  )}
                </FormField>

                <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-sm">
                  <p className="font-semibold text-foreground mb-1">📊 Behavioral Impact Preview</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Volatility-Seeking players: +1.5 fit score</li>
                    <li>• Bonus-Seeking players: +0.5 fit score</li>
                    <li>• Casual players: −1.0 fit score</li>
                    <li>• Budget-Constrained players: −2.0 fit score</li>
                    <li>• Session variance: +15%</li>
                    <li>• D7 retention: −3 percentage points</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* SECTION 13 — Design Intent */}
        <CollapsibleSection title="Design Intent" icon={<Target className="h-5 w-5" />}>
          <FormField label="Primary Goal">
            <SelectButtons options={PRIMARY_GOALS} value={primaryGoal} onChange={setPrimaryGoal} />
          </FormField>
          <FormField label="Target Audience">
            <SelectButtons options={TARGET_AUDIENCES} value={targetAudience} onChange={setTargetAudience} />
          </FormField>
        </CollapsibleSection>

        {/* SECTION 14 — Player Archetype Configuration */}
        <PlayerArchetypeConfig />

        {/* Expected Player Volume */}
        <CollapsibleSection
          title="Expected Player Volume"
          icon={<Users className="h-5 w-5" />}
          description="Select the player volume for population-level simulations. This scales session counts and retention estimates."
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 auto-rows-fr">
            {([
              { value: "100-1000",          label: "100 – 1K",      sub: "Small / Regional" },
              { value: "1000-5000",         label: "1K – 5K",       sub: "Niche title" },
              { value: "5000-10000",        label: "5K – 10K",      sub: "Limited release" },
              { value: "10000-50000",       label: "10K – 50K",     sub: "Standard launch" },
              { value: "50000-200000",      label: "50K – 200K",    sub: "Strong release" },
              { value: "200000-500000",     label: "200K – 500K",   sub: "Major title" },
              { value: "500000-1000000",    label: "500K – 1M",     sub: "Top performer" },
              { value: "1000000+",          label: "1M+",           sub: "Global hit" },
            ] as Array<{ value: PopulationRange; label: string; sub: string }>).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPopulationRange(opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left transition-colors flex flex-col justify-between min-h-[68px]",
                  populationRange === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:bg-secondary/50"
                )}
              >
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.sub}</p>
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* SECTION 15 — Math Complexity Summary */}
        <CollapsibleSection
          title="Math Complexity Summary"
          icon={<Cpu className="h-5 w-5" />}
          description="Auto-generated from your inputs. Used to calibrate simulation depth."
          defaultOpen={true}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Modeling Approach</p>
              <p className={cn("text-lg font-bold mt-1", requiresSimulation ? "text-amber-600 dark:text-amber-400" : "text-[hsl(var(--badge-success-text))]")}>
                {requiresSimulation ? "⚠ Monte Carlo Simulation Required" : "✓ Analytical (Excel)"}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {requiresSimulation
                  ? `Cascades + ${gameType}${(wildType === "Sticky" || wildType === "Sticky + Multiplier") ? " + Sticky Wilds" : ""} — final RTP requires Python/simulation.`
                  : "This configuration can be fully modelled analytically. Free game RTP = symbols_RTP × (trigger / (1 − retrigger))."}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Feature Dependency Index</p>
              <p className={cn("text-lg font-bold mt-1", featureDependency > 0.6 ? "text-destructive" : featureDependency > 0.4 ? "text-amber-600 dark:text-amber-400" : "text-[hsl(var(--badge-success-text))]")}>
                {(featureDependency * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {featureDependency > 0.6 ? "High — majority of RTP in features. Strong Bonus-Seeking pull, elevated early-session fragility."
                : featureDependency > 0.4 ? "Medium — balanced. Broad archetype appeal."
                : "Low — base game drives most returns. Casual-friendly profile."}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Wild Complexity</p>
              <p className="text-lg font-bold mt-1">
                {!hasWild ? "No Wilds"
                : !wildType ? "Type not selected"
                : wildType === "Expanding" ? "Per-payline calculation"
                : wildType === "Sticky" || wildType === "Sticky + Multiplier" ? "Simulation required (2ᴺ states)"
                : wildType === "Expanding + Multiplier" ? "Per-payline + multiplier dist."
                : "Standard (additive)"}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {wildType === "Standard" ? "events = symbol_count + wild_count per reel."
                : wildType === "Expanding" || wildType === "Expanding + Multiplier" ? "Deduct covered symbols per payline separately. Usually restricted to free game."
                : wildType?.includes("Sticky") ? "Calculate RTP per spin state, weight by state probability, sum across feature rounds."
                : ""}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected Feature Spins / Base Spin</p>
              <p className={cn("text-lg font-bold mt-1", retriggerRate >= 1 ? "text-destructive" : "text-primary")}>
                {expectedFeatureTimes}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                base_trigger ÷ (1 − retrigger_rate). Multiply by free_game_symbols_RTP to get feature RTP contribution.
                {retriggerRate >= 1 && " ⚠ Invalid — retrigger rate must be < 1."}
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Derived Logic Summary */}
        {(overallHitFreq || volatility || rtpTarget) && (
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Derived Metrics Preview</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
              <div>
                <span className="text-muted-foreground">Feature Dependency</span>
                <p className={cn("text-base font-bold", riskFlagFeatureHeavy ? "text-destructive" : "text-foreground")}>
                  {(featureDependency * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Volatility Score</span>
                <p className="text-base font-bold">
                  {{ Low: "0.3", Medium: "0.5", High: "0.8", "Very High": "1.0" }[volatility] || "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Hit Freq Score</span>
                <p className="text-base font-bold">
                  {{ "Low (<20%)": "0.3", "Medium (20–35%)": "0.5", "High (>35%)": "0.7" }[overallHitFreq] || "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Early Session Risk</span>
                <p className={cn("text-base font-bold",
                  (HIT_FREQ_MAP[overallHitFreq] === "Low" && featureTriggerFreq === "1 in 200") ? "text-destructive" : "text-foreground"
                )}>
                  {(HIT_FREQ_MAP[overallHitFreq] === "Low" && featureTriggerFreq === "1 in 200") ? "HIGH" :
                   (HIT_FREQ_MAP[overallHitFreq] === "Low" || featureTriggerFreq === "1 in 200") ? "ELEVATED" : "NORMAL"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col items-end gap-2 border-t pt-6">
          {!isFormValid && validationMessage && (
            <p className="text-xs text-[hsl(var(--badge-warning-text))]">
              ⚠ {validationMessage}
            </p>
          )}
          <Button type="submit" size="lg" disabled={isSubmitting || !isFormValid} className="min-w-48">
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Running Simulation...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Behavioral Simulation
              </>
            )}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
