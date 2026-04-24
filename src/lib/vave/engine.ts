import type { GenerateResponse, VaveInput } from "./types";
import { buildBaseline } from "./score";
import { gradeSubstitutionIdeas } from "./rules/gradeSubstitution";
import { gaugeReductionIdeas } from "./rules/gaugeReduction";
import { joiningStackIdeas } from "./rules/joiningStack";
import { coatingIdeas } from "./rules/coating";

export function generate(input: VaveInput): GenerateResponse {
  const base = buildBaseline(input);

  const raw = [
    ...gradeSubstitutionIdeas(input),
    ...gaugeReductionIdeas(input),
    ...joiningStackIdeas(input),
    ...coatingIdeas(input),
  ];

  const ideas = raw.sort((a, b) => b.score - a.score).slice(0, 10);

  return {
    baseline: {
      mass_per_part_kg: +base.mass_kg.toFixed(3),
      cost_per_part_usd: +base.cost_usd.toFixed(3),
      notes: [
        `Baseline: ${base.grade.name} @ ${input.current_thk_mm} mm, coating ${input.current_coating_id}, joining ${input.current_joining_ids.join("+")}.`,
        `Part family: ${base.rule.label} (${base.rule.function}), min UTS ${base.rule.min_uts_mpa} MPa.`,
      ],
    },
    ideas,
  };
}
