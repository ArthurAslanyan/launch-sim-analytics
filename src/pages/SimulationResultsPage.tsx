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
  const [showAllArchetypes, setShowAllArchetypes] = useState(false);
  const [expandedArchetype, setExpandedArchetype] = useState<string | null>(null);

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
      } catch {}
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
                  const overallColor = overallPct >= 75 ? "hsl(160,45%,35%)" : overallPct >= 50 ? "hsl(40,85%,52%)" : "hsl(0,65%,50%)";
                  const dimensions = [
                    { label: "Theme", score: g.themeScore, color: "hsl(270,50%,55%)" },
                    { label: "Mechanics", score: g.mechanicsScore, color: "hsl(200,60%,50%)" },
                    { label: "Features", score: g.featureScore, color: "hsl(160,45%,42%)" },
                    { label: "Volatility", score: g.volatilityScore, color: "hsl(35,85%,52%)" },
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
                                  <span key={fi} className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
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
                                  <span key={fi} className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-400">
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
                                  <span key={fi} className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
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

        {/* ────── Player Archetype Profiles ────── */}
        {behavioralSimulation && (
          <SectionCard title="Player Archetype Profiles" icon={<Users className="h-5 w-5 text-primary" />}>
            <p className="mb-6 text-sm text-muted-foreground">
              How different player types respond to your game's structure. Cards show typical session depth, pressure points, and fit assessment.
            </p>

            {/* Core Archetypes — 3 columns */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              {[
                {
                  id: "casual",
                  name: "Casual Player",
                  emoji: null as string | null,
                  icon: "casual",
                  description: "Sessions: 8–12 min, Loss tolerance: 40%, Exits after 8 dead spins",
                  primaryColor: "hsl(186,70%,45%)",
                  lightColor: "hsl(186,70%,92%)",
                  darkColor: "hsl(186,70%,25%)",
                  survivalAt: { spin10: 95, spin30: 85, spin50: 72, spin100: 48 },
                  pressures: [
                    "Dead spin frequency — too many non-wins exhaust bankroll",
                    "Volatility penalty — high variance causes rapid exits",
                    "Session length — short engagement window means limited bonus exposure"
                  ],
                  fitScore: (() => {
                    const vol = game.volatility === "Low" ? 9 : game.volatility === "Medium" ? 7 : game.volatility === "High" ? 5 : 2;
                    const fdi = results.inputMetrics.featureDependencyIndex > 0.65 ? -2 : 0;
                    return Math.max(2, Math.min(10, vol + fdi));
                  })(),
                  fitLabel: (score: number) => score >= 8 ? "Perfect fit" : score >= 6 ? "Good fit" : score >= 4 ? "Moderate fit" : "Challenging",
                  fitReason: (score: number) =>
                    score >= 8 ? "This game's structure is ideal for Casual players" :
                    score >= 6 ? "This game works well for Casual players with minor caveats" :
                    score >= 4 ? "This game challenges some Casual player expectations" :
                    "This game may struggle to retain Casual players",
                },
                {
                  id: "bonus",
                  name: "Bonus-Seeking Player",
                  emoji: null as string | null,
                  icon: "bonus",
                  description: "Sessions: 12–18 min, Loss tolerance: 68%, Expects features every 45 spins",
                  primaryColor: "hsl(160,65%,42%)",
                  lightColor: "hsl(160,65%,92%)",
                  darkColor: "hsl(160,65%,22%)",
                  survivalAt: { spin10: 98, spin30: 92, spin50: 82, spin100: 65 },
                  pressures: [
                    "Feature trigger frequency — waiting too long kills motivation",
                    "Feature RTP quality — if bonus wins are weak, abandonment spikes",
                    "Pacing perception — need regular 'near-miss' triggers to sustain hope"
                  ],
                  fitScore: (() => {
                    const fdi = results.inputMetrics.featureDependencyIndex >= 0.55 && results.inputMetrics.featureDependencyIndex <= 0.75 ? 9 : 6;
                    const vol = game.volatility === "High" || game.volatility === "Very High" ? 1 : 0;
                    return Math.max(4, Math.min(10, fdi + vol));
                  })(),
                  fitLabel: (score: number) => score >= 8 ? "Perfect fit" : score >= 6 ? "Good fit" : score >= 4 ? "Moderate fit" : "Challenging",
                  fitReason: (score: number) =>
                    score >= 8 ? "Your game is built for Bonus-Seeking players" :
                    score >= 6 ? "Bonus-Seeking players will enjoy this game" :
                    score >= 4 ? "Some adjustments would improve Bonus-Seeker engagement" :
                    "This game doesn't align well with Bonus-Seeking expectations",
                },
                {
                  id: "volatility",
                  name: "Volatility-Seeking Player",
                  emoji: null as string | null,
                  icon: "volatility",
                  description: "Sessions: 15–25 min, Loss tolerance: 85%, Expects 12×+ feature wins",
                  primaryColor: "hsl(120,70%,48%)",
                  lightColor: "hsl(120,70%,92%)",
                  darkColor: "hsl(120,70%,28%)",
                  survivalAt: { spin10: 99, spin30: 95, spin50: 88, spin100: 72 },
                  pressures: [
                    "Top win potential — games with <5000× max win feel underwhelming",
                    "Volatility authenticity — if variance is too low, feels boring despite label",
                    "Feature multiplier quality — need massive wins to justify the grind"
                  ],
                  fitScore: (() => {
                    const vol = game.volatility === "Very High" ? 10 : game.volatility === "High" ? 8 : 4;
                    const topWin = game.topWin >= 5000 ? 1 : -2;
                    return Math.max(3, Math.min(10, vol + topWin));
                  })(),
                  fitLabel: (score: number) => score >= 8 ? "Excellent fit" : score >= 6 ? "Good fit" : score >= 4 ? "Moderate fit" : "Challenging",
                  fitReason: (score: number) =>
                    score >= 8 ? "Volatility Seekers will be captivated by this game" :
                    score >= 6 ? "This game appeals to Volatility-Seeking players" :
                    score >= 4 ? "Missing elements that Volatility Seekers crave" :
                    "This game doesn't meet Volatility-Seeker expectations",
                },
              ].map(arch => {
                const isExpanded = expandedArchetype === arch.id;
                return (
                  <button
                    key={arch.id}
                    onClick={() => setExpandedArchetype(isExpanded ? null : arch.id)}
                    className="group rounded-2xl border-2 bg-card p-6 text-left transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                    style={{
                      borderColor: isExpanded ? arch.primaryColor : "hsl(var(--border))",
                      backgroundColor: isExpanded ? arch.lightColor : "hsl(var(--card))",
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="pt-0.5">
                          {arch.icon && ArchetypeIcons[arch.icon as keyof typeof ArchetypeIcons](arch.primaryColor)}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg leading-tight">{arch.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                            {arch.fitLabel(arch.fitScore)}
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex flex-col items-center justify-center rounded-xl p-4 min-w-[90px] text-center"
                        style={{ backgroundColor: arch.primaryColor }}
                      >
                        <p className="text-3xl font-black text-white tabular-nums">
                          {arch.fitScore.toFixed(1)}
                        </p>
                        <p className="text-xs font-bold text-white/90 mt-0.5">Fit Score</p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {arch.description}
                    </p>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground">Session Depth</p>
                        <p className="text-xs font-bold" style={{ color: arch.primaryColor }}>
                          {arch.survivalAt.spin50}% active @ spin 50
                        </p>
                      </div>
                      <div className="h-3 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(30, Math.min(100, arch.survivalAt.spin50))}%`,
                            backgroundColor: arch.primaryColor,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: arch.primaryColor }}
                      />
                      <p className="text-xs font-semibold" style={{ color: arch.darkColor }}>
                        {arch.fitReason(arch.fitScore)}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 group-hover:text-foreground transition-colors">
                      {isExpanded ? "Click to collapse details" : "Click to view pressure points & survival data"}
                    </p>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t-2 space-y-5" style={{ borderTopColor: arch.primaryColor }}>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                            Survival Curve
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { label: "Spin 10", val: arch.survivalAt.spin10 },
                              { label: "Spin 30", val: arch.survivalAt.spin30 },
                              { label: "Spin 50", val: arch.survivalAt.spin50 },
                              { label: "Spin 100", val: arch.survivalAt.spin100 },
                            ].map(pt => (
                              <div
                                key={pt.label}
                                className="rounded-lg p-3 text-center border-2"
                                style={{
                                  borderColor: arch.lightColor,
                                  backgroundColor: arch.lightColor,
                                }}
                              >
                                <p className="text-2xl font-black tabular-nums" style={{ color: arch.primaryColor }}>
                                  {pt.val}%
                                </p>
                                <p className="text-xs font-medium text-muted-foreground mt-1">{pt.label}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Percentage of {arch.name}s still actively playing at that spin count. Higher = more engaged.
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                            Why They Might Exit
                          </p>
                          <ul className="space-y-2.5">
                            {arch.pressures.map((p, pi) => (
                              <li key={pi} className="flex items-start gap-3">
                                <div
                                  className="h-2 w-2 rounded-full mt-2 shrink-0"
                                  style={{ backgroundColor: arch.primaryColor }}
                                />
                                <span className="text-sm text-muted-foreground leading-relaxed">{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div
                          className="rounded-lg p-3 text-sm"
                          style={{ backgroundColor: arch.lightColor }}
                        >
                          <p style={{ color: arch.darkColor, fontWeight: 600 }}>
                            💡 Consider: {
                              arch.id === "casual"
                                ? "Reduce volatility or increase base game hit frequency to match expectations"
                                : arch.id === "bonus"
                                ? "Ensure feature trigger frequency aligns with player anticipation window (45 spins max)"
                                : arch.id === "volatility"
                                ? "Increase maximum win potential and volatility authenticity to attract high-variance players"
                                : ""
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Edge Case Archetypes — clearer visual separation */}
            <div className="mt-8 rounded-2xl border-2 border-border/30 bg-secondary/10 p-6">
              <div className="mb-5">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  📊 Niche Segments
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  These archetypes represent smaller but important player segments. Review their fit scores if targeting these audiences.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    id: "budget",
                    name: "Budget-Constrained",
                    emoji: null as string | null,
                    icon: "budget",
                    description: "Strict bankroll limits (5–10× bet), low loss tolerance (22%), exits after 7 dead spins",
                    primaryColor: "hsl(35,85%,52%)",
                    lightColor: "hsl(35,85%,92%)",
                    darkColor: "hsl(35,85%,32%)",
                    fitScore: (() => {
                      const vol = game.volatility === "Low" || game.volatility === "Medium" ? 8 : 3;
                      const bgt = (game.rtpBreakdown?.baseGameRtp ?? 0) < 0.45 ? -3 : 0;
                      return Math.max(2, Math.min(9, vol + bgt));
                    })(),
                    fitLabel: (score: number) => score >= 7 ? "Good fit" : score >= 5 ? "Moderate fit" : "Challenging",
                  },
                  {
                    id: "progress",
                    name: "Progress-Oriented",
                    emoji: null as string | null,
                    icon: "progress",
                    description: "Value achievement & cross-session goals, moderate loss tolerance (58%), need progression mechanics",
                    primaryColor: "hsl(210,80%,50%)",
                    lightColor: "hsl(210,80%,92%)",
                    darkColor: "hsl(210,80%,30%)",
                    fitScore: (() => {
                      const hasProgress = game.specialMechanics?.some(m => m.includes("Collection") || m.includes("Unlock")) ? 5 : 0;
                      return Math.max(3, Math.min(9, 5 + hasProgress));
                    })(),
                    fitLabel: (score: number) => score >= 7 ? "Good fit" : score >= 5 ? "Moderate fit" : "Challenging",
                  },
                ].map(arch => (
                  <div
                    key={arch.id}
                    className="rounded-xl border-2 bg-card p-4 hover:shadow-md transition-all"
                    style={{
                      borderColor: arch.lightColor,
                      backgroundColor: arch.lightColor,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{arch.emoji}</span>
                        <div>
                          <h5 className="font-bold text-sm">{arch.name}</h5>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {arch.fitLabel(arch.fitScore)}
                          </p>
                        </div>
                      </div>
                      <div
                        className="rounded-lg px-3 py-2 text-center"
                        style={{ backgroundColor: arch.primaryColor }}
                      >
                        <p className="text-2xl font-black text-white tabular-nums">
                          {arch.fitScore.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{arch.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable summary */}
            <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="text-sm font-bold text-foreground mb-2">Next Steps</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Focus on the archetype(s) with the highest fit scores — these are your natural audience. For archetypes scoring below 5, consider structural adjustments (volatility, feature pacing, base game hit rate) or accept a narrower target market. Click core archetype cards to explore pressure points and survival data.
                  </p>
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
                        { label: "Session Start", value: 100 },
                        { label: "Spin 30", value: Math.round(results.behavioralSimulation?.survivalData?.find(r => r.spin === 30)?.casual_survival ?? 100) },
                        { label: "Spin 60", value: Math.round(results.behavioralSimulation?.survivalData?.find(r => r.spin === 60)?.casual_survival ?? 100) },
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
                        {[0, 1, 2, 3, 4].map((i) => (
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
