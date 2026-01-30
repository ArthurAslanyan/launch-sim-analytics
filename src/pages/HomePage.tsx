import { useNavigate } from "react-router-dom";
import { BarChart3, ArrowRight, Shield, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";

const features = [
  {
    icon: Shield,
    title: "Risk Identification",
    description: "Detect structural weaknesses before production begins",
  },
  {
    icon: Users,
    title: "Player Behavior Modeling",
    description: "Simulate responses across 5 distinct player archetypes",
  },
  {
    icon: TrendingUp,
    title: "Optimization Insights",
    description: "Actionable recommendations to improve game performance",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center py-12">
        <div className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="mb-8 inline-flex items-center justify-center rounded-full bg-secondary px-4 py-2">
            <BarChart3 className="mr-2 h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-secondary-foreground">
              Pre-Production Risk Intelligence
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Evaluate slot game ideas before production using behavioral simulation
          </h1>

          <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
            LaunchIndex helps studios identify structural risks, player behavior patterns, 
            and improvement opportunities before a game is built.
          </p>

          <Button
            size="lg"
            onClick={() => navigate("/evaluate")}
            className="h-12 px-8 text-base font-semibold"
          >
            Evaluate Game
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="mt-20 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
