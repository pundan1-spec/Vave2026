"use client";
import { useState } from "react";
import InputPanel from "@/components/InputPanel";
import IdeaCard from "@/components/IdeaCard";
import CompareTable from "@/components/CompareTable";
import WeightCostChart from "@/components/WeightCostChart";
import ExportButtons from "@/components/ExportButtons";
import type { GenerateResponse, VaveInput } from "@/lib/vave/types";
import { formatMoney, type CurrencyCode } from "@/lib/vave/currency";

export default function Home() {
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [input, setInput] = useState<VaveInput | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <InputPanel
          onResult={(r, i, c) => {
            setResult(r as GenerateResponse);
            setInput(i);
            setCurrency(c);
          }}
        />
        {result && (
          <div className="card">
            <h3 className="text-sm font-semibold text-steel-50 mb-1">Baseline</h3>
            <div className="text-xs text-steel-300">
              Mass {result.baseline.mass_per_part_kg.toFixed(3)} kg · Cost{" "}
              {formatMoney(result.baseline.cost_per_part_usd, currency, {
                fractionDigits: currency === "INR" ? 1 : 2,
              })}{" "}
              / part
            </div>
            <ul className="mt-2 text-[11px] text-steel-400 list-disc pl-4 space-y-1">
              {result.baseline.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            {result.baseline.crash_tests && result.baseline.crash_tests.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] text-steel-400 uppercase tracking-wider mb-1">
                  Governing crash tests
                </div>
                <div className="flex flex-wrap gap-1">
                  {result.baseline.crash_tests.map((t) => (
                    <span
                      key={t}
                      className="chip !text-[10px] !border-blue-500 !text-blue-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {result.meta && (
              <div className="mt-3 text-[10px] text-steel-500">
                {result.meta.narrated && "AI narratives · "}
                Region: {result.meta.region}
                {result.meta.sourcing_india_only && " · India-only"}
                {result.meta.filtered_out_non_india > 0 &&
                  ` · ${result.meta.filtered_out_non_india} imported grades hidden`}
                {result.meta.filtered_out_crash_gate > 0 &&
                  ` · ${result.meta.filtered_out_crash_gate} failed UTS·t gate`}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-8 space-y-4">
        {!result && (
          <div className="card text-sm text-steel-300">
            <h2 className="text-lg font-semibold text-steel-50 mb-2">
              Generate ideas (India context)
            </h2>
            <p>
              Set the baseline on the left and click <b>Generate VAVE ideas</b>. The
              engine proposes ranked ideas across four levers — grade substitution,
              gauge reduction, joining stack and coating — with integrated welding,
              coating and formability notes, and weight + cost deltas per part and
              per program in ₹.
            </p>
            <p className="mt-2 text-steel-400">
              Typical Indian OEM baselines are <b>IF / IF-HS / Mild / HSLA</b>. The
              preset chips on the left jump-start common scenarios: mild floor pan
              → IF-HS/BH down-gauge, IF door inner → DP-HE, HSLA B-pillar reinf →
              PHS 1500 with Al-Si + pulsed RSW + weld-bond.
            </p>
            <ul className="mt-3 list-disc pl-5 text-xs text-steel-400 space-y-1">
              <li>Stiffness-dominated parts compensate gauge-down with weld-bond.</li>
              <li>UHSS (≥ 980 MPa) auto-upgrades RSW → pulsed RSW for LME control.</li>
              <li>PHS mandates Al-Si or Zn-coated PHS.</li>
              <li>Class-A closures prefer EG for paint finish.</li>
            </ul>
          </div>
        )}

        {result && input && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-steel-50">
                {result.ideas.length} ranked ideas
              </h2>
              <ExportButtons input={input} result={result} currency={currency} />
            </div>
            <WeightCostChart ideas={result.ideas} currency={currency} />
            <CompareTable baseline={result.baseline} ideas={result.ideas} currency={currency} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {result.ideas.map((idea, i) => (
                <IdeaCard key={idea.id} idea={idea} rank={i + 1} currency={currency} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
