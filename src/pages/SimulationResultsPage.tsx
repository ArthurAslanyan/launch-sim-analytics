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
  RefreshCw,
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
import { cn } from "@/lib/utils";

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

// Minimal Archetype Icons
const ArchetypeIcons = {
  casual: (color: string) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="8" r="3.5" stroke={color} strokeWidth="1.5" />
      <path d="M14 12V20M8 15C8 15 8 18 14 18C20 18 20 15 20 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bonus: (color: string) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="10" stroke={color} strokeWidth="1.5" />
      <path d="M14 9V19M9 14H19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  volatility: (color: string) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="6,18 10,10 14,15 18,8 22,16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="18" y1="8" x2="22" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  budget: (color: string) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="8" width="16" height="12" rx="1.5" stroke={color} strokeWidth="1.5" />
      <line x1="14" y1="8" x2="14" y2="20" stroke={color} strokeWidth="1.5" />
      <circle cx="14" cy="14" r="1.5" fill={color} />
    </svg>
  ),
  progress: (color: string) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="8,18 12,12 16,16 20,8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18,8H22V12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ─── Main Page ───────────────────────────────────────────────

export default function SimulationResultsPage() {
  const navigate = useNavigate();
  const [game, setGame] = useState<GameConcept | null>(null);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [market, setMarket] = useState<MarketAnalysis | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);

  useEffect(() => {
    try {
      const gameData = sessionStorage.getItem("launchindex_game");
      const resultsData = sessionStorage.getItem("launchindex_results");
      if (gameData && resultsData) {
        const g = JSON.parse(gameData) as GameConcept;
        const r = JSON.parse(resultsData) as SimulationResults;
        setGame(g);
        setResults(r);

        setMarketLoading(true);
        runMarketAnalysis(g).then(m => { setMarket(m); setMarketLoading(false); }).catch(() => setMarketLoading(false));
      }
    } catch (err) {
      console.error("Failed to load stored simulation data:", err);
      try {
        sessionStorage.removeItem("launchindex_game");
        sessionStorage.removeItem("launchindex_results");
      } catch (cleanupErr) {
        console.warn("Failed to clean up sessionStorage:", cleanupErr);
      }
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
            {/* ────── Section 2 — Similar Games & Similarity Analysis ────── */}
            <SectionCard title="Similar Games Analysis" icon={<Crosshair className="h-5 w-5 text-primary" />}>
              <p className="text-sm text-muted-foreground mb-4">
                Multi-dimensional similarity scoring across theme, mechanics, features, and volatility profile.
              </p>
              <div className="space-y-4">
                {market.similarGames.slice(0, 4).map((g, i) => {
                  const overallPct = Math.round(g.matchScore);
                  const overallColor = overallPct >= 75 ? "#2E8950" : overallPct >= 50 ? "#5B9F8B" : "#7B8C6F";
                  const dimensions = [
                    { label: "Theme", score: g.themeScore, color: "#5B9F8B" },
                    { label: "Mechanics", score: g.mechanicsScore, color: "#3D6955" },
                    { label: "Features", score: g.featureScore, color: "#2E8950" },
                    { label: "Volatility", score: g.volatilityScore, color: "#4A7BA7" },
                  ];
                  return (
                    <div key={i} className="rounded-xl border bg-card p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="text-base font-bold">{g.name}</h4>
                            <PresenceBadge level={g.marketPresence} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {g.provider} · {g.releaseYear} · {g.coreMechanics}
                          </p>
                        </div>
                        <div className="flex flex-col items-center min-w-[80px]">
                          <div className="relative h-16 w-16">
                            <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                              <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                              <circle
                                cx="18" cy="18" r="14" fill="none"
                                stroke={overallColor}
                                strokeWidth="3"
                                strokeDasharray={`${overallPct * 0.88} 88`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: overallColor }}>
                              {overallPct}%
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">Match</span>
                        </div>
                      </div>

                      <div className="grid gap-2 mb-4">
                        {dimensions.map(d => (
                          <div key={d.label} className="flex items-center gap-3">
                            <span className="text-xs font-medium text-muted-foreground w-20 text-right">{d.label}</span>
                            <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${d.score}%`, backgroundColor: d.color }}
                              />
                            </div>
                            <span className="text-xs font-bold tabular-nums w-10 text-right" style={{ color: d.color }}>
                              {d.score}%
                            </span>
                          </div>
                        ))}
                      </div>

                      {(g.sharedFeatures.length > 0 || g.missingFeatures.length > 0 || g.uniqueFeatures.length > 0) && (
                        <div className="flex flex-wrap gap-4 pt-3 border-t">
                          {g.sharedFeatures.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Shared Features</p>
                              <div className="flex flex-wrap gap-1">
                                {g.sharedFeatures.map((f, fi) => (
                                  <span key={fi} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs" style={{ backgroundColor: "#E8F4EE", borderColor: "#2E8950", color: "#2E8950" }}>
                                    <CheckCircle2 className="h-3 w-3" /> {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {g.missingFeatures.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Your Concept Has (They Don't)</p>
                              <div className="flex flex-wrap gap-1">
                                {g.missingFeatures.map((f, fi) => (
                                  <span key={fi} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs" style={{ backgroundColor: "#EEF2F8", borderColor: "#4A7BA7", color: "#4A7BA7" }}>
                                    <Zap className="h-3 w-3" /> {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {g.uniqueFeatures.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1.5">They Have (You Don't)</p>
                              <div className="flex flex-wrap gap-1">
                                {g.uniqueFeatures.map((f, fi) => (
                                  <span key={fi} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs" style={{ backgroundColor: "#F0F2ED", borderColor: "#7B8C6F", color: "#7B8C6F" }}>
                                    <AlertTriangle className="h-3 w-3" /> {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </>
        )}

        {/* ────── Session Journey — Interactive Survival ────── */}
        {behavioralSimulation && (
          <SectionCard title="Session Journey by Player Type" icon={<Users className="h-5 w-5 text-primary" />}>
            <p className="mb-6 text-sm text-muted-foreground">
              How long does each player type stay engaged? Hover over pressure points to see where they typically exit.
            </p>

            <div className="space-y-6">
              {/* Archetype Legend + Quick Fit Assessment — 5 Archetypes */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {(results.archetypeFitScores ?? []).map(arch => {
                  const colorMap: Record<string, string> = {
                    "Casual Player": "#5B9F8B",
                    "Bonus-Seeking Player": "#3D6955",
                    "Volatility-Seeking Player": "#2E8950",
                    "Budget-Constrained Player": "#7B8C6F",
                    "Progress-Oriented Player": "#4A7BA7",
                  };
                  const color = colorMap[arch.archetype] ?? "#5B9F8B";
                  const hasModifiers = arch.gambleAdjustment !== 0 || arch.symbolSwapAdjustment !== 0;
                  return (
                    <div key={arch.archetype} className="rounded-lg border p-3 flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <p className="text-sm font-semibold leading-tight truncate" title={arch.archetype}>
                          {arch.archetype.replace(" Player", "")}
                        </p>
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <p className="text-xs text-muted-foreground truncate">{arch.fitLabel}</p>
                        <p className="text-xl font-bold tabular-nums leading-none shrink-0" style={{ color }}>
                          {arch.finalScore.toFixed(1)}
                        </p>
                      </div>
                      {hasModifiers && (
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          Base: {arch.baseScore.toFixed(1)}
                          {arch.gambleAdjustment !== 0 && (
                            <span className={arch.gambleAdjustment > 0 ? "text-green-600" : "text-red-600"}>
                              {" "}{arch.gambleAdjustment > 0 ? "+" : ""}{arch.gambleAdjustment.toFixed(1)} gamble
                            </span>
                          )}
                          {arch.symbolSwapAdjustment !== 0 && (
                            <span className={arch.symbolSwapAdjustment > 0 ? "text-green-600" : "text-red-600"}>
                              {" "}{arch.symbolSwapAdjustment > 0 ? "+" : ""}{arch.symbolSwapAdjustment.toFixed(1)} swap
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Main Chart — Session Survival */}
              <div className="rounded-lg border bg-card p-5">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={behavioralSimulation.survivalData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="spin"
                        label={{
                          value: "Spin Count",
                          position: "insideBottom",
                          offset: -5,
                          style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
                        }}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        label={{
                          value: "% Sessions Active",
                          angle: -90,
                          position: "insideLeft",
                          offset: 5,
                          style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
                        }}
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
                      <Line
                        type="monotone"
                        dataKey="casual_survival"
                        name="Casual Player"
                        stroke="#5B9F8B"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bonus_survival"
                        name="Bonus-Seeking Player"
                        stroke="#3D6955"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="volatility_survival"
                        name="Volatility-Seeking Player"
                        stroke="#2E8950"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="budget_survival"
                        name="Budget-Constrained Player"
                        stroke="#7B8C6F"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        dot={{ r: 2.5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="progress_survival"
                        name="Progress-Oriented Player"
                        stroke="#4A7BA7"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={{ r: 2.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend moved below chart */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t">
                  {[
                    { name: "Casual Player", color: "#5B9F8B", line: "solid" },
                    { name: "Bonus-Seeking", color: "#3D6955", line: "solid" },
                    { name: "Volatility-Seeking", color: "#2E8950", line: "solid" },
                    { name: "Budget-Constrained", color: "#7B8C6F", line: "dashed" },
                    { name: "Progress-Oriented", color: "#4A7BA7", line: "dashed" },
                  ].map(leg => (
                    <div key={leg.name} className="flex items-center gap-2">
                      <div
                        className="w-6 h-0.5"
                        style={{
                          backgroundColor: leg.color,
                          borderBottom: leg.line === "dashed" ? `2px dashed ${leg.color}` : "none",
                        }}
                      />
                      <span className="text-xs font-medium text-muted-foreground">{leg.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Insights */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: "Early Exits (Spins 0–30)",
                    description: "Casual & Budget-Constrained players drop fastest here due to dead spin clusters. Casual players rarely make it past spin 25.",
                    color: "#5B9F8B",
                  },
                  {
                    title: "Mid-Session (Spins 30–70)",
                    description: "Bonus-Seeking players stay engaged hunting for features. Volatility Seekers push past 50 spins. This is your feature trigger window — if triggers are too infrequent, expect Bonus players to churn here.",
                    color: "#3D6955",
                  },
                  {
                    title: "Late Sessions (Spins 70+)",
                    description: "Only Volatility Seekers reliably reach here. Progress-Oriented players persist if progression mechanics are present. If your max win or feature payouts disappoint, expect rapid abandonment.",
                    color: "#2E8950",
                  },
                ].map((phase, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-4"
                    style={{
                      backgroundColor: `${phase.color}08`,
                      borderColor: `${phase.color}30`,
                    }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: phase.color }}>
                      {phase.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{phase.description}</p>
                  </div>
                ))}
              </div>

              {/* Edge Cases Callout */}
              <div className="rounded-lg border border-border/30 bg-secondary/10 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  📊 About Budget-Constrained & Progress-Oriented
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">Budget-Constrained Players</p>
                    <p className="text-sm text-muted-foreground">
                      Exit before spin 10 if volatility is high or hit rate is low. Shown as dashed line. Fit score reflects whether your volatility/RTP mix supports tight bankrolls (5–10× bet).
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">Progress-Oriented Players</p>
                    <p className="text-sm text-muted-foreground">
                      Persist longer if the game includes collection mechanics or unlockables. Shown as dashed line. Fit score reflects whether your game has progression hooks.
                    </p>
                  </div>
                </div>
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
                  margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
                  barSize={52}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="archetype"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={70}
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
              <div className="grid gap-6 lg:grid-cols-3 auto-rows-fr">
                {/* Overall score */}
                <div
                  className="rounded-xl border-2 p-6 flex flex-col items-center text-center h-full"
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
                <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2 h-full">
                  {subs.map(s => {
                    const c = s.value >= 7 ? "hsl(160,45%,35%)" : s.value >= 5 ? "hsl(40,85%,52%)" : "hsl(0,65%,50%)";
                    return (
                      <div key={s.label} className="rounded-lg border bg-card p-4 h-full flex flex-col">
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
              <p className="text-xs text-muted-foreground mb-4 -mt-2">
                ℹ Population estimates are reproducible for the same game inputs. Different inputs produce structural variations of ±5%.
              </p>

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
                  {(() => {
                    const retentionData = [
                      { label: "Session Start", value: 100 },
                      { label: "Spin 30", value: Math.round(results.behavioralSimulation?.survivalData?.find(r => r.spin === 30)?.casual_survival ?? 100) },
                      { label: "Spin 60", value: Math.round(results.behavioralSimulation?.survivalData?.find(r => r.spin === 60)?.casual_survival ?? 100) },
                      { label: "D1 Return", value: results.simulatedPopulation.retentionD1 },
                      { label: "D7 Return", value: results.simulatedPopulation.retentionD7 },
                    ];
                    return (
                      <ResponsiveContainer>
                        <BarChart data={retentionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                          <Tooltip formatter={(v: number) => [`${v}%`, "Players remaining"]} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {retentionData.map((d, i) => (
                              <Cell
                                key={i}
                                fill={
                                  d.value >= 60 ? "#2E8950" :
                                  d.value >= 30 ? "#E6A933" :
                                  "#C84B4B"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Session survival uses Casual Player archetype as the retention baseline. D1/D7 are structurally derived estimates.
                </p>
              </div>
            </>
          )}

        </SectionCard>
        )}

        {/* ────── Data Interpretation Guide ────── */}
        {results.dataInterpretation && results.dataInterpretation.length > 0 && (
          <SectionCard title="Data Interpretation Guide" icon={<BarChart3 className="h-5 w-5 text-primary" />}>
            <p className="text-sm text-muted-foreground mb-4">
              Detailed breakdown of key metrics, benchmarks, and actionable recommendations tied to this simulation.
            </p>
            <div className="space-y-6">
              {results.dataInterpretation.map((interp, idx) => (
                <div key={idx} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">{interp.category}</h4>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {interp.metrics.map((metric, i) => {
                      const verdictColors = {
                        excellent: { border: "#2E8950", bg: "#E8F4EE", text: "#145230" },
                        good: { border: "#3D6955", bg: "#EBF1ED", text: "#1D3D2D" },
                        average: { border: "#7B8C6F", bg: "#F0F2ED", text: "#3D4538" },
                        poor: { border: "#C84B4B", bg: "#FDECEC", text: "#7A2828" },
                      };
                      const colors = verdictColors[metric.verdict];
                      return (
                        <div key={i} className="rounded-md border-l-4 p-3" style={{ borderLeftColor: colors.border, backgroundColor: colors.bg }}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs font-semibold" style={{ color: colors.text }}>{metric.name}</span>
                            <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded" style={{ color: colors.text, backgroundColor: "rgba(255,255,255,0.5)" }}>
                              {metric.verdict.charAt(0).toUpperCase() + metric.verdict.slice(1)}
                            </span>
                          </div>
                          <p className="text-lg font-bold" style={{ color: colors.text }}>{metric.value}</p>
                          <p className="text-xs mt-1" style={{ color: colors.text }}>{metric.explanation}</p>
                          {metric.benchmark && (
                            <p className="text-[11px] mt-1 italic opacity-75" style={{ color: colors.text }}>
                              Benchmark: {metric.benchmark}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-md bg-muted/50 p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold mb-1">What This Means</p>
                        <p className="text-xs text-muted-foreground">{interp.narrative}</p>
                      </div>
                    </div>
                  </div>

                  {interp.actionable.length > 0 && (
                    <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold mb-1">Recommended Actions</p>
                          <ul className="space-y-1">
                            {interp.actionable.map((action, ai) => (
                              <li key={ai} className="text-xs text-muted-foreground flex gap-2">
                                <span className="text-primary">→</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ────── Gamble Feature Impact ────── */}
        {results.gambleImpact && results.gambleImpact.notes.length > 0 && (
          <SectionCard title="Gamble Feature Impact" icon={<Zap className="h-5 w-5 text-primary" />}>
            <p className="text-sm text-muted-foreground mb-4">
              Behavioral effect of the gamble feature on player archetypes and retention metrics.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Configuration
                </p>
                <ul className="space-y-1.5">
                  {results.gambleImpact.notes.map((note, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Quantitative Impact
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Session Variance</span>
                    <span className="font-bold text-foreground">
                      ×{results.gambleImpact.sessionVarianceMultiplier.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">D7 Retention</span>
                    <span className={cn(
                      "font-bold",
                      results.gambleImpact.retentionD7Adjustment >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {results.gambleImpact.retentionD7Adjustment >= 0 ? "+" : ""}
                      {results.gambleImpact.retentionD7Adjustment} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Per-Archetype Fit Adjustment
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(results.gambleImpact.archetypeFitAdjustments).map(([archetype, adjustment]) => {
                  if (adjustment === 0) return null;
                  const isPositive = adjustment > 0;
                  return (
                    <div
                      key={archetype}
                      className={cn(
                        "rounded-lg border p-3 flex items-center justify-between",
                        isPositive ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                      )}
                    >
                      <span className="text-sm font-medium">
                        {archetype.replace(" Player", "")}
                      </span>
                      <span className={cn(
                        "text-sm font-bold tabular-nums",
                        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {isPositive ? "+" : ""}{adjustment.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ────── Symbol Swap Impact ────── */}
        {results.symbolSwapImpact && results.symbolSwapImpact.notes.length > 0 && (
          <SectionCard title="Symbol Swap Impact" icon={<RefreshCw className="h-5 w-5 text-primary" />}>
            <p className="text-sm text-muted-foreground mb-4">
              Behavioral effect of the symbol swap mechanic on player archetypes and win frequency.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Configuration
                </p>
                <ul className="space-y-1.5">
                  {results.symbolSwapImpact.notes.map((note, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-foreground">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Quantitative Impact
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">RTP Contribution</span>
                    <span className="font-bold text-green-600">
                      +{results.symbolSwapImpact.estimatedRtpContribution.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Win Frequency Boost</span>
                    <span className="font-bold text-green-600">
                      {((results.symbolSwapImpact.estimatedWinFrequencyBoost - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-muted-foreground">D1 Retention Boost</span>
                    <span className="font-bold text-primary">
                      +{results.symbolSwapImpact.retentionD1Boost} pts
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">D7 Retention Boost</span>
                    <span className="font-bold text-primary">
                      +{results.symbolSwapImpact.retentionD7Boost} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Per-Archetype Fit Adjustment
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(results.symbolSwapImpact.archetypeFitAdjustments).map(([archetype, adjustment]) => {
                  if (adjustment === 0) return null;
                  const isPositive = adjustment > 0;
                  return (
                    <div
                      key={archetype}
                      className={cn(
                        "rounded-lg border p-3 flex items-center justify-between",
                        isPositive ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                      )}
                    >
                      <span className="text-sm font-medium">
                        {archetype.replace(" Player", "")}
                      </span>
                      <span className={cn(
                        "text-sm font-bold tabular-nums",
                        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {isPositive ? "+" : ""}{adjustment.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
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
