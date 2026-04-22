import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, MapPin, Brain, Bell, Activity, Route as RouteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafeHer — AI Women Safety Alert System" },
      { name: "description", content: "Press SOS. We classify the threat, predict risk, and route you to safety — instantly." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Shield, title: "One-tap SOS", desc: "Trigger an alert with location, message, and voice — all in one tap." },
  { icon: Brain, title: "Threat NLP", desc: "Classifies your message into assault, stalking, harassment & more in real time." },
  { icon: Activity, title: "Risk prediction", desc: "Combines past incidents and area patterns into a Low/Medium/High score." },
  { icon: RouteIcon, title: "Safe routing", desc: "Routes you around hotspots toward the nearest police, hospital, or public hub." },
  { icon: Bell, title: "Auto-notify", desc: "Guardians, dispatchers, and emergency contacts get an instant summary." },
  { icon: MapPin, title: "Live hotspots", desc: "See crime clusters mapped around you with intensity grading." },
];

function Index() {
  return (
    <main className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[color:var(--safe)] animate-pulse" />
          AI-powered emergency response
        </div>
        <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-7xl">
          Your safety,
          <br />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            intelligently guarded.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          SafeHer combines NLP threat classification, location-based risk modeling, and safe route
          recommendation into one tap. Built for the moments that matter most.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/auth">
            <Button size="lg" className="h-14 px-8 text-base bg-primary hover:bg-primary/90 shadow-[var(--shadow-glow)]">
              Activate SafeHer
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base">
              Open dashboard
            </Button>
          </Link>
        </div>

        {/* SOS preview */}
        <div className="mx-auto mt-20 grid max-w-3xl place-items-center">
          <div className="relative">
            <div className="sos-pulse grid h-44 w-44 place-items-center rounded-full text-primary-foreground" style={{ background: "var(--gradient-sos)" }}>
              <div className="text-center">
                <Shield className="mx-auto h-10 w-10" />
                <div className="mt-1 font-display text-2xl font-bold">SOS</div>
              </div>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Tap to trigger. Held for 2 seconds = silent alert.</p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-background/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Four modules. One protective system.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">From SOS signal to safe-route delivery — every step is engineered for speed and accuracy.</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/50 hover:shadow-[var(--shadow-soft)]">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">How it works</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              ["1", "SOS Signal", "Tap SOS. We capture GPS, message, voice."],
              ["2", "Classify", "NLP detects threat type & severity."],
              ["3", "Predict", "Risk model scores your area Low / Med / High."],
              ["4", "Respond", "Safe route + dispatch + contact alerts."],
            ].map(([n, t, d]) => (
              <li key={n} className="rounded-2xl border border-border bg-card p-6">
                <div className="font-display text-4xl font-bold text-primary">{n}</div>
                <div className="mt-2 font-semibold">{t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
        SafeHer — Built as an AI prototype. Not a replacement for emergency services.
      </footer>
    </main>
  );
}
