"use client";
import { useMemo, useState } from "react";
import type { VaveInput } from "@/lib/vave/types";
import gradesJson from "@/data/grades.json";
import coatingsJson from "@/data/coatings.json";
import joiningJson from "@/data/joining.json";
import partRulesJson from "@/data/partRules.json";

const GRADES = gradesJson as unknown as { id: string; name: string; family: string; typical_thk_mm: [number, number] }[];
const COATINGS = coatingsJson as unknown as { id: string; name: string }[];
const JOINING = joiningJson as unknown as { id: string; name: string }[];
const PART_RULES = partRulesJson as unknown as Record<string, { label: string; function: string }>;

const DEFAULT: VaveInput = {
  current_grade_id: "DP-340",
  current_thk_mm: 1.4,
  part_family: "b_pillar_outer",
  annual_volume: 200000,
  blank_area_m2: 0.95,
  current_coating_id: "GA",
  current_joining_ids: ["RSW"],
  currency: "USD",
};

export default function InputPanel({
  onResult,
}: {
  onResult: (r: unknown, input: VaveInput) => void;
}) {
  const [form, setForm] = useState<VaveInput>(DEFAULT);
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
      onResult(json, form);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2 className="text-lg font-semibold mb-4 text-steel-50">
        Baseline part
      </h2>
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
              Typical gauge range {selectedGrade.typical_thk_mm[0]}–{selectedGrade.typical_thk_mm[1]} mm
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
                className={`chip ${active ? "!bg-accent-500 !text-steel-900 !border-accent-500" : ""}`}
              >
                {j.name}
              </button>
            );
          })}
        </div>
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
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setForm(DEFAULT)}
        >
          Reset
        </button>
      </div>
    </section>
  );
}
