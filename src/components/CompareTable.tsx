"use client";
import type { BaselineSummary, Idea } from "@/lib/vave/types";
import { formatMoney, type CurrencyCode } from "@/lib/vave/currency";

export default function CompareTable({
  baseline,
  ideas,
  currency,
}: {
  baseline: BaselineSummary;
  ideas: Idea[];
  currency: CurrencyCode;
}) {
  const top = ideas.slice(0, 5);
  const costDigits = currency === "INR" ? 1 : 2;
  return (
    <div className="card overflow-x-auto">
      <h3 className="text-base font-semibold mb-3 text-steel-50">Baseline vs. top 5 ideas</h3>
      <table className="w-full text-xs">
        <thead className="text-steel-400">
          <tr className="border-b border-steel-700">
            <th className="py-2 text-left">Metric</th>
            <th className="py-2 text-right">Baseline</th>
            {top.map((i, idx) => (
              <th key={i.id} className="py-2 text-right">
                #{idx + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-steel-200">
          <Row label="Lever" values={["—", ...top.map((i) => i.lever)]} />
          <Row label="Grade" values={["—", ...top.map((i) => i.new_grade_id)]} />
          <Row
            label="Thk (mm)"
            values={["—", ...top.map((i) => i.new_thk_mm.toFixed(2))]}
          />
          <Row label="Coating" values={["—", ...top.map((i) => i.new_coating_id)]} />
          <Row
            label="Joining"
            values={["—", ...top.map((i) => i.new_joining_ids.join("+"))]}
          />
          <Row
            label="Mass / part (kg)"
            values={[
              baseline.mass_per_part_kg.toFixed(3),
              ...top.map((i) => (baseline.mass_per_part_kg + i.weight_delta_kg).toFixed(3)),
            ]}
          />
          <Row
            label="Δ mass (%)"
            values={["0.00", ...top.map((i) => i.weight_delta_pct.toFixed(2))]}
          />
          <Row
            label={`Cost / part (${currency})`}
            values={[
              formatMoney(baseline.cost_per_part_usd, currency, { fractionDigits: costDigits }),
              ...top.map((i) =>
                formatMoney(baseline.cost_per_part_usd + i.cost_delta_per_part_usd, currency, {
                  fractionDigits: costDigits,
                }),
              ),
            ]}
          />
          <Row
            label={`Δ cost (${currency}/part)`}
            values={[
              formatMoney(0, currency, { fractionDigits: costDigits }),
              ...top.map((i) =>
                formatMoney(i.cost_delta_per_part_usd, currency, { fractionDigits: costDigits }),
              ),
            ]}
          />
          <Row
            label={`Δ program (${currency}/yr)`}
            values={[
              formatMoney(0, currency, { compact: true }),
              ...top.map((i) => formatMoney(i.cost_delta_program_usd, currency, { compact: true })),
            ]}
          />
          <Row label="Confidence" values={["—", ...top.map((i) => i.confidence)]} />
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, values }: { label: string; values: (string | number)[] }) {
  return (
    <tr className="border-b border-steel-800">
      <td className="py-2 text-steel-400">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-2 text-right font-mono">
          {v}
        </td>
      ))}
    </tr>
  );
}
