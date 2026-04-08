import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Info, 
  Grid3X3, 
  Sparkles, 
  Timer, 
  Plus, 
  Trash2,
  Play,
  PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FormSection, FormField, FormRow } from "@/components/FormSection";
import { MultiSelect, SelectButtons } from "@/components/MultiSelect";
import { GameConcept, Feature, RtpBreakdown, runSimulation } from "@/lib/simulation";

const TARGET_MARKETS = ["UK", "Nordics", "EU", "LATAM", "Global"];
const PLAYER_FOCUS = ["Casual", "Bonus-Seeking", "Volatility-Seeking", "Budget-Constrained", "Progress-Oriented"];
const GRID_LAYOUTS = ["3×5", "4×5", "5×5", "6×5"];
const PAY_STRUCTURES = ["Lines", "Ways", "Cluster"];
const YES_NO = ["Yes", "No"];
const FREQUENCIES = ["Low", "Medium", "High"];
const VOLATILITIES = ["Low", "Medium", "Medium-High", "High"];
const FEATURE_TYPES = ["Free Spins", "Respins", "Multipliers", "Collection", "Bonus Game"];
const VISIBILITY_OPTIONS = ["Always visible", "Occasional", "Hidden"];
const IMPACT_OPTIONS = ["Low", "Medium", "High"];
const SESSION_LENGTHS = ["Short", "Medium", "Long"];
const BONUS_IMPORTANCE = ["Decorative", "Important", "Core"];
const EXCITEMENT_LEVELS = ["Low", "Moderate", "High"];

const createEmptyFeature = (): Feature => ({
  id: crypto.randomUUID(),
  type: "",
  triggerFrequency: "",
  visibility: "",
  winImpact: "",
  progressImpact: "",
});

export default function NewEvaluationPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [gameName, setGameName] = useState("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);
  const [playerFocus, setPlayerFocus] = useState<string[]>([]);
  
  const [gridLayout, setGridLayout] = useState("");
  const [payStructure, setPayStructure] = useState("");
  const [cascades, setCascades] = useState("");
  const [baseHitFrequency, setBaseHitFrequency] = useState("");
  const [volatility, setVolatility] = useState("");
  const [rtpTarget, setRtpTarget] = useState("96.5");
  const [topWin, setTopWin] = useState("5000");

  // RTP Breakdown
  const [baseGameRtp, setBaseGameRtp] = useState("45");
  const [wildRtp, setWildRtp] = useState("5");
  const [respinRtp, setRespinRtp] = useState("3");
  const [freeSpinsRtp, setFreeSpinsRtp] = useState("25");
  const [jackpotRtp, setJackpotRtp] = useState("8");
  const [otherFeatureRtp, setOtherFeatureRtp] = useState("10.5");

  const [features, setFeatures] = useState<Feature[]>([createEmptyFeature()]);

  const [sessionLength, setSessionLength] = useState("");
  const [bonusImportance, setBonusImportance] = useState("");
  const [earlyExcitement, setEarlyExcitement] = useState("");
  const [referenceGames, setReferenceGames] = useState("");

  const addFeature = () => {
    setFeatures([...features, createEmptyFeature()]);
  };

  const removeFeature = (id: string) => {
    if (features.length > 1) {
      setFeatures(features.filter((f) => f.id !== id));
    }
  };

  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    setFeatures(features.map((f) => 
      f.id === id ? { ...f, [field]: value } : f
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const rtpBreakdown: RtpBreakdown = {
      baseGameRtp: parseFloat(baseGameRtp) || 0,
      wildRtp: parseFloat(wildRtp) || 0,
      respinRtp: parseFloat(respinRtp) || 0,
      freeSpinsRtp: parseFloat(freeSpinsRtp) || 0,
      jackpotRtp: parseFloat(jackpotRtp) || 0,
      otherFeatureRtp: parseFloat(otherFeatureRtp) || 0,
    };

    const gameConcept: GameConcept = {
      gameName: gameName || "Untitled Game",
      targetMarkets,
      playerFocus,
      gridLayout,
      payStructure,
      cascades,
      baseHitFrequency,
      volatility,
      rtpTarget: parseFloat(rtpTarget) || 96.5,
      topWin: parseFloat(topWin) || 5000,
      rtpBreakdown,
      features: features.filter((f) => f.type),
      sessionLength,
      bonusImportance,
      earlyExcitement,
      referenceGames,
    };

    const results = runSimulation(gameConcept);

    sessionStorage.setItem("launchindex_game", JSON.stringify(gameConcept));
    sessionStorage.setItem("launchindex_results", JSON.stringify(results));

    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);
    navigate("/results");
  };

  const computedFeatureRtp = (parseFloat(wildRtp) || 0) + (parseFloat(respinRtp) || 0) + 
    (parseFloat(freeSpinsRtp) || 0) + (parseFloat(jackpotRtp) || 0) + (parseFloat(otherFeatureRtp) || 0);
  const computedTotalRtp = (parseFloat(baseGameRtp) || 0) + computedFeatureRtp;

  return (
    <DashboardLayout
      title="Slot Game Concept Evaluation"
      subtitle="Configure game mechanics to run behavioral simulation"
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
        {/* Section 1: Basic Info */}
        <FormSection
          title="Basic Information"
          description="Define the game identity and target audience"
          icon={<Info className="h-5 w-5" />}
        >
          <FormField label="Game Name" required>
            <Input
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name"
              className="max-w-md"
            />
          </FormField>

          <FormField label="Target Markets">
            <MultiSelect
              options={TARGET_MARKETS}
              selected={targetMarkets}
              onChange={setTargetMarkets}
            />
          </FormField>

          <FormField label="Intended Player Focus">
            <MultiSelect
              options={PLAYER_FOCUS}
              selected={playerFocus}
              onChange={setPlayerFocus}
            />
          </FormField>
        </FormSection>

        {/* Section 2: Core Mechanics */}
        <FormSection
          title="Core Mechanics"
          description="Define the fundamental game structure"
          icon={<Grid3X3 className="h-5 w-5" />}
        >
          <FormRow>
            <FormField label="Grid Layout">
              <SelectButtons
                options={GRID_LAYOUTS}
                value={gridLayout}
                onChange={setGridLayout}
              />
            </FormField>

            <FormField label="Pay Structure">
              <SelectButtons
                options={PAY_STRUCTURES}
                value={payStructure}
                onChange={setPayStructure}
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Cascades">
              <SelectButtons
                options={YES_NO}
                value={cascades}
                onChange={setCascades}
              />
            </FormField>

            <FormField label="Base Hit Frequency">
              <SelectButtons
                options={FREQUENCIES}
                value={baseHitFrequency}
                onChange={setBaseHitFrequency}
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Intended Volatility">
              <SelectButtons
                options={VOLATILITIES}
                value={volatility}
                onChange={setVolatility}
              />
            </FormField>

            <FormField label="Top Win (× bet)">
              <Input
                type="number"
                min="100"
                max="50000"
                value={topWin}
                onChange={(e) => setTopWin(e.target.value)}
                placeholder="e.g., 5000"
                className="max-w-32"
              />
            </FormField>
          </FormRow>
        </FormSection>

        {/* Section 2.5: RTP Breakdown */}
        <FormSection
          title="RTP Breakdown"
          description="Define how total RTP is distributed across game layers"
          icon={<PieChart className="h-5 w-5" />}
        >
          <FormRow>
            <FormField label="Total RTP Target (%)">
              <Input
                type="number"
                step="0.01"
                min="85"
                max="99"
                value={rtpTarget}
                onChange={(e) => setRtpTarget(e.target.value)}
                placeholder="e.g., 96.5"
                className="max-w-32"
              />
            </FormField>
            <FormField label="Base Game RTP (%)">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="99"
                value={baseGameRtp}
                onChange={(e) => setBaseGameRtp(e.target.value)}
                placeholder="e.g., 45"
                className="max-w-32"
              />
            </FormField>
          </FormRow>

          <FormRow columns={3}>
            <FormField label="Wild RTP (%)">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={wildRtp}
                onChange={(e) => setWildRtp(e.target.value)}
                placeholder="e.g., 5"
                className="max-w-32"
              />
            </FormField>
            <FormField label="Respin RTP (%)">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={respinRtp}
                onChange={(e) => setRespinRtp(e.target.value)}
                placeholder="e.g., 3"
                className="max-w-32"
              />
            </FormField>
            <FormField label="Free Spins RTP (%)">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={freeSpinsRtp}
                onChange={(e) => setFreeSpinsRtp(e.target.value)}
                placeholder="e.g., 25"
                className="max-w-32"
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Jackpot RTP (%)">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={jackpotRtp}
                onChange={(e) => setJackpotRtp(e.target.value)}
                placeholder="e.g., 8"
                className="max-w-32"
              />
            </FormField>
            <FormField label="Other Feature RTP (%)">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={otherFeatureRtp}
                onChange={(e) => setOtherFeatureRtp(e.target.value)}
                placeholder="e.g., 10.5"
                className="max-w-32"
              />
            </FormField>
          </FormRow>

          {/* Live computed summary */}
          <div className="rounded-lg bg-secondary/50 p-4 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-muted-foreground">Feature RTP Total</span>
                <p className="text-lg font-semibold">{computedFeatureRtp.toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Computed Total RTP</span>
                <p className="text-lg font-semibold">{computedTotalRtp.toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Feature Dependency</span>
                <p className="text-lg font-semibold">
                  {computedTotalRtp > 0 ? (computedFeatureRtp / computedTotalRtp * 100).toFixed(1) : "0.0"}%
                </p>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Section 3: Features */}
        <FormSection
          title="Game Features"
          description="Define bonus features and their characteristics"
          icon={<Sparkles className="h-5 w-5" />}
        >
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className="relative rounded-lg border border-dashed border-border bg-secondary/30 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Feature {index + 1}
                  </span>
                  {features.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(feature.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField label="Feature Type">
                    <SelectButtons
                      options={FEATURE_TYPES}
                      value={feature.type}
                      onChange={(v) => updateFeature(feature.id, "type", v)}
                    />
                  </FormField>

                  <FormField label="Trigger Frequency">
                    <SelectButtons
                      options={FREQUENCIES}
                      value={feature.triggerFrequency}
                      onChange={(v) => updateFeature(feature.id, "triggerFrequency", v)}
                    />
                  </FormField>

                  <FormField label="Visibility">
                    <SelectButtons
                      options={VISIBILITY_OPTIONS}
                      value={feature.visibility}
                      onChange={(v) => updateFeature(feature.id, "visibility", v)}
                    />
                  </FormField>

                  <FormField label="Win Impact">
                    <SelectButtons
                      options={IMPACT_OPTIONS}
                      value={feature.winImpact}
                      onChange={(v) => updateFeature(feature.id, "winImpact", v)}
                    />
                  </FormField>

                  <FormField label="Progress Impact">
                    <SelectButtons
                      options={YES_NO}
                      value={feature.progressImpact}
                      onChange={(v) => updateFeature(feature.id, "progressImpact", v)}
                    />
                  </FormField>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addFeature}
              className="w-full border-dashed"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Feature
            </Button>
          </div>
        </FormSection>

        {/* Section 4: Pacing & Intent */}
        <FormSection
          title="Pacing & Intent"
          description="Define session experience goals"
          icon={<Timer className="h-5 w-5" />}
        >
          <FormRow columns={3}>
            <FormField label="Intended Session Length">
              <SelectButtons
                options={SESSION_LENGTHS}
                value={sessionLength}
                onChange={setSessionLength}
              />
            </FormField>

            <FormField label="Bonus Importance">
              <SelectButtons
                options={BONUS_IMPORTANCE}
                value={bonusImportance}
                onChange={setBonusImportance}
              />
            </FormField>

            <FormField label="Early-Game Excitement">
              <SelectButtons
                options={EXCITEMENT_LEVELS}
                value={earlyExcitement}
                onChange={setEarlyExcitement}
              />
            </FormField>
          </FormRow>

          <FormField label="Reference Games (optional)">
            <Input
              value={referenceGames}
              onChange={(e) => setReferenceGames(e.target.value)}
              placeholder="e.g., Book of Dead, Sweet Bonanza, Starburst"
              className="max-w-lg"
            />
          </FormField>
        </FormSection>

        {/* Submit Button */}
        <div className="flex justify-end border-t pt-6">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !gameName}
            className="min-w-48"
          >
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
