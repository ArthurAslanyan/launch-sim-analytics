import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertCircle, TrendingUp, Activity, Zap } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ChartContainer } from "@/components/ChartContainer";
import { MetricCard, RecommendationBadge, ScoreBadge } from "@/components/MetricCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  GameConcept,
  SimulationResults,
  getSurvivalCurveData,
  getEndReasonData,
  getFeatureImpactData,
  getBankrollDepletionData,
  getDurationData,
} from "@/lib/simulation";

const CHART_COLORS = [
  "hsl(160, 45%, 35%)",
  "hsl(180, 35%, 45%)",
  "hsl(200, 40%, 50%)",
  "hsl(40, 50%, 55%)",
  "hsl(25, 45%, 50%)",
];

const END_REASON_COLORS = {
  "Low Engagement": "hsl(200, 40%, 50%)",
  "Loss Tolerance": "hsl(40, 50%, 55%)",
  "Bankroll Depleted": "hsl(0, 60%, 50%)",
  "No Bonus": "hsl(280, 40%, 50%)",
  "Time Limit": "hsl(160, 45%, 35%)",
};

export default function SimulationResultsPage() {
  const navigate = useNavigate();
  const [game, setGame] = useState<GameConcept | null>(null);
  const [results, setResults] = useState<SimulationResults | null>(null);

  useEffect(() => {
    const gameData = sessionStorage.getItem("launchindex_game");
    const resultsData = sessionStorage.getItem("launchindex_results");

    if (gameData && resultsData) {
      setGame(JSON.parse(gameData));
      setResults(JSON.parse(resultsData));
    }
  }, []);

  if (!game || !results) {
    return (
      <DashboardLayout title="No Simulation Data">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">No simulation results found</h2>
          <p className="mb-6 text-muted-foreground">
            Run a game evaluation to see behavioral simulation results.
          </p>
          <Button onClick={() => navigate("/evaluate")}>
            Start New Evaluation
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const survivalData = getSurvivalCurveData(results);
  const endReasonData = getEndReasonData(results);
  const featureImpactData = getFeatureImpactData(results);
  const bankrollData = getBankrollDepletionData(results);
  const durationData = getDurationData(results);
  const archetypes = results.archetypeResults.map((r) => r.archetype);

  return (
    <DashboardLayout
      title="Behavioral Simulation Report"
      subtitle={`Analysis for "${game.gameName}"`}
    >
      <div className="space-y-8">
        {/* Score Summary */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-8 md:justify-start">
              <ScoreBadge
                score={results.structuralStabilityScore}
                label="Structural Stability"
              />
              <ScoreBadge
                score={results.earlySessionRiskScore}
                label="Early-Session Risk"
                thresholds={{ good: 30, moderate: 50 }}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="score-badge score-badge-info">
                  {results.featureDependencyLevel}
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Feature Dependency
                </span>
              </div>
            </div>
            <RecommendationBadge recommendation={results.recommendation} />
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Avg Session Duration"
            value={`${(results.archetypeResults.reduce((s, r) => s + r.avgDuration, 0) / results.archetypeResults.length).toFixed(1)} min`}
            variant="neutral"
            icon={<Activity className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            label="Survival at 60 Spins"
            value={`${(results.archetypeResults.reduce((s, r) => s + r.survivalAt60, 0) / results.archetypeResults.length).toFixed(0)}%`}
            variant={results.archetypeResults.reduce((s, r) => s + r.survivalAt60, 0) / results.archetypeResults.length > 50 ? "positive" : "warning"}
            icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            label="Feature Impact"
            value={`+${((results.archetypeResults.reduce((s, r) => s + r.avgDurationWithFeature - r.avgDurationWithoutFeature, 0) / results.archetypeResults.length)).toFixed(1)} min`}
            description="Session duration increase with bonus"
            variant="positive"
            icon={<Zap className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            label="Avg Bankroll Depletion"
            value={`${(results.archetypeResults.reduce((s, r) => s + r.avgBankrollDepletion, 0) / results.archetypeResults.length).toFixed(0)}%`}
            variant={results.archetypeResults.reduce((s, r) => s + r.avgBankrollDepletion, 0) / results.archetypeResults.length < 60 ? "positive" : "warning"}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Session Survival Chart */}
          <ChartContainer
            title="Session Survival by Player Archetype"
            description="Percentage of active sessions remaining at each spin count"
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={survivalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="spins"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: "Spins", position: "insideBottom", offset: -5 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: "Active Sessions (%)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {archetypes.map((archetype, index) => (
                  <Line
                    key={archetype}
                    type="monotone"
                    dataKey={archetype}
                    stroke={CHART_COLORS[index]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Average Duration Chart */}
          <ChartContainer
            title="Average Session Duration by Archetype"
            description="Minutes per session across player types"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  dataKey="archetype"
                  type="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="average" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Why Sessions End Chart */}
          <ChartContainer
            title="Why Sessions End"
            description="Distribution of session termination reasons"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={endReasonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="archetype" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="Low Engagement" stackId="a" fill={END_REASON_COLORS["Low Engagement"]} />
                <Bar dataKey="Loss Tolerance" stackId="a" fill={END_REASON_COLORS["Loss Tolerance"]} />
                <Bar dataKey="Bankroll Depleted" stackId="a" fill={END_REASON_COLORS["Bankroll Depleted"]} />
                <Bar dataKey="No Bonus" stackId="a" fill={END_REASON_COLORS["No Bonus"]} />
                <Bar dataKey="Time Limit" stackId="a" fill={END_REASON_COLORS["Time Limit"]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Feature Impact Chart */}
          <ChartContainer
            title="Impact of Bonus Features on Session Length"
            description="Session duration comparison with and without feature triggers"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImpactData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="archetype" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="With Feature" fill={CHART_COLORS[0]} />
                <Bar dataKey="Without Feature" fill={CHART_COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Bankroll Depletion Chart */}
          <ChartContainer
            title="Bankroll Depletion Rate by Archetype"
            description="Average percentage of starting bankroll lost per session"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankrollData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                <YAxis
                  dataKey="archetype"
                  type="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, "Depletion"]}
                />
                <Bar dataKey="depletion" radius={[0, 4, 4, 0]}>
                  {bankrollData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.depletion > 70 ? "hsl(0, 60%, 50%)" : entry.depletion > 50 ? "hsl(40, 50%, 55%)" : CHART_COLORS[0]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Archetype Fit Table */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h3 className="text-lg font-semibold">Archetype Fit & Structural Risk</h3>
            <p className="text-sm text-muted-foreground">
              Detailed assessment of game mechanics compatibility with each player type
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="data-table-header">
                  <TableHead>Archetype</TableHead>
                  <TableHead>Session Robustness</TableHead>
                  <TableHead>Volatility Tolerance</TableHead>
                  <TableHead>Bankroll Sensitivity</TableHead>
                  <TableHead>Overall Fit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(results.overallFit).map(([archetype, fit]) => (
                  <TableRow key={archetype}>
                    <TableCell className="font-medium">{archetype}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        fit.robustness === "High" ? "bg-[hsl(var(--badge-success-bg))] text-[hsl(var(--badge-success-text))]" :
                        fit.robustness === "Medium" ? "bg-[hsl(var(--badge-warning-bg))] text-[hsl(var(--badge-warning-text))]" :
                        "bg-[hsl(var(--badge-info-bg))] text-[hsl(var(--badge-info-text))]"
                      }`}>
                        {fit.robustness}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        fit.volatilityTolerance === "High" ? "bg-[hsl(var(--badge-success-bg))] text-[hsl(var(--badge-success-text))]" :
                        fit.volatilityTolerance === "Medium" ? "bg-[hsl(var(--badge-warning-bg))] text-[hsl(var(--badge-warning-text))]" :
                        "bg-[hsl(var(--badge-info-bg))] text-[hsl(var(--badge-info-text))]"
                      }`}>
                        {fit.volatilityTolerance}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        fit.bankrollSensitivity === "Low" ? "bg-[hsl(var(--badge-success-bg))] text-[hsl(var(--badge-success-text))]" :
                        fit.bankrollSensitivity === "Medium" ? "bg-[hsl(var(--badge-warning-bg))] text-[hsl(var(--badge-warning-text))]" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {fit.bankrollSensitivity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        fit.overallFit === "Good" ? "bg-[hsl(var(--badge-success-bg))] text-[hsl(var(--badge-success-text))]" :
                        fit.overallFit === "Moderate" ? "bg-[hsl(var(--badge-warning-bg))] text-[hsl(var(--badge-warning-text))]" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {fit.overallFit}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Risk Summary */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Risk Analysis Summary</h3>
          <div className="whitespace-pre-line text-sm text-muted-foreground">
            {results.riskSummary}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 border-t pt-6">
          <Button variant="outline" onClick={() => navigate("/evaluate")}>
            Run New Evaluation
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
