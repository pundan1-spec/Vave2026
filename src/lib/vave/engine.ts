import type { GenerateResponse, Region, VaveInput } from "./types";
import { buildBaseline } from "./score";
import { gradeSubstitutionIdeas } from "./rules/gradeSubstitution";
import { gaugeReductionIdeas } from "./rules/gaugeReduction";
import { joiningStackIdeas } from "./rules/joiningStack";
import { coatingIdeas } from "./rules/coating";
import { narrateIdeas } from "./narrator";

export async function generate(input: VaveInput): Promise<GenerateResponse> {
  const base = buildBaseline(input);
  const region: Region = base.region;
  const sourcing_india_only = !!input.sourcing_india_only;

  const sub = gradeSubstitutionIdeas(input);
  const raw = [
    ...sub.ideas,
    ...gaugeReductionIdeas(input),
    ...joiningStackIdeas(input),
    ...coatingIdeas(input),
  ];

  const ideas = raw.sort((a, b) => b.score - a.score).slice(0, 10);

  // Optional narrative enrichment (Claude Haiku 4.5 with prompt caching).
  // Only runs when ANTHROPIC_API_KEY is set AND input.narrate !== false.
  let narrated = false;
  if (input.narrate !== false && process.env.ANTHROPIC_API_KEY) {
    try {
      const narratives = await narrateIdeas(input, base, ideas.slice(0, 5));
      for (const idea of ideas) {
        if (narratives[idea.id]) idea.narrative = narratives[idea.id];
      }
      narrated = Object.keys(narratives).length > 0;
    } catch {
      // Narrator failures must not break the core response.
    }
  }

  return {
    baseline: {
      mass_per_part_kg: +base.mass_kg.toFixed(3),
      cost_per_part_usd: +base.cost_usd.toFixed(3),
      notes: [
        `Baseline: ${base.grade.name} @ ${input.current_thk_mm} mm, coating ${input.current_coating_id}, joining ${input.current_joining_ids.join("+")}.`,
        `Part family: ${base.rule.label} (${base.rule.function}), min UTS ${base.rule.min_uts_mpa} MPa${
          base.rule.min_utst_nmm ? `, min UTS·t ${base.rule.min_utst_nmm} N/mm` : ""
        }.`,
        `Region: ${region}${sourcing_india_only ? " · India sourcing only" : ""}.`,
      ],
      crash_tests: base.rule.crash_tests ?? [],
    },
    ideas,
    meta: {
      region,
      sourcing_india_only,
      narrated,
      filtered_out_non_india: sub.filtered_india,
      filtered_out_crash_gate: sub.filtered_crash,
    },
  };
}
