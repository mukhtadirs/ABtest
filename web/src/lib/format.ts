export function formatPct(x: number): string {
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(2) + "%";
}

export function formatPctSmart(x: number): string {
  if (!Number.isFinite(x)) return "—";
  const pct = x * 100;
  const decimals = Math.abs(pct) < 10 ? 2 : 1;
  return pct.toFixed(decimals) + "%";
}

export function formatP(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p < 0.0001) return "< 0.0001";
  return p.toFixed(4);
}

export function formatLift(rel: number): string {
  return (rel * 100).toFixed(2) + "%";
}

export function formatLiftSigned(rel: number | null | undefined): string {
  if (rel == null || !Number.isFinite(rel)) return "—";
  const pct = rel * 100;
  const sign = pct > 0 ? "+" : pct < 0 ? "" : "";
  const decimals = Math.abs(pct) < 10 ? 2 : 1;
  return sign + pct.toFixed(decimals) + "%";
}

export function formatPP(delta: number): string {
  if (!Number.isFinite(delta)) return "—";
  const pp = delta * 100; // percentage points
  const sign = pp > 0 ? "+" : pp < 0 ? "" : "";
  const decimals = Math.abs(pp) < 10 ? 2 : 1;
  return sign + pp.toFixed(decimals) + " pp";
}

export function formatCounts(successes: number, traffic: number): string {
  if (!Number.isFinite(successes) || !Number.isFinite(traffic)) return "—";
  return `${successes}/${traffic}`;
}

export function getRateBadgeColor(rate: number): string {
  if (!Number.isFinite(rate)) return "bg-gray-100 text-gray-600";
  const pct = rate * 100;
  if (pct >= 15) return "bg-gradient-to-r from-blue-600 to-purple-700 text-white";
  if (pct >= 10) return "bg-gradient-to-r from-blue-500 to-purple-600 text-white";
  if (pct >= 5) return "bg-gradient-to-r from-blue-400 to-indigo-500 text-white";
  if (pct >= 2) return "bg-gradient-to-r from-indigo-400 to-blue-500 text-white";
  return "bg-gradient-to-r from-slate-400 to-gray-500 text-white";
}


