import type { Idea, VaveInput } from "../types";
import {
  buildBaseline,
  costPerPartUsd,
  scoreIdea,
} from "../score";
import { JOINING } from "../data";

/**
 * Purely modify the joining stack (grade + gauge unchanged).
 * Useful when LME risk, throughput, or multi-material joining is the constraint.
 */
export function joiningStackIdeas(input: VaveInput): Idea[] {
  const base = buildBaseline(input);
  const ideas: Idea[] = [];
  const baseIds = new Set(input.current_joining_ids);

  // Candidate stacks to try
  const candidates: { ids: string[]; title: string; summary: string; risks?: string[] }[] = [];

  if (base.grade.uts_mpa >= 980 && baseIds.has("RSW") && !baseIds.has("RSW_PULSED")) {
    candidates.push({
      ids: input.current_joining_ids.map((j) => (j === "RSW" ? "RSW_PULSED" : j)),
      title: "Swap RSW → pulsed RSW schedule",
      summary: "Pulsed-current RSW broadens the weld lobe and mitigates LME on Zn-coated UHSS.",
    });
  }

  if (!baseIds.has("RSW_ADHESIVE") && !baseIds.has("ADHESIVE_ONLY")) {
    candidates.push({
      ids: [...input.current_joining_ids, "RSW_ADHESIVE"],
      title: "Add structural adhesive (weld-bond)",
      summary:
        "Adhesive + spot-weld delivers ~20% stiffness, +30% fatigue, NVH improvement; often unlocks a down-gauge step.",
    });
  }

  if (base.grade.uts_mpa >= 1180 && !baseIds.has("FDS") && !baseIds.has("SPR")) {
    candidates.push({
      ids: [...input.current_joining_ids, "FDS"],
      title: "Add flow-drill screw for hard-to-weld UHSS",
      summary:
        "Single-sided access and no LME risk; useful for PHS / DP1180 sub-assemblies with Al carriers.",
    });
  }

  if (base.grade.uts_mpa <= 780 && !baseIds.has("CLINCH")) {
    candidates.push({
      ids: [...input.current_joining_ids, "CLINCH"],
      title: "Add clinching on non-structural flanges",
      summary:
        "Coating-tolerant, cheap joint for shear-loaded flanges — offloads RSW gun-count.",
    });
  }

  for (const c of candidates) {
    const methods = c.ids.map((id) => JOINING.find((j) => j.id === id)!);
    if (methods.some((m) => m.applies_to_uts_max_mpa < base.grade.uts_mpa)) continue;

    const new_cost = costPerPartUsd(
      base.grade,
      input.current_thk_mm,
      input.blank_area_m2,
      input.current_coating_id,
      c.ids,
      input.part_family,
    );
    const cost_delta = new_cost - base.cost_usd;

    const hasAdhesive = c.ids.includes("RSW_ADHESIVE") || c.ids.includes("ADHESIVE_ONLY");
    const stiffnessUplift = hasAdhesive ? 20 : 0;

    const idea: Idea = {
      id: `join:${c.ids.join("+")}`,
      lever: "joining_stack",
      title: c.title,
      summary: c.summary,
      new_grade_id: base.grade.id,
      new_thk_mm: input.current_thk_mm,
      new_coating_id: input.current_coating_id,
      new_joining_ids: c.ids,
      weight_delta_kg: 0,
      weight_delta_pct: 0,
      cost_delta_per_part_usd: +cost_delta.toFixed(3),
      cost_delta_program_usd: +(cost_delta * input.annual_volume).toFixed(0),
      cost_band_pct: 10,
      weldability_note: c.title.includes("pulsed")
        ? "Pulsed RSW widens current range; LME risk reduced."
        : "No RSW change; additional process step added.",
      coating_note: `${input.current_coating_id}: unchanged.`,
      formability_note: "N/A — joining-only change.",
      crash_note: stiffnessUplift ? `+${stiffnessUplift}% joint stiffness, +30% fatigue.` : "No mass-bearing change.",
      confidence: "high",
      risks: c.risks ?? [],
      sources: methods.map((m) => m.source),
      score: 0,
    };
    idea.score = scoreIdea(idea);
    ideas.push(idea);
  }
  return ideas;
}
