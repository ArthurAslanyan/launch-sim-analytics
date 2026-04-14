import { useNavigate } from "react-router-dom";
import { BarChart3, ArrowRight, Shield, TrendingUp, Users, Zap, Target, Activity, Wallet, Sparkles } from "lucide-react";
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

        {/* Behavioral Archetypes Engine Section */}
        <div className="mt-24 w-full max-w-5xl animate-fade-in">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              Simulate How Different Players Actually Behave
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              LaunchIndex models player behavior using structured archetypes — not assumptions, not guesswork.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-8 shadow-sm mb-10">
            <p className="text-base text-foreground mb-4">
              Instead of treating players as a single group, LaunchIndex simulates multiple behavioral profiles in parallel.
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Each archetype represents a distribution of players with controlled variation in:
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground list-disc list-inside">
              <li>Bankroll size and risk tolerance</li>
              <li>Sensitivity to losses and dead spins</li>
              <li>Expectation of feature triggers</li>
              <li>Reaction to rewards and win patterns</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              This allows the system to generate realistic behavioral patterns rather than artificial averages.
            </p>
          </div>

          <div className="mb-10">
            <h3 className="text-xl font-semibold text-foreground text-center mb-6">How It Works</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Game structure is translated into mathematical outcomes",
                "Archetypes interact with outcomes using defined behavioral parameters",
                "Hundreds of simulated players per archetype introduce natural variation",
                "Results are aggregated into survival curves, drop-off points, and risk indicators",
              ].map((step, i) => (
                <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-xl font-semibold text-foreground text-center mb-6">Player Archetypes</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Users, name: "Casual Player", desc: "Seeks steady engagement and frequent small rewards. Sensitive to boredom and dead spins." },
                { icon: Target, name: "Bonus Seeker", desc: "Focused on triggering features. High patience when rewards feel reachable, rapid churn otherwise." },
                { icon: Zap, name: "Volatility Seeker", desc: "Accepts long dry periods in pursuit of large wins. Ignores small rewards." },
                { icon: Wallet, name: "Budget Player", desc: "Highly sensitive to loss rate and bankroll depletion. Exits early under pressure." },
                { icon: Activity, name: "Engagement Seeker", desc: "Responds to pacing and stimulation. Stays longer when the experience feels active." },
              ].map((a) => (
                <div key={a.name} className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <a.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{a.name}</h4>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-base text-foreground mb-3">
              By combining structured behavioral archetypes with controlled variability, LaunchIndex reveals how different player types respond to your game before it is built.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Not all players behave the same. Your game shouldn't be evaluated as if they do.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
