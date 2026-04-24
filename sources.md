# Data Sources

All grade, coating, and joining data in this app is anchored to public WorldAutoSteel references.
No data was scraped; entries are hand-curated from the publications listed below and cited per row
in `src/data/*.json`.

## Primary references

1. **WorldAutoSteel AHSS Application Guidelines v7.0** — grade families (Mild, HSLA, BH, DP, TRIP, CP, MS, PHS, TWIP, 3rd-Gen), property ranges, coatings, joining practice.
   https://ahssinsights.org/
2. **AHSS Insights (WorldAutoSteel technology site)** — individual articles on:
   - Press Hardening Steels (22MnB5, 34MnB5 class; Al-Si and Zn-coated routes)
   - Resistance Spot Welding of AHSS and UHSS (pulsed schedules, LME)
   - Weld-bonding (RSW + structural adhesive)
   - Laser Welding and Tailor-Welded Blanks
   - Self-Piercing Rivets, Flow-Drill Screws, Clinching (for multi-material stacks)
   - Zinc, Galvanneal, Electrogalvanized, Zn-Al-Mg coatings
3. **Steel E-Motive / FutureSteelVehicle (FSV)** reference BIW architectures — used to anchor
   part-family → function → grade baselines in `partRules.json`.

## Verification

Every row in `src/data/grades.json`, `src/data/coatings.json`, `src/data/joining.json`, and
`src/data/partRules.json` carries a `source` field pointing back to the above references.
Users should cross-check each number against the original document before using for production
decisions.

## Not included (by design, iteration 1)

- Live scraping of worldautosteel.org (no public API; would risk stale/ambiguous data)
- OEM-internal cost sheets (plug-in point reserved for iteration 2)
- FEA / crash-surrogate models (iteration 3)
