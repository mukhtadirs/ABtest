import { diffCI_Normal, fishersExactTwoSided, twoPropZTest, wilsonCI, chiSquare2xK } from "./stats";

export type Input = {
  metric: "ctr" | "conversion";
  variants: { name: string; traffic: number; successes: number }[];
};

export type DecisionResult = {
  testName: string;
  testWhy: string;
  pValue: number;
  significant: boolean;
  winner: string | null;
  leader: string | null;
  note?: string;
  variants: {
    name: string;
    rate: number;
    traffic: number;
    successes: number;
    ciLow: number;
    ciHigh: number;
    liftAbs?: number | null;
    liftRel?: number | null;
  }[];
  twoVariant?: {
    diff: { ciLow: number; ciHigh: number };
  };
  summary: {
    text: string;
  };
};

const ALPHA = 0.05;

export function decide(input: Input): DecisionResult {
  const vs = input.variants.map(v => ({
    name: v.name.trim() || "?",
    n: v.traffic,
    x: v.successes,
    p: v.traffic > 0 ? v.successes / v.traffic : 0
  }));

  const control = vs[0];
  const sorted = [...vs].sort((a, b) => b.p - a.p);
  const top = sorted[0];
  
  // Check for ties (rates within 0.0001 tolerance)
  const hasTie = sorted.length > 1 && Math.abs(sorted[0].p - sorted[1].p) < 0.0001;

  if (vs.length === 2) {
    const a = vs[0], b = vs[1];

    const smallCounts = smallCountsFlag(a.x, a.n, b.x, b.n);
    let pValue: number, testName: string, testWhy: string;

    if (smallCounts) {
      pValue = fishersExactTwoSided(a.x, a.n, b.x, b.n);
      testName = "Fisher’s exact test";
      testWhy = "Fisher’s exact test — safer with small sample sizes.";
    } else {
      const { p } = twoPropZTest(a.x, a.n, b.x, b.n);
      pValue = p;
      testName = "Two‑proportion z‑test";
      testWhy = "Two‑proportion z‑test — we’re comparing success rates between two independent variants.";
    }

    const significant = pValue < ALPHA;
    const winner = significant ? (b.p > a.p ? b.name : a.p > b.p ? a.name : null) : null;
    const leader = significant ? winner : (hasTie ? null : (b.p > a.p ? b.name : a.name));

    const diff = (a.n > 0 && b.n > 0) ? diffCI_Normal(a.p, a.n, b.p, b.n) : { low: 0, high: 0 };

    const variants = vs.map(v => ({
      name: v.name,
      rate: v.p,
      traffic: v.n,
      successes: v.x,
      ciLow: wilsonCI(v.x, v.n).low,
      ciHigh: wilsonCI(v.x, v.n).high,
      liftAbs: v.p - control.p,
      liftRel: control.p > 0 ? (v.p / control.p - 1) : null
    }));

    const summary = significant
      ? {
          text: winner 
            ? `Variant ${winner} wins with an ${percent(rateOf(vs, winner))}% rate, ${percentRel(relLiftOf(vs, winner, control.name))} vs control (p = ${formatP(pValue)}).`.replace("%%", "%")
            : `Results show a tie with equal performance (p = ${formatP(pValue)}). Both variants perform identically.`
        }
      : {
          text: leader 
            ? `Variant ${leader} is leading at ${percent(rateOf(vs, leader))}% (${percentRel(relLiftOf(vs, leader, control.name))} vs control), but results aren't yet statistically reliable (p = ${formatP(pValue)}).`.replace("%%", "%")
            : `No clear leader - variants are performing equally (p = ${formatP(pValue)}). Continue collecting data.`
        };

    return {
      testName,
      testWhy,
      pValue,
      significant,
      winner,
      leader,
      variants,
      twoVariant: { diff: { ciLow: diff.low, ciHigh: diff.high } },
      summary
    };
  }

  const xs = vs.map(v => v.x);
  const ns = vs.map(v => v.n);
  const { p: pValue } = chiSquare2xK(xs, ns);
  const significant = pValue < ALPHA;
  const winner = significant ? (hasTie ? null : top.name) : null;
  const leader = significant ? winner : (hasTie ? null : top.name);

  const variants = vs.map(v => ({
    name: v.name,
    rate: v.p,
    traffic: v.n,
    successes: v.x,
    ciLow: wilsonCI(v.x, v.n).low,
    ciHigh: wilsonCI(v.x, v.n).high,
    liftAbs: v.p - control.p,
    liftRel: control.p > 0 ? (v.p / control.p - 1) : null
  }));

  const summary = significant
    ? {
        text: winner 
          ? `We found a real difference across variants (chi‑square, p = ${formatP(pValue)}). ${winner} has the highest rate at ${percent(rateOf(vs, winner))}%. (MVP: no pairwise follow‑ups.)`.replace("%%", "%")
          : `Results show a tie with equal performance across variants (chi‑square, p = ${formatP(pValue)}). All top variants perform identically.`
      }
    : {
        text: leader 
          ? `No clear winner yet (chi‑square p = ${formatP(pValue)}). ${leader} is currently leading at ${percent(rateOf(vs, leader))}%.`.replace("%%", "%")
          : `No clear leader - variants are performing equally (chi‑square p = ${formatP(pValue)}). Continue collecting data.`
      };

  return {
    testName: "Chi‑square test",
    testWhy: "Chi‑square test — we’re checking if success rates differ across multiple variants.",
    pValue,
    significant,
    winner,
    leader,
    variants,
    note: significant ? "Global difference detected; MVP does not run pairwise post‑hoc." : undefined,
    summary
  };
}

function smallCountsFlag(x1: number, n1: number, x2: number, n2: number) {
  const p = (x1 + x2) / (n1 + n2 || 1);
  const e1succ = n1 * p, e1fail = n1 * (1 - p);
  const e2succ = n2 * p, e2fail = n2 * (1 - p);
  return (e1succ < 5 || e1fail < 5 || e2succ < 5 || e2fail < 5) || (n1 < 30 || n2 < 30);
}

function percent(x: number) {
  return (x * 100).toFixed(2);
}
function percentRel(x: number | null) {
  if (x == null) return "—";
  return (x * 100).toFixed(2) + "%";
}
function rateOf(vs: { name: string; p: number }[], name: string | null) {
  if (!name) return 0;
  const v = vs.find(v => v.name === name);
  return v ? v.p : 0;
}
function relLiftOf(vs: { name: string; p: number }[], name: string | null, control: string) {
  if (!name) return 0;
  const v = vs.find(v => v.name === name);
  const c = vs.find(v => v.name === control);
  if (!v || !c || c.p === 0) return 0;
  return v.p / c.p - 1;
}
function formatP(p: number) {
  if (p < 0.0001) return "< 0.0001";
  return p.toFixed(4);
}


