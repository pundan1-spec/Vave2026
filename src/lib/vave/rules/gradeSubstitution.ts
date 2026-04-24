import type { Idea, VaveInput } from "../types";
import { GRADES } from "../data";
import {
  buildBaseline,
  costPerPartUsd,
  massPerPartKg,
  scoreIdea,
} from "../score";

const RULE_ID = "grade_substitution";

/**
 * For each candidate grade satisfying the part-family UTS floor,
 * compute an equal-strength thickness that keeps load-carrying
 * capacity (UTS * t) parity with the baseline, clipped to the
 * candidate grade's typical gauge range.
 */
export function gradeSubstitutionIdeas(input: VaveInput): Idea[] {
  const base = buildBaseline(input);
  const baselineUtsThk = base.grade.uts_mpa * input.current_thk_mm;
  const baselineStiffnessT3 = Math.pow(input.current_thk_mm, 3);

  const ideas: Idea[] = [];

  for (const cand of GRADES) {
    if (cand.id === base.grade.id) continue;
    if (cand.uts_mpa < base.rule.min_uts_mpa) continue;
    if (cand.avoid_for.includes(input.part_family)) continue;

    let new_thk_mm: number;
    let stiffnessSwap = false;
    if (base.rule.stiffness_dominated) {
      // Pure stiffness (E·t³) doesn't change across steel grades, but a higher-YS grade
      // enables dent resistance / oil-canning parity with stiffener redesign —
      // a realistic VAVE move for IF/Mild baselines on inner panels and closures.
      if (cand.ys_mpa <= base.grade.ys_mpa) continue;
      if (!base.rule.preferred_families.includes(cand.family)) continue;
      const gaugeFactor = Math.max(
        0.8,
        Math.sqrt(base.grade.ys_mpa / cand.ys_mpa),
      );
      new_thk_mm = input.current_thk_mm * gaugeFactor;
      stiffnessSwap = true;
    } else {
      // Strength parity (UTS·t)
      new_thk_mm = baselineUtsThk / cand.uts_mpa;
    }

    const [tMin, tMax] = cand.typical_thk_mm;
    new_thk_mm = Math.max(tMin, Math.min(tMax, new_thk_mm));
    new_thk_mm = Math.round(new_thk_mm * 100) / 100;

    // Require meaningful change
    if (Math.abs(new_thk_mm - input.current_thk_mm) < 0.05 && cand.family === base.grade.family) {
      continue;
    }

    const new_mass = massPerPartKg(cand, new_thk_mm, input.blank_area_m2);
    const delta_kg = new_mass - base.mass_kg;
    const delta_pct = (delta_kg / base.mass_kg) * 100;

    // Coating: keep if compatible, else swap
    let new_coating = input.current_coating_id;
    if (cand.family === "PHS") new_coating = "AlSi";
    if (!cand.typical_coatings.includes(new_coating))
      new_coating = cand.typical_coatings[0];

    // Joining: auto-upgrade for UHSS
    let new_joining = [...input.current_joining_ids];
    const weldabilityNotes: string[] = [];
    if (cand.uts_mpa >= 980 && new_joining.includes("RSW")) {
      new_joining = new_joining.map((j) => (j === "RSW" ? "RSW_PULSED" : j));
      weldabilityNotes.push("RSW upgraded to pulsed schedule for UHSS (LME mitigation).");
    }
    if (cand.uts_mpa >= 1200 && !new_joining.includes("RSW_ADHESIVE") && !new_joining.includes("ADHESIVE_ONLY")) {
      new_joining.push("RSW_ADHESIVE");
      weldabilityNotes.push("Weld-bond added: UHSS spot-weld crash robustness + stiffness uplift.");
    }

    const new_cost = costPerPartUsd(
      cand,
      new_thk_mm,
      input.blank_area_m2,
      new_coating,
      new_joining,
      input.part_family,
    );

    const cost_delta_per_part = new_cost - base.cost_usd;
    const cost_delta_program = cost_delta_per_part * input.annual_volume;

    const risks: string[] = [];
    if (cand.r_over_t_bend > 2)
      risks.push(`Bendability r/t ≥ ${cand.r_over_t_bend} — re-evaluate flange radii`);
    if (cand.te_pct < 8)
      risks.push(`Low total elongation ${cand.te_pct}% — forming feasibility check needed`);
    if (cand.ce_max > 0.42)
      risks.push(`High CE ${cand.ce_max} — weld schedule development required`);
    if (base.rule.function === "crash" && cand.uts_mpa < base.grade.uts_mpa)
      risks.push("Downgrade in UTS for a crash part — verify intrusion / energy absorption");
    if (stiffnessSwap)
      risks.push(
        "Stiffness-dominated part: gauge-down driven by YS parity — requires stiffener / bead redesign and dent-resistance validation",
      );

    const formability_note =
      cand.te_pct >= 15
        ? `Good formability (TE ${cand.te_pct}%, n ${cand.n_value}).`
        : `Limited formability (TE ${cand.te_pct}%); consider roll-forming or PHS for complex geometry.`;

    const crash_note =
      base.rule.function === "crash"
        ? `UTS·t parity ${(cand.uts_mpa * new_thk_mm).toFixed(0)} vs baseline ${baselineUtsThk.toFixed(0)} N/mm.`
        : stiffnessSwap
          ? `YS gain ${base.grade.ys_mpa}→${cand.ys_mpa} MPa enables ${((1 - new_thk_mm / input.current_thk_mm) * 100).toFixed(0)}% down-gauge with bead/stiffener redesign.`
          : `Stiffness ratio (t³) ${(Math.pow(new_thk_mm, 3) / baselineStiffnessT3).toFixed(2)}×.`;

    const coating_note = `${new_coating}: corrosion class ${
      (cand.typical_coatings.includes(new_coating) ? "ok" : "check")
    }.`;

    const confidence: "high" | "medium" | "low" =
      cand.best_for.includes(input.part_family)
        ? "high"
        : cand.family === base.grade.family
          ? "medium"
          : "medium";

    const idea: Idea = {
      id: `${RULE_ID}:${cand.id}:${new_thk_mm}`,
      lever: "grade_substitution",
      title: `Switch to ${cand.name} @ ${new_thk_mm} mm`,
      summary: `Strength-parity swap from ${base.grade.name} ${input.current_thk_mm} mm to ${cand.name} ${new_thk_mm} mm.`,
      new_grade_id: cand.id,
      new_thk_mm,
      new_coating_id: new_coating,
      new_joining_ids: new_joining,
      weight_delta_kg: +delta_kg.toFixed(3),
      weight_delta_pct: +delta_pct.toFixed(2),
      cost_delta_per_part_usd: +cost_delta_per_part.toFixed(3),
      cost_delta_program_usd: +cost_delta_program.toFixed(0),
      cost_band_pct: 15,
      weldability_note: weldabilityNotes.join(" ") ||
        `Weldability index ${cand.weldability_idx}; RSW compatible.`,
      coating_note,
      formability_note,
      crash_note,
      confidence,
      risks,
      sources: [cand.source],
      score: 0,
    };
    idea.score = scoreIdea(idea);
    ideas.push(idea);
  }

  return ideas;
}
