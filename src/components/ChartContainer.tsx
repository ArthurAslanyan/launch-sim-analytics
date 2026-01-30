import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ChartContainer({ title, description, children, className }: ChartContainerProps) {
  return (
    <div className={cn("chart-container animate-fade-in", className)}>
      <div className="mb-4">
        <h3 className="chart-title">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="h-[280px] w-full">
        {children}
      </div>
    </div>
  );
}
