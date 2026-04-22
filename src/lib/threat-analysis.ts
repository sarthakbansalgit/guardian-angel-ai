// Lightweight rule-based NLP for threat classification + risk scoring.
// Designed for prototype use — replicates a trained classifier's behavior.

export type RiskLevel = "low" | "medium" | "high";

export interface ThreatResult {
  category: string;
  keywords: string[];
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  recommendedAction: string;
}

const CATEGORIES: { name: string; keywords: string[]; weight: number }[] = [
  { name: "Physical Assault", weight: 95, keywords: ["attack", "hit", "beat", "punch", "assault", "grab", "drag", "hurt", "weapon", "knife", "gun"] },
  { name: "Stalking", weight: 75, keywords: ["follow", "following", "stalk", "watching", "behind me", "chasing"] },
  { name: "Harassment", weight: 60, keywords: ["harass", "catcall", "touch", "groping", "creep", "creepy", "inappropriate", "threaten"] },
  { name: "Kidnapping", weight: 100, keywords: ["kidnap", "abduct", "forced", "van", "trapped", "locked"] },
  { name: "Domestic Violence", weight: 90, keywords: ["husband", "partner", "boyfriend", "home", "abuse", "domestic"] },
  { name: "Robbery", weight: 70, keywords: ["rob", "steal", "snatch", "money", "phone", "purse"] },
  { name: "Suspicious Activity", weight: 45, keywords: ["suspicious", "strange", "scared", "unsafe", "dark", "alone", "lost"] },
  { name: "Medical Emergency", weight: 65, keywords: ["hurt", "bleeding", "injured", "pain", "unconscious", "accident"] },
];

const URGENCY_BOOST = ["help", "emergency", "now", "please", "scream", "danger", "sos"];

export function analyzeThreat(message: string, areaRiskBoost = 0): ThreatResult {
  const text = (message || "").toLowerCase();
  let bestCategory = "General Alert";
  let bestWeight = 30;
  const matchedKeywords: string[] = [];

  for (const cat of CATEGORIES) {
    const hits = cat.keywords.filter((k) => text.includes(k));
    if (hits.length > 0) {
      matchedKeywords.push(...hits);
      const score = cat.weight + hits.length * 4;
      if (score > bestWeight) {
        bestWeight = score;
        bestCategory = cat.name;
      }
    }
  }

  const urgencyHits = URGENCY_BOOST.filter((u) => text.includes(u));
  matchedKeywords.push(...urgencyHits);

  let riskScore = Math.min(100, bestWeight + urgencyHits.length * 5 + areaRiskBoost);
  if (!message?.trim()) riskScore = Math.max(55, areaRiskBoost + 40); // silent SOS still serious

  const riskLevel: RiskLevel = riskScore >= 75 ? "high" : riskScore >= 50 ? "medium" : "low";

  const recommendedAction =
    riskLevel === "high"
      ? "Dispatch nearest patrol immediately. Notify all emergency contacts. Keep line open."
      : riskLevel === "medium"
        ? "Alert nearest patrol unit. Notify guardian. Suggest safer route to user."
        : "Log incident. Notify primary contact. Recommend well-lit public route.";

  return {
    category: bestCategory,
    keywords: Array.from(new Set(matchedKeywords)).slice(0, 8),
    riskLevel,
    riskScore,
    recommendedAction,
  };
}

// Mock crime hotspots (offsets from user) — used for risk modeling + safe route
export interface Hotspot {
  lat: number;
  lng: number;
  intensity: number; // 0-1
  label: string;
}

export function generateHotspots(lat: number, lng: number): Hotspot[] {
  // Deterministic-ish based on coords
  const seed = Math.abs(Math.sin(lat * 1000 + lng * 1000));
  const labels = ["Past assault report", "Stalking incident", "Harassment cluster", "Theft area", "Poor lighting"];
  return Array.from({ length: 5 }, (_, i) => ({
    lat: lat + (Math.sin(seed * (i + 1) * 7) * 0.006),
    lng: lng + (Math.cos(seed * (i + 1) * 11) * 0.006),
    intensity: 0.4 + ((seed * (i + 3)) % 0.6),
    label: labels[i],
  }));
}

export function areaRiskFromHotspots(hotspots: Hotspot[]): number {
  const avg = hotspots.reduce((s, h) => s + h.intensity, 0) / Math.max(1, hotspots.length);
  return Math.round(avg * 30); // up to +30 boost
}

// Safe route: pick a destination (nearest "safe haven") and route around hotspots
export interface SafeHaven {
  lat: number;
  lng: number;
  name: string;
  type: "police" | "hospital" | "public";
}

export function suggestSafeHavens(lat: number, lng: number): SafeHaven[] {
  return [
    { lat: lat + 0.008, lng: lng + 0.005, name: "Central Police Station", type: "police" },
    { lat: lat - 0.006, lng: lng + 0.009, name: "City Hospital", type: "hospital" },
    { lat: lat + 0.004, lng: lng - 0.008, name: "24/7 Metro Hub", type: "public" },
  ];
}

export function buildSafeRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  hotspots: Hotspot[],
): [number, number][] {
  // Build a 6-segment path that bends away from highest-intensity hotspot.
  const points: [number, number][] = [];
  const steps = 8;
  const worst = hotspots.reduce((a, b) => (b.intensity > a.intensity ? b : a), hotspots[0]);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let lat = from.lat + (to.lat - from.lat) * t;
    let lng = from.lng + (to.lng - from.lng) * t;
    if (worst) {
      const dLat = lat - worst.lat;
      const dLng = lng - worst.lng;
      const dist = Math.hypot(dLat, dLng) || 0.0001;
      const push = 0.003 / dist;
      lat += (dLat / dist) * push * (1 - Math.abs(t - 0.5) * 2);
      lng += (dLng / dist) * push * (1 - Math.abs(t - 0.5) * 2);
    }
    points.push([lat, lng]);
  }
  return points;
}
