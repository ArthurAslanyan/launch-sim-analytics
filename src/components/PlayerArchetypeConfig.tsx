import { useState } from "react";
import {
  Users, Zap, Target, Activity, Wallet, Sparkles,
  ChevronDown, HelpCircle, TrendingDown, Crosshair,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SelectButtons } from "@/components/MultiSelect";
import { cn } from "@/lib/utils";

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

export interface ArchetypeParams {
  bankrollMin: number;
  bankrollMax: number;
  lossTolerance: number;
  deadSpinTolerance: number;
  featureExpectation: number;
  meaningfulWin: number;
  continueAfterBigWin: number;
  tiltSensitivity: number; // 0-100
}

export interface ArchetypeConfigOutput {
  archetypes: Record<string, ArchetypeParams>;
  playersPerArchetype: number;
  variationIntensity: string;
  useDefaults: boolean;
}

const ARCHETYPE_ICONS: Record<string, React.ReactNode> = {
  "Casual Player":            <Sparkles className="h-4 w-4" />,
  "Bonus-Seeking Player":     <Target className="h-4 w-4" />,
  "Volatility-Seeking Player": <Zap className="h-4 w-4" />,
  "Budget-Constrained Player": <Wallet className="h-4 w-4" />,
  "Progress-Oriented Player":  <Activity className="h-4 w-4" />,
  "Loss-Chasing Player":       <TrendingDown className="h-4 w-4" />,
  "Feature-Focused Player":    <Crosshair className="h-4 w-4" />,
};

const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  "Casual Player":
    "Low risk tolerance. Exits quickly during losing streaks or dead spin runs. Driven by entertainment, light excitement, and comfort. Needs frequent small rewards to sustain engagement.",
  "Bonus-Seeking Player":
    "Tolerates base-game losses while hunting features. Measures session value by bonus frequency. Disengages if features feel too rare or disappointing. 'Just one more spin' mentality.",
  "Volatility-Seeking Player":
    "Ignores small wins entirely. Accepts extended losing streaks in pursuit of large, rare payouts. Low tilt sensitivity. Plays for the spike, not the average.",
  "Budget-Constrained Player":
    "Fixed bankroll mindset. Stops the moment losses exceed a preset threshold. Highly sensitive to perceived fairness. Prioritises control and predictability over excitement.",
  "Progress-Oriented Player":
    "Motivated by visible advancement — collection meters, unlock paths, milestone indicators. Tolerates moderate losses if progress continues. Disengages if momentum stalls.",
  "Loss-Chasing Player":
    "[Tier 3 — Advanced] Increases risk exposure after losses. Sensitive to near-miss patterns. Seeks recovery rather than entertainment. Risk escalation within session is the primary signal.",
  "Feature-Focused Player":
    "[Tier 3 — Advanced] Engages primarily with a single dominant mechanic. Other parts of the game are invisible to this player. Highly sensitive to that one feature's quality and frequency.",
};

const DEFAULT_VALUES: Record<string, ArchetypeParams> = {
  "Casual Player": {
    bankrollMin: 10, bankrollMax: 20, lossTolerance: 40,
    deadSpinTolerance: 8, featureExpectation: 60,
    meaningfulWin: 1.5, continueAfterBigWin: 22, tiltSensitivity: 65,
  },
  "Bonus-Seeking Player": {
    bankrollMin: 15, bankrollMax: 35, lossTolerance: 68,
    deadSpinTolerance: 22, featureExpectation: 45,
    meaningfulWin: 5, continueAfterBigWin: 72, tiltSensitivity: 35,
  },
  "Volatility-Seeking Player": {
    bankrollMin: 25, bankrollMax: 70, lossTolerance: 85,
    deadSpinTolerance: 45, featureExpectation: 160,
    meaningfulWin: 12, continueAfterBigWin: 88, tiltSensitivity: 10,
  },
  "Budget-Constrained Player": {
    bankrollMin: 5, bankrollMax: 10, lossTolerance: 22,
    deadSpinTolerance: 7, featureExpectation: 50,
    meaningfulWin: 1, continueAfterBigWin: 12, tiltSensitivity: 92,
  },
  "Progress-Oriented Player": {
    bankrollMin: 12, bankrollMax: 28, lossTolerance: 58,
    deadSpinTolerance: 18, featureExpectation: 75,
    meaningfulWin: 2, continueAfterBigWin: 55, tiltSensitivity: 42,
  },
  "Loss-Chasing Player": {
    bankrollMin: 20, bankrollMax: 100, lossTolerance: 92,
    deadSpinTolerance: 28, featureExpectation: 110,
    meaningfulWin: 15, continueAfterBigWin: 35, tiltSensitivity: 98,
  },
  "Feature-Focused Player": {
    bankrollMin: 15, bankrollMax: 38, lossTolerance: 72,
    deadSpinTolerance: 28, featureExpectation: 35,
    meaningfulWin: 8, continueAfterBigWin: 65, tiltSensitivity: 30,
  },
};

const ARCHETYPE_NAMES = Object.keys(DEFAULT_VALUES);
const TIER_3_ARCHETYPES = ["Loss-Chasing Player", "Feature-Focused Player"];
const PLAYERS_OPTIONS = ["50", "100", "200", "500"];
const VARIATION_OPTIONS = ["Low", "Medium", "High"];

interface ArchetypeCardProps {
  name: string;
  params: ArchetypeParams;
  disabled: boolean;
  onChange: (params: ArchetypeParams) => void;
}

function SliderField({
  label, tooltip, value, min, max, step, unit, disabled, onChange,
}: {
  label: string; tooltip: string; value: number; min: number; max: number;
  step?: number; unit?: string; disabled: boolean; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">
          {label} <Tip text={tooltip} />
        </span>
        <span className="text-xs font-semibold text-primary">
          {value}{unit || ""}
        </span>
      </div>
      <Slider
        min={min} max={max} step={step || 1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
        className={disabled ? "opacity-50" : ""}
      />
    </div>
  );
}

function ArchetypeCard({ name, params, disabled, onChange }: ArchetypeCardProps) {
  const [open, setOpen] = useState(false);
  const icon = ARCHETYPE_ICONS[name];
  const desc = ARCHETYPE_DESCRIPTIONS[name];

  // Defensive fallback — guard against missing archetype defaults
  const safeParams: ArchetypeParams = params ?? {
    bankrollMin: 10, bankrollMax: 20, lossTolerance: 50,
    deadSpinTolerance: 10, featureExpectation: 80,
    meaningfulWin: 2, continueAfterBigWin: 50, tiltSensitivity: 50,
  };

  const update = (field: keyof ArchetypeParams, val: number) => {
    onChange({ ...safeParams, [field]: val });
  };

  const tiltLabel = safeParams.tiltSensitivity < 33 ? "Low" : safeParams.tiltSensitivity < 66 ? "Medium" : "High";

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
          <div className="flex items-center gap-2">
            <span className="text-primary">{icon}</span>
            <div>
              <span className="text-sm font-semibold text-foreground">{name}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
          {TIER_3_ARCHETYPES.includes(name) && (
            <span className="ml-2 inline-flex rounded-full bg-[hsl(var(--badge-info-bg))] text-[hsl(var(--badge-info-text))] px-2 py-0.5 text-xs font-semibold shrink-0">
              Tier 3
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0 ml-2", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            {/* Bankroll Range */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">
                Bankroll Range (× bet) <Tip text="Min and max starting bankroll in multiples of bet size" />
              </span>
              <div className="flex items-center gap-2">
                <Input
                  type="number" min={1} max={200} step={1}
                  value={params.bankrollMin}
                  onChange={e => update("bankrollMin", parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  className="max-w-20 h-8 text-sm"
                  placeholder="Min"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="number" min={1} max={500} step={1}
                  value={params.bankrollMax}
                  onChange={e => update("bankrollMax", parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  className="max-w-20 h-8 text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            <SliderField
              label="Loss Tolerance" tooltip="Percentage of bankroll a player will lose before considering exit"
              value={params.lossTolerance} min={20} max={90} unit="%"
              disabled={disabled} onChange={v => update("lossTolerance", v)}
            />

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">
                Dead Spin Tolerance <Tip text="How many consecutive dead spins before frustration builds" />
              </span>
              <Input
                type="number" min={3} max={60} step={1}
                value={params.deadSpinTolerance}
                onChange={e => update("deadSpinTolerance", parseInt(e.target.value) || 0)}
                disabled={disabled}
                className="max-w-20 h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">
                Feature Expectation <Tip text="Max spins a player is willing to wait for a feature trigger" />
              </span>
              <Input
                type="number" min={10} max={500} step={5}
                value={params.featureExpectation}
                onChange={e => update("featureExpectation", parseInt(e.target.value) || 0)}
                disabled={disabled}
                className="max-w-24 h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">
                Meaningful Win Threshold (× bet) <Tip text="What this player type perceives as a 'real win'" />
              </span>
              <Input
                type="number" min={0.5} max={50} step={0.5}
                value={params.meaningfulWin}
                onChange={e => update("meaningfulWin", parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className="max-w-24 h-8 text-sm"
              />
            </div>

            <SliderField
              label="Continue After Big Win" tooltip="Probability a player keeps playing after hitting a big win"
              value={params.continueAfterBigWin} min={0} max={100} unit="%"
              disabled={disabled} onChange={v => update("continueAfterBigWin", v)}
            />

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  Tilt Sensitivity <Tip text="How strongly a losing streak increases exit probability" />
                </span>
                <span className={cn("text-xs font-semibold",
                  tiltLabel === "High" ? "text-destructive" : tiltLabel === "Medium" ? "text-warning" : "text-primary"
                )}>
                  {tiltLabel}
                </span>
              </div>
              <Slider
                min={0} max={100} step={1}
                value={[params.tiltSensitivity]}
                onValueChange={([v]) => update("tiltSensitivity", v)}
                disabled={disabled}
                className={disabled ? "opacity-50" : ""}
              />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface PlayerArchetypeConfigProps {
  onChange?: (config: ArchetypeConfigOutput) => void;
}

export function PlayerArchetypeConfig({ onChange }: PlayerArchetypeConfigProps) {
  const [useDefaults, setUseDefaults] = useState(true);
  const [archetypes, setArchetypes] = useState<Record<string, ArchetypeParams>>(
    () => JSON.parse(JSON.stringify(DEFAULT_VALUES))
  );
  const [playersPerArchetype, setPlayersPerArchetype] = useState("100");
  const [variationIntensity, setVariationIntensity] = useState("Medium");
  const [sectionOpen, setSectionOpen] = useState(true);

  const handleArchetypeChange = (name: string, params: ArchetypeParams) => {
    const next = { ...archetypes, [name]: params };
    setArchetypes(next);
    onChange?.({
      archetypes: next,
      playersPerArchetype: parseInt(playersPerArchetype),
      variationIntensity,
      useDefaults,
    });
  };

  const handleToggle = (checked: boolean) => {
    setUseDefaults(checked);
    if (checked) {
      const defaults = JSON.parse(JSON.stringify(DEFAULT_VALUES));
      setArchetypes(defaults);
      onChange?.({
        archetypes: defaults,
        playersPerArchetype: parseInt(playersPerArchetype),
        variationIntensity,
        useDefaults: checked,
      });
    }
  };

  return (
    <Collapsible open={sectionOpen} onOpenChange={setSectionOpen}>
      <div className="form-section animate-fade-in">
        <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
          <div className="flex items-center gap-2">
            <span className="text-primary"><Users className="h-5 w-5" /></span>
            <span className="form-section-title !mb-0">Player Archetype Configuration</span>
          </div>
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", sectionOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <p className="form-section-description mt-1">
          Customize how each player archetype behaves during simulation
        </p>
        <CollapsibleContent>
          <div className="mt-4 space-y-4">
            {/* Global Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-3 flex-1">
                <Switch checked={useDefaults} onCheckedChange={handleToggle} />
                <span className="text-sm font-medium text-foreground">
                  {useDefaults ? "Using default archetypes" : "Custom archetypes"}
                </span>
              </div>
            </div>

            {/* Simulation Settings */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <span className="text-sm font-semibold text-foreground">Simulation Settings</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">
                    Players per archetype <Tip text="Number of simulated players for each archetype" />
                  </span>
                  <SelectButtons
                    options={PLAYERS_OPTIONS}
                    value={playersPerArchetype}
                    onChange={setPlayersPerArchetype}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">
                    Variation intensity <Tip text="Controls how much individual players differ within each archetype" />
                  </span>
                  <SelectButtons
                    options={VARIATION_OPTIONS}
                    value={variationIntensity}
                    onChange={setVariationIntensity}
                  />
                </div>
              </div>
            </div>

            {/* Archetype Cards */}
            <div className="space-y-3">
              {ARCHETYPE_NAMES.filter(n => !TIER_3_ARCHETYPES.includes(n)).map(name => (
                <ArchetypeCard
                  key={name}
                  name={name}
                  params={archetypes[name]}
                  disabled={useDefaults}
                  onChange={params => handleArchetypeChange(name, params)}
                />
              ))}

              <div className="pt-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tier 3 — Advanced Research Archetypes
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <p className="text-xs text-muted-foreground mb-3 px-1">
                  These archetypes are excluded from standard survival curve simulation. They are included for research, responsible gambling analysis, and future premium features.
                </p>
                {TIER_3_ARCHETYPES.map(name => (
                  <div key={name} className="mb-3">
                    <ArchetypeCard
                      name={name}
                      params={archetypes[name]}
                      disabled={useDefaults}
                      onChange={params => handleArchetypeChange(name, params)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
