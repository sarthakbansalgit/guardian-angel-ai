import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureSession } from "@/lib/ensure-session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, MapPin, AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  analyzeThreat,
  generateHotspots,
  areaRiskFromHotspots,
  suggestSafeHavens,
  buildSafeRoute,
  type ThreatResult,
  type SafeHaven,
} from "@/lib/threat-analysis";
import { MapClient } from "@/components/MapClient";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SafeHer" }, { name: "description", content: "SOS dashboard with live threat classification and safe route." }] }),
  component: Dashboard,
});

interface LocState {
  lat: number;
  lng: number;
  status: "idle" | "loading" | "ready" | "error";
}

function Dashboard() {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [loc, setLoc] = useState<LocState>({ lat: 0, lng: 0, status: "idle" });
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ThreatResult | null>(null);
  const [destination, setDestination] = useState<SafeHaven | null>(null);

  useEffect(() => {
    ensureSession().then((uid) => {
      if (uid) setReady(true);
      else toast.error("Could not initialize session.");
    });
  }, []);

  // Fetch location on mount
  useEffect(() => {
    if (!ready) return;
    setLoc((s) => ({ ...s, status: "loading" }));
    if (!navigator.geolocation) {
      // fallback
      setLoc({ lat: 28.6139, lng: 77.209, status: "ready" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: "ready" }),
      () => {
        toast.warning("Location denied — using default city center.");
        setLoc({ lat: 28.6139, lng: 77.209, status: "ready" });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [ready]);

  const hotspots = useMemo(() => (loc.status === "ready" ? generateHotspots(loc.lat, loc.lng) : []), [loc]);
  const havens = useMemo(() => (loc.status === "ready" ? suggestSafeHavens(loc.lat, loc.lng) : []), [loc]);
  const areaBoost = useMemo(() => areaRiskFromHotspots(hotspots), [hotspots]);

  const route = useMemo(() => {
    if (!destination || loc.status !== "ready") return undefined;
    return buildSafeRoute({ lat: loc.lat, lng: loc.lng }, destination, hotspots);
  }, [destination, loc, hotspots]);

  const triggerSOS = async () => {
    if (loc.status !== "ready") {
      toast.error("Waiting for location...");
      return;
    }
    setAnalyzing(true);
    const r = analyzeThreat(message, areaBoost);
    setResult(r);

    // pick destination based on threat
    const haven =
      r.category === "Medical Emergency"
        ? havens.find((h) => h.type === "hospital")
        : r.riskLevel === "high"
          ? havens.find((h) => h.type === "police")
          : havens.find((h) => h.type === "public");
    setDestination(haven ?? havens[0]);

    // store
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { error } = await supabase.from("incidents").insert({
        user_id: userData.user.id,
        message: message || null,
        latitude: loc.lat,
        longitude: loc.lng,
        threat_category: r.category,
        threat_keywords: r.keywords,
        risk_level: r.riskLevel,
        risk_score: r.riskScore,
        recommended_action: r.recommendedAction,
      });
      if (error) toast.error("Could not save incident: " + error.message);
      else toast.success("SOS recorded. Contacts notified (simulated).");
    }
    setAnalyzing(false);
  };

  if (!ready) {
    return (
      <main className="grid min-h-[calc(100vh-65px)] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  const riskColor =
    result?.riskLevel === "high" ? "var(--danger)" : result?.riskLevel === "medium" ? "var(--warn)" : "var(--safe)";

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Emergency Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {loc.status === "ready"
              ? `Live location: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
              : "Acquiring location..."}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Area baseline risk</div>
          <div className="font-display text-2xl font-bold">{areaBoost + 30}/100</div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* SOS panel */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <div className="grid place-items-center py-4">
              <button
                onClick={triggerSOS}
                disabled={analyzing || loc.status !== "ready"}
                className="sos-pulse grid h-44 w-44 place-items-center rounded-full text-primary-foreground transition active:scale-95 disabled:opacity-60"
                style={{ background: "var(--gradient-sos)" }}
              >
                <div className="text-center">
                  {analyzing ? <Loader2 className="mx-auto h-10 w-10 animate-spin" /> : <Shield className="mx-auto h-10 w-10" />}
                  <div className="mt-1 font-display text-2xl font-bold">SOS</div>
                </div>
              </button>
            </div>
            <Textarea
              placeholder="Describe what's happening (optional). E.g. 'Someone is following me on dark street'..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              className="resize-none"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              The system also classifies silent SOS as serious.
            </p>
          </div>

          {/* Result panel */}
          {result && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h2 className="font-display text-lg font-semibold">AI Analysis</h2>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Threat category</span>
                <span className="font-semibold">{result.category}</span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Risk score</span>
                  <span className="font-semibold uppercase tracking-wide" style={{ color: riskColor }}>
                    {result.riskLevel} · {result.riskScore}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all" style={{ width: `${result.riskScore}%`, background: riskColor }} />
                </div>
              </div>

              {result.keywords.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-2">Detected keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords.map((k) => (
                      <span key={k} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-[color:var(--warn)] mt-0.5" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Recommended action</div>
                    <p className="mt-1 text-sm">{result.recommendedAction}</p>
                  </div>
                </div>
              </div>

              {destination && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-[color:var(--safe)]/40 bg-[color:var(--safe)]/10 p-4">
                  <CheckCircle2 className="h-4 w-4 text-[color:var(--safe)] mt-0.5" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Safe destination</div>
                    <p className="mt-1 text-sm font-semibold">{destination.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{destination.type} · routed around hotspots</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Map */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Risk map & safe route</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[color:var(--danger)]" />High</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[color:var(--warn)]" />Medium</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[color:var(--safe)]" />Safe</span>
              </div>
            </div>
            {loc.status === "ready" ? (
              <MapClient
                user={{ lat: loc.lat, lng: loc.lng }}
                hotspots={hotspots}
                havens={havens}
                route={route}
                destination={destination ?? undefined}
              />
            ) : (
              <div className="h-[420px] rounded-xl bg-muted/40 animate-pulse" />
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {havens.map((h) => (
              <button
                key={h.name}
                onClick={() => setDestination(h)}
                className={`rounded-xl border p-4 text-left transition hover:border-primary ${destination?.name === h.name ? "border-primary bg-primary/10" : "border-border bg-card"}`}
              >
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{h.type}</div>
                <div className="mt-1 font-semibold">{h.name}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
