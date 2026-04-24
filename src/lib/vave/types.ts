export type GradeFamily =
  | "IF"
  | "IF-HS"
  | "Mild"
  | "HSLA"
  | "BH"
  | "DP"
  | "TRIP"
  | "CP"
  | "MS"
  | "PHS"
  | "TWIP"
  | "QP"
  | "MedMn"
  | "FB";

export type Region = "INDIA" | "GLOBAL";

export interface Grade {
  id: string;
  name: string;
  family: GradeFamily;
  generation: 1 | 2 | 3;
  ys_mpa: number;
  uts_mpa: number;
  te_pct: number;
  n_value: number;
  r_over_t_bend: number;
  ce_max: number;
  weldability_idx: number;
  typical_coatings: string[];
  cost_index_usd_per_kg: number;
  price_inr_per_kg: number;
  suppliers_in_india: string[];
  density_kg_m3: number;
  typical_thk_mm: [number, number];
  best_for: string[];
  avoid_for: string[];
  source: string;
}

export interface Coating {
  id: string;
  name: string;
  corrosion_class: number;
  rsw_ease: number;
  laser_ease: number;
  adhesive_ease: number;
  cost_uplift_usd_per_kg: number;
  notes: string;
  source: string;
}

export interface JoiningMethod {
  id: string;
  name: string;
  applies_to_uts_max_mpa: number;
  multi_material: boolean;
  capex_index: number;
  opex_usd_per_joint: number;
  cycle_time_s: number;
  stiffness_gain_pct?: number;
  fatigue_gain_pct?: number;
  notes: string;
  source: string;
}

export interface PartRule {
  label: string;
  function: "crash" | "crash_energy" | "structural" | "closure";
  min_uts_mpa: number;
  min_utst_nmm?: number;
  crash_tests?: string[];
  preferred_families: GradeFamily[];
  coating_required: string[];
  stiffness_dominated: boolean;
  notes: string;
  source: string;
}

export interface VaveInput {
  current_grade_id: string;
  current_thk_mm: number;
  part_family: string;
  annual_volume: number;
  blank_area_m2: number;
  current_coating_id: string;
  current_joining_ids: string[];
  currency?: "USD" | "INR" | "EUR";
  region?: Region;
  sourcing_india_only?: boolean;
  narrate?: boolean;
}

export type IdeaLever =
  | "grade_substitution"
  | "gauge_reduction"
  | "joining_stack"
  | "coating";

export interface Idea {
  id: string;
  lever: IdeaLever;
  title: string;
  summary: string;
  new_grade_id: string;
  new_thk_mm: number;
  new_coating_id: string;
  new_joining_ids: string[];
  weight_delta_kg: number;
  weight_delta_pct: number;
  cost_delta_per_part_usd: number;
  cost_delta_program_usd: number;
  cost_band_pct: number;
  weldability_note: string;
  coating_note: string;
  formability_note: string;
  crash_note: string;
  crash_tests?: string[];
  suppliers_in_india?: string[];
  confidence: "high" | "medium" | "low";
  risks: string[];
  sources: string[];
  score: number;
  narrative?: string;
}

export interface BaselineSummary {
  mass_per_part_kg: number;
  cost_per_part_usd: number;
  notes: string[];
  crash_tests?: string[];
}

export interface GenerateResponse {
  baseline: BaselineSummary;
  ideas: Idea[];
  meta: {
    region: Region;
    sourcing_india_only: boolean;
    narrated: boolean;
    filtered_out_non_india: number;
    filtered_out_crash_gate: number;
  };
}
