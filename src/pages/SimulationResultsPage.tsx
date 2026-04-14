import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Shield,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
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
} from "@/lib/simulation";
import { MarketIntelligence } from "@/components/MarketIntelligence";
import { MatchInput } from "@/lib/referenceGames";

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

  if (!game || !results || !results.archetypeSelection) {
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

  const { inputMetrics, archetypeSelection, sessionBehavior, featureInteraction, economyBehavior, stopReasons, behavioralInsights, riskFlags, strengths, improvements, diagnosis, behavioralSimulation } = results || {} as SimulationResults;

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

        {/* 1. Selected Archetype */}
        <SectionCard
          title="Selected Player Archetype"
          icon={<Target className="h-5 w-5 text-primary" />}
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 px-4 py-2">
              <span className="text-lg font-bold text-primary">{archetypeSelection.archetype}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{archetypeSelection.reason}</p>
          </div>
        </SectionCard>

        {/* Input Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total RTP"
            value={`${inputMetrics.totalRtp.toFixed(1)}%`}
            variant="neutral"
          />
          <MetricCard
            label="Feature RTP Total"
            value={`${inputMetrics.featureRtpTotal.toFixed(1)}%`}
            variant="neutral"
          />
          <MetricCard
            label="Feature Dependency Index"
            value={`${(inputMetrics.featureDependencyIndex * 100).toFixed(1)}%`}
            variant={inputMetrics.featureDependencyIndex > 0.5 ? "warning" : "positive"}
          />
          <MetricCard
            label="Jackpot Weight"
            value={`${(inputMetrics.jackpotWeight * 100).toFixed(1)}%`}
            variant={inputMetrics.jackpotWeight > 0.08 ? "warning" : "neutral"}
          />
        </div>

        {/* 2. Session Behavior Table */}
        <SectionCard
          title="Session Behavior"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
        >
          <DataTable
            rows={[
              ["Base Session Length", `${sessionBehavior.baseSessionLength} min`],
              ["Adjusted Session Length", `${sessionBehavior.adjustedSessionLength} min`],
              ["Early Exit Probability", `${sessionBehavior.earlyExitProbability}%`],
              ["Survival at Spin 30", `${sessionBehavior.survivalAt30}%`],
              ["Survival at Spin 60", `${sessionBehavior.survivalAt60}%`],
              ["Survival at Spin 120", `${sessionBehavior.survivalAt120}%`],
            ]}
          />
        </SectionCard>

        {/* 3. Feature Interaction Table */}
        <SectionCard
          title="Feature Interaction"
          icon={<Zap className="h-5 w-5 text-primary" />}
        >
          <DataTable
            rows={[
              ["Sessions Reaching Feature", `${featureInteraction.sessionsReachingFeature}%`],
              ["Sessions Reaching Jackpot", `${featureInteraction.sessionsReachingJackpot}%`],
              ["Sessions Ending Before Feature", `${featureInteraction.sessionsEndingBeforeFeature}%`],
            ]}
          />
        </SectionCard>

        {/* 4. Economy Behavior Table */}
        <SectionCard
          title="Economy Behavior"
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
        >
          <DataTable
            rows={[
              ["Bankroll Depletion", `${economyBehavior.bankrollDepletion}%`],
              ["Loss-Driven Exits", `${economyBehavior.lossDrivenExits}%`],
            ]}
          />
        </SectionCard>

        {/* 5. Stop Reasons Table */}
        <SectionCard
          title="Stop Reasons Distribution"
          icon={<Shield className="h-5 w-5 text-primary" />}
        >
          <DataTable
            rows={[
              ["Loss Tolerance Exceeded", `${stopReasons.lossToleranceExceeded}%`],
              ["No Feature Trigger (Frustration)", `${stopReasons.noFeatureTrigger}%`],
              ["Time Limit", `${stopReasons.timeLimit}%`],
              ["Big Win Exit", `${stopReasons.bigWinExit}%`],
            ]}
          />
        </SectionCard>

        {/* Behavioral Simulation Engine - Survival Curves */}
        {behavioralSimulation && (
          <>
            <SectionCard
              title="Session Survival by Player Archetype"
              icon={<Users className="h-5 w-5 text-primary" />}
            >
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Deterministic decay model showing estimated session survival across player archetypes based on loss pressure, dead spin pressure, and feature absence pressure.
                </p>
              </div>
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={behavioralSimulation.survivalData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="spin"
                      label={{ value: "Spin Count", position: "insideBottom", offset: -2, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      label={{ value: "% Sessions Active", angle: -90, position: "insideLeft", offset: 10, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value}%`, undefined]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="casual_survival"
                      name="Casual Player"
                      stroke="hsl(160, 45%, 30%)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bonus_survival"
                      name="Bonus-Seeking Player"
                      stroke="hsl(160, 40%, 50%)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="volatility_survival"
                      name="Volatility-Seeking Player"
                      stroke="hsl(155, 35%, 70%)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Decay Rate Table */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Archetype Decay Rates</h4>
                <Table>
                  <TableHeader>
                    <TableRow className="data-table-header">
                      <TableHead>Archetype</TableHead>
                      <TableHead className="text-right">Decay Rate</TableHead>
                      <TableHead className="text-right">Assessment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {behavioralSimulation.archetypes.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{a.name}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">{a.decayRate.toFixed(3)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.decayRate > 0.7
                              ? "bg-destructive/10 text-destructive"
                              : a.decayRate > 0.5
                              ? "bg-[hsl(var(--badge-warning-bg))] text-[hsl(var(--badge-warning-text))]"
                              : "bg-[hsl(var(--badge-success-bg))] text-[hsl(var(--badge-success-text))]"
                          }`}>
                            {a.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>

            {/* Interpretation Panel */}
            <SectionCard
              title="Survival Interpretation"
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Fastest Drop-Off</p>
                  <p className="text-sm font-semibold">{behavioralSimulation.interpretation.fastestDropOff}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Most Stable</p>
                  <p className="text-sm font-semibold">{behavioralSimulation.interpretation.mostStable}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Early Session Risk (0–30 spins)</p>
                  <p className="text-sm font-semibold">{behavioralSimulation.interpretation.earlySessionRisk}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Retention Driver</p>
                  <p className="text-sm font-semibold">{behavioralSimulation.interpretation.retentionDriver}</p>
                </div>
              </div>
            </SectionCard>
          </>
        )}

        <SectionCard
          title="Behavioral Interpretation"
          icon={<Info className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-3">
            {behavioralInsights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg p-3 ${
                  insight.type === "warning"
                    ? "bg-[hsl(var(--badge-warning-bg))]"
                    : insight.type === "positive"
                    ? "bg-[hsl(var(--badge-success-bg))]"
                    : "bg-[hsl(var(--badge-info-bg))]"
                }`}
              >
                {insight.type === "warning" ? (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--badge-warning-text))]" />
                ) : insight.type === "positive" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--badge-success-text))]" />
                ) : (
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--badge-info-text))]" />
                )}
                <div>
                  <p className="text-sm font-semibold">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 7. Risk Flags */}
        <SectionCard
          title="Risk Flags"
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
        >
          {riskFlags.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-metric-positive" />
              No critical risk flags detected.
            </div>
          ) : (
            <div className="space-y-3">
              {riskFlags.map((flag, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 ${
                    flag.severity === "high"
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-[hsl(var(--badge-warning-text))]/30 bg-[hsl(var(--badge-warning-bg))]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      flag.severity === "high"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-[hsl(var(--badge-warning-bg))] text-[hsl(var(--badge-warning-text))]"
                    }`}>
                      {flag.severity}
                    </span>
                    <span className="text-sm font-bold">{flag.flag}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 8. What Works Well */}
        <SectionCard
          title="What Works Well"
          icon={<CheckCircle2 className="h-5 w-5 text-metric-positive" />}
        >
          <div className="space-y-3">
            {strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-[hsl(var(--badge-success-bg))] p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--badge-success-text))]" />
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 9. Improvement Recommendations */}
        <SectionCard
          title="Improvement Recommendations"
          icon={<Lightbulb className="h-5 w-5 text-primary" />}
        >
          {improvements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No critical improvements needed — game math structure is well-balanced.</p>
          ) : (
            <div className="space-y-3">
              {improvements.map((imp, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-4">
                  <span className={`mt-0.5 inline-flex rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    imp.priority === "high"
                      ? "bg-destructive/10 text-destructive"
                      : imp.priority === "medium"
                      ? "bg-[hsl(var(--badge-warning-bg))] text-[hsl(var(--badge-warning-text))]"
                      : "bg-[hsl(var(--badge-info-bg))] text-[hsl(var(--badge-info-text))]"
                  }`}>
                    {imp.priority}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{imp.category}</p>
                    <p className="text-sm text-muted-foreground">{imp.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 10. One-Line Diagnosis */}
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Diagnosis</p>
          <p className="text-lg font-semibold text-foreground">{diagnosis}</p>
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

// ============================================
// Reusable sub-components
// ============================================

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b p-5">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DataTable({ rows }: { rows: [string, string][] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="data-table-header">
          <TableHead>Metric</TableHead>
          <TableHead className="text-right">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(([label, value], i) => (
          <TableRow key={i}>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell className="text-right font-semibold">{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
