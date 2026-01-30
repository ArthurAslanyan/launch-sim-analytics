import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  variant?: "default" | "positive" | "warning" | "negative" | "neutral";
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  description,
  variant = "default",
  icon,
  className,
}: MetricCardProps) {
  const variantStyles = {
    default: "text-foreground",
    positive: "text-metric-positive",
    warning: "text-metric-warning",
    negative: "text-metric-negative",
    neutral: "text-metric-neutral",
  };

  return (
    <div className={cn("metric-card animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="metric-label">{label}</p>
          <p className={cn("metric-value mt-1", variantStyles[variant])}>{value}</p>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface ScoreBadgeProps {
  score: number;
  label: string;
  thresholds?: { good: number; moderate: number };
}

export function ScoreBadge({ score, label, thresholds = { good: 70, moderate: 40 } }: ScoreBadgeProps) {
  const variant = score >= thresholds.good ? "success" : score >= thresholds.moderate ? "warning" : "info";
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("score-badge", `score-badge-${variant}`)}>
        {score}/100
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

interface RecommendationBadgeProps {
  recommendation: string;
}

export function RecommendationBadge({ recommendation }: RecommendationBadgeProps) {
  const variants: Record<string, string> = {
    "Ready to Launch": "bg-[hsl(var(--badge-success-bg))] text-[hsl(var(--badge-success-text))]",
    "Launch with Adjustments": "bg-[hsl(var(--badge-warning-bg))] text-[hsl(var(--badge-warning-text))]",
    "Requires Significant Revision": "bg-[hsl(var(--badge-info-bg))] text-[hsl(var(--badge-info-text))]",
    "Redesign Recommended": "bg-destructive/10 text-destructive",
  };

  return (
    <div className={cn("recommendation-badge", variants[recommendation] || variants["Launch with Adjustments"])}>
      <span className="text-lg">
        {recommendation === "Ready to Launch" ? "✓" : 
         recommendation === "Launch with Adjustments" ? "⚡" :
         recommendation === "Requires Significant Revision" ? "⚠" : "✗"}
      </span>
      <span>{recommendation}</span>
    </div>
  );
}
