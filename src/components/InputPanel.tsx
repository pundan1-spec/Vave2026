"use client";
import { useMemo, useState } from "react";
import type { VaveInput } from "@/lib/vave/types";
import type { CurrencyCode } from "@/lib/vave/currency";
import gradesJson from "@/data/grades.json";
import coatingsJson from "@/data/coatings.json";
import joiningJson from "@/data/joining.json";
import partRulesJson from "@/data/partRules.json";

const GRADES = gradesJson as unknown as {
  id: string;
  name: string;
  family: string;
  typical_thk_mm: [number, number];
}[];
const COATINGS = coatingsJson as unknown as { id: string; name: string }[];
const JOINING = joiningJson as unknown as { id: string; name: string }[];
const PART_RULES = partRulesJson as unknown as Record<
  string,
  { label: string; function: string }
>;

// India-context default: HSLA rail @ 1.5 mm, 150k/yr, GA + RSW, ₹ INR.
const DEFAULT: VaveInput = {
  current_grade_id: "HSLA-340",
  current_thk_mm: 1.5,
  part_family: "rail",
  annual_volume: 150000,
  blank_area_m2: 0.8,
  current_coating_id: "GA",
  current_joining_ids: ["RSW"],
  currency: "INR",
  sourcing_india_only: true,
  narrate: true,
};

const PRESETS: {
  label: string;
  note: string;
  input: VaveInput;
}[] = [
  {
    label: "Floor pan · Mild 0.8 mm",
    note: "Classic Indian baseline — room to move to IF-HS/BH and down-gauge.",
    input: {
      current_grade_id: "MILD-140",
      current_thk_mm: 0.8,
      part_family: "floor_pan",
      annual_volume: 200000,
      blank_area_m2: 1.8,
      current_coating_id: "GA",
      current_joining_ids: ["RSW"],
      currency: "INR",
      sourcing_india_only: true,
      narrate: true,
    },
  },
  {
    label: "Door inner · IF 0.75 mm",
    note: "IF deep-draw baseline — move to IF-HS or DP-HE for weight save.",
    input: {
      current_grade_id: "IF-180",
      current_thk_mm: 0.75,
      part_family: "door_inner",
      annual_volume: 200000,
      blank_area_m2: 1.1,
      current_coating_id: "GA",
      current_joining_ids: ["RSW"],
      currency: "INR",
      sourcing_india_only: true,
      narrate: true,
    },
  },
  {
    label: "B-pillar reinf · HSLA 1.6 mm",
    note: "Legacy BIW — candidate for PHS1500 with Al-Si + pulsed RSW + weld-bond.",
    input: {
      current_grade_id: "HSLA-340",
      current_thk_mm: 1.6,
      part_family: "b_pillar_reinf",
      annual_volume: 150000,
      blank_area_m2: 0.9,
      current_coating_id: "GA",
      current_joining_ids: ["RSW"],
      currency: "INR",
      sourcing_india_only: true,
      narrate: true,
    },
  },
  {
    label: "Rail · HSLA 1.5 mm",
    note: "HSLA rail — TRIP780 / DP780 unlock axial-crush + weight save.",
    input: DEFAULT,
  },
];

export default function InputPanel({
  onResult,
}: {
  onResult: (r: unknown, input: VaveInput, currency: CurrencyCode) => void;
}) {
  const [form, setForm] = useState<VaveInput>(DEFAULT);
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGrade = useMemo(
    () => GRADES.find((g) => g.id === form.current_grade_id),
    [form.current_grade_id],
  );

  function update<K extends keyof VaveInput>(k: K, v: VaveInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleJoining(id: string) {
    setForm((f) => ({
      ...f,
      current_joining_ids: f.current_joining_ids.includes(id)
        ? f.current_joining_ids.filter((j) => j !== id)
        : [...f.current_joining_ids, id],
    }));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      onResult(json, form, currency);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-steel-50">Baseline part</h2>
        <div className="flex gap-1 text-xs">
          {(["INR", "USD", "EUR"] as CurrencyCode[]).map((c) => (
            <button
              key={c}
              type="button"
              className={`px-2 py-1 rounded border ${
                currency === c
                  ? "border-accent-500 text-accent-500"
                  : "border-steel-600 text-steel-300"
              }`}
              onClick={() => setCurrency(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="label">Quick presets (India context)</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="chip hover:!bg-accent-500 hover:!text-steel-900 hover:!border-accent-500"
              title={p.note}
              onClick={() => setForm(p.input)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Part family</label>
          <select
            className="input"
            value={form.part_family}
            onChange={(e) => update("part_family", e.target.value)}
          >
            {Object.entries(PART_RULES).map(([id, r]) => (
              <option key={id} value={id}>
                {r.label} — {r.function}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Steel grade (current)</label>
          <select
            className="input"
            value={form.current_grade_id}
            onChange={(e) => update("current_grade_id", e.target.value)}
          >
            {GRADES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.family})
              </option>
            ))}
          </select>
          {selectedGrade && (
            <p className="mt-1 text-[11px] text-steel-400">
              Typical gauge range {selectedGrade.typical_thk_mm[0]}–
              {selectedGrade.typical_thk_mm[1]} mm
            </p>
          )}
        </div>
        <div>
          <label className="label">Thickness (mm)</label>
          <input
            type="number"
            step="0.05"
            min="0.4"
            max="4"
            className="input"
            value={form.current_thk_mm}
            onChange={(e) => update("current_thk_mm", parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Blank area (m²)</label>
          <input
            type="number"
            step="0.05"
            min="0.05"
            className="input"
            value={form.blank_area_m2}
            onChange={(e) => update("blank_area_m2", parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Annual volume (parts/yr)</label>
          <input
            type="number"
            step="1000"
            min="0"
            className="input"
            value={form.annual_volume}
            onChange={(e) => update("annual_volume", parseInt(e.target.value, 10))}
          />
        </div>
        <div>
          <label className="label">Current coating</label>
          <select
            className="input"
            value={form.current_coating_id}
            onChange={(e) => update("current_coating_id", e.target.value)}
          >
            {COATINGS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <div className="label">Current joining stack</div>
        <div className="flex flex-wrap gap-2">
          {JOINING.map((j) => {
            const active = form.current_joining_ids.includes(j.id);
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => toggleJoining(j.id)}
                className={`chip ${
                  active ? "!bg-accent-500 !text-steel-900 !border-accent-500" : ""
                }`}
              >
                {j.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.sourcing_india_only}
            onChange={(e) => update("sourcing_india_only", e.target.checked)}
            className="accent-accent-500"
          />
          <span>
            India-sourcing only
            <span className="block text-[10px] text-steel-400">
              Hide grades not produced locally (Tata / JSW / SAIL / AM-NS).
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.narrate !== false}
            onChange={(e) => update("narrate", e.target.checked)}
            className="accent-accent-500"
          />
          <span>
            AI narrative per idea
            <span className="block text-[10px] text-steel-400">
              Needs ANTHROPIC_API_KEY; uses Claude Haiku 4.5 with prompt caching.
            </span>
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded border border-red-500 bg-red-900/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button className="btn-primary" onClick={submit} disabled={loading}>
          {loading ? "Generating…" : "Generate VAVE ideas"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setForm(DEFAULT)}>
          Reset
        </button>
      </div>
    </section>
  );
}
