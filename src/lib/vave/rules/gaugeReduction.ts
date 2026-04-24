import type { Idea, VaveInput } from "../types";
import {
  buildBaseline,
  costPerPartUsd,
  massPerPartKg,
  scoreIdea,
} from "../score";

/**
 * Pure down-gauging on the current grade (no grade swap).
 * For stiffness-dominated parts, compensate with weld-bond; for crash parts, skip
 * (grade_substitution rule handles crash-thk trades).
 */
export function gaugeReductionIdeas(input: VaveInput): Idea[] {
  const base = buildBaseline(input);
  const ideas: Idea[] = [];

  const steps = [0.9, 0.85, 0.8];
  for (const factor of steps) {
    let new_thk_mm = +(input.current_thk_mm * factor).toFixed(2);
    const [tMin] = base.grade.typical_thk_mm;
    if (new_thk_mm < tMin) continue;

    const new_mass = massPerPartKg(base.grade, new_thk_mm, input.blank_area_m2);
    const delta_kg = new_mass - base.mass_kg;
    const delta_pct = (delta_kg / base.mass_kg) * 100;

    let new_joining = [...input.current_joining_ids];
    const weldNotes: string[] = [];
    const risks: string[] = [];

    if (base.rule.stiffness_dominated) {
      if (!new_joining.includes("RSW_ADHESIVE") && !new_joining.includes("ADHESIVE_ONLY")) {
        new_joining.push("RSW_ADHESIVE");
        weldNotes.push(
          "Weld-bond added: ~20% stiffness uplift compensates for gauge reduction.",
        );
      }
    } else {
      // Crash part — gauge reduction alone is risky without a stronger grade
      risks.push(
        "Crash-function part: gauge-down without grade-up reduces UTS·t — verify intrusion.",
      );
    }

    const new_cost = costPerPartUsd(
      base.grade,
      new_thk_mm,
      input.blank_area_m2,
      input.current_coating_id,
      new_joining,
      input.part_family,
    );
    const cost_delta = new_cost - base.cost_usd;

    const idea: Idea = {
      id: `gauge:${base.grade.id}:${new_thk_mm}`,
      lever: "gauge_reduction",
      title: `Down-gauge ${base.grade.name} to ${new_thk_mm} mm`,
      summary: `Reduce thickness by ${((1 - factor) * 100).toFixed(0)}% on the existing grade${
        base.rule.stiffness_dominated ? " with weld-bond compensation" : ""
      }.`,
      new_grade_id: base.grade.id,
      new_thk_mm,
      new_coating_id: input.current_coating_id,
      new_joining_ids: new_joining,
      weight_delta_kg: +delta_kg.toFixed(3),
      weight_delta_pct: +delta_pct.toFixed(2),
      cost_delta_per_part_usd: +cost_delta.toFixed(3),
      cost_delta_program_usd: +(cost_delta * input.annual_volume).toFixed(0),
      cost_band_pct: 12,
      weldability_note: weldNotes.join(" ") || "No welding change required.",
      coating_note: `${input.current_coating_id}: unchanged.`,
      formability_note: `Formability unchanged (same grade at thinner gauge).`,
      crash_note: base.rule.stiffness_dominated
        ? `Stiffness ratio t³ ${(Math.pow(new_thk_mm, 3) / Math.pow(input.current_thk_mm, 3)).toFixed(2)}× (adhesive recovers).`
        : `UTS·t drops ${((1 - factor) * 100).toFixed(0)}% — flagged.`,
      confidence: base.rule.stiffness_dominated ? "high" : "low",
      risks,
      sources: [base.grade.source, "WorldAutoSteel AHSS Insights, weld-bonding"],
      score: 0,
    };
    idea.score = scoreIdea(idea);
    ideas.push(idea);
  }
  return ideas;
}
