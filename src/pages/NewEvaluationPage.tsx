import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Info,
  Grid3X3,
  Sparkles,
  Timer,
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
import { cn } from "@/lib/utils";

const TARGET_MARKETS = ["UK", "Nordics", "EU", "LATAM", "Global"];
const PLAYER_FOCUS = ["Casual", "Bonus-Seeking", "Volatility-Seeking", "Budget-Constrained", "Progress-Oriented"];
const GAME_TYPES = ["Paylines", "Payways", "Cluster Pays"];
const VOLATILITIES = ["Low", "Medium", "High", "Very High"];
const HIT_FREQUENCIES = ["Low (<20%)", "Medium (20–35%)", "High (>35%)"];
const HIT_FREQ_MAP: Record<string, string> = {
  "Low (<20%)": "Low",
  "Medium (20–35%)": "Medium",
  "High (>35%)": "High",
};
const FEATURE_TRIGGER_OPTIONS = ["1 in 50", "1 in 100", "1 in 150", "1 in 200"];
const FEATURE_TYPES_LIST = ["Free Spins", "Respins", "Pick Bonus", "Progressive"];
const FEATURE_VOL = ["Low", "Medium", "High"];
const BASE_GAME_STRENGTHS = ["Weak (feature-driven)", "Balanced", "Strong"];
const DEAD_SPIN_FREQ = ["Low", "Medium", "High"];
const BANKROLL_TARGETS = ["Low", "Medium", "High"];
const PRIMARY_GOALS = ["High engagement", "Long sessions", "Big win excitement", "Frequent rewards"];
const TARGET_AUDIENCES = ["Casual", "Bonus seekers", "High volatility players"];
const SPECIAL_MECHANICS = [
  "Cascades",
  "Multipliers",
  "Expanding Wilds",
  "Sticky Symbols",
  "Progressive Jackpot",
  "Collection Mechanics",
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

export default function NewEvaluationPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic
  const [gameName, setGameName] = useState("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);
  const [playerFocus, setPlayerFocus] = useState<string[]>([]);

  // Section 1 — Game Structure
  const [gameType, setGameType] = useState("");
  const [gridRows, setGridRows] = useState("3");
  const [gridColumns, setGridColumns] = useState("5");
  const [waysOrLines, setWaysOrLines] = useState("243");

  // Section 2 — RTP
  const [rtpTarget, setRtpTarget] = useState("96.5");
  const [baseGameRtp, setBaseGameRtp] = useState("45");
  const [featureRtpField, setFeatureRtpField] = useState("51.5");
  const [freeSpinsRtp, setFreeSpinsRtp] = useState("25");
  const [bonusRtp, setBonusRtp] = useState("10");
  const [jackpotRtp, setJackpotRtp] = useState("8");
  const [showAdvancedRtp, setShowAdvancedRtp] = useState(false);

  // Section 3 — Hit Frequency
  const [overallHitFreq, setOverallHitFreq] = useState("");
  const [baseHitFreq, setBaseHitFreq] = useState("");
  const [featureTriggerFreq, setFeatureTriggerFreq] = useState("");

  // Section 4 — Volatility
  const [volatility, setVolatility] = useState("");
  const [topWin, setTopWin] = useState("5000");

  // Section 5 — Win Distribution
  const [winSub1x, setWinSub1x] = useState("50");
  const [win1to5, setWin1to5] = useState("30");
  const [win5to20, setWin5to20] = useState("12");
  const [win20to100, setWin20to100] = useState("6");
  const [win100plus, setWin100plus] = useState("2");

  // Section 6 — Features
  const [features, setFeatures] = useState<Feature[]>([createEmptyFeature()]);

  // Section 7 — Base Game Strength
  const [baseGameStrength, setBaseGameStrength] = useState("");
  const [averageBaseWin, setAverageBaseWin] = useState("");
  const [deadSpinFrequency, setDeadSpinFrequency] = useState("");

  // Section 8 — Bankroll
  const [targetBankroll, setTargetBankroll] = useState("");
  const [targetSessionLength, setTargetSessionLength] = useState("15");

  // Section 9 — Special Mechanics
  const [specialMechanics, setSpecialMechanics] = useState<string[]>([]);

  // Section 10 — Design Intent
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Upload
  const [referenceGames, setReferenceGames] = useState("");

  // Computed values
  const rtpNum = parseFloat(rtpTarget) || 0;
  const baseRtpNum = parseFloat(baseGameRtp) || 0;
  const featureRtpNum = parseFloat(featureRtpField) || 0;
  const rtpSumValid = Math.abs(baseRtpNum + featureRtpNum - rtpNum) < 0.1;
  const rtpInRange = rtpNum >= 85 && rtpNum <= 99;

  const advFreeSpins = parseFloat(freeSpinsRtp) || 0;
  const advBonus = parseFloat(bonusRtp) || 0;
  const advJackpot = parseFloat(jackpotRtp) || 0;
  const advSum = advFreeSpins + advBonus + advJackpot;
  const advSumValid = Math.abs(advSum - featureRtpNum) < 0.1;

  const winTotal = (parseFloat(winSub1x) || 0) + (parseFloat(win1to5) || 0) + (parseFloat(win5to20) || 0) + (parseFloat(win20to100) || 0) + (parseFloat(win100plus) || 0);
  const winTotalValid = Math.abs(winTotal - 100) < 0.5;

  const topWinNum = parseFloat(topWin) || 0;
  const maxExposureCategory = topWinNum < 500 ? "<500×" : topWinNum <= 2000 ? "500–2000×" : "2000×+";

  const featureDependency = rtpNum > 0 ? featureRtpNum / rtpNum : 0;
  const riskFlagFeatureHeavy = featureDependency > 0.6;

  const waysLinesLabel = gameType === "Paylines" ? "Number of Paylines" : gameType === "Payways" ? "Number of Ways" : "Ways / Lines";

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
      if (pm.includes("line")) setGameType("Paylines");
      else if (pm.includes("way")) setGameType("Payways");
      else if (pm.includes("cluster")) setGameType("Cluster Pays");
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
        else if (lower.includes("pick") || lower.includes("bonus")) feat.type = "Pick Bonus";
        else if (lower.includes("progress")) feat.type = "Progressive";
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
      wildRtp: 0,
      respinRtp: 0,
      freeSpinsRtp: advFreeSpins,
      jackpotRtp: advJackpot,
      otherFeatureRtp: advBonus + (featureRtpNum - advSum),
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
      referenceGames,
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
      title="Game Math & Economy Input"
      subtitle="Define the structural math profile of your slot game"
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-4">
        {/* Upload */}
        <CollapsibleSection title="Upload Game Brief (Auto-Fill)" icon={<FileUp className="h-5 w-5" />} description="Upload a game design document to auto-fill the form below" defaultOpen={false}>
          <DocumentUpload onExtracted={handleExtracted} />
        </CollapsibleSection>

        {/* Basic Info */}
        <CollapsibleSection title="Basic Information" icon={<Info className="h-5 w-5" />}>
          <FormField label="Game Name" required>
            <Input value={gameName} onChange={e => setGameName(e.target.value)} placeholder="Enter game name" className="max-w-md" />
          </FormField>
          <FormField label="Target Markets">
            <MultiSelect options={TARGET_MARKETS} selected={targetMarkets} onChange={setTargetMarkets} />
          </FormField>
          <FormField label="Intended Player Focus">
            <MultiSelect options={PLAYER_FOCUS} selected={playerFocus} onChange={setPlayerFocus} />
          </FormField>
        </CollapsibleSection>

        {/* Section 1 — Game Structure */}
        <CollapsibleSection title="Game Structure" icon={<Grid3X3 className="h-5 w-5" />} description="Define how the game grid and pay system work">
          <FormField label="Game Type" required>
            <SelectButtons options={GAME_TYPES} value={gameType} onChange={setGameType} />
          </FormField>
          <FormRow>
            <FormField label="Grid Rows">
              <Input type="number" min="1" max="12" value={gridRows} onChange={e => setGridRows(e.target.value)} className="max-w-24" />
            </FormField>
            <FormField label="Grid Columns">
              <Input type="number" min="1" max="12" value={gridColumns} onChange={e => setGridColumns(e.target.value)} className="max-w-24" />
            </FormField>
          </FormRow>
          <FormField label={waysLinesLabel}>
            <Input type="number" min="1" value={waysOrLines} onChange={e => setWaysOrLines(e.target.value)} className="max-w-32" />
          </FormField>
        </CollapsibleSection>

        {/* Section 2 — RTP Distribution */}
        <CollapsibleSection title="RTP Distribution" icon={<PieChart className="h-5 w-5" />} description="Define how total RTP is distributed">
          <FormField label="Total RTP (%)" required>
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
                <FormField label="Bonus RTP (%)">
                  <Input type="number" step="0.1" min="0" value={bonusRtp} onChange={e => setBonusRtp(e.target.value)} className="max-w-28" />
                </FormField>
                <FormField label="Jackpot RTP (%)">
                  <Input type="number" step="0.1" min="0" value={jackpotRtp} onChange={e => setJackpotRtp(e.target.value)} className="max-w-28" />
                </FormField>
              </FormRow>
              {!advSumValid && (
                <p className="text-xs text-destructive">Sub-values must sum to Feature RTP ({featureRtpNum.toFixed(1)}%). Currently: {advSum.toFixed(1)}%</p>
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
        </CollapsibleSection>

        {/* Section 3 — Hit Frequency & Pacing */}
        <CollapsibleSection title="Hit Frequency & Pacing" icon={<BarChart3 className="h-5 w-5" />}>
          <FormField label="Overall Hit Frequency" required>
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
        </CollapsibleSection>

        {/* Section 4 — Volatility Profile */}
        <CollapsibleSection title="Volatility Profile" icon={<TrendingUp className="h-5 w-5" />}>
          <FormField label="Volatility" required>
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

        {/* Section 5 — Win Distribution */}
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

        {/* Section 6 — Feature Structure */}
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
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addFeature} className="w-full border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Add Another Feature
            </Button>
          </div>
        </CollapsibleSection>

        {/* Section 7 — Base Game Strength */}
        <CollapsibleSection title="Base Game Strength" icon={<Zap className="h-5 w-5" />}>
          <FormField label="Base Game Strength" required>
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
        </CollapsibleSection>

        {/* Section 8 — Bankroll Model */}
        <CollapsibleSection title="Bankroll Model" icon={<Wallet className="h-5 w-5" />}>
          <FormField label="Target Player Bankroll">
            <SelectButtons options={BANKROLL_TARGETS} value={targetBankroll} onChange={setTargetBankroll} />
          </FormField>
          <FormField label="Target Session Length (minutes)">
            <Input type="number" min="1" max="120" value={targetSessionLength} onChange={e => setTargetSessionLength(e.target.value)} className="max-w-32" />
          </FormField>
        </CollapsibleSection>

        {/* Section 9 — Special Mechanics */}
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

        {/* Section 10 — Design Intent */}
        <CollapsibleSection title="Design Intent" icon={<Target className="h-5 w-5" />}>
          <FormField label="Primary Goal">
            <SelectButtons options={PRIMARY_GOALS} value={primaryGoal} onChange={setPrimaryGoal} />
          </FormField>
          <FormField label="Target Audience">
            <SelectButtons options={TARGET_AUDIENCES} value={targetAudience} onChange={setTargetAudience} />
          </FormField>
          <FormField label="Reference Games (optional)">
            <Input value={referenceGames} onChange={e => setReferenceGames(e.target.value)} placeholder="e.g., Book of Dead, Sweet Bonanza" className="max-w-lg" />
          </FormField>
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
