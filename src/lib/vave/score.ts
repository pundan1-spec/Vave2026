import type {
  Coating,
  Grade,
  Idea,
  JoiningMethod,
  PartRule,
  Region,
  VaveInput,
} from "./types";
import { getCoating, getGrade, getJoining, getPartRule } from "./data";

const INR_PER_USD = 83.5;

export function massPerPartKg(grade: Grade, thk_mm: number, blank_area_m2: number): number {
  return grade.density_kg_m3 * (thk_mm / 1000) * blank_area_m2;
}

/** Steel cost in USD/kg for the chosen region. India uses the local INR sheet converted to USD. */
export function steelUsdPerKg(grade: Grade, region: Region): number {
  if (region === "INDIA") return grade.price_inr_per_kg / INR_PER_USD;
  return grade.cost_index_usd_per_kg;
}

export function coatingUplift(coating: Coating, mass_kg: number): number {
  return coating.cost_uplift_usd_per_kg * mass_kg;
}

export function joinsPerPart(part_family: string): number {
  const role = getPartRule(part_family).function;
  if (role === "crash" || role === "crash_energy") return 28;
  if (role === "structural") return 18;
  return 12;
}

export function joiningOpex(methods: JoiningMethod[], joints: number): number {
  if (methods.length === 0) return 0;
  const perMethod = joints / methods.length;
  return methods.reduce((acc, m) => acc + m.opex_usd_per_joint * perMethod, 0);
}

export function costPerPartUsd(
  grade: Grade,
  thk_mm: number,
  blank_area_m2: number,
  coatingId: string,
  joiningIds: string[],
  part_family: string,
  region: Region,
): number {
  const mass = massPerPartKg(grade, thk_mm, blank_area_m2);
  const steelCost = mass * steelUsdPerKg(grade, region);
  const coatCost = coatingUplift(getCoating(coatingId), mass);
  const methods = joiningIds.map(getJoining);
  const joints = joinsPerPart(part_family);
  const joinCost = joiningOpex(methods, joints);
  return steelCost + coatCost + joinCost;
}

export interface BaselineContext {
  grade: Grade;
  coating: Coating;
  joining: JoiningMethod[];
  rule: PartRule;
  region: Region;
  mass_kg: number;
  cost_usd: number;
}

export function buildBaseline(input: VaveInput): BaselineContext {
  const grade = getGrade(input.current_grade_id);
  const coating = getCoating(input.current_coating_id);
  const joining = input.current_joining_ids.map(getJoining);
  const rule = getPartRule(input.part_family);
  const region: Region = input.region ?? (input.currency === "INR" ? "INDIA" : "GLOBAL");
  const mass_kg = massPerPartKg(grade, input.current_thk_mm, input.blank_area_m2);
  const cost_usd = costPerPartUsd(
    grade,
    input.current_thk_mm,
    input.blank_area_m2,
    input.current_coating_id,
    input.current_joining_ids,
    input.part_family,
    region,
  );
  return { grade, coating, joining, rule, region, mass_kg, cost_usd };
}

export function scoreIdea(idea: Idea): number {
  const weight = -idea.weight_delta_pct * 8;
  const cost = -idea.cost_delta_per_part_usd * 10;
  const conf = idea.confidence === "high" ? 15 : idea.confidence === "medium" ? 5 : -5;
  const risk = -idea.risks.length * 4;
  return Math.round(weight + cost + conf + risk);
}
