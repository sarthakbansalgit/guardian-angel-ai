import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureSession } from "@/lib/ensure-session";
import { Loader2, MapPin } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Incident History — SafeHer" }, { name: "description", content: "Your past SOS incidents and AI analysis." }] }),
  component: History,
});

interface Incident {
  id: string;
  message: string | null;
  threat_category: string | null;
  risk_level: string | null;
  risk_score: number | null;
  recommended_action: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

function History() {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const uid = await ensureSession();
      if (!uid) { setLoading(false); return; }
      const { data } = await supabase.from("incidents").select("*").order("created_at", { ascending: false });
      setItems((data ?? []) as Incident[]);
      setLoading(false);
    })();
  }, []);

  const color = (l: string | null) =>
    l === "high" ? "var(--danger)" : l === "medium" ? "var(--warn)" : "var(--safe)";

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold">Incident History</h1>
      <p className="mt-1 text-sm text-muted-foreground">All your SOS alerts and AI-generated summaries.</p>

      <div className="mt-8 space-y-3">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> :
          items.length === 0 ? <p className="text-sm text-muted-foreground">No incidents yet. Stay safe.</p> :
          items.map((it) => (
            <article key={it.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{it.threat_category ?? "General Alert"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(it.created_at).toLocaleString()}</div>
                </div>
                <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  style={{ background: `color-mix(in oklab, ${color(it.risk_level)} 20%, transparent)`, color: color(it.risk_level) }}>
                  {it.risk_level} · {it.risk_score}
                </span>
              </div>
              {it.message && <p className="mt-3 text-sm">{it.message}</p>}
              {it.recommended_action && (
                <p className="mt-3 text-sm text-muted-foreground border-l-2 border-border pl-3">{it.recommended_action}</p>
              )}
              {it.latitude && it.longitude && (
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />{it.latitude.toFixed(4)}, {it.longitude.toFixed(4)}
                </div>
              )}
            </article>
          ))}
      </div>
    </main>
  );
}
