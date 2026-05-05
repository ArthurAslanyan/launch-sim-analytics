import { DashboardLayout } from "@/components/DashboardLayout";
import { FlaskConical } from "lucide-react";

export default function ValidationRunnerPage() {
  return (
    <DashboardLayout title="Validation Runner" subtitle="Run validation suites against the simulation engine">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
          <FlaskConical className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Validation Runner</h2>
        <p className="text-muted-foreground max-w-md">
          Validation tools coming soon. This area will host structured test suites for the LaunchIndex simulation engine.
        </p>
      </div>
    </DashboardLayout>
  );
}
