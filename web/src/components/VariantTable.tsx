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
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">Test Variants</h3>
        <p className="text-xs text-gray-500 mb-3">
          Enter the traffic and {label.toLowerCase()} for each variant in your A/B test.
        </p>
      </div>
      
      <div className="overflow-x-auto">
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
                      className="w-16 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
                      className={`w-32 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${tErr ? "border-red-500 aria-invalid" : ""}`}
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
                      className={`w-32 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${sErr ? "border-red-500" : ""}`}
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

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={addVariant}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
          disabled={variants.length >= 5}
          aria-label="Add new test variant"
        >
          + Add Variant {variants.length < 5 ? `(${String.fromCharCode(65 + variants.length)})` : ''}
        </button>
        
        {variants.length >= 5 && (
          <p className="text-xs text-gray-500">Maximum 5 variants supported</p>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
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