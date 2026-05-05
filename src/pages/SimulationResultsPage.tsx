import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  Crosshair,
  Shield,
  Clock,
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
  BarChart,
  Bar,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RecommendationBadge, ScoreBadge } from "@/components/MetricCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GameConcept, SimulationResults } from "@/lib/simulation";
import { MarketAnalysis, runMarketAnalysis } from "@/lib/marketAnalysis";

// ─── SVG Gauge ───────────────────────────────────────────────

function SemiGauge({ value, label, size = 120 }: { value: number; label: string; size?: number }) {
  const cx = size / 2;
  const cy = size * 0.56;
  const r = size * 0.38;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const color = value >= 70 ? "hsl(160,45%,35%)" : value >= 40 ? "hsl(40,85%,52%)" : "hsl(0,72%,50%)";

  // Arc helpers
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;
  const trackD = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;

  const angle = Math.PI - pct * Math.PI;
  const fillX = cx + r * Math.cos(angle);
  const fillY = cy - r * Math.sin(angle);
  const largeArc = pct > 0.5 ? 1 : 0;
  const fillD = `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${fillX} ${fillY}`;

  const needleLen = r * 0.85;
  const needleX = cx + needleLen * Math.cos(angle);
  const needleY = cy - needleLen * Math.sin(angle);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.66} viewBox={`0 0 ${size} ${size * 0.66}`}>
        <path d={trackD} fill="none" stroke="hsl(var(--border))" strokeWidth={8} strokeLinecap="round" />
        {pct > 0 && <path d={fillD} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" />}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="hsl(var(--foreground))" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={3} fill="hsl(var(--foreground))" />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={18} fontWeight="bold" fill="hsl(var(--foreground))">{value}</text>
      </svg>
      <span className="text-xs font-medium text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Section Card ────────────────────────────────────────────

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

// ─── Loading skeleton ────────────────────────────────────────

function MarketLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Presence badge ──────────────────────────────────────────

function PresenceBadge({ level }: { level: string }) {
  const cls = level === "High" ? "bg-primary/15 text-primary border-primary/30"
    : level === "Medium" ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
    : "bg-muted text-muted-foreground border-border";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>{level}</span>;
}

// ─── Main Page ───────────────────────────────────────────────

export default function SimulationResultsPage() {
  const navigate = useNavigate();
  const [game, setGame] = useState<GameConcept | null>(null);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [market, setMarket] = useState<MarketAnalysis | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);

  useEffect(() => {
    const gameData = sessionStorage.getItem("launchindex_game");
    const resultsData = sessionStorage.getItem("launchindex_results");
    if (gameData && resultsData) {
      const g = JSON.parse(gameData) as GameConcept;
      setGame(g);
      setResults(JSON.parse(resultsData));

      setMarketLoading(true);
      runMarketAnalysis(g).then(m => { setMarket(m); setMarketLoading(false); }).catch(() => setMarketLoading(false));
    }
  }, []);

  if (!game || !results || !results.archetypeSelection) {
    return (
      <DashboardLayout title="No Simulation Data">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">No simulation results found</h2>
          <p className="mb-6 text-muted-foreground">Run a game evaluation to see behavioral simulation results.</p>
          <Button onClick={() => navigate("/evaluate")}>Start New Evaluation</Button>
        </div>
      </DashboardLayout>
    );
  }

  const {
    inputMetrics,
    sessionBehavior,
    stopReasons,
    behavioralSimulation,
  } = results;
  const archetypeStopReasons = results.archetypeStopReasons ?? [];
  const behavioralInsights = results.behavioralInsights ?? [];
  const riskFlags = results.riskFlags ?? [];

  return (
    <DashboardLayout title="Behavioral Simulation Report" subtitle={`Analysis for "${game.gameName}"`}>
      <div className="space-y-8">

        {/* Score Summary Bar */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 lg:justify-start">
              <ScoreBadge score={results.structuralStabilityScore} label="Structural Stability" />
              <ScoreBadge score={results.earlySessionRiskScore} label="Early-Session Risk" thresholds={{ good: 30, moderate: 50 }} />
              <div className="flex flex-col items-center gap-2">
                <div className="score-badge score-badge-info">{results.featureDependencyLevel}</div>
                <span className="text-sm font-medium text-muted-foreground">Feature Dependency</span>
              </div>
            </div>
            <RecommendationBadge recommendation={results.recommendation} />
          </div>
        </div>

        {/* ────── Section 1 — Concept & Market Position ────── */}
        {marketLoading && <MarketLoadingSkeleton />}
        {!marketLoading && (
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Concept Classification" icon={<Target className="h-5 w-5 text-primary" />}>
            {market ? (
              <div className="flex flex-wrap gap-2">
                {[
                  ["Theme", market.conceptClassification.themeCategory],
                  ["Structure", market.conceptClassification.gameplayStructure],
                  ["Feature Density", market.conceptClassification.featureDensity],
                  ["Volatility", market.conceptClassification.inferredVolatility],
                ].map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/20 px-3 py-1.5 text-sm">
                    <span className="text-muted-foreground">{k}:</span>
                    <span className="font-semibold">{v}</span>
                  </span>
                ))}
              </div>
            ) : <Skeleton className="h-12 w-full" />}
          </SectionCard>

          <SectionCard title="Market Saturation Index" icon={<BarChart3 className="h-5 w-5 text-primary" />}>
            {market ? (
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  {(() => {
                    const gaugeVal = market.marketSaturation.gaugeValue;
                    const heights = [40, 55, 70, 80, gaugeVal, 50, 35];
                    return (
                      <div className="flex items-end gap-1" style={{ height: 96 }}>
                        {heights.map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t transition-all"
                            style={{
                              height: `${h}%`,
                              backgroundColor: i === 4 ? "hsl(var(--primary))" : "hsl(var(--border))",
                            }}
                          />
                        ))}
                      </div>
                    );
                  })()}
                  <p className="mt-2 text-xs text-muted-foreground">{market.marketSaturation.narrative}</p>
                </div>
                <SemiGauge value={market.marketSaturation.gaugeValue} label={market.marketSaturation.level} size={100} />
              </div>
            ) : <Skeleton className="h-24 w-full" />}
          </SectionCard>
        </div>
        )}

        {/* ────── Section 2 — Similar Games Benchmark ────── */}
        {marketLoading && (
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-28 w-full" />
            </div>
          </div>
        )}
        {!marketLoading && market && (
          <>
            <SectionCard title="Similar Games Identified" icon={<Users className="h-5 w-5 text-primary" />}>
              <Table>
                <TableHeader>
                  <TableRow className="data-table-header">
                    <TableHead>Game Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-center">Year</TableHead>
                    <TableHead>Core Mechanics</TableHead>
                    <TableHead className="text-center">Presence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {market.similarGames.slice(0, 4).map((g, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>{g.provider}</TableCell>
                      <TableCell className="text-center">{g.releaseYear}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.coreMechanics}</TableCell>
                      <TableCell className="text-center"><PresenceBadge level={g.marketPresence} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>

            <SectionCard title="Similarity Heatmap" icon={<Crosshair className="h-5 w-5 text-primary" />}>
              {market.similarityMatrix.games.length > 0 && (
                <div>
                  <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${market.similarityMatrix.games.length}, 1fr)` }}>
                    <div />
                    {market.similarityMatrix.games.map((g, i) => (
                      <div key={i} className="truncate text-center text-xs font-medium text-muted-foreground px-1">
                        {g.name.split(" ").slice(0, 2).join(" ")}
                      </div>
                    ))}
                    {(["Theme", "Mechanics", "Features"] as const).map(dim => (
                      <React.Fragment key={dim}>
                        <div className="text-xs font-medium py-2">{dim}</div>
                        {market.similarityMatrix.games.map((g, i) => {
                          const score = dim === "Theme" ? g.themeScore : dim === "Mechanics" ? g.mechanicsScore : g.featureScore;
                          const alpha = 0.12 + (score / 100) * 0.72;
                          return (
                            <div
                              key={`${dim}-${i}`}
                              className="flex items-center justify-center rounded py-2 text-xs font-semibold"
                              style={{
                                backgroundColor: `hsla(160,45%,35%,${alpha})`,
                                color: score > 50 ? "hsl(160,10%,95%)" : "hsl(var(--foreground))",
                              }}
                            >
                              {score}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </>
        )}

        {/* ────── Section 3 — Behavioral Simulation ────── */}
        {behavioralSimulation && (
          <SectionCard title="Session Survival by Player Archetype" icon={<Users className="h-5 w-5 text-primary" />}>
            <p className="mb-4 text-sm text-muted-foreground">Deterministic decay model showing estimated session survival across player archetypes.</p>
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={behavioralSimulation.survivalData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="spin" label={{ value: "Spin Count", position: "insideBottom", offset: -2, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} label={{ value: "% Sessions Active", angle: -90, position: "insideLeft", offset: 10, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} formatter={(value: number) => [`${value}%`, undefined]} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                    iconSize={10}
                    formatter={(value) => <span style={{ color: "hsl(var(--foreground))", marginRight: 8 }}>{value}</span>}
                  />
                  <Line type="monotone" dataKey="casual_survival" name="Casual Player" stroke="hsl(160,45%,30%)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="bonus_survival" name="Bonus-Seeking Player" stroke="hsl(160,40%,50%)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="volatility_survival" name="Volatility-Seeking Player" stroke="hsl(155,35%,70%)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="budget_survival" name="Budget-Constrained Player" stroke="hsl(40,80%,52%)" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="progress_survival" name="Progress-Oriented Player" stroke="hsl(200,60%,50%)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 2.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Below chart: stop reasons + early fragility */}
            <div className="mt-6 flex justify-center">
              <div className="rounded-lg border p-4 flex flex-col items-center justify-center text-center max-w-sm w-full">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Early-Session Fragility</p>
                {(() => {
                  const ep = sessionBehavior.earlyExitProbability;
                  const level = ep >= 50 ? "High" : ep >= 30 ? "Medium" : "Low";
                  const cls = ep >= 50 ? "text-destructive" : ep >= 30 ? "text-amber-500" : "text-emerald-500";
                  const sub = ep >= 50 ? "Risk of early churn is elevated" : ep >= 30 ? "Risk of early churn is moderate" : "Risk of early churn is low";
                  return (
                    <>
                      <p className={`text-3xl font-bold ${cls}`}>{level}</p>
                      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── Why Sessions End — per-archetype stacked bar ── */}
        {archetypeStopReasons.length > 0 && (
          <SectionCard title="Why Sessions End" icon={<BarChart3 className="h-5 w-5 text-primary" />}>
            <p className="text-sm text-muted-foreground mb-4">
              Stop-reason distribution per player archetype, derived from archetype-specific behavioral parameters. Each column sums to 100%.
            </p>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={archetypeStopReasons}
                  margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
                  barSize={52}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="archetype"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickLine={false}
                    label={{
                      value: "Archetype",
                      position: "insideBottom",
                      offset: -18,
                      style: { fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600 },
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickLine={false}
                    label={{
                      value: "Why Sessions End",
                      angle: -90,
                      position: "insideLeft",
                      offset: 12,
                      style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    cursor={{ fill: "hsl(var(--border))", opacity: 0.3 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(value) => (
                      <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="boredomLowEngagement"
                    name="Boredom / Low Engagement"
                    stackId="a"
                    fill="hsl(160,45%,22%)"
                  />
                  <Bar
                    dataKey="lossToleranceExceeded"
                    name="Loss Tolerance Exceeded"
                    stackId="a"
                    fill="hsl(160,38%,42%)"
                  />
                  <Bar
                    dataKey="bankrollDepleted"
                    name="Bankroll Depleted"
                    stackId="a"
                    fill="hsl(158,30%,60%)"
                  />
                  <Bar
                    dataKey="sessionTimeLimit"
                    name="Session Time Limit"
                    stackId="a"
                    fill="hsl(155,22%,78%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {archetypeStopReasons.map((a, i) => {
                const dominant = Object.entries({
                  "Boredom": a.boredomLowEngagement,
                  "Loss Tolerance": a.lossToleranceExceeded,
                  "Bankroll": a.bankrollDepleted,
                  "Time Limit": a.sessionTimeLimit,
                }).sort((x, y) => y[1] - x[1])[0];
                return (
                  <div key={i} className="rounded-lg border bg-secondary/30 px-3 py-2 text-center">
                    <p className="text-xs font-semibold text-foreground">{a.archetype}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Primary: <span className="font-medium text-foreground">{dominant[0]}</span>
                    </p>
                    <p className="text-lg font-bold text-primary">{dominant[1]}%</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* ────── Section 4 — Market & Reference Comparison ────── */}
        {marketLoading && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <Skeleton className="h-6 w-48" /><Skeleton className="h-48 w-full" />
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
              <Skeleton className="h-6 w-48" /><Skeleton className="h-48 w-full" />
            </div>
          </div>
        )}
        {!marketLoading && market && (
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Session Duration vs Market" icon={<BarChart3 className="h-5 w-5 text-primary" />}>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Your Game", value: market.sessionBenchmark.simulatedAvgMinutes },
                    { name: "Similar Games Avg", value: market.sessionBenchmark.typicalForSimilarMinutes },
                  ]} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft", offset: 10, style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 } }} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <Cell fill="hsl(160,45%,35%)" />
                      <Cell fill="hsl(160,35%,55%)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-center">
                <Badge variant={market.sessionBenchmark.deltaMinutes < 0 ? "destructive" : "default"} className={market.sessionBenchmark.deltaMinutes >= 0 ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : ""}>
                  Delta: {market.sessionBenchmark.deltaPercent >= 0 ? "+" : ""}{market.sessionBenchmark.deltaPercent}% · {market.sessionBenchmark.deltaMinutes >= 0 ? "+" : ""}{market.sessionBenchmark.deltaMinutes} min
                </Badge>
              </div>
            </SectionCard>

            <SectionCard title="Competitive Positioning Map" icon={<Crosshair className="h-5 w-5 text-primary" />}>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="x" name="Volatility" domain={[0, 10]} label={{ value: "Volatility →", position: "insideBottom", offset: -5, style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 } }} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis type="number" dataKey="y" name="Session Friendliness" domain={[0, 10]} label={{ value: "Session Friendliness", angle: -90, position: "insideLeft", offset: 10, style: { fill: "hsl(var(--muted-foreground))", fontSize: 11 } }} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <ZAxis range={[60, 60]} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} formatter={(_: unknown, name: string) => [name, ""]} labelFormatter={() => ""} />
                    <Scatter
                      name="Reference Games"
                      data={market.competitivePositioning.referencePoints.map(p => ({ x: p.volatilityScore, y: p.sessionFriendliness, name: p.name }))}
                      fill="hsl(160,40%,50%)"
                      opacity={0.8}
                    />
                    {market.competitivePositioning.thisGame && (
                      <Scatter
                        name={market.competitivePositioning.thisGame.label ?? "Your Concept"}
                        data={[{
                          x: market.competitivePositioning.thisGame.volatilityScore ?? 5,
                          y: market.competitivePositioning.thisGame.sessionFriendliness ?? 5,
                          name: market.competitivePositioning.thisGame.label ?? "Your Concept",
                        }]}
                        fill="hsl(160,45%,25%)"
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ────── Section 5 — Insights & Improvement ────── */}
        {(market?.improvementCards || results.improvements) && (
          <SectionCard title="Insights & Improvement Suggestions" icon={<Lightbulb className="h-5 w-5 text-primary" />}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(market?.improvementCards ?? (results.improvements ?? []).map(imp => ({
                issue: imp.category,
                rootCause: "Derived from simulation analysis",
                suggestedImprovement: imp.suggestion,
                tradeOffNote: imp.priority === "high" ? "High priority — address before launch" : "Consider for next iteration",
              }))).map((card, i) => (
                <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issue</span>
                    <span className="text-sm font-bold">{card.issue}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{card.rootCause}</p>
                  <p className="text-xs text-muted-foreground">{card.suggestedImprovement}</p>
                  <div className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">
                    {card.tradeOffNote}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ────── Performance Dashboard ────── */}
        {results.performanceScore && (
        <SectionCard title="Performance Dashboard" icon={<Shield className="h-5 w-5 text-primary" />}>
          {(() => {
            const ps = results.performanceScore;
            const overallColor =
              ps.overall >= 8 ? "hsl(160,45%,35%)" :
              ps.overall >= 6 ? "hsl(40,85%,52%)" :
              ps.overall >= 4 ? "hsl(40,85%,52%)" : "hsl(0,65%,50%)";
            const subs = [
              { label: "Session Quality", value: ps.sessionQuality, icon: <Clock className="h-4 w-4 text-muted-foreground" />, desc: "Avg session length, early exit rate, spin depth" },
              { label: "Player Retention", value: ps.playerRetention, icon: <Users className="h-4 w-4 text-muted-foreground" />, desc: "D1 and D7 return probability" },
              { label: "Feature Efficiency", value: ps.featureEfficiency, icon: <Zap className="h-4 w-4 text-muted-foreground" />, desc: "Feature encounter rate, pacing quality" },
              { label: "Market Fit", value: ps.marketFit, icon: <Target className="h-4 w-4 text-muted-foreground" />, desc: "Structural robustness, differentiation" },
            ];
            return (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Overall score */}
                <div
                  className="rounded-xl border-2 p-6 flex flex-col items-center text-center"
                  style={{ borderColor: overallColor }}
                >
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Overall Performance</p>
                  <p className="text-6xl font-bold mt-2" style={{ color: overallColor }}>
                    {ps.overall.toFixed(1)}
                  </p>
                  <Badge className="mt-2" style={{ backgroundColor: overallColor, color: "white" }}>{ps.label}</Badge>
                  <div className="w-full h-2 rounded-full bg-secondary mt-4 overflow-hidden">
                    <div className="h-full" style={{ width: `${(ps.overall / 10) * 100}%`, backgroundColor: overallColor }} />
                  </div>
                  <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
                    <span>0 — Poor</span>
                    <span>5 — Average</span>
                    <span>10 — Excellent</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{ps.summary}</p>
                </div>

                {/* Sub-scores */}
                <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">
                  {subs.map(s => {
                    const c = s.value >= 7 ? "hsl(160,45%,35%)" : s.value >= 5 ? "hsl(40,85%,52%)" : "hsl(0,65%,50%)";
                    return (
                      <div key={s.label} className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {s.icon}
                          <span className="text-sm font-semibold">{s.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold" style={{ color: c }}>{s.value.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">/ 10</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-secondary mt-2 overflow-hidden">
                          <div className="h-full" style={{ width: `${(s.value / 10) * 100}%`, backgroundColor: c }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Population metrics */}
          {results.simulatedPopulation && (
            <>
              <div className="flex items-center gap-2 mt-8 mb-4">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Simulated Population Metrics — {results.simulatedPopulation.rangeLabel}
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Players", value: results.simulatedPopulation.totalPlayers.toLocaleString(), sub: results.simulatedPopulation.rangeLabel, icon: <Users className="h-4 w-4 text-muted-foreground" /> },
                  { label: "Total Rounds", value: results.simulatedPopulation.totalRounds.toLocaleString(), sub: `${results.simulatedPopulation.roundsPerUniquePlayer} per player`, icon: <TrendingUp className="h-4 w-4 text-muted-foreground" /> },
                  { label: "Avg Session", value: `${results.simulatedPopulation.avgSessionDurationMinutes} min`, sub: `${results.simulatedPopulation.avgRoundsPerSession} rounds`, icon: <Clock className="h-4 w-4 text-muted-foreground" /> },
                  { label: "Early Churn", value: `${results.simulatedPopulation.churnRate}%`, sub: "before feature trigger", icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" /> },
                ].map(m => (
                  <div key={m.label} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2 mb-1">
                      {m.icon}
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{m.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* Retention bar chart */}
              <div className="mt-6 rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Simulated Player Retention</h4>
                </div>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        { label: "Spin 30", value: Math.round(results.behavioralSimulation.survivalData.find(r => r.spin === 30)?.casual_survival ?? 70) },
                        { label: "Spin 60", value: Math.round(results.behavioralSimulation.survivalData.find(r => r.spin === 60)?.casual_survival ?? 45) },
                        { label: "D1 Return", value: results.simulatedPopulation.retentionD1 },
                        { label: "D7 Return", value: results.simulatedPopulation.retentionD7 },
                      ]}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip formatter={(v: number) => [`${v}%`, "Players remaining"]} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[0, 1, 2, 3].map((i) => (
                          <Cell key={i} fill={i < 2 ? "hsl(160,45%,35%)" : "hsl(40,85%,52%)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Session survival uses Casual Player archetype as the retention baseline. D1/D7 are structurally derived estimates.
                </p>
              </div>
            </>
          )}

          {/* Recommendation */}
          <div className="mt-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <Badge className="bg-primary/15 text-primary border-primary/30 text-sm font-bold">
                {market?.finalVerdict?.recommendation ?? results.recommendation}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {market?.finalVerdict?.recommendationRationale ?? results.diagnosis}
            </p>
          </div>
        </SectionCard>
        )}

        {/* ────── Behavioral Insights (kept) ────── */}
        <SectionCard title="Behavioral Interpretation" icon={<Info className="h-5 w-5 text-primary" />}>
          <div className="space-y-3">
            {behavioralInsights.map((insight, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-lg p-3 ${
                insight.type === "warning" ? "bg-[hsl(var(--badge-warning-bg))]"
                : insight.type === "positive" ? "bg-[hsl(var(--badge-success-bg))]"
                : "bg-[hsl(var(--badge-info-bg))]"
              }`}>
                {insight.type === "warning" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--badge-warning-text))]" />
                : insight.type === "positive" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--badge-success-text))]" />
                : <Info className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--badge-info-text))]" />}
                <div>
                  <p className="text-sm font-semibold">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ────── Risk Flags (kept) ────── */}
        <SectionCard title="Risk Flags" icon={<AlertTriangle className="h-5 w-5 text-destructive" />}>
          {riskFlags.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-metric-positive" /> No critical risk flags detected.
            </div>
          ) : (
            <div className="space-y-3">
              {riskFlags.map((flag, i) => (
                <div key={i} className={`rounded-lg border p-4 ${flag.severity === "high" ? "border-destructive/30 bg-destructive/5" : "border-[hsl(var(--badge-warning-text))]/30 bg-[hsl(var(--badge-warning-bg))]"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${flag.severity === "high" ? "bg-destructive/10 text-destructive" : "bg-[hsl(var(--badge-warning-bg))] text-[hsl(var(--badge-warning-text))]"}`}>{flag.severity}</span>
                    <span className="text-sm font-bold">{flag.flag}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 border-t pt-6">
          <Button variant="outline" onClick={() => navigate("/evaluate")}>Run New Evaluation</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
