// Rates and CI (Wilson)
export function rate(x: number, n: number): number {
  if (n <= 0) return 0;
  return x / n;
}

export function wilsonCI(x: number, n: number, z = 1.96): { low: number; high: number } {
  if (n === 0) return { low: 0, high: 0 };
  const p = x / n;
  const z2n = (z * z) / n;
  const center = (p + z2n / 2) / (1 + z2n);
  const half = (z * Math.sqrt(p * (1 - p) / n + (z * z) / (4 * n * n))) / (1 + z2n);
  return {
    low: clamp01(center - half),
    high: clamp01(center + half)
  };
}

export function diffCI_Normal(p1: number, n1: number, p2: number, n2: number, z = 1.96) {
  const se = Math.sqrt(p1*(1-p1)/n1 + p2*(1-p2)/n2);
  const half = z * se;
  return { low: (p2 - p1) - half, high: (p2 - p1) + half };
}

// Two-proportion z-test (two-sided)
export function twoPropZTest(x1: number, n1: number, x2: number, n2: number) {
  const p1 = rate(x1, n1);
  const p2 = rate(x2, n2);
  const p = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (se === 0) return { z: 0, p: 1 };
  const z = (p2 - p1) / se;
  const pval = 2 * (1 - Phi(Math.abs(z)));
  return { z, p: clamp01(pval) };
}

// Fisher's exact test (two-sided) for 2x2
// Table: [ [x1, n1 - x1], [x2, n2 - x2] ]
export function fishersExactTwoSided(x1: number, n1: number, x2: number, n2: number) {
  const a = x1;
  const b = n1 - x1;
  const c = x2;
  const d = n2 - x2;
  const row1 = a + b;
  const row2 = c + d;
  const col1 = a + c;
  const col2 = b + d; // kept for clarity; not used directly
  void col2;
  const N = row1 + row2;

  const minA = Math.max(0, col1 - row2);
  const maxA = Math.min(col1, row1);

  const observedLogP = hypergeomLogP(a, row1, col1, N);
  let pSum = 0;
  for (let aa = minA; aa <= maxA; aa++) {
    const lp = hypergeomLogP(aa, row1, col1, N);
    if (lp <= observedLogP + 1e-12) {
      pSum += Math.exp(lp);
    }
  }
  return clamp01(pSum);
}

function hypergeomLogP(a: number, row1: number, col1: number, N: number) {
  return logChoose(col1, a) + logChoose(N - col1, row1 - a) - logChoose(N, row1);
}

function logChoose(n: number, k: number) {
  if (k < 0 || k > n) return -Infinity;
  return logFact(n) - logFact(k) - logFact(n - k);
}

const LOG_FACT_CACHE: number[] = [0, 0];
function logFact(n: number): number {
  if (n < 0) return NaN;
  if (n < LOG_FACT_CACHE.length) return LOG_FACT_CACHE[n];
  for (let i = LOG_FACT_CACHE.length; i <= n; i++) {
    LOG_FACT_CACHE[i] = LOG_FACT_CACHE[i - 1] + Math.log(i);
  }
  return LOG_FACT_CACHE[n];
}

// Chi-square test for 2 x k (success vs failure across variants)
export function chiSquare2xK(xs: number[], ns: number[]) {
  const k = xs.length;
  const X = xs.reduce((a,b) => a+b, 0);
  const N = ns.reduce((a,b) => a+b, 0);
  if (N === 0) return { chi2: 0, df: k - 1, p: 1 };

  let chi2 = 0;
  for (let i = 0; i < k; i++) {
    const n = ns[i];
    const x = xs[i];
    const eSucc = n * (X / N);
    const eFail = n * (1 - X / N);
    if (eSucc > 0) chi2 += (x - eSucc) ** 2 / eSucc;
    if (eFail > 0) chi2 += ((n - x) - eFail) ** 2 / eFail;
  }
  const df = k - 1;
  const p = 1 - chiSquareCDF(chi2, df);
  return { chi2, df, p: clamp01(p) };
}

// Normal CDF using erf approximation
export function Phi(z: number) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// Chi-square CDF via regularized gamma P(k/2, x/2)
function chiSquareCDF(x: number, k: number) {
  if (x <= 0) return 0;
  return lowerRegularizedGamma(k / 2, x / 2);
}

function lowerRegularizedGamma(s: number, x: number) {
  if (x <= 0) return 0;
  if (x < s + 1) {
    let sum = 1 / s;
    let term = sum;
    for (let n = 1; n < 200; n++) {
      term *= x / (s + n);
      sum += term;
      if (term < 1e-12) break;
    }
    return sum * Math.exp(-x + s * Math.log(x) - logGamma(s));
  } else {
    let a0 = 0, b0 = 1, a1 = 1, b1 = x, fac = 1;
    let gOld = a1 / b1;
    for (let n = 1; n < 200; n++) {
      const an = n;
      const ana = an - s;
      a0 = (a1 + a0 * ana) * fac;
      b0 = (b1 + b0 * ana) * fac;
      const anf = an * fac;
      a1 = x * a0 + anf * a1;
      b1 = x * b0 + anf * b1;
      if (a1 !== 0) {
        const g = a1 / b1;
        if (Math.abs((g - gOld) / g) < 1e-12) {
          const Q = Math.exp(-x + s * Math.log(x) - logGamma(s)) * g;
          return 1 - Q;
        }
        gOld = g;
      }
    }
    const Q = Math.exp(-x + s * Math.log(x) - logGamma(s)) * (a1 / b1);
    return 1 - Q;
  }
}

// Lanczos approximation for logGamma
function logGamma(z: number): number {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = p[0];
  for (let i = 1; i < p.length; i++) x += p[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function clamp01(x: number) {
  if (!Number.isFinite(x)) return x;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}


