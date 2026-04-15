import { useState } from "react";
import {
  Users, Zap, Target, Activity, Wallet, Sparkles,
  ChevronDown, HelpCircle,
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
  "Casual Player": <Sparkles className="h-4 w-4" />,
  "Bonus Seeker": <Target className="h-4 w-4" />,
  "Volatility Seeker": <Zap className="h-4 w-4" />,
  "Budget Player": <Wallet className="h-4 w-4" />,
  "Engagement Seeker": <Activity className="h-4 w-4" />,
};

const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  "Casual Player": "Seeks steady engagement and frequent small rewards. Sensitive to boredom and dead spins.",
  "Bonus Seeker": "Focused on triggering features. High patience when rewards feel reachable, rapid churn otherwise.",
  "Volatility Seeker": "Accepts long dry periods in pursuit of large wins. Ignores small rewards.",
  "Budget Player": "Highly sensitive to loss rate and bankroll depletion. Exits early under pressure.",
  "Engagement Seeker": "Responds to pacing and stimulation. Stays longer when the experience feels active.",
};

const DEFAULT_VALUES: Record<string, ArchetypeParams> = {
  "Casual Player": {
    bankrollMin: 10, bankrollMax: 20, lossTolerance: 47,
    deadSpinTolerance: 12, featureExpectation: 80,
    meaningfulWin: 2, continueAfterBigWin: 30, tiltSensitivity: 40,
  },
  "Bonus Seeker": {
    bankrollMin: 15, bankrollMax: 30, lossTolerance: 62,
    deadSpinTolerance: 20, featureExpectation: 50,
    meaningfulWin: 3, continueAfterBigWin: 60, tiltSensitivity: 50,
  },
  "Volatility Seeker": {
    bankrollMin: 20, bankrollMax: 50, lossTolerance: 80,
    deadSpinTolerance: 30, featureExpectation: 120,
    meaningfulWin: 5, continueAfterBigWin: 80, tiltSensitivity: 20,
  },
  "Budget Player": {
    bankrollMin: 5, bankrollMax: 12, lossTolerance: 28,
    deadSpinTolerance: 8, featureExpectation: 60,
    meaningfulWin: 1.5, continueAfterBigWin: 20, tiltSensitivity: 85,
  },
  "Engagement Seeker": {
    bankrollMin: 10, bankrollMax: 25, lossTolerance: 55,
    deadSpinTolerance: 15, featureExpectation: 70,
    meaningfulWin: 2.5, continueAfterBigWin: 50, tiltSensitivity: 45,
  },
};

const ARCHETYPE_NAMES = Object.keys(DEFAULT_VALUES);
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

  const update = (field: keyof ArchetypeParams, val: number) => {
    onChange({ ...params, [field]: val });
  };

  const tiltLabel = params.tiltSensitivity < 33 ? "Low" : params.tiltSensitivity < 66 ? "Medium" : "High";

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
              {ARCHETYPE_NAMES.map(name => (
                <ArchetypeCard
                  key={name}
                  name={name}
                  params={archetypes[name]}
                  disabled={useDefaults}
                  onChange={params => handleArchetypeChange(name, params)}
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
