import type { Metric } from "../App";

export function MetricSwitch(props: { metric: Metric; onChange: (m: Metric) => void }) {
  const { metric, onChange } = props;
  return (
    <div className="flex items-center gap-6 mb-4">
      <span className="text-sm font-medium">Metric:</span>
      <label className="inline-flex items-center gap-2">
        <input
          type="radio"
          name="metric"
          checked={metric === "ctr"}
          onChange={() => onChange("ctr")}
        />
        <span className="text-sm">CTR</span>
      </label>
      <label className="inline-flex items-center gap-2">
        <input
          type="radio"
          name="metric"
          checked={metric === "conversion"}
          onChange={() => onChange("conversion")}
        />
        <span className="text-sm">Conversion Rate</span>
      </label>
    </div>
  );
}


