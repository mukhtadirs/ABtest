import { useMemo, useState, useCallback } from "react";
import { z } from "zod";
import { MetricSwitch } from "./components/MetricSwitch";
import { VariantTable } from "./components/VariantTable";
import type { VariantRow } from "./components/VariantTable";
import { ResultsCard } from "./components/ResultsCard";
import { decide } from "./lib/decision";
import { formatP, formatPct } from "./lib/format";

export type Metric = "ctr" | "conversion";

const schema = z.object({
  metric: z.enum(["ctr", "conversion"]),
  variants: z.array(z.object({
    name: z.string().min(1),
    traffic: z.number().int().min(0).max(1_000_000_000),
    successes: z.number().int().min(0).max(1_000_000_000),
  })).min(2).refine(arr => arr.every(v => v.successes <= v.traffic), {
    message: "Successes can't exceed Traffic.",
    path: ["variants"]
  }).refine(arr => arr.every(v => v.traffic === 0 ? v.successes === 0 : true), {
    message: "If Traffic = 0, Successes must be 0.",
    path: ["variants"]
  })
});

export default function App() {
  const [metric, setMetric] = useState<Metric>("ctr");
  const [variants, setVariants] = useState<VariantRow[]>([
    { name: "A", traffic: 0, successes: 0 },
    { name: "B", traffic: 0, successes: 0 },
  ]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [result, setResult] = useState<ReturnType<typeof decide> | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  const data = useMemo(() => ({ metric, variants }), [metric, variants]);

  const onCompute = useCallback(async () => {
    setIsComputing(true);
    setResult(null);
    
    // Add small delay for better UX on fast computers
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "variants" && typeof issue.path[1] === "number") {
          const key = `variants.${issue.path[1]}.${String(issue.path[2] ?? "row")}`;
          fieldErrors[key] = issue.message;
        } else {
          fieldErrors["form"] = issue.message;
        }
      }
      if (!fieldErrors["form"]) {
        const rowRule = parsed.error.issues.find(i => i.path[0] === "variants" && typeof i.path[1] !== "number");
        if (rowRule) fieldErrors["form"] = rowRule.message;
      }
      setErrors(fieldErrors);
      setIsComputing(false);
      return;
    }
    
    setErrors({});
    try {
      const computedResult = decide(parsed.data);
      setResult(computedResult);
    } catch (error) {
      console.error('Error computing results:', error);
      setErrors({ form: 'An error occurred while computing results. Please check your data and try again.' });
    }
    setIsComputing(false);
  }, [data]);

  const onReset = useCallback(() => {
    setVariants([
      { name: "A", traffic: 0, successes: 0 },
      { name: "B", traffic: 0, successes: 0 },
    ]);
    setResult(null);
    setErrors({});
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onCompute();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      e.preventDefault();
      onReset();
    }
  }, [onCompute, onReset]);

  return (
    <div 
      className="max-w-6xl mx-auto px-4 py-10"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <header className="mb-8">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white p-6 shadow-md">
          <h1 className="text-3xl font-semibold tracking-tight">A/B Test Advisor</h1>
          <p className="text-sm/6 text-indigo-100 mt-1">
            Enter traffic and clicks/conversions to determine a winner or current leader.
          </p>
        </div>
      </header>

      <main>
        <section 
          className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl p-5 shadow-sm mb-5"
          aria-labelledby="test-setup-heading"
        >
          <h2 id="test-setup-heading" className="sr-only">Test Setup</h2>
          
          <MetricSwitch metric={metric} onChange={setMetric} />
          <VariantTable
            metric={metric}
            variants={variants}
            setVariants={setVariants}
            errors={errors}
          />
          
          {errors["form"] && (
            <div className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200" role="alert">
              {errors["form"]}
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            <button 
              onClick={onCompute} 
              disabled={isComputing}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-describedby="compute-shortcut"
            >
              {isComputing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Computing...
                </span>
              ) : (
                'Compute Result'
              )}
            </button>
            <button 
              onClick={onReset} 
              className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-gray-800 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              aria-describedby="reset-shortcut"
            >
              Reset
            </button>
          </div>
          
          <div className="text-xs text-gray-500 mt-2 space-x-4">
            <span id="compute-shortcut">Tip: Press Cmd/Ctrl + Enter to compute</span>
            <span id="reset-shortcut">Cmd/Ctrl + R to reset</span>
          </div>
        </section>

        {result && (
          <section aria-labelledby="results-heading">
            <h2 id="results-heading" className="sr-only">Test Results</h2>
            <ResultsCard result={result} metric={metric} />
          </section>
        )}
      </main>

      {/* Educate Yourself Section */}
      <aside className="mt-12" aria-labelledby="education-heading">
        <div className="text-center mb-6">
          <h2 id="education-heading" className="text-2xl font-bold text-gray-900 mb-2">Learn More About Statistics</h2>
          <p className="text-gray-600">Understanding the concepts behind your A/B test results</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mb-6">
          {/* Video Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-6 bg-white rounded flex items-center justify-center">
                <svg className="w-5 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-lg">YouTube Video</span>
            </div>
          </div>

          {/* Video Content */}
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Understanding P-Values in Statistics</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Learn what p-values actually measure and how to interpret them correctly in your A/B tests. 
              This video explains the concepts in plain language with clear examples.
            </p>
            
            {/* Centered Button */}
            <div className="text-center">
              <a 
                href="https://www.youtube.com/watch?v=vemZtEM63GY" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Watch P-Values explanation video on YouTube (opens in new tab)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Video
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="font-semibold text-blue-600 mb-1">P-Value</h4>
            <p className="text-sm text-gray-600">Probability your results happened by chance</p>
          </div>

          <div className="bg-white border border-green-200 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="font-semibold text-green-600 mb-1">Significance</h4>
            <p className="text-sm text-gray-600">Usually p &lt; 0.05 means reliable results</p>
          </div>

          <div className="bg-white border border-purple-200 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-purple-600 mb-1">Confidence</h4>
            <p className="text-sm text-gray-600">95% confidence = 5% chance of error</p>
          </div>
        </div>
      </aside>
    </div>
  );
}