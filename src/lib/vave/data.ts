import gradesJson from "@/data/grades.json";
import coatingsJson from "@/data/coatings.json";
import joiningJson from "@/data/joining.json";
import partRulesJson from "@/data/partRules.json";
import type { Grade, Coating, JoiningMethod, PartRule } from "./types";

export const GRADES: Grade[] = gradesJson as Grade[];
export const COATINGS: Coating[] = coatingsJson as Coating[];
export const JOINING: JoiningMethod[] = joiningJson as JoiningMethod[];
export const PART_RULES: Record<string, PartRule> = partRulesJson as Record<string, PartRule>;

export function getGrade(id: string): Grade {
  const g = GRADES.find((x) => x.id === id);
  if (!g) throw new Error(`Unknown grade: ${id}`);
  return g;
}

export function getCoating(id: string): Coating {
  const c = COATINGS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown coating: ${id}`);
  return c;
}

export function getJoining(id: string): JoiningMethod {
  const j = JOINING.find((x) => x.id === id);
  if (!j) throw new Error(`Unknown joining: ${id}`);
  return j;
}

export function getPartRule(id: string): PartRule {
  const p = PART_RULES[id];
  if (!p) throw new Error(`Unknown part family: ${id}`);
  return p;
}
