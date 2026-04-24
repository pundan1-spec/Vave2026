"use client";
import type { Idea } from "@/lib/vave/types";
import { formatMoney, signed, type CurrencyCode } from "@/lib/vave/currency";

const LEVER_LABEL: Record<Idea["lever"], string> = {
  grade_substitution: "Grade",
  gauge_reduction: "Gauge",
  joining_stack: "Joining",
  coating: "Coating",
};

export default function IdeaCard({
  idea,
  rank,
  currency,
}: {
  idea: Idea;
  rank: number;
  currency: CurrencyCode;
}) {
  const weightCls =
    idea.weight_delta_kg < 0 ? "text-green-400" : idea.weight_delta_kg > 0 ? "text-red-300" : "text-steel-200";
  const costCls =
    idea.cost_delta_per_part_usd < 0
      ? "text-green-400"
      : idea.cost_delta_per_part_usd > 0
        ? "text-red-300"
        : "text-steel-200";

  return (
    <article className="card flex flex-col gap-3">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="chip">#{rank}</span>
            <span className="chip">{LEVER_LABEL[idea.lever]}</span>
            <span
              className={`chip ${
                idea.confidence === "high"
                  ? "!border-green-500 !text-green-300"
                  : idea.confidence === "low"
                    ? "!border-red-500 !text-red-300"
                    : ""
              }`}
            >
              {idea.confidence} confidence
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-steel-50">{idea.title}</h3>
          <p className="text-sm text-steel-300">{idea.summary}</p>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-lg font-bold ${weightCls}`}>
            {signed(idea.weight_delta_kg)}
            {idea.weight_delta_kg.toFixed(3)} kg
          </div>
          <div className="text-[11px] text-steel-400">
            {idea.weight_delta_pct.toFixed(1)}% per part
          </div>
          <div className={`mt-1 text-sm font-semibold ${costCls}`}>
            {signed(idea.cost_delta_per_part_usd)}
            {formatMoney(idea.cost_delta_per_part_usd, currency, { fractionDigits: currency === "INR" ? 1 : 2 })}
            /part
          </div>
          <div className="text-[11px] text-steel-400">
            Program: {formatMoney(idea.cost_delta_program_usd, currency, { compact: true })} / yr
            (±{idea.cost_band_pct}%)
          </div>
        </div>
      </header>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-steel-300">
        <div>
          <dt className="text-steel-400">Welding</dt>
          <dd>{idea.weldability_note}</dd>
        </div>
        <div>
          <dt className="text-steel-400">Coating</dt>
          <dd>{idea.coating_note}</dd>
        </div>
        <div>
          <dt className="text-steel-400">Formability</dt>
          <dd>{idea.formability_note}</dd>
        </div>
        <div>
          <dt className="text-steel-400">Crash / Stiffness</dt>
          <dd>{idea.crash_note}</dd>
        </div>
      </dl>

      {idea.risks.length > 0 && (
        <div className="rounded border border-amber-700/60 bg-amber-900/20 p-2 text-xs text-amber-200">
          <div className="font-semibold mb-1">Risks / checks</div>
          <ul className="list-disc pl-4">
            {idea.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <footer className="text-[10px] text-steel-500">
        Sources: {idea.sources.join("; ")}
      </footer>
    </article>
  );
}
