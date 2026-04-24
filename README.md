# VAVE BIW Studio

A Value Analysis / Value Engineering (VAVE) idea generator for automotive Body-in-White (BIW) parts at a steel OEM. Inputs a current steel grade, thickness, and part family; outputs ranked ideas across four levers — **grade substitution**, **gauge reduction**, **joining stack**, and **coating** — with integrated welding, coating, formability, crash/stiffness notes and weight + cost deltas (per part and per program).

Data anchored to public **WorldAutoSteel AHSS Application Guidelines** and **AHSS Insights** references (see `sources.md`).

## Quick start

```bash
npm install
npm run dev         # http://localhost:3000
npm run test        # Vitest — engine golden cases
npm run build       # production build
```

## Features (Iteration 1)

- **25+ AHSS grades** — Mild, HSLA, BH, DP, TRIP, CP, MS, PHS, TWIP, 3rd-Gen (Q&P, medium-Mn), FB — with UTS/YS/TE/n/bendability/CE/weldability index.
- **7 coatings** — Uncoated, GI, GA, EG, Zn-Al-Mg, Al-Si (PHS), Zn-coated PHS.
- **8 joining methods** — RSW, pulsed RSW, weld-bond, laser, SPR, FDS, clinch, adhesive-only.
- **16 part families** — B-pillar reinforcement, A-pillar, rocker, rail, roof rail, bumper beam, cross member, floor pan, door inner, door impact beam, closure outer, seat structure, crash box, tunnel reinforcement, and more.
- **Rules engine**
  - Grade substitution on UTS·t parity (crash) or stiffness parity (structural).
  - Gauge reduction with weld-bond compensation for stiffness-dominated parts.
  - Joining stack upgrades (pulsed RSW, weld-bond, FDS for UHSS/PHS).
  - Coating gates (Al-Si for PHS, ZM for corrosion, EG for class-A).
- **Per-idea card**: weight Δ (kg, %), cost Δ ($/part, $/program), welding note, coating note, formability note, crash/stiffness note, risks, citations.
- **Compare view**: baseline vs. top-5 side-by-side.
- **Export**: JSON and printable PDF report.

## Architecture

```
src/
  app/
    page.tsx                      # landing + input form + results
    sources/page.tsx              # data source citations
    api/generate/route.ts         # POST VaveInput → GenerateResponse
  components/
    InputPanel.tsx
    IdeaCard.tsx
    CompareTable.tsx
    WeightCostChart.tsx
    ExportButtons.tsx
    VaveReport.tsx                # react-pdf document
  data/
    grades.json
    coatings.json
    joining.json
    partRules.json
  lib/vave/
    engine.ts                     # orchestrator
    rules/
      gradeSubstitution.ts
      gaugeReduction.ts
      joiningStack.ts
      coating.ts
    score.ts                      # mass, cost, ranking
    data.ts                       # typed loaders
    types.ts
tests/engine.test.ts
sources.md
```

## Iteration roadmap

- **Iter 2** — OEM-internal cost sheets, LLM-based idea rerank & narrative generation, saveable part libraries, multi-user auth.
- **Iter 3** — Analytical crash surrogate (EA per unit volume), thinned-skin NVH delta, FEA plug-in via CalculiX.
- **Iter 4** — Tailor-welded blank / tailor-rolled blank optimizer; multi-part sub-assembly VAVE.

## Disclaimers

- Numbers are approximate and intended for early-stage ideation. Production decisions require OEM-specific cost data, material certificates, CAE validation, and physical weld trials.
- All sources are cited per row; verify against the original WorldAutoSteel reference before use.
