import type { Metric } from "../App";

export type VariantRow = {
  name: string;
  traffic: number;
  successes: number;
};

export function VariantTable(props: {
  metric: Metric;
  variants: VariantRow[];
  setVariants: (v: VariantRow[]) => void;
  errors: Record<string, string | undefined>;
}) {
  const { metric, variants, setVariants, errors } = props;
  const label = metric === "ctr" ? "Clicks" : "Conversions";

  const setRow = (i: number, partial: Partial<VariantRow>) => {
    const newVariants = [...variants];
    newVariants[i] = { ...newVariants[i], ...partial };
    setVariants(newVariants);
  };

  const addVariant = () => {
    const nextLetter = String.fromCharCode(65 + variants.length); // A, B, C, ...
    setVariants([...variants, { name: nextLetter, traffic: 0, successes: 0 }]);
  };

  const removeVariant = (i: number) => {
    if (variants.length > 2) {
      setVariants(variants.filter((_, idx) => idx !== i));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Test Variants</h3>
        <p className="text-xs text-gray-500 mb-4">
          Enter the traffic and {label.toLowerCase()} for each variant in your A/B test.
        </p>
      </div>
      
      {/* Mobile Layout - Stacked Cards */}
      <div className="block sm:hidden space-y-4">
        {variants.map((v, i) => {
          const tErr = errors[`variants.${i}.traffic`];
          const sErr = errors[`variants.${i}.successes`];
          const rowErr = errors[`variants.${i}.row`];

          return (
            <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Variant {v.name}</h4>
                {variants.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded transition-colors"
                    aria-label={`Remove variant ${v.name}`}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`variant-name-mobile-${i}`}>
                    Variant Name
                  </label>
                  <input
                    id={`variant-name-mobile-${i}`}
                    className="w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    value={v.name}
                    onChange={e => setRow(i, { name: e.target.value })}
                    aria-describedby={rowErr ? `variant-mobile-${i}-error` : undefined}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`variant-traffic-mobile-${i}`}>
                    Traffic (number of visitors)
                  </label>
                  <input
                    id={`variant-traffic-mobile-${i}`}
                    className={`w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 ${tErr ? "border-red-500" : ""}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={`${Number.isFinite(v.traffic) ? v.traffic : 0}`}
                    onChange={e => setRow(i, { traffic: clampInt(e.target.value) })}
                    aria-describedby={tErr ? `traffic-mobile-${i}-error` : undefined}
                    aria-invalid={tErr ? "true" : "false"}
                    placeholder="Enter number of visitors"
                  />
                  {tErr && (
                    <div id={`traffic-mobile-${i}-error`} className="text-sm text-red-600 mt-1" role="alert">
                      {tErr}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`variant-successes-mobile-${i}`}>
                    {label} (successful actions)
                  </label>
                  <input
                    id={`variant-successes-mobile-${i}`}
                    className={`w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 ${sErr ? "border-red-500" : ""}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={`${Number.isFinite(v.successes) ? v.successes : 0}`}
                    onChange={e => setRow(i, { successes: clampInt(e.target.value) })}
                    aria-describedby={sErr ? `successes-mobile-${i}-error` : undefined}
                    aria-invalid={sErr ? "true" : "false"}
                    placeholder={`Enter number of ${label.toLowerCase()}`}
                  />
                  {sErr && (
                    <div id={`successes-mobile-${i}-error`} className="text-sm text-red-600 mt-1" role="alert">
                      {sErr}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Desktop Layout - Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm" role="table" aria-label="A/B test variant data">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-3" scope="col">Variant</th>
              <th className="py-2 pr-3" scope="col">Traffic</th>
              <th className="py-2 pr-3" scope="col">{label}</th>
              <th className="py-2 pr-3" scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v, i) => {
              const tErr = errors[`variants.${i}.traffic`];
              const sErr = errors[`variants.${i}.successes`];
              const rowErr = errors[`variants.${i}.row`];

              return (
                <tr key={i} className="border-t border-gray-200">
                  <td className="py-2 pr-3">
                    <label className="sr-only" htmlFor={`variant-name-${i}`}>
                      Variant {v.name} name
                    </label>
                    <input
                      id={`variant-name-${i}`}
                      className="w-12 sm:w-16 lg:w-20 border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                      value={v.name}
                      onChange={e => setRow(i, { name: e.target.value })}
                      aria-describedby={rowErr ? `variant-${i}-error` : undefined}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <label className="sr-only" htmlFor={`variant-traffic-${i}`}>
                      Variant {v.name} traffic (number of visitors)
                    </label>
                    <input
                      id={`variant-traffic-${i}`}
                      className={`w-20 sm:w-24 lg:w-32 border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 ${tErr ? "border-red-500" : ""}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={`${Number.isFinite(v.traffic) ? v.traffic : 0}`}
                      onChange={e => setRow(i, { traffic: clampInt(e.target.value) })}
                      aria-describedby={tErr ? `traffic-${i}-error` : undefined}
                      aria-invalid={tErr ? "true" : "false"}
                      placeholder="0"
                    />
                    {tErr && (
                      <div id={`traffic-${i}-error`} className="text-xs text-red-600 mt-1" role="alert">
                        {tErr}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <label className="sr-only" htmlFor={`variant-successes-${i}`}>
                      Variant {v.name} {label.toLowerCase()} (successful actions)
                    </label>
                    <input
                      id={`variant-successes-${i}`}
                      className={`w-20 sm:w-24 lg:w-32 border rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 ${sErr ? "border-red-500" : ""}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={`${Number.isFinite(v.successes) ? v.successes : 0}`}
                      onChange={e => setRow(i, { successes: clampInt(e.target.value) })}
                      aria-describedby={sErr ? `successes-${i}-error` : undefined}
                      aria-invalid={sErr ? "true" : "false"}
                      placeholder="0"
                    />
                    {sErr && (
                      <div id={`successes-${i}-error`} className="text-xs text-red-600 mt-1" role="alert">
                        {sErr}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {variants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded transition-colors"
                        aria-label={`Remove variant ${v.name}`}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={addVariant}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          disabled={variants.length >= 5}
          aria-label="Add new test variant"
        >
          + Add Variant {variants.length < 5 ? `(${String.fromCharCode(65 + variants.length)})` : ''}
        </button>
        
        {variants.length >= 5 && (
          <p className="text-xs text-gray-500 text-center sm:text-left">Maximum 5 variants supported</p>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 sm:p-4 rounded-lg">
        <p><strong>Traffic:</strong> Total number of visitors who saw this variant</p>
        <p><strong>{label}:</strong> Number of visitors who completed the desired action</p>
        <p><strong>Note:</strong> {label} cannot exceed Traffic for any variant</p>
      </div>
    </div>
  );
}

function clampInt(v: string): number {
  const int = parseInt(v) || 0;
  return Math.max(0, Math.min(1_000_000_000, int));
}