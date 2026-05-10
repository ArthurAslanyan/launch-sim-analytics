import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Info, Grid3X3, PieChart, Sparkles, BarChart3, TrendingUp,
  Zap, Target, Plus, Trash2, Play, ChevronDown, ArrowLeft,
  HelpCircle, RefreshCw, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FormField, FormRow } from "@/components/FormSection";
import { MultiSelect, SelectButtons } from "@/components/MultiSelect";
import { GameConcept, Feature, RtpBreakdown, WinDistribution, runSimulation } from "@/lib/simulation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PlayerArchetypeConfig } from "@/components/PlayerArchetypeConfig";

const GAME_TYPES = ["Paylines", "Payways", "Cluster Pays", "Megaways"];
const TARGET_MARKETS = ["UK", "EU", "LATAM", "Global"];
const VOLATILITIES = ["Low", "Medium", "High", "Very High"];
const FEATURE_TYPES = ["Free Spins", "Hold & Spin", "Respin", "Pick Bonus", "Collection Mechanic"];
const FEATURE_VOL = ["Low", "Medium", "High"];
const SPECIAL_MECHANICS = [
  "Multipliers", "Cascades", "Sticky Symbols", "Expanding Wilds",
  "Progressive Jackpot", "Collection Features",
];

const WIN_THRESHOLDS = ["0×", "1×", "2×", "5×", "10×", "20×", "50×", "100×", "250×", "500×", "1000×"];

interface RtpRow { name: string; rtp: string; }
interface AdvFeature {
  id: string; name: string; type: string; triggerFrequency: string;
  avgPayout: string; maxPayout: string; rtpContribution: string;
  volatility: string; avgDuration: string;
}
interface WinRow { threshold: string; probability: string; }
interface SymbolRow { name: string; x3: string; x4: string; x5: string; }

const createFeature = (): AdvFeature => ({
  id: crypto.randomUUID(), name: "", type: "", triggerFrequency: "",
  avgPayout: "", maxPayout: "", rtpContribution: "", volatility: "", avgDuration: "",
});

function Tip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="ml-1 inline h-3.5 w-3.5 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

function Section({ title, icon, description, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; description?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
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
          <div className="mt-4 space-y-4">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function AdvancedEvaluationPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Section 1 — General
  const [gameName, setGameName] = useState("");
  const [provider, setProvider] = useState("");
  const [gameType, setGameType] = useState("");
  const [gridRows, setGridRows] = useState("3");
  const [gridColumns, setGridColumns] = useState("5");
  const [waysOrLines, setWaysOrLines] = useState("243");
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);

  // Section 2 — RTP
  const [baseRtp, setBaseRtp] = useState("60");
  const [featureRtp, setFeatureRtp] = useState("36.5");
  const [rtpRows, setRtpRows] = useState<RtpRow[]>([
    { name: "Base Game", rtp: "60" },
    { name: "Free Spins", rtp: "20" },
    { name: "Hold & Spin", rtp: "10" },
    { name: "Other", rtp: "6.5" },
  ]);

  // Section 3 — Features
  const [features, setFeatures] = useState<AdvFeature[]>([createFeature()]);

  // Section 4 — Win Distribution
  const [winRows, setWinRows] = useState<WinRow[]>(
    WIN_THRESHOLDS.map(t => ({ threshold: t, probability: "" }))
  );

  // Section 5 — Paytable
  const [paytableUnit, setPaytableUnit] = useState<"coins" | "xbet">("xbet");
  const [symbols, setSymbols] = useState<SymbolRow[]>([
    { name: "HP1", x3: "", x4: "", x5: "" },
    { name: "HP2", x3: "", x4: "", x5: "" },
    { name: "LP1", x3: "", x4: "", x5: "" },
    { name: "LP2", x3: "", x4: "", x5: "" },
  ]);

  // Section 6 — Volatility & Metrics
  const [stdDev, setStdDev] = useState("");
  const [volatility, setVolatility] = useState("");
  const [topWin, setTopWin] = useState("");
  const [avgWin, setAvgWin] = useState("");
  const [hitFrequency, setHitFrequency] = useState("");
  const [deadSpinRate, setDeadSpinRate] = useState("");

  // Section 7 — Special Mechanics
  const [specialMechanics, setSpecialMechanics] = useState<string[]>([]);
  const [collectorProb, setCollectorProb] = useState("");
  const [coinDist, setCoinDist] = useState<string[]>(Array(6).fill(""));

  // Section 8 — Feature Performance
  const [fsFreq, setFsFreq] = useState("");
  const [fsAvgPayout, setFsAvgPayout] = useState("");
  const [hsFreq, setHsFreq] = useState("");
  const [hsAvgPayout, setHsAvgPayout] = useState("");
  const [avgMultiplier, setAvgMultiplier] = useState("");

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
  const [symbolSwapRules, setSymbolSwapRules] = useState<Array<{ id: string; sourceSymbol: string; targetSymbol: string; swapCount: number | "all" }>>([]);
  const [symbolSwapRtpContribution, setSymbolSwapRtpContribution] = useState("0.75");
  const [symbolSwapWinFrequencyBoost, setSymbolSwapWinFrequencyBoost] = useState("1.08");

  const createSymbolSwapRule = () => ({
    id: crypto.randomUUID(),
    sourceSymbol: "A",
    targetSymbol: "K",
    swapCount: 1 as number | "all",
  });

  const updateSymbolSwapRule = (id: string, field: string, value: string | number) => {
    setSymbolSwapRules(symbolSwapRules.map(rule =>
      rule.id === id
        ? { ...rule, [field]: field === "swapCount" ? (value === "all" ? "all" : (parseInt(value as string) || 1)) : value }
        : rule
    ));
  };

  const removeSymbolSwapRule = (id: string) => {
    setSymbolSwapRules(symbolSwapRules.filter(rule => rule.id !== id));
  };

  // Derived metrics
  const totalRtp = useMemo(() => rtpRows.reduce((s, r) => s + (parseFloat(r.rtp) || 0), 0), [rtpRows]);
  const baseRtpNum = parseFloat(baseRtp) || 0;
  const featureRtpNum = parseFloat(featureRtp) || 0;
  const rtpSum = baseRtpNum + featureRtpNum;
  const winProbTotal = useMemo(() => winRows.reduce((s, r) => s + (parseFloat(r.probability) || 0), 0), [winRows]);

  const featureDependency = rtpSum > 0 ? featureRtpNum / rtpSum : 0;
  const topWinNum = parseFloat(topWin) || 0;
  const hitFreqNum = parseFloat(hitFrequency) || 0;
  const deadSpinNum = parseFloat(deadSpinRate) || 0;

  const volScore: Record<string, number> = { Low: 0.3, Medium: 0.5, High: 0.8, "Very High": 1.0 };
  const earlySessionRisk = hitFreqNum < 20 && featureDependency > 0.5 ? "HIGH" : hitFreqNum < 30 ? "MEDIUM" : "LOW";

  // Handlers
  const addRtpRow = () => setRtpRows([...rtpRows, { name: "", rtp: "" }]);
  const removeRtpRow = (i: number) => setRtpRows(rtpRows.filter((_, idx) => idx !== i));
  const updateRtpRow = (i: number, field: keyof RtpRow, val: string) =>
    setRtpRows(rtpRows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const addFeature = () => setFeatures([...features, createFeature()]);
  const removeFeature = (id: string) => { if (features.length > 1) setFeatures(features.filter(f => f.id !== id)); };
  const updateFeature = (id: string, field: keyof AdvFeature, val: string) =>
    setFeatures(features.map(f => f.id === id ? { ...f, [field]: val } : f));

  const updateWinRow = (i: number, val: string) =>
    setWinRows(winRows.map((r, idx) => idx === i ? { ...r, probability: val } : r));

  const addSymbol = () => setSymbols([...symbols, { name: "", x3: "", x4: "", x5: "" }]);
  const removeSymbol = (i: number) => setSymbols(symbols.filter((_, idx) => idx !== i));
  const updateSymbol = (i: number, field: keyof SymbolRow, val: string) =>
    setSymbols(symbols.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const rtpBreakdown: RtpBreakdown = {
      baseGameRtp: baseRtpNum,
      wildRtp: 0,
      respinRtp: 0,
      freeSpinsRtp: parseFloat(rtpRows.find(r => r.name.toLowerCase().includes("free"))?.rtp || "0"),
      jackpotRtp: parseFloat(rtpRows.find(r => r.name.toLowerCase().includes("jackpot"))?.rtp || "0"),
      otherFeatureRtp: featureRtpNum - (parseFloat(rtpRows.find(r => r.name.toLowerCase().includes("free"))?.rtp || "0")),
    };

    // Map win distribution from detailed rows to the 5-band model
    const probAt = (i: number) => parseFloat(winRows[i]?.probability || "0");
    const winDistribution: WinDistribution = {
      sub1x: probAt(0) + probAt(1),
      x1to5: probAt(2) + probAt(3),
      x5to20: probAt(4) + probAt(5),
      x20to100: probAt(6) + probAt(7),
      x100plus: probAt(8) + probAt(9) + probAt(10),
    };

    const mappedFeatures: Feature[] = features.filter(f => f.name || f.type).map(f => ({
      id: f.id,
      type: f.type || "Free Spins",
      name: f.name || f.type,
      triggerCondition: "",
      triggerFrequency: f.triggerFrequency,
      averageValue: parseFloat(f.avgPayout) || 0,
      maxValue: parseFloat(f.maxPayout) || 0,
      featureVolatility: f.volatility,
      visibility: "", winImpact: "", progressImpact: "",
    }));

    const hitFreqLabel = hitFreqNum > 35 ? "High" : hitFreqNum > 20 ? "Medium" : "Low";
    const deadSpinLabel = deadSpinNum > 50 ? "High" : deadSpinNum > 30 ? "Medium" : "Low";

    const gameConcept: GameConcept = {
      gameName: gameName || "Untitled Game",
      targetMarkets,
      playerFocus: [],
      gridLayout: `${gridColumns}×${gridRows}`,
      gridRows: parseInt(gridRows) || 3,
      gridColumns: parseInt(gridColumns) || 5,
      gameType,
      waysOrLines: parseInt(waysOrLines) || 243,
      payStructure: gameType === "Paylines" ? "Lines" : gameType === "Payways" || gameType === "Megaways" ? "Ways" : "Cluster",
      cascades: specialMechanics.includes("Cascades") ? "Yes" : "No",
      baseHitFrequency: hitFreqLabel,
      baseHitFrequencyDetail: hitFreqLabel,
      featureTriggerFrequency: fsFreq || "1 in 100",
      volatility,
      rtpTarget: rtpSum || totalRtp,
      topWin: topWinNum,
      maxExposureCategory: topWinNum >= 2000 ? "2000×+" : topWinNum >= 500 ? "500–2000×" : "<500×",
      rtpBreakdown,
      winDistribution,
      features: mappedFeatures,
      baseGameStrength: featureDependency > 0.6 ? "Weak (feature-driven)" : featureDependency < 0.4 ? "Strong" : "Balanced",
      averageBaseWin: parseFloat(avgWin) || 0,
      deadSpinFrequency: deadSpinLabel,
      targetBankroll: "Medium",
      targetSessionLength: 15,
      specialMechanics,
      primaryGoal: featureDependency > 0.5 ? "Big win excitement" : "High engagement",
      targetAudience: volatility === "Very High" || volatility === "High" ? "High volatility players" : "Casual",
      sessionLength: "Medium",
      bonusImportance: featureDependency > 0.5 ? "Core" : featureDependency > 0.3 ? "Important" : "Decorative",
      earlyExcitement: hitFreqNum > 35 ? "High" : hitFreqNum < 20 ? "Low" : "Moderate",
      reelType: "Video" as const,
      hasWild: true,
      hasScatter: true,
      scatterThreshold: 3,
      hasRetrigger: false,
      freeSpinCount: 10,
      hasMultiplierSymbol: false,
      bonusBuyAvailable: false,
      anteBetAvailable: false,
      requiresSimulation: specialMechanics.includes("Cascades") && ["Megaways", "Cluster Pays"].includes(gameType),
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
      title="Advanced Game Math Input"
      subtitle="Studio-grade math sheet input for precise behavioral simulation"
    >
      <div className="mx-auto max-w-4xl mb-4">
        <Link to="/evaluate" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Standard Input
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-4">

        {/* SECTION 1 — General Game Info */}
        <Section title="General Game Info" icon={<Info className="h-5 w-5" />} description="Basic identification and structure">
          <FormRow>
            <FormField label="Game Name" required>
              <Input value={gameName} onChange={e => setGameName(e.target.value)} placeholder="e.g. Phoenix Fortune" />
            </FormField>
            <FormField label="Provider / Studio">
              <Input value={provider} onChange={e => setProvider(e.target.value)} placeholder="e.g. NetEnt" />
            </FormField>
          </FormRow>
          <FormField label="Game Type" required>
            <SelectButtons options={GAME_TYPES} value={gameType} onChange={setGameType} />
          </FormField>
          <FormRow columns={3}>
            <FormField label="Rows">
              <Input type="number" min="1" max="12" value={gridRows} onChange={e => setGridRows(e.target.value)} className="max-w-24" />
            </FormField>
            <FormField label="Columns">
              <Input type="number" min="1" max="12" value={gridColumns} onChange={e => setGridColumns(e.target.value)} className="max-w-24" />
            </FormField>
            <FormField label={gameType === "Paylines" ? "Number of Paylines" : "Number of Ways"}>
              <Input type="number" min="1" value={waysOrLines} onChange={e => setWaysOrLines(e.target.value)} className="max-w-32" />
            </FormField>
          </FormRow>
          <FormField label="Target Markets">
            <MultiSelect options={TARGET_MARKETS} selected={targetMarkets} onChange={setTargetMarkets} />
          </FormField>
        </Section>

        {/* SECTION 2 — RTP Distribution */}
        <Section title="RTP Distribution" icon={<PieChart className="h-5 w-5" />} description="Detailed return-to-player breakdown">
          <FormRow>
            <FormField label={<>Base Game RTP (%) <Tip text="The percentage of total RTP returned through base game wins" /></>}>
              <Input type="number" step="0.1" min="0" max="99" value={baseRtp} onChange={e => setBaseRtp(e.target.value)} className="max-w-32" />
            </FormField>
            <FormField label={<>Feature RTP (%) <Tip text="The percentage of total RTP returned through bonus features" /></>}>
              <Input type="number" step="0.1" min="0" max="99" value={featureRtp} onChange={e => setFeatureRtp(e.target.value)} className="max-w-32" />
            </FormField>
          </FormRow>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Total RTP:</span>
            <span className={cn("font-semibold", rtpSum < 85 || rtpSum > 99 ? "text-destructive" : "text-primary")}>
              {rtpSum.toFixed(1)}%
            </span>
            {(rtpSum < 85 || rtpSum > 99) && <span className="text-xs text-destructive">Must be 85–99%</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">RTP Breakdown Table</label>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Component</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">RTP %</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr></thead>
                <tbody>
                  {rtpRows.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-1.5">
                        <Input value={row.name} onChange={e => updateRtpRow(i, "name", e.target.value)} className="h-8 text-sm" placeholder="Component name" />
                      </td>
                      <td className="px-3 py-1.5">
                        <Input type="number" step="0.1" value={row.rtp} onChange={e => updateRtpRow(i, "rtp", e.target.value)} className="h-8 text-sm max-w-24" />
                      </td>
                      <td className="px-3 py-1.5">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeRtpRow(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="border-t border-border bg-muted/30">
                  <td className="px-3 py-2 font-medium text-foreground">Total</td>
                  <td className="px-3 py-2 font-semibold text-primary">{totalRtp.toFixed(1)}%</td>
                  <td></td>
                </tr></tfoot>
              </table>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRtpRow} className="mt-1">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Row
            </Button>
          </div>
        </Section>

        {/* SECTION 3 — Feature Definitions */}
        <Section title="Feature Definitions" icon={<Sparkles className="h-5 w-5" />} description="Define each bonus feature in detail">
          {features.map((feat, idx) => (
            <div key={feat.id} className="rounded-lg border border-border p-4 space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Feature {idx + 1}</span>
                {features.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFeature(feat.id)} className="text-muted-foreground hover:text-destructive h-7">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                )}
              </div>
              <FormRow>
                <FormField label="Feature Name">
                  <Input value={feat.name} onChange={e => updateFeature(feat.id, "name", e.target.value)} placeholder="e.g. Dragon Spins" />
                </FormField>
                <FormField label="Feature Type">
                  <Select value={feat.type} onValueChange={v => updateFeature(feat.id, "type", v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{FEATURE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
              </FormRow>
              <FormRow columns={3}>
                <FormField label={<>Trigger Frequency <Tip text="How often this feature triggers, e.g. '1 in 150' or a number" /></>}>
                  <Input value={feat.triggerFrequency} onChange={e => updateFeature(feat.id, "triggerFrequency", e.target.value)} placeholder="1 in 150" />
                </FormField>
                <FormField label="Avg Payout (× bet)">
                  <Input type="number" step="0.1" value={feat.avgPayout} onChange={e => updateFeature(feat.id, "avgPayout", e.target.value)} placeholder="50" />
                </FormField>
                <FormField label="Max Payout (× bet)">
                  <Input type="number" step="0.1" value={feat.maxPayout} onChange={e => updateFeature(feat.id, "maxPayout", e.target.value)} placeholder="5000" />
                </FormField>
              </FormRow>
              <FormRow columns={3}>
                <FormField label="RTP Contribution (%)">
                  <Input type="number" step="0.1" value={feat.rtpContribution} onChange={e => updateFeature(feat.id, "rtpContribution", e.target.value)} placeholder="15" />
                </FormField>
                <FormField label="Feature Volatility">
                  <SelectButtons options={FEATURE_VOL} value={feat.volatility} onChange={v => updateFeature(feat.id, "volatility", v)} />
                </FormField>
                <FormField label="Avg Duration (spins)">
                  <Input type="number" value={feat.avgDuration} onChange={e => updateFeature(feat.id, "avgDuration", e.target.value)} placeholder="8" />
                </FormField>
              </FormRow>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addFeature}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Feature
          </Button>
        </Section>

        {/* SECTION 4 — Win Distribution */}
        <Section title="Win Distribution" icon={<BarChart3 className="h-5 w-5" />} description="Probability of each win threshold">
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Win Threshold</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Probability (%)</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Frequency</th>
              </tr></thead>
              <tbody>
                {winRows.map((row, i) => {
                  const prob = parseFloat(row.probability) || 0;
                  const freq = prob > 0 ? `1 in ${Math.round(100 / prob)}` : "—";
                  return (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-1.5 font-medium text-foreground">{row.threshold}</td>
                      <td className="px-3 py-1.5">
                        <Input type="number" step="0.01" min="0" max="100" value={row.probability} onChange={e => updateWinRow(i, e.target.value)} className="h-8 text-sm max-w-28" placeholder="0.00" />
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{freq}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr className="border-t border-border bg-muted/30">
                <td className="px-3 py-2 font-medium text-foreground">Total</td>
                <td className="px-3 py-2 font-semibold" colSpan={2}>
                  <span className={cn(Math.abs(winProbTotal - 100) > 1 && winProbTotal > 0 ? "text-destructive" : "text-primary")}>
                    {winProbTotal.toFixed(2)}%
                  </span>
                  {winProbTotal > 0 && Math.abs(winProbTotal - 100) > 1 && (
                    <span className="ml-2 text-xs text-destructive">Should sum to 100%</span>
                  )}
                </td>
              </tr></tfoot>
            </table>
          </div>
        </Section>

        {/* SECTION 5 — Paytable */}
        <Section title="Paytable" icon={<Grid3X3 className="h-5 w-5" />} description="Symbol payout values" defaultOpen={false}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-muted-foreground">Values in:</span>
            <SelectButtons options={["Coins", "× Bet"]} value={paytableUnit === "coins" ? "Coins" : "× Bet"} onChange={v => setPaytableUnit(v === "Coins" ? "coins" : "xbet")} />
          </div>
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Symbol</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">3 of a Kind</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">4 of a Kind</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">5 of a Kind</th>
                <th className="px-3 py-2 w-10"></th>
              </tr></thead>
              <tbody>
                {symbols.map((sym, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-1.5">
                      <Input value={sym.name} onChange={e => updateSymbol(i, "name", e.target.value)} className="h-8 text-sm max-w-28" placeholder="HP1" />
                    </td>
                    <td className="px-3 py-1.5"><Input type="number" step="0.1" value={sym.x3} onChange={e => updateSymbol(i, "x3", e.target.value)} className="h-8 text-sm max-w-20" /></td>
                    <td className="px-3 py-1.5"><Input type="number" step="0.1" value={sym.x4} onChange={e => updateSymbol(i, "x4", e.target.value)} className="h-8 text-sm max-w-20" /></td>
                    <td className="px-3 py-1.5"><Input type="number" step="0.1" value={sym.x5} onChange={e => updateSymbol(i, "x5", e.target.value)} className="h-8 text-sm max-w-20" /></td>
                    <td className="px-3 py-1.5">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSymbol(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSymbol} className="mt-1">
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Symbol
          </Button>
        </Section>

        {/* SECTION 6 — Volatility & Metrics */}
        <Section title="Volatility & Metrics" icon={<TrendingUp className="h-5 w-5" />} description="Key performance indicators">
          <FormRow>
            <FormField label={<>Standard Deviation <Tip text="Measure of result variability per spin" /></>}>
              <Input type="number" step="0.01" value={stdDev} onChange={e => setStdDev(e.target.value)} placeholder="4.5" className="max-w-32" />
            </FormField>
            <FormField label="Volatility Category" required>
              <SelectButtons options={VOLATILITIES} value={volatility} onChange={setVolatility} />
            </FormField>
          </FormRow>
          <FormRow columns={4}>
            <FormField label="Top Win (× bet)">
              <Input type="number" step="1" value={topWin} onChange={e => setTopWin(e.target.value)} placeholder="5000" className="max-w-28" />
            </FormField>
            <FormField label="Avg Win (× bet)">
              <Input type="number" step="0.1" value={avgWin} onChange={e => setAvgWin(e.target.value)} placeholder="2.5" className="max-w-28" />
            </FormField>
            <FormField label="Hit Frequency (%)">
              <Input type="number" step="0.1" min="0" max="100" value={hitFrequency} onChange={e => setHitFrequency(e.target.value)} placeholder="30" className="max-w-28" />
            </FormField>
            <FormField label="Dead Spin Rate (%)">
              <Input type="number" step="0.1" min="0" max="100" value={deadSpinRate} onChange={e => setDeadSpinRate(e.target.value)} placeholder="45" className="max-w-28" />
            </FormField>
          </FormRow>
          {topWinNum > 0 && (
            <div className="text-sm text-muted-foreground">
              Max Exposure: <span className="font-medium text-foreground">{topWinNum >= 2000 ? "2000×+" : topWinNum >= 500 ? "500–2000×" : "<500×"}</span>
            </div>
          )}
        </Section>

        {/* SECTION 7 — Special Mechanics */}
        <Section title="Special Mechanics" icon={<Zap className="h-5 w-5" />} description="Additional game mechanics and collection features" defaultOpen={false}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SPECIAL_MECHANICS.map(m => (
              <label key={m} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={specialMechanics.includes(m)}
                  onCheckedChange={checked => {
                    setSpecialMechanics(checked ? [...specialMechanics, m] : specialMechanics.filter(x => x !== m));
                  }}
                />
                {m}
              </label>
            ))}
          </div>

          {specialMechanics.includes("Collection Features") && (
            <div className="mt-4 space-y-3 rounded-lg border border-border p-4 bg-card">
              <FormField label="Collector Probability (%)">
                <Input type="number" step="0.1" value={collectorProb} onChange={e => setCollectorProb(e.target.value)} className="max-w-32" placeholder="5" />
              </FormField>
              <label className="text-sm font-medium text-foreground">Coin Distribution</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <FormField key={n} label={`${n} coin (%)`}>
                    <Input type="number" step="0.1" value={coinDist[n]} onChange={e => {
                      const next = [...coinDist];
                      next[n] = e.target.value;
                      setCoinDist(next);
                    }} className="max-w-20 text-sm" />
                  </FormField>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* SECTION 8 — Feature Performance Snapshot */}
        <Section title="Feature Performance Snapshot" icon={<Target className="h-5 w-5" />} description="Key feature performance benchmarks">
          <FormRow>
            <FormField label="Free Spins Frequency">
              <Input value={fsFreq} onChange={e => setFsFreq(e.target.value)} placeholder="1 in 150" />
            </FormField>
            <FormField label="Free Spins Avg Payout (× bet)">
              <Input type="number" step="0.1" value={fsAvgPayout} onChange={e => setFsAvgPayout(e.target.value)} placeholder="50" />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Hold & Spin Frequency">
              <Input value={hsFreq} onChange={e => setHsFreq(e.target.value)} placeholder="1 in 200" />
            </FormField>
            <FormField label="Hold & Spin Avg Payout (× bet)">
              <Input type="number" step="0.1" value={hsAvgPayout} onChange={e => setHsAvgPayout(e.target.value)} placeholder="30" />
            </FormField>
          </FormRow>
          <FormField label={<>Average Multiplier <Tip text="The mean multiplier applied across all wins" /></>}>
            <Input type="number" step="0.1" value={avgMultiplier} onChange={e => setAvgMultiplier(e.target.value)} placeholder="2.5" className="max-w-32" />
          </FormField>
        </Section>

        {/* Player Archetype Configuration */}
        <PlayerArchetypeConfig />

        {/* Validation & Summary */}
        <div className="form-section animate-fade-in">
          <div className="form-section-title">Validation & Summary</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="rounded-lg border border-border p-3 bg-card">
              <div className="text-muted-foreground mb-1">Total RTP</div>
              <div className={cn("text-lg font-bold", rtpSum < 85 || rtpSum > 99 ? "text-destructive" : "text-primary")}>{rtpSum.toFixed(1)}%</div>
            </div>
            <div className="rounded-lg border border-border p-3 bg-card">
              <div className="text-muted-foreground mb-1">Feature Dependency</div>
              <div className={cn("text-lg font-bold", featureDependency > 0.6 ? "text-warning" : "text-primary")}>{(featureDependency * 100).toFixed(0)}%</div>
            </div>
            <div className="rounded-lg border border-border p-3 bg-card">
              <div className="text-muted-foreground mb-1">Volatility Score</div>
              <div className="text-lg font-bold text-primary">{volScore[volatility] ?? "—"}</div>
            </div>
            <div className="rounded-lg border border-border p-3 bg-card">
              <div className="text-muted-foreground mb-1">Early Session Risk</div>
              <div className={cn("text-lg font-bold", earlySessionRisk === "HIGH" ? "text-destructive" : earlySessionRisk === "MEDIUM" ? "text-warning" : "text-primary")}>{earlySessionRisk}</div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full mt-6" disabled={isSubmitting || !gameName || !gameType || !volatility}>
            {isSubmitting ? (
              <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Running Simulation…</span>
            ) : (
              <span className="flex items-center gap-2"><Play className="h-4 w-4" /> Run Advanced Simulation</span>
            )}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
