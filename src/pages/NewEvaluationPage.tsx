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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FormField, FormRow } from "@/components/FormSection";
import { MultiSelect, SelectButtons } from "@/components/MultiSelect";
import { GameConcept, Feature, RtpBreakdown, WinDistribution, runSimulation } from "@/lib/simulation";
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
        <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <span className="text-primary">{icon}</span>
            <span className="form-section-title !mb-0">{title}</span>
          </div>
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        {description && <p className="form-section-description mt-1">{description}</p>}
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
  const [waysOrLines, setWaysOrLines] = useState("243");

  // Structure (new)
  const [reelType, setReelType] = useState<"Classic" | "Video">("Video");
  const [paylineCount, setPaylineCount] = useState("20");
  const [waysConstant, setWaysConstant] = useState("243");
  const [irregularWindow, setIrregularWindow] = useState(false);
  const [megawaysMaxWays, setMegawaysMaxWays] = useState("117649");
  const [minClusterSize, setMinClusterSize] = useState("5");

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
  const [featureRtpField, setFeatureRtpField] = useState("51.5");
  const [freeSpinsRtp, setFreeSpinsRtp] = useState("25");
  const [bonusRtp, setBonusRtp] = useState("10");
  const [jackpotRtp, setJackpotRtp] = useState("8");
  const [holdSpinRtp, setHoldSpinRtp] = useState("0");
  const [respinsRtp, setRespinsRtp] = useState("0");
  const [wildContributionRtp, setWildContributionRtp] = useState("0");
  const [showAdvancedRtp, setShowAdvancedRtp] = useState(false);

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

  // Win Distribution
  const [winSub1x, setWinSub1x] = useState("50");
  const [win1to5, setWin1to5] = useState("30");
  const [win5to20, setWin5to20] = useState("12");
  const [win20to100, setWin20to100] = useState("6");
  const [win100plus, setWin100plus] = useState("2");

  // Features
  const [features, setFeatures] = useState<Feature[]>([createEmptyFeature()]);

  // Base Game Strength
  const [baseGameStrength, setBaseGameStrength] = useState("");
  const [averageBaseWin, setAverageBaseWin] = useState("");
  const [deadSpinFrequency, setDeadSpinFrequency] = useState("");

  // Bankroll
  const [targetBankroll, setTargetBankroll] = useState("");
  const [targetSessionLength, setTargetSessionLength] = useState("15");

  // Special Mechanics
  const [specialMechanics, setSpecialMechanics] = useState<string[]>([]);

  // Design Intent
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Computed values
  const rtpNum = parseFloat(rtpTarget) || 0;
  const baseRtpNum = parseFloat(baseGameRtp) || 0;
  const featureRtpNum = parseFloat(featureRtpField) || 0;
  const rtpSumValid = Math.abs(baseRtpNum + featureRtpNum - rtpNum) < 0.1;
  const rtpInRange = rtpNum >= 85 && rtpNum <= 99;

  const advFreeSpins = parseFloat(freeSpinsRtp) || 0;
  const advBonus = parseFloat(bonusRtp) || 0;
  const advJackpot = parseFloat(jackpotRtp) || 0;
  const advHoldSpin = parseFloat(holdSpinRtp) || 0;
  const advRespins = parseFloat(respinsRtp) || 0;
  const advWild = parseFloat(wildContributionRtp) || 0;
  const advSum = advFreeSpins + advBonus + advJackpot + advHoldSpin + advRespins + advWild;
  const advSumValid = Math.abs(advSum - featureRtpNum) < 0.1;

  const winTotal = (parseFloat(winSub1x) || 0) + (parseFloat(win1to5) || 0) + (parseFloat(win5to20) || 0) + (parseFloat(win20to100) || 0) + (parseFloat(win100plus) || 0);
  const winTotalValid = Math.abs(winTotal - 100) < 0.5;

  const topWinNum = parseFloat(topWin) || 0;
  const maxExposureCategory = topWinNum < 500 ? "<500×" : topWinNum <= 2000 ? "500–2000×" : "2000×+";

  const featureDependency = rtpNum > 0 ? featureRtpNum / rtpNum : 0;
  const riskFlagFeatureHeavy = featureDependency > 0.6;

  const waysLinesLabel = gameType === "Paylines" ? "Number of Paylines"
    : gameType === "Payways" ? "Ways Constant"
    : gameType === "Megaways" ? "Max Ways"
    : "—";

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
  const updateFeature = (id: string, field: keyof Feature, value: string | number) => {
    setFeatures(features.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const rtpBreakdown: RtpBreakdown = {
      baseGameRtp: baseRtpNum,
      wildRtp: parseFloat(wildContributionRtp) || 0,
      respinRtp: parseFloat(respinsRtp) || 0,
      freeSpinsRtp: advFreeSpins,
      jackpotRtp: advJackpot,
      otherFeatureRtp: (parseFloat(bonusRtp) || 0) + (parseFloat(holdSpinRtp) || 0),
    };
    // legacy placeholder removed below
    const _unusedOriginalRtp = {
      wildRtp: parseFloat(wildContributionRtp) || 0,
      respinRtp: parseFloat(respinsRtp) || 0,
      freeSpinsRtp: advFreeSpins,
      jackpotRtp: advJackpot,
      otherFeatureRtp: advBonus,
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
      paylineCount: gameType === "Paylines" ? parseInt(paylineCount) || 20 : undefined,
      waysConstant: gameType === "Payways" ? parseInt(waysConstant) || 243 : undefined,
      irregularWindow: gameType === "Payways" ? irregularWindow : undefined,
      megawaysMaxWays: gameType === "Megaways" ? parseInt(megawaysMaxWays) || 117649 : undefined,
      minClusterSize: ["Cluster Pays", "Grid"].includes(gameType) ? parseInt(minClusterSize) || 5 : undefined,
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
      respinsRtp: parseFloat(respinsRtp) || 0,
      wildContributionRtp: parseFloat(wildContributionRtp) || 0,
      bonusBuyAvailable,
      anteBetAvailable,
      winPacing: winPacing as GameConcept["winPacing"],
      requiresSimulation,
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
          <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-sm">
            <p className="text-foreground/90">
              <span className="font-medium">Lines & Ways</span> can be fully modelled analytically in Excel.{" "}
              <span className="font-medium">Megaways, Cluster Pays, and Grid</span> require Monte Carlo simulation when cascades are enabled — analytical RTP can only be used as a no-cascade baseline.
            </p>
          </div>

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

          {gameType === "Paylines" && (
            <FormField label={<span className="inline-flex items-center gap-1.5">Number of Paylines * <Tip text="Standard 5×3: 20–40 paylines. Max theoretical for 5×3: 243." /></span>} required>
              <Input type="number" min="1" value={paylineCount} onChange={e => setPaylineCount(e.target.value)} className="max-w-32" />
              <p className="text-xs text-muted-foreground mt-1">Standard 5×3: 20–40 paylines. Max theoretical for 5×3: 243.</p>
            </FormField>
          )}

          {gameType === "Payways" && (
            <>
              <FormField label={<span className="inline-flex items-center gap-1.5">Ways Constant <Tip text="Total ways = product of symbols on each reel (e.g. 3×3×3×3×3 = 243)." /></span>}>
                <Input type="number" min="1" value={waysConstant} onChange={e => setWaysConstant(e.target.value)} className="max-w-32" />
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
              <FormField label={<span className="inline-flex items-center gap-1.5">Max Ways <Tip text="The Megaways patent peaks at 117,649 ways (7^6). Some implementations cap lower." /></span>}>
                <Input type="number" min="1" value={megawaysMaxWays} onChange={e => setMegawaysMaxWays(e.target.value)} className="max-w-40" />
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
              <FormField label={<span className="inline-flex items-center gap-1.5">Minimum Symbols for Win * <Tip text="Cluster: requires adjacent matching symbols. Grid: any positions count." /></span>} required>
                <Input type="number" min="3" max="20" value={minClusterSize} onChange={e => setMinClusterSize(e.target.value)} className="max-w-24" />
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

          {(gameType === "Paylines" || gameType === "Payways") && (
            <FormField label={waysLinesLabel}>
              <Input type="number" min="1" value={waysOrLines} onChange={e => setWaysOrLines(e.target.value)} className="max-w-32" />
            </FormField>
          )}
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
              <Input type="number" step="0.1" min="0" max="99" value={baseGameRtp} onChange={e => setBaseGameRtp(e.target.value)} className="max-w-32" />
            </FormField>
            <FormField label="Feature RTP (%)">
              <Input type="number" step="0.1" min="0" max="99" value={featureRtpField} onChange={e => setFeatureRtpField(e.target.value)} className="max-w-32" />
            </FormField>
          </FormRow>
          {!rtpSumValid && baseGameRtp && featureRtpField && (
            <p className="text-xs text-destructive">Base RTP + Feature RTP must equal Total RTP ({rtpNum}%). Currently: {(baseRtpNum + featureRtpNum).toFixed(1)}%</p>
          )}

          <div className="mt-2">
            <button type="button" onClick={() => setShowAdvancedRtp(!showAdvancedRtp)} className="text-sm text-primary font-medium hover:underline">
              {showAdvancedRtp ? "Hide" : "Show"} Advanced Breakdown
            </button>
          </div>
          {showAdvancedRtp && (
            <div className="space-y-4 rounded-lg border border-dashed border-border bg-secondary/20 p-4">
              <FormRow columns={3}>
                <FormField label="Free Spins RTP (%)">
                  <Input type="number" step="0.1" min="0" value={freeSpinsRtp} onChange={e => setFreeSpinsRtp(e.target.value)} className="max-w-28" />
                </FormField>
                <FormField label="Respins RTP (%)">
                  <Input type="number" step="0.1" min="0" value={respinsRtp} onChange={e => setRespinsRtp(e.target.value)} className="max-w-28" />
                </FormField>
                <FormField label="Hold & Spin RTP (%)">
                  <Input type="number" step="0.1" min="0" value={holdSpinRtp} onChange={e => setHoldSpinRtp(e.target.value)} className="max-w-28" />
                </FormField>
              </FormRow>
              <FormRow columns={3}>
                <FormField label={<span className="inline-flex items-center gap-1.5">Wild Contribution RTP (%) <Tip text="RTP attributable specifically to wilds (substitution and multiplier effects)." /></span>}>
                  <Input type="number" step="0.1" min="0" value={wildContributionRtp} onChange={e => setWildContributionRtp(e.target.value)} className="max-w-28" />
                </FormField>
                <FormField label="Bonus Game RTP (%)">
                  <Input type="number" step="0.1" min="0" value={bonusRtp} onChange={e => setBonusRtp(e.target.value)} className="max-w-28" />
                </FormField>
                <FormField label="Jackpot / Progressive RTP (%)">
                  <Input type="number" step="0.1" min="0" value={jackpotRtp} onChange={e => setJackpotRtp(e.target.value)} className="max-w-28" />
                </FormField>
              </FormRow>
              {!advSumValid && (
                <p className="text-xs text-destructive">
                  All sub-values (Free Spins + Respins + Hold & Spin + Wild + Bonus + Jackpot) must sum to Feature RTP ({featureRtpNum.toFixed(1)}%). Currently: {advSum.toFixed(1)}%
                </p>
              )}
            </div>
          )}

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
        <div className="flex justify-end border-t pt-6">
          <Button type="submit" size="lg" disabled={isSubmitting || !gameName} className="min-w-48">
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
