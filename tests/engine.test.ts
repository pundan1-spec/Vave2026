import { describe, it, expect } from "vitest";
import { generate } from "../src/lib/vave/engine";
import type { VaveInput } from "../src/lib/vave/types";

const bPillarBaseline: VaveInput = {
  current_grade_id: "DP-700",
  current_thk_mm: 1.6,
  part_family: "b_pillar_reinf",
  annual_volume: 200000,
  blank_area_m2: 0.95,
  current_coating_id: "GA",
  current_joining_ids: ["RSW"],
  narrate: false,
};

describe("VAVE engine — B-pillar reinforcement baseline", () => {
  it("returns a non-empty ranked list", async () => {
    const out = await generate(bPillarBaseline);
    expect(out.ideas.length).toBeGreaterThanOrEqual(5);
    expect(out.baseline.mass_per_part_kg).toBeGreaterThan(0);
    expect(out.baseline.cost_per_part_usd).toBeGreaterThan(0);
  });

  it("surfaces a PHS-1500 grade-substitution idea with Al-Si coating", async () => {
    const out = await generate(bPillarBaseline);
    const phs = out.ideas.find((i) => i.new_grade_id === "PHS-1500");
    expect(phs, "expected PHS-1500 in the idea set").toBeDefined();
    expect(phs!.new_coating_id).toBe("AlSi");
  });

  it("auto-upgrades RSW to pulsed RSW + adds weld-bond when switching to UHSS/PHS", async () => {
    const out = await generate(bPillarBaseline);
    const phs = out.ideas.find((i) => i.new_grade_id === "PHS-1500")!;
    expect(phs.new_joining_ids).toContain("RSW_PULSED");
    expect(phs.new_joining_ids).toContain("RSW_ADHESIVE");
  });

  it("attaches AIS crash-test tags to crash-critical part ideas", async () => {
    const out = await generate(bPillarBaseline);
    expect(out.baseline.crash_tests?.some((t) => t.includes("AIS-098"))).toBe(true);
    const phs = out.ideas.find((i) => i.new_grade_id === "PHS-1500")!;
    expect(phs.crash_tests?.length ?? 0).toBeGreaterThan(0);
  });

  it("ranks ideas with weight save as top lever for a crash part", async () => {
    const out = await generate(bPillarBaseline);
    expect(out.ideas[0].weight_delta_pct).toBeLessThan(0);
  });

  it("populates India suppliers on the top idea", async () => {
    const out = await generate(bPillarBaseline);
    const phs = out.ideas.find((i) => i.new_grade_id === "PHS-1500")!;
    expect(phs.suppliers_in_india?.length ?? 0).toBeGreaterThan(0);
  });
});

describe("VAVE engine — crash gate (UTS·t floor)", () => {
  it("filters out grades that can't meet min UTS·t at their clipped minimum thickness", async () => {
    // Rocker-reinf requires UTS·t ≥ 2400 and UTS ≥ 1500. DP-1000 (UTS 1180) fails UTS floor;
    // MS-950 (UTS 1200) fails UTS floor; only MS-1250 / PHS-1500 / PHS-2000 qualify.
    const rockerReinf: VaveInput = {
      current_grade_id: "PHS-1500",
      current_thk_mm: 1.6,
      part_family: "rocker_reinf",
      annual_volume: 100000,
      blank_area_m2: 0.7,
      current_coating_id: "AlSi",
      current_joining_ids: ["RSW"],
      narrate: false,
    };
    const out = await generate(rockerReinf);
    const subs = out.ideas.filter((i) => i.lever === "grade_substitution");
    for (const s of subs) {
      // Must all clear UTS·t ≥ 2400
      const thk = s.new_thk_mm;
      const uts =
        s.new_grade_id === "PHS-2000" ? 2000 : s.new_grade_id === "MS-1250" ? 1500 : 0;
      expect(uts * thk).toBeGreaterThanOrEqual(2400);
    }
  });
});

describe("VAVE engine — India sourcing filter", () => {
  const input: VaveInput = {
    current_grade_id: "DP-700",
    current_thk_mm: 1.6,
    part_family: "b_pillar_reinf",
    annual_volume: 200000,
    blank_area_m2: 0.95,
    current_coating_id: "GA",
    current_joining_ids: ["RSW"],
    sourcing_india_only: true,
    narrate: false,
  };

  it("drops grades with no Indian supplier when India-only is on", async () => {
    const out = await generate(input);
    const imports = out.ideas.filter(
      (i) => (i.suppliers_in_india?.length ?? 0) === 0 && i.lever === "grade_substitution",
    );
    expect(imports.length).toBe(0);
    expect(out.meta.filtered_out_non_india).toBeGreaterThanOrEqual(0);
  });
});

describe("VAVE engine — IF door inner (India baseline)", () => {
  const doorInner: VaveInput = {
    current_grade_id: "IF-180",
    current_thk_mm: 0.75,
    part_family: "door_inner",
    annual_volume: 200000,
    blank_area_m2: 1.1,
    current_coating_id: "GA",
    current_joining_ids: ["RSW"],
    narrate: false,
  };

  it("surfaces stronger grades (IF-HS, BH, HSLA, DP) for an IF baseline", async () => {
    const out = await generate(doorInner);
    const subs = out.ideas.filter((i) => i.lever === "grade_substitution");
    expect(subs.length).toBeGreaterThan(0);
    const upgradeTargets = subs.map((s) => s.new_grade_id);
    expect(
      upgradeTargets.some(
        (g) =>
          g.startsWith("IF-HS") ||
          g.startsWith("BH") ||
          g.startsWith("HSLA") ||
          g.startsWith("DP"),
      ),
    ).toBe(true);
  });

  it("uses India INR price sheet when currency=INR (cost diff vs USD sheet)", async () => {
    const inrResult = await generate({ ...doorInner, currency: "INR", region: "INDIA" });
    const usdResult = await generate({ ...doorInner, currency: "USD", region: "GLOBAL" });
    // Both return costs in USD, but they should differ because India uses local INR price sheet.
    expect(inrResult.baseline.cost_per_part_usd).not.toBeCloseTo(
      usdResult.baseline.cost_per_part_usd,
      4,
    );
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
    narrate: false,
  };

  it("proposes gauge reduction with weld-bond compensation", async () => {
    const out = await generate(floorInput);
    const gauge = out.ideas.find(
      (i) =>
        i.lever === "gauge_reduction" && i.new_joining_ids.includes("RSW_ADHESIVE"),
    );
    expect(gauge, "expected gauge reduction idea with RSW_ADHESIVE").toBeDefined();
    expect(gauge!.weight_delta_pct).toBeLessThan(0);
  });
});
