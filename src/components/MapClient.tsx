import { lazy, Suspense, useEffect, useState } from "react";
import type { Hotspot, SafeHaven } from "@/lib/threat-analysis";

const SafeMap = lazy(() => import("./SafeMap").then((m) => ({ default: m.SafeMap })));

interface Props {
  user: { lat: number; lng: number };
  hotspots: Hotspot[];
  havens: SafeHaven[];
  route?: [number, number][];
  destination?: SafeHaven;
}

export function MapClient(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="h-[420px] rounded-xl bg-muted/40 animate-pulse" />;
  }
  return (
    <Suspense fallback={<div className="h-[420px] rounded-xl bg-muted/40 animate-pulse" />}>
      <div className="h-[420px] overflow-hidden rounded-xl border border-border">
        <SafeMap {...props} />
      </div>
    </Suspense>
  );
}
