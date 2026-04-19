// NOTE: This component is currently unused. Kept for future integration.
import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  Info,
  BarChart3,
  Crosshair,
} from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  MatchInput,
  MatchedGameLegacy as MatchedGame,
  MarketInsight,
  findSimilarGamesLegacy as findSimilarGames,
  computeSaturation,
  generateMarketInsights,
} from "@/lib/referenceGames";

interface MarketIntelligenceProps {
  input: MatchInput;
  conceptName?: string;
}

// ─── Section Card (local, matches results page style) ─────────
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

// ─── Similarity Heatmap ───────────────────────────────────────
function SimilarityHeatmap({ matches }: { matches: MatchedGame[] }) {
  const dimensions = ["theme", "gameplay", "features"] as const;
  const labels = { theme: "Theme", gameplay: "Mechanics", features: "Features" };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left p-2 font-medium text-muted-foreground">Game</th>
            {dimensions.map(d => (
              <th key={d} className="p-2 text-center font-medium text-muted-foreground">{labels[d]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.game.name}>
              <td className="p-2 font-medium">{m.game.name}</td>
              {dimensions.map(d => {
                const val = m.breakdown[d];
                const opacity = Math.max(0.1, val / 100);
                return (
                  <td key={d} className="p-2 text-center">
                    <div
                      className="mx-auto flex h-8 w-14 items-center justify-center rounded text-xs font-semibold"
                      style={{
                        backgroundColor: `hsla(160, 45%, 35%, ${opacity})`,
                        color: val > 50 ? "white" : "hsl(var(--foreground))",
                      }}
                    >
                      {val}%
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Custom Scatter Tooltip ──────────────────────────────────
function ScatterTooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold">{data.name}</p>
      <p className="text-muted-foreground">Volatility: {data.volatilityLabel}</p>
      <p className="text-muted-foreground">Session Friendliness: {data.y}%</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function MarketIntelligence({ input, conceptName }: MarketIntelligenceProps) {
  const matches = useMemo(() => findSimilarGames(input), [input]);
  const saturation = useMemo(() => computeSaturation(matches), [matches]);
  const insights = useMemo(() => generateMarketInsights(matches, input), [matches, input]);

  const volMap: Record<string, number> = { "Low": 1, "Medium": 2, "High": 3, "Very High": 4 };
  const volLabelMap: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High", 4: "Very High" };

  const scatterData = useMemo(() => {
    const points: Array<{ x: number; y: number; name: string; volatilityLabel: string; isConcept: boolean }> = matches.map(m => ({
      x: volMap[m.game.volatility] ?? 2,
      y: m.game.sessionFriendliness,
      name: m.game.name,
      volatilityLabel: m.game.volatility as string,
      isConcept: false,
    }));
    points.push({
      x: volMap[input.volatility] ?? 2,
      y: 50,
      name: conceptName || "Your Concept",
      volatilityLabel: input.volatility as string,
      isConcept: true,
    });
    return points;
  }, [matches, input, conceptName]);

  const saturationBarData = [
    { name: "Similar Games", value: saturation.totalSimilar },
    { name: "High Presence", value: saturation.highPresenceCount },
  ];

  const saturationColor = saturation.level === "Very High" || saturation.level === "High"
    ? "hsl(var(--destructive))"
    : saturation.level === "Medium"
    ? "hsl(45, 80%, 50%)"
    : "hsl(160, 45%, 35%)";

  return (
    <div className="space-y-8">
      {/* ── Similar Games Table ── */}
      <SectionCard
        title="Similar Games Identified"
        icon={<Globe className="h-5 w-5 text-primary" />}
      >
        <Table>
          <TableHeader>
            <TableRow className="data-table-header">
              <TableHead>Game Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="text-center">Year</TableHead>
              <TableHead>Gameplay</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="text-right">Match</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((m) => (
              <TableRow key={m.game.name}>
                <TableCell className="font-semibold">{m.game.name}</TableCell>
                <TableCell className="text-muted-foreground">{m.game.provider}</TableCell>
                <TableCell className="text-center">{m.game.releaseYear}</TableCell>
                <TableCell>{m.game.gameplayStructures.join(", ")}</TableCell>
                <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                  {m.game.features.join(", ")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Progress value={m.score} className="h-2 w-16" />
                    <span className="w-10 text-right font-mono font-semibold text-sm">{m.score}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Heatmap */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3">Similarity Heatmap</h4>
          <SimilarityHeatmap matches={matches} />
        </div>
      </SectionCard>

      {/* ── Market Saturation ── */}
      <SectionCard
        title="Market Saturation Index"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={saturationBarData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={110} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {saturationBarData.map((_, i) => (
                    <Cell key={i} fill="hsl(160, 45%, 35%)" />
                  ))}
                  <LabelList dataKey="value" position="right" style={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Saturation Level</p>
              <span
                className="inline-flex rounded-full px-3 py-1 text-sm font-bold"
                style={{
                  backgroundColor: `${saturationColor}20`,
                  color: saturationColor,
                }}
              >
                {saturation.level}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{saturation.interpretation}</p>
          </div>
        </div>
      </SectionCard>

      {/* ── Competitive Positioning Map ── */}
      <SectionCard
        title="Competitive Positioning Map"
        icon={<Crosshair className="h-5 w-5 text-primary" />}
      >
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0.5, 4.5]}
                ticks={[1, 2, 3, 4]}
                tickFormatter={(v) => volLabelMap[v] || ""}
                label={{ value: "Volatility", position: "insideBottom", offset: -5, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 100]}
                label={{ value: "Session Friendliness", angle: -90, position: "insideLeft", offset: 10, style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } }}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <Tooltip content={<ScatterTooltipContent />} />
              <Scatter data={scatterData.filter(d => !d.isConcept)} fill="hsl(160, 45%, 35%)" />
              <Scatter data={scatterData.filter(d => d.isConcept)} fill="hsl(var(--primary))" shape="star" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "hsl(160, 45%, 35%)" }} />
            Reference Games
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            {conceptName || "Your Concept"}
          </span>
        </div>
      </SectionCard>

      {/* ── Market Insights ── */}
      <SectionCard
        title="Market Intelligence Insights"
        icon={<Info className="h-5 w-5 text-primary" />}
      >
        <div className="space-y-3">
          {insights.map((insight, i) => (
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
              <p className="text-sm">{insight.text}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
