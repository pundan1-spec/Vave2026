import type { Idea, VaveInput } from "../types";
import {
  buildBaseline,
  costPerPartUsd,
  scoreIdea,
} from "../score";
import { COATINGS } from "../data";

/**
 * Coating-only ideas — corrosion durability or welding-window improvements.
 */
export function coatingIdeas(input: VaveInput): Idea[] {
  const base = buildBaseline(input);
  const ideas: Idea[] = [];

  // PHS gate
  if (base.grade.family === "PHS") {
    if (input.current_coating_id !== "AlSi" && input.current_coating_id !== "ZnCoatedPHS") {
      ideas.push(
        makeCoatingIdea(input, base, "AlSi", "Apply Al-Si coating (PHS standard)", [
          "Al-Si is near-mandatory for PHS to suppress oxide scale; laser-ablation step added.",
        ]),
      );
    }
    return ideas;
  }

  // Corrosion upgrade to ZnAlMg on structural / crash parts
  if (
    ["GI", "GA"].includes(input.current_coating_id) &&
    base.rule.function !== "closure"
  ) {
    ideas.push(
      makeCoatingIdea(
        input,
        base,
        "ZnAlMg",
        "Switch to Zn-Al-Mg for 2–3× corrosion life",
        ["Slight RSW current adjustment; galvanic compatibility with fasteners to be checked."],
      ),
    );
  }

  // Class-A closures → EG for paint finish
  if (base.rule.function === "closure" && input.current_coating_id !== "EG") {
    ideas.push(
      makeCoatingIdea(
        input,
        base,
        "EG",
        "Electrogalvanize for class-A surface",
        ["Cost uplift vs. HDG; only for visible closure skins."],
      ),
    );
  }

  return ideas;
}

function makeCoatingIdea(
  input: VaveInput,
  base: ReturnType<typeof buildBaseline>,
  new_coating_id: string,
  title: string,
  risks: string[],
): Idea {
  const coat = COATINGS.find((c) => c.id === new_coating_id)!;
  const new_cost = costPerPartUsd(
    base.grade,
    input.current_thk_mm,
    input.blank_area_m2,
    new_coating_id,
    input.current_joining_ids,
    input.part_family,
    base.region,
  );
  const cost_delta = new_cost - base.cost_usd;
  const idea: Idea = {
    id: `coat:${new_coating_id}`,
    lever: "coating",
    title,
    summary: coat.notes,
    new_grade_id: base.grade.id,
    new_thk_mm: input.current_thk_mm,
    new_coating_id,
    new_joining_ids: input.current_joining_ids,
    weight_delta_kg: 0,
    weight_delta_pct: 0,
    cost_delta_per_part_usd: +cost_delta.toFixed(3),
    cost_delta_program_usd: +(cost_delta * input.annual_volume).toFixed(0),
    cost_band_pct: 10,
    weldability_note: `RSW ease ${coat.rsw_ease.toFixed(2)}, laser ease ${coat.laser_ease.toFixed(2)}.`,
    coating_note: coat.notes,
    formability_note: "N/A — coating change only.",
    crash_note: "No crash change.",
    crash_tests: base.rule.crash_tests ?? [],
    suppliers_in_india: base.grade.suppliers_in_india,
    confidence: "high",
    risks,
    sources: [coat.source],
    score: 0,
  };
  idea.score = scoreIdea(idea);
  return idea;
}
