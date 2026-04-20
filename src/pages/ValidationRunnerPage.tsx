import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  BarChart3,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Zap,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { runSimulation, SimulationResults } from "@/lib/simulation";
import {
  VALIDATION_DATASET,
  ValidationEntry,
  getDatasetSummary,
} from "@/lib/validationDataset";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

interface RunResult {
  entry: ValidationEntry;
  results: SimulationResults;
  predictedArchetype: string;
  knownArchetype: string;
  archetypeMatch: boolean;
  sessionDeltaMinutes: number;
  featureDependencyIndex: number;
  structuralStabilityScore: number;
  earlySessionRiskScore: number;
  mismatchReason?: string;
}

type FilterMode = "all" | "correct" | "incorrect";
type SortField = "name" | "volatility" | "accuracy" | "featureDep";

// ── Helpers ──────────────────────────────────────────────────

const ARCHETYPE_COLORS: Record<string, string> = {
  "Casual Player": "hsl(160,45%,35%)",
  "Bonus-Seeking Player": "hsl(200,65%,45%)",
  "Volatility-Seeking Player": "hsl(0,65%,50%)",
  "Balanced Player": "hsl(155,35%,60%)",
  "Budget Player": "hsl(40,85%,50%)",
};

const ARCHETYPE_SHORT: Record<string, string> = {
  "Casual Player": "Casual",
  "Bonus-Seeking Player": "Bonus-Seeking",
  "Volatility-Seeking Player": "Volatility-Seeking",
  "Balanced Player": "Balanced",
  "Budget Player": "Budget",
  "Engagement Seeker": "Engagement",
};

function getMismatchReason(result: RunResult): string | undefined {
  if (result.archetypeMatch) return undefined;
  const predicted = result.predictedArchetype;
  const known = result.knownArchetype;
  const fdi = result.featureDependencyIndex;

  if (predicted === "Bonus-Seeking Player" && known === "Casual Player") {
    return `FDI ${(fdi * 100).toFixed(0)}% > 45% threshold drove Bonus-Seeking prediction, but high base game engagement overrides this for ${known}.`;
  }
  if (predicted === "Casual Player" && (known === "Volatility-Seeking Player" || known === "Bonus-Seeking Player")) {
    return `Base RTP ratio > 60% classified as Casual, but feature excitement profile suggests ${known} dominates.`;
  }
  if (predicted === "Volatility-Seeking Player" && known === "Casual Player") {
    return `High vol + top win > 2000× triggered Volatility-Seeking, but accessible theme/mechanics attract Casual archetype.`;
  }
  if (predicted === "Balanced Player") {
    return `No dominant signal detected — engine defaulted to Balanced. Known audience is clearly ${known}.`;
  }
  return `Predicted "${predicted}" but known primary audience is "${known}". Review threshold calibration.`;
}

function ArchetypePill({ archetype }: { archetype: string }) {
  const color = ARCHETYPE_COLORS[archetype] || "hsl(var(--muted))";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}50`,
      }}
    >
      {ARCHETYPE_SHORT[archetype] ?? archetype}
    </span>
  );
}

function MatchBadge({ match }: { match: boolean }) {
  return match ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--badge-success-bg))] text-[hsl(var(--badge-success-text))] px-2.5 py-0.5 text-xs font-bold">
      <CheckCircle2 className="h-3 w-3" /> Match
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2.5 py-0.5 text-xs font-bold">
      <XCircle className="h-3 w-3" /> Miss
    </span>
  );
}

// ── Accuracy arc gauge (SVG) ──────────────────────────────────

function AccuracyGauge({ pct }: { pct: number }) {
  const size = 180;
  const cx = size / 2;
  const cy = size * 0.58;
  const r = size * 0.4;
  const p = Math.max(0, Math.min(100, pct)) / 100;
  const color = pct >= 70 ? "hsl(160,45%,35%)" : pct >= 50 ? "hsl(40,85%,52%)" : "hsl(0,65%,50%)";
  const startX = cx - r;
  const startY = cy;
  const angle = Math.PI - p * Math.PI;
  const fillX = cx + r * Math.cos(angle);
  const fillY = cy - r * Math.sin(angle);
  const largeArc = p > 0.5 ? 1 : 0;
  const fillD = `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${fillX} ${fillY}`;
  const trackD = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${cx + r} ${startY}`;
  const nl = r * 0.82;
  const nx = cx + nl * Math.cos(angle);
  const ny = cy - nl * Math.sin(angle);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        <path d={trackD} fill="none" stroke="hsl(var(--border))" strokeWidth={14} strokeLinecap="round" />
        {p > 0 && (
          <path d={fillD} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />
        )}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--foreground))" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="hsl(var(--foreground))" />
        <text x={cx} y={cy - 14} textAnchor="middle" fontSize={32} fontWeight="800" fill={color}>
          {pct}%
        </text>
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">
          prediction accuracy
        </text>
      </svg>
    </div>
  );
}

// ── Expandable row ────────────────────────────────────────────

function ResultRow({ r, index }: { r: RunResult; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow
        className={cn(
          "cursor-pointer transition-colors hover:bg-secondary/40",
          !r.archetypeMatch && "bg-destructive/3 hover:bg-destructive/6",
          expanded && "bg-secondary/50"
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <TableCell className="w-8 text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </TableCell>
        <TableCell className="font-semibold">{r.entry.gameName}</TableCell>
        <TableCell className="text-muted-foreground text-sm">{r.entry.provider}</TableCell>
        <TableCell>
          <span className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
            r.entry.gameConcept.volatility === "Very High" ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400" :
            r.entry.gameConcept.volatility === "High" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
            r.entry.gameConcept.volatility === "Medium" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
          )}>
            {r.entry.gameConcept.volatility}
          </span>
        </TableCell>
        <TableCell className="font-mono text-sm">
          {(r.featureDependencyIndex * 100).toFixed(0)}%
        </TableCell>
        <TableCell><ArchetypePill archetype={r.predictedArchetype} /></TableCell>
        <TableCell><ArchetypePill archetype={r.knownArchetype} /></TableCell>
        <TableCell><MatchBadge match={r.archetypeMatch} /></TableCell>
        <TableCell className={cn("font-mono text-sm text-right", r.sessionDeltaMinutes > 3 || r.sessionDeltaMinutes < -3 ? "text-amber-600" : "text-muted-foreground")}>
          {r.sessionDeltaMinutes > 0 ? "+" : ""}{r.sessionDeltaMinutes}m
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-secondary/30 hover:bg-secondary/30">
          <TableCell colSpan={9} className="p-0">
            <div className="px-6 py-4 space-y-4">
              {/* Key metrics row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Structural Stability", value: `${r.structuralStabilityScore}/100` },
                  { label: "Early Session Risk", value: `${r.earlySessionRiskScore}%` },
                  { label: "Feature Dependency", value: `${(r.featureDependencyIndex * 100).toFixed(1)}%` },
                  { label: "Session Delta", value: `${r.sessionDeltaMinutes > 0 ? "+" : ""}${r.sessionDeltaMinutes} min` },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border bg-card px-3 py-2">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="font-semibold text-sm">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Simulation reason */}
              <div className="rounded-lg border-l-4 border-primary/40 bg-primary/5 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Engine reasoning</p>
                <p className="text-sm">{r.results.archetypeSelection.reason}</p>
              </div>

              {/* Mismatch explanation */}
              {!r.archetypeMatch && r.mismatchReason && (
                <div className="rounded-lg border-l-4 border-destructive/50 bg-destructive/5 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-destructive/70 mb-1">
                    Why the prediction missed
                  </p>
                  <p className="text-sm text-muted-foreground">{r.mismatchReason}</p>
                </div>
              )}

              {/* Known outcome context */}
              <div className="rounded-lg border bg-card px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Known market context</p>
                <p className="text-sm text-muted-foreground">{r.entry.knownOutcomes.archetypeReason}</p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function ValidationRunnerPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortField>("accuracy");
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResults, setRunResults] = useState<RunResult[]>([]);

  const summary = getDatasetSummary();

  // Run all simulations
  const runValidation = async () => {
    setIsRunning(true);
    // Allow UI to repaint before blocking computation
    await new Promise((r) => setTimeout(r, 50));

    const results: RunResult[] = VALIDATION_DATASET.map((entry) => {
      const simResults = runSimulation(entry.gameConcept);
      const predicted = simResults.archetypeSelection.archetype;
      const known = entry.knownOutcomes.primaryArchetype;
      const match = predicted === known;

      const predictedSession = simResults.sessionBehavior.adjustedSessionLength;
      const knownSession = entry.knownOutcomes.estimatedSessionLengthMinutes;
      const sessionDelta = Math.round(predictedSession - knownSession);

      const r: RunResult = {
        entry,
        results: simResults,
        predictedArchetype: predicted,
        knownArchetype: known,
        archetypeMatch: match,
        sessionDeltaMinutes: sessionDelta,
        featureDependencyIndex: simResults.inputMetrics.featureDependencyIndex,
        structuralStabilityScore: simResults.structuralStabilityScore,
        earlySessionRiskScore: simResults.earlySessionRiskScore,
      };
      r.mismatchReason = getMismatchReason(r);
      return r;
    });

    setRunResults(results);
    setHasRun(true);
    setIsRunning(false);
  };

  // Accuracy metrics
  const metrics = useMemo(() => {
    if (!runResults.length) return null;
    const correct = runResults.filter((r) => r.archetypeMatch).length;
    const total = runResults.length;
    const accuracyPct = Math.round((correct / total) * 100);

    // By archetype
    const archetypes = [...new Set(runResults.map((r) => r.knownArchetype))];
    const byArchetype = archetypes.map((arch) => {
      const group = runResults.filter((r) => r.knownArchetype === arch);
      const groupCorrect = group.filter((r) => r.archetypeMatch).length;
      return {
        archetype: ARCHETYPE_SHORT[arch] ?? arch,
        total: group.length,
        correct: groupCorrect,
        accuracy: Math.round((groupCorrect / group.length) * 100),
      };
    }).sort((a, b) => b.total - a.total);

    // By volatility
    const volatilities = ["Low", "Medium", "High", "Very High"];
    const byVolatility = volatilities.map((vol) => {
      const group = runResults.filter((r) => r.entry.gameConcept.volatility === vol);
      if (!group.length) return null;
      const groupCorrect = group.filter((r) => r.archetypeMatch).length;
      return {
        volatility: vol,
        total: group.length,
        correct: groupCorrect,
        accuracy: Math.round((groupCorrect / group.length) * 100),
      };
    }).filter(Boolean) as Array<{ volatility: string; total: number; correct: number; accuracy: number }>;

    // Common mismatch patterns
    const mismatches = runResults
      .filter((r) => !r.archetypeMatch)
      .map((r) => `${ARCHETYPE_SHORT[r.predictedArchetype] ?? r.predictedArchetype} → ${ARCHETYPE_SHORT[r.knownArchetype] ?? r.knownArchetype}`);
    const mismatchCounts: Record<string, number> = {};
    mismatches.forEach((m) => { mismatchCounts[m] = (mismatchCounts[m] || 0) + 1; });
    const topMismatches = Object.entries(mismatchCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const avgSessionDelta = Math.round(
      runResults.reduce((s, r) => s + Math.abs(r.sessionDeltaMinutes), 0) / total
    );

    return { correct, total, accuracyPct, byArchetype, byVolatility, topMismatches, avgSessionDelta };
  }, [runResults]);

  // Filtered + sorted results
  const displayResults = useMemo(() => {
    let results = [...runResults];
    if (filter === "correct") results = results.filter((r) => r.archetypeMatch);
    if (filter === "incorrect") results = results.filter((r) => !r.archetypeMatch);
    if (sort === "name") results.sort((a, b) => a.entry.gameName.localeCompare(b.entry.gameName));
    if (sort === "volatility") {
      const order = { Low: 0, Medium: 1, High: 2, "Very High": 3 };
      results.sort((a, b) => (order[b.entry.gameConcept.volatility as keyof typeof order] ?? 0) - (order[a.entry.gameConcept.volatility as keyof typeof order] ?? 0));
    }
    if (sort === "featureDep") results.sort((a, b) => b.featureDependencyIndex - a.featureDependencyIndex);
    if (sort === "accuracy") results.sort((a, b) => (a.archetypeMatch ? 1 : 0) - (b.archetypeMatch ? 1 : 0));
    return results;
  }, [runResults, filter, sort]);

  return (
    <DashboardLayout
      title="Validation Runner"
      subtitle={`Engine accuracy test across ${summary.totalGames} reference games`}
    >
      <div className="space-y-8 max-w-7xl">

        {/* ── Pre-run state ── */}
        {!hasRun && (
          <div className="rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
            <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ready to validate</h2>
            <p className="text-muted-foreground mb-2 max-w-xl mx-auto">
              This will run{" "}
              <span className="font-semibold text-foreground">{summary.totalGames} reference games</span> through
              the simulation engine and compare predicted archetypes against known market outcomes.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Dataset: {summary.byVolatility.Low} Low / {summary.byVolatility.Medium} Medium / {summary.byVolatility.High} High / {summary.byVolatility["Very High"]} Very High volatility
              · {Object.entries(summary.byGameType).map(([t, n]) => `${n} ${t}`).join(" · ")}
            </p>
            <Button
              size="lg"
              onClick={runValidation}
              disabled={isRunning}
              className="min-w-48"
            >
              {isRunning ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Running simulations...
                </>
              ) : (
                <>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Run Validation Suite
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── Results ── */}
        {hasRun && metrics && (
          <>
            {/* ── Hero accuracy row ── */}
            <div className="grid gap-4 lg:grid-cols-4">
              {/* Gauge */}
              <div className="lg:col-span-1 rounded-xl border bg-card p-6 flex flex-col items-center justify-center shadow-sm">
                <AccuracyGauge pct={metrics.accuracyPct} />
                <div className="mt-3 flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[hsl(var(--badge-success-text))]">{metrics.correct}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">{metrics.total - metrics.correct}</p>
                    <p className="text-xs text-muted-foreground">Incorrect</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{metrics.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>

              {/* Accuracy by archetype */}
              <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Accuracy by Archetype
                </h3>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.byArchetype} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="archetype" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                        formatter={(v: number, _: string, props: { payload?: { total?: number; correct?: number } }) => [`${v}% (${props.payload?.correct}/${props.payload?.total})`, "Accuracy"]}
                      />
                      <Bar dataKey="accuracy" radius={[3, 3, 0, 0]} barSize={32}>
                        {metrics.byArchetype.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.accuracy >= 70 ? "hsl(160,45%,35%)" : entry.accuracy >= 50 ? "hsl(40,85%,52%)" : "hsl(0,65%,50%)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key stats */}
              <div className="lg:col-span-1 rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Key Diagnostics
                </h3>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Top Mismatch Patterns</p>
                  <div className="space-y-1.5">
                    {metrics.topMismatches.length > 0 ? metrics.topMismatches.map(([pattern, count], i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-mono">{pattern}</span>
                        <span className="font-bold text-destructive">×{count}</span>
                      </div>
                    )) : (
                      <p className="text-xs text-[hsl(var(--badge-success-text))]">No recurring mismatch patterns</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Avg Session Delta</p>
                  <p className="font-mono font-bold text-lg">
                    ±{metrics.avgSessionDelta}
                    <span className="text-xs text-muted-foreground font-normal ml-1">min vs known</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Accuracy Target</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${metrics.accuracyPct}%`,
                        backgroundColor: metrics.accuracyPct >= 70 ? "hsl(160,45%,35%)" : "hsl(40,85%,52%)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.accuracyPct >= 70 ? "✓ Above 70% target" : `${70 - metrics.accuracyPct}% below 70% target`}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={runValidation}
                  disabled={isRunning}
                >
                  Re-run
                </Button>
              </div>
            </div>

            {/* ── Accuracy by volatility ── */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Accuracy by Volatility Band
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {metrics.byVolatility.map((v) => (
                  <div key={v.volatility} className="rounded-lg border bg-secondary/30 p-4 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{v.volatility}</p>
                    <p
                      className="text-3xl font-black"
                      style={{ color: v.accuracy >= 70 ? "hsl(160,45%,35%)" : v.accuracy >= 50 ? "hsl(40,85%,52%)" : "hsl(0,65%,50%)" }}
                    >
                      {v.accuracy}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{v.correct}/{v.total} games</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Improvement suggestions if accuracy is low ── */}
            {metrics.accuracyPct < 70 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                      Accuracy below 70% target — engine calibration recommended
                    </p>
                    <div className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                      {metrics.topMismatches.some(([p]) => p.includes("Bonus-Seeking → Casual")) && (
                        <p>• <strong>Bonus-Seeking → Casual mismatches:</strong> Lower the featureDependencyIndex threshold for Bonus-Seeking from 45% to 55% in <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">simulation.ts selectArchetype()</code></p>
                      )}
                      {metrics.topMismatches.some(([p]) => p.includes("Balanced")) && (
                        <p>• <strong>Balanced Player defaults:</strong> The "Balanced Player" fallback is too broad. Add a Budget Player condition: targetBankroll === "Low" AND volatility === "Low" → Budget Player.</p>
                      )}
                      {metrics.topMismatches.some(([p]) => p.includes("Volatility-Seeking → Casual")) && (
                        <p>• <strong>Volatility-Seeking → Casual mismatches:</strong> High volatility alone is not sufficient for Volatility-Seeking if the game type is Paylines with low paylines count. Add a paylines weight to the condition.</p>
                      )}
                      <p>• See the expanded rows below for per-game mismatch analysis.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Results table ── */}
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b p-5">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Per-Game Results
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    (click any row to expand)
                  </span>
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filter */}
                  <div className="flex rounded-lg border overflow-hidden text-xs">
                    {(["all", "correct", "incorrect"] as FilterMode[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={cn(
                          "px-3 py-1.5 font-medium capitalize transition-colors",
                          filter === f
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {f === "all" ? `All (${runResults.length})` :
                         f === "correct" ? `✓ Correct (${runResults.filter(r => r.archetypeMatch).length})` :
                         `✗ Incorrect (${runResults.filter(r => !r.archetypeMatch).length})`}
                      </button>
                    ))}
                  </div>
                  {/* Sort */}
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortField)}
                    className="text-xs rounded-lg border bg-card px-3 py-1.5 text-foreground"
                  >
                    <option value="accuracy">Sort: Errors first</option>
                    <option value="name">Sort: Name</option>
                    <option value="volatility">Sort: Volatility</option>
                    <option value="featureDep">Sort: Feature Dep.</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="data-table-header">
                      <TableHead className="w-8" />
                      <TableHead>Game</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Volatility</TableHead>
                      <TableHead>
                        <span className="flex items-center gap-1">
                          FDI
                          <span className="text-xs text-muted-foreground font-normal">(feature dep.)</span>
                        </span>
                      </TableHead>
                      <TableHead>Predicted Archetype</TableHead>
                      <TableHead>Known Archetype</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead className="text-right">
                        <span className="flex items-center justify-end gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Session Δ
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayResults.map((r, i) => (
                      <ResultRow key={r.entry.gameName} r={r} index={i} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* ── Calibration guide ── */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Engine Calibration Guide
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="space-y-2">
                  <p className="font-semibold">How to improve accuracy:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Identify the most common mismatch pattern above</li>
                    <li>Open <code className="bg-secondary px-1 rounded text-xs">src/lib/simulation.ts</code></li>
                    <li>Edit <code className="bg-secondary px-1 rounded text-xs">selectArchetype()</code> thresholds</li>
                    <li>Re-run this validator after each change</li>
                    <li>Commit when accuracy improves without introducing new mismatches</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">Current thresholds in engine:</p>
                  <div className="space-y-1 font-mono text-xs bg-secondary/50 rounded-lg p-3">
                    <p><span className="text-primary">FDI</span> {">"} 45% → Bonus-Seeking Player</p>
                    <p><span className="text-primary">Vol</span> High/Very High + topWin {">"} 2000× → Volatility-Seeking</p>
                    <p><span className="text-primary">baseRtpRatio</span> {">"} 60% → Casual Player</p>
                    <p><span className="text-muted-foreground">else</span> → Balanced Player</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target: 70%+ accuracy. Each threshold change should be tested here before committing.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 border-t pt-6">
              <Button variant="outline" onClick={() => navigate("/evaluate")}>
                Run New Evaluation
              </Button>
              <Button variant="outline" onClick={runValidation} disabled={isRunning}>
                Re-run Validation
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
