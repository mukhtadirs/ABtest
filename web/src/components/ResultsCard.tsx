import { formatP, formatPctSmart, formatCounts, getRateBadgeColor } from "../lib/format";
import type { DecisionResult } from "../lib/decision";
import type { Metric } from "../App";
import { generatePDFReport } from "../lib/pdfGenerator";

// Get variant badge color for prominent display
function getVariantBadgeColor(name: string): string {
  const colors = {
    'A': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
    'B': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white', 
    'C': 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white',
    'D': 'bg-gradient-to-r from-violet-500 to-violet-600 text-white',
    'E': 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
  };
  return colors[name as keyof typeof colors] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
}

// Get enhanced styling for winners/leaders
function getWinnerStyling(isTop: boolean, isSig: boolean, isTie: boolean, rate: number, topRate: number) {
  const isEqual = isTie && Math.abs(rate - topRate) < 0.0001;
  
  if (isTop && isSig) {
    // Significant winner - green glow
    return {
      badgeClass: 'w-12 h-12 ring-4 ring-emerald-300 ring-opacity-60 shadow-lg shadow-emerald-200',
      labelClass: 'text-emerald-700 font-bold'
    };
  } else if (isTop && !isSig) {
    // Non-significant leader - amber glow  
    return {
      badgeClass: 'w-11 h-11 ring-3 ring-amber-300 ring-opacity-60 shadow-lg shadow-amber-200',
      labelClass: 'text-amber-700 font-bold'
    };
  } else if (isEqual) {
    // Tied performance - blue glow
    return {
      badgeClass: 'w-11 h-11 ring-3 ring-blue-300 ring-opacity-60 shadow-lg shadow-blue-200',
      labelClass: 'text-blue-700 font-bold'
    };
  }
  
  // Regular variant
  return {
    badgeClass: 'w-10 h-10 shadow-md',
    labelClass: 'text-gray-700'
  };
}

// Mobile version of winner styling
function getMobileWinnerStyling(isTop: boolean, isSig: boolean, isTie: boolean, rate: number, topRate: number) {
  const isEqual = isTie && Math.abs(rate - topRate) < 0.0001;
  
  if (isTop && isSig) {
    return {
      badgeClass: 'w-10 h-10 ring-3 ring-emerald-300 ring-opacity-60 shadow-lg shadow-emerald-200',
      labelClass: 'text-emerald-700 font-bold'
    };
  } else if (isTop && !isSig) {
    return {
      badgeClass: 'w-9 h-9 ring-2 ring-amber-300 ring-opacity-60 shadow-lg shadow-amber-200',
      labelClass: 'text-amber-700 font-bold'
    };
  } else if (isEqual) {
    return {
      badgeClass: 'w-9 h-9 ring-2 ring-blue-300 ring-opacity-60 shadow-lg shadow-blue-200',
      labelClass: 'text-blue-700 font-bold'
    };
  }
  
  return {
    badgeClass: 'w-8 h-8 shadow-md',
    labelClass: 'text-gray-700'
  };
}

export function ResultsCard({ result, metric }: { result: DecisionResult; metric: Metric }) {
  const isSig = result.significant;
  const topName = result.winner ?? result.leader;
  const controlName = result.variants[0]?.name ?? "A";
  const metricNoun = metric === "ctr" ? "CTR" : "conversion rate";
  const isTie = !topName; // No winner or leader means it's a tie

  // Prepare rows: always show in alphabetical order (A, B, C, etc.)
  const rows = result.variants.sort((a, b) => a.name.localeCompare(b.name));
  const topRow = topName ? rows.find(v => v.name === topName) ?? rows[0] : rows[0];

  const handleDownloadPDF = async () => {
    try {
      await generatePDFReport(result, metric);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg">
      {/* Header - Mobile Responsive */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
              <span>{isTie ? "🤝" : (isSig ? "✅" : "⚠️")}</span>
              <span className="leading-tight">
                {isTie 
                  ? "Equal performance detected" 
                  : (isSig ? `Variant ${topName} is the winner` : `Variant ${topName} is leading`)
                }
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
              {isTie 
                ? `Variants performing equally at ${formatPctSmart(topRow.rate)} ${metricNoun}`
                : `${formatPctSmart(topRow.rate)} ${metricNoun}, vs ${formatPctSmart(rows.find(v => v.name === controlName)?.rate || 0)} for Control`
              }
            </p>
          </div>
          
          {/* Significance Badge - Always visible on mobile */}
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className={`text-xs px-3 py-2 rounded-full border whitespace-nowrap ${isSig ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-700"}`}>
              <span className="hidden sm:inline">{isSig ? `Significant (p = ${formatP(result.pValue)})` : `Not significant (p = ${formatP(result.pValue)})`}</span>
              <span className="sm:hidden">{isSig ? `Significant` : `Not significant`}</span>
            </div>
            
            {/* Download Button - Full width on mobile */}
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm min-w-0 whitespace-nowrap"
              title="Download PDF Report"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 10.5a1.5 1.5 0 01-1.5 1.5h-16a1.5 1.5 0 01-1.5-1.5v-1.5a1.5 1.5 0 011.5-1.5h16a1.5 1.5 0 011.5 1.5v1.5z" />
              </svg>
              <span className="hidden sm:inline">Download Report</span>
              <span className="sm:hidden">Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b-2 border-blue-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <th className="py-4 pr-6 text-left">
                <div className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  📊 Variant
                </div>
              </th>
              <th className="py-4 pr-6 text-left">
                <div className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  🎯 Performance
                </div>
              </th>
              <th className="py-4 pr-6 text-left">
                <div className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  📈 Count
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => {
              const isTop = !isTie && v.name === topName;
              const isControl = v.name === controlName;
              const bg = isTop ? (isSig ? "bg-emerald-50" : "bg-amber-50") : "";
              const badgeColor = getRateBadgeColor(v.rate);
              const variantBadgeColor = getVariantBadgeColor(v.name);
              const styling = getWinnerStyling(isTop, isSig, isTie, v.rate, topRow.rate);
              
              return (
                <tr key={v.name} className={`border-t border-gray-100 hover:bg-gray-50/80 transition-colors ${bg}`}>
                  <td className="py-5 pr-6">
                    <div className="flex items-center gap-4">
                      <div className={`${styling.badgeClass} rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200 ${variantBadgeColor}`}>
                        {v.name}
                      </div>
                      <div>
                        <div className={`text-lg font-bold transition-colors ${styling.labelClass}`}>
                          Variant {v.name}
                        </div>
                        {isControl && (
                          <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                            Control
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-5 pr-6">
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-full text-base font-bold shadow-sm ${badgeColor}`}>
                        {formatPctSmart(v.rate)}
                      </span>
                      <span className="text-gray-600 font-medium">
                        {metric === "ctr" ? "CTR" : "conversion rate"}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 pr-6">
                    <div className="font-mono text-base text-gray-700 font-medium">
                      <div>{formatCounts(v.successes, v.traffic)}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">
                        {metric === "ctr" ? "clicks" : "conversions"}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        {rows.map((v) => {
          const isTop = !isTie && v.name === topName;
          const isControl = v.name === controlName;
          const bg = isTop ? (isSig ? "bg-emerald-50" : "bg-amber-50") : "bg-white";
          const badgeColor = getRateBadgeColor(v.rate);
          const variantBadgeColor = getVariantBadgeColor(v.name);
          const styling = getMobileWinnerStyling(isTop, isSig, isTie, v.rate, topRow.rate);
          
          return (
            <div key={v.name} className={`border border-gray-200 rounded-xl p-4 ${bg} shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`${styling.badgeClass} rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${variantBadgeColor}`}>
                    {v.name}
                  </div>
                  <div>
                    <div className={`font-bold transition-colors ${styling.labelClass}`}>
                      Variant {v.name}
                    </div>
                    {isControl && (
                      <div className="text-xs text-blue-600 font-medium uppercase">
                        Control
                      </div>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${badgeColor}`}>
                  {formatPctSmart(v.rate)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-mono font-medium">{formatCounts(v.successes, v.traffic)} {metric === "ctr" ? "clicks" : "conversions"}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Steps (callout) */}
      <div
        className={`mt-6 rounded-xl p-4 border-l-4 ${
          isTie ? "border-blue-500 bg-blue-50" : (isSig ? "border-emerald-500 bg-emerald-50" : "border-amber-500 bg-yellow-100")
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-xl">{isTie ? "🤝" : (isSig ? "✅" : "⚠️")}</div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">
              {isTie
                ? "No clear winner - tie detected"
                : (isSig ? `Roll out Variant ${topName}` : "Keep collecting data")}
            </h3>
            <p className="text-sm text-gray-800 mt-1">
              {isTie
                ? `All variants are performing equally (p = ${formatP(result.pValue)}). Consider other factors like cost, implementation ease, or collect more data to break the tie.`
                : (isSig
                  ? `Variant ${topName} is statistically better (p = ${formatP(result.pValue)}). Consider rolling it out to all traffic.`
                  : `Variant ${topName} is leading, but results aren't statistically significant yet (p = ${formatP(result.pValue)}). Let the test run longer before making a decision.`)}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Test: {result.testName} — {result.testWhy}
        </p>
      </div>
    </div>
  );
}