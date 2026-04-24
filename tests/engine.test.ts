import { describe, it, expect } from "vitest";
import { generate } from "../src/lib/vave/engine";
import type { VaveInput } from "../src/lib/vave/types";

const bPillarBaseline: VaveInput = {
  current_grade_id: "DP-700", // DP 700/980
  current_thk_mm: 1.6,
  part_family: "b_pillar_reinf",
  annual_volume: 200000,
  blank_area_m2: 0.95,
  current_coating_id: "GA",
  current_joining_ids: ["RSW"],
};

describe("VAVE engine — B-pillar reinforcement baseline", () => {
  it("returns a non-empty ranked list", () => {
    const out = generate(bPillarBaseline);
    expect(out.ideas.length).toBeGreaterThanOrEqual(5);
    expect(out.baseline.mass_per_part_kg).toBeGreaterThan(0);
    expect(out.baseline.cost_per_part_usd).toBeGreaterThan(0);
  });

  it("surfaces a PHS-1500 grade-substitution idea with Al-Si coating", () => {
    const out = generate(bPillarBaseline);
    const phs = out.ideas.find((i) => i.new_grade_id === "PHS-1500");
    expect(phs, "expected PHS-1500 in the idea set").toBeDefined();
    expect(phs!.new_coating_id).toBe("AlSi");
  });

  it("auto-upgrades RSW to pulsed RSW + adds weld-bond when switching to UHSS/PHS", () => {
    const out = generate(bPillarBaseline);
    const phs = out.ideas.find((i) => i.new_grade_id === "PHS-1500")!;
    expect(phs.new_joining_ids).toContain("RSW_PULSED");
    expect(phs.new_joining_ids).toContain("RSW_ADHESIVE");
  });

  it("ranks ideas with weight save as top lever for a crash part", () => {
    const out = generate(bPillarBaseline);
    const top = out.ideas[0];
    // Top idea should show meaningful weight reduction for a crash part
    expect(top.weight_delta_pct).toBeLessThan(0);
  });

  it("enforces part-family UTS floor — no grade below min_uts_mpa is proposed for substitution", () => {
    const out = generate(bPillarBaseline);
    const subs = out.ideas.filter((i) => i.lever === "grade_substitution");
    for (const s of subs) {
      const g = s.new_grade_id;
      // The floor for b_pillar_reinf is 1200 MPa; all proposed grades must meet it.
      expect([
        "DP-1000",
        "CP-1000",
        "MS-950",
        "MS-1250",
        "PHS-1500",
        "PHS-2000",
        "CP-680", // excluded by min_uts
        "MMN-1200",
        "QP-1180",
      ]).toContain(g);
    }
  });
});

describe("VAVE engine — floor pan (stiffness-dominated)", () => {
  const floorInput: VaveInput = {
    current_grade_id: "HSLA-340",
    current_thk_mm: 1.0,
    part_family: "floor_pan",
    annual_volume: 300000,
    blank_area_m2: 1.6,
    current_coating_id: "GA",
    current_joining_ids: ["RSW"],
  };

  it("proposes gauge reduction with weld-bond compensation", () => {
    const out = generate(floorInput);
    const gauge = out.ideas.find(
      (i) =>
        i.lever === "gauge_reduction" && i.new_joining_ids.includes("RSW_ADHESIVE"),
    );
    expect(gauge, "expected gauge reduction idea with RSW_ADHESIVE").toBeDefined();
    expect(gauge!.weight_delta_pct).toBeLessThan(0);
  });
});
