import Anthropic from "@anthropic-ai/sdk";
import type { Idea, VaveInput } from "./types";
import type { BaselineContext } from "./score";
import { GRADES, COATINGS, JOINING, PART_RULES } from "./data";

/**
 * Optional enrichment: ask Claude Haiku 4.5 to produce a short, VAVE-specific
 * narrative per idea. Prompt-cached system block keeps per-request cost low.
 */

// Build the large static context once so prompt caching gives us near-zero-cost reads.
const STATIC_SYSTEM = [
  "You are a senior VAVE (Value Analysis / Value Engineering) engineer at an Indian steel OEM.",
  "You speak the language of Body-in-White: grade families, UTS·t crash parity, stiffness (E·t³), bendability r/t, LME risk, weld-bonding, Al-Si for PHS, EG for class-A.",
  "Indian context: baselines are typically IF / IF-HS / Mild / HSLA. Lightweight moves go to BH / DP / TRIP / PHS. Cost is discussed in ₹ per part.",
  "",
  "GRADE CATALOG (id, family, UTS/YS MPa, TE%, r/t, suppliers_in_india, ₹/kg):",
  ...GRADES.map(
    (g) =>
      `- ${g.id} (${g.family}) UTS ${g.uts_mpa} YS ${g.ys_mpa} TE ${g.te_pct}% r/t ${g.r_over_t_bend} | suppliers: ${
        g.suppliers_in_india.length ? g.suppliers_in_india.join(", ") : "import only"
      } | ₹${g.price_inr_per_kg}/kg`,
  ),
  "",
  "COATINGS:",
  ...COATINGS.map((c) => `- ${c.id}: ${c.name}. ${c.notes}`),
  "",
  "JOINING METHODS:",
  ...JOINING.map(
    (j) =>
      `- ${j.id}: ${j.name} (up to ${j.applies_to_uts_max_mpa} MPa). ${j.notes}`,
  ),
  "",
  "PART-FAMILY RULES (function, min UTS·t, relevant AIS crash tests):",
  ...Object.entries(PART_RULES).map(
    ([id, r]) =>
      `- ${id} (${r.label}): ${r.function}${
        r.min_utst_nmm ? `, min UTS·t ${r.min_utst_nmm} N/mm` : ""
      }${r.crash_tests && r.crash_tests.length ? `, tests: ${r.crash_tests.join("; ")}` : ""}`,
  ),
  "",
  "WRITING STYLE:",
  "- Two to three crisp sentences per idea. Active voice.",
  "- Lead with why the swap works for THIS part (crash, stiffness, dent, NVH).",
  "- Call out the one biggest execution risk (LME, formability, supplier).",
  "- Use ₹ for money; state the per-part and annual-program direction.",
  "- Do NOT repeat the idea title or restate numbers the UI already shows.",
  "- Do NOT hedge with disclaimers; engineers need a point of view.",
  "",
  "OUTPUT: strict JSON only, no prose, no markdown. Shape:",
  '{"narratives":{"<idea_id>":"<2-3 sentences>", ...}}',
].join("\n");

export async function narrateIdeas(
  input: VaveInput,
  base: BaselineContext,
  ideas: Idea[],
): Promise<Record<string, string>> {
  if (!process.env.ANTHROPIC_API_KEY) return {};
  if (ideas.length === 0) return {};

  const client = new Anthropic();

  const userPayload = {
    baseline: {
      grade: input.current_grade_id,
      thk_mm: input.current_thk_mm,
      part_family: input.part_family,
      coating: input.current_coating_id,
      joining: input.current_joining_ids,
      annual_volume: input.annual_volume,
      mass_kg: +base.mass_kg.toFixed(3),
      region: base.region,
      currency: input.currency ?? (base.region === "INDIA" ? "INR" : "USD"),
    },
    ideas: ideas.map((i) => ({
      id: i.id,
      lever: i.lever,
      title: i.title,
      new_grade: i.new_grade_id,
      new_thk_mm: i.new_thk_mm,
      new_coating: i.new_coating_id,
      new_joining: i.new_joining_ids,
      weight_delta_pct: i.weight_delta_pct,
      cost_delta_per_part_usd: i.cost_delta_per_part_usd,
      crash_note: i.crash_note,
      suppliers_in_india: i.suppliers_in_india ?? [],
      risks: i.risks,
    })),
  };

  // Use the beta messages namespace so we can annotate the large, stable
  // system prompt with cache_control for prompt caching.
  const res = await client.beta.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: [
      {
        type: "text",
        text: STATIC_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Write a narrative for each idea. Return JSON only.\n\n${JSON.stringify(userPayload)}`,
      },
    ],
  });

  const text = res.content
    .filter((c): c is Anthropic.Beta.BetaTextBlock => c.type === "text")
    .map((c) => c.text)
    .join("");

  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const json = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      narratives?: Record<string, string>;
    };
    return json.narratives ?? {};
  } catch {
    return {};
  }
}
