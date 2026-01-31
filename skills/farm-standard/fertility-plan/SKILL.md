---
name: fertility-plan
description: Fertilization guidance based on soil EC, plant needs, and seasonal timing.
homepage: https://github.com/rahulraonatarajan/farm_clawed
metadata:
  farm_clawed:
    emoji: "🌱"
    category: "fertility"
    requires:
      depth: 0
    provides:
      - "fertilization_schedule"
      - "nutrient_recommendations"
---

# Fertility Plan Skill

Provides fertilization recommendations based on soil electrical conductivity (EC), plant growth stages, and seasonal needs.

## When to Use

Use this skill when:
- Planning fertilization schedules
- Interpreting soil EC readings
- Addressing nutrient deficiency symptoms
- Preparing for planting or transplanting

## Data Sources

This skill uses:
- `sensor_readings.csv` - Soil EC and temperature data
- `farm_map.geojson` - Crop locations and types
- `season_calendar.yaml` - Growth stages and timing
- `roi_inputs.yaml` - Fertilizer costs

## EC Interpretation

Electrical Conductivity (EC) indicates dissolved salts/nutrients in soil.

| EC (mS/cm) | Status | Interpretation |
|------------|--------|----------------|
| < 0.5 | Very Low | Needs fertilization |
| 0.5 - 1.0 | Low | Light feeding recommended |
| 1.0 - 2.0 | Optimal | Most plants thrive here |
| 2.0 - 3.0 | High | Salt-sensitive plants may struggle |
| > 3.0 | Very High | Flush soil, reduce inputs |

## Fertilization Timing

### Seasonal Schedule

**Spring (March-May)**
- Heavy feeders: Every 2-3 weeks
- Light feeders: Monthly
- New transplants: Wait 2 weeks, then light feed

**Summer (June-August)**
- Fruiting plants: Bi-weekly during production
- Leafy greens: Weekly light feeding
- Perennials: Monthly

**Fall (September-November)**
- Reduce nitrogen for perennials
- Final feeding before dormancy
- Focus on phosphorus and potassium

**Winter (December-February)**
- No feeding for dormant plants
- Indoor/container plants: Monthly light feed

## Example Outputs

### Current Status

```
FERTILITY STATUS - January 31, 2025

Sensor S001 (Lemon Container):
- EC: 0.001 mS/cm (Very Low)
- Last fertilized: Unknown
- Plant stage: Winter dormancy

Assessment: VERY LOW EC
The EC reading indicates minimal dissolved nutrients.
This is common for:
- Heavily leached soil
- Newly potted plants
- End of growing season

Recommendation:
For citrus in winter, light feeding is appropriate.
- Apply: Citrus fertilizer (2-1-1 ratio)
- Amount: 1/4 strength (1 tsp per gallon)
- Timing: Next watering
- Follow-up: Recheck EC in 1 week

Note: Low EC in winter is less critical as growth
is slow. Prioritize correcting before spring flush.
```

### Annual Plan

```
ANNUAL FERTILIZATION PLAN - Lemon Tree

February:
  - Pre-bloom feeding
  - NPK: 6-4-4 citrus formula
  - Amount: Full label rate

April:
  - Post-bloom feeding
  - Support fruit set
  - Add micronutrients (iron, zinc)

June:
  - Summer growth support
  - Light nitrogen
  - Watch for chlorosis

September:
  - Final feeding before dormancy
  - Low nitrogen, higher P-K
  - Promotes winter hardiness

December-January:
  - No feeding (dormancy)
  - Observe only
```

## Organic vs Conventional

### Organic Options
- Compost: Slow release, improves soil
- Worm castings: Gentle, won't burn
- Fish emulsion: Quick nitrogen
- Bone meal: Phosphorus for roots/flowers
- Kelp: Micronutrients and hormones

### Conventional Options
- Balanced granular (10-10-10)
- Slow-release coated pellets
- Water-soluble concentrates
- Specialty citrus/vegetable formulas

## Deficiency Symptoms

| Symptom | Likely Deficiency | Quick Fix |
|---------|------------------|-----------|
| Yellow leaves (older) | Nitrogen | Fish emulsion |
| Yellow leaves (newer) | Iron | Iron chelate |
| Purple leaves | Phosphorus | Bone meal |
| Brown leaf edges | Potassium | Kelp extract |
| Interveinal chlorosis | Magnesium | Epsom salt |

## Commands

```bash
# Get current fertility status
farm_clawed farm fertility status

# Get annual plan for a crop
farm_clawed farm fertility plan --crop "lemon"

# Log fertilization
farm_clawed farm fertility log --product "fish emulsion" --amount "2 tbsp"
```

## Tips

1. **Less is more**: Under-fertilizing is safer than over-fertilizing
2. **Water first**: Always water before and after feeding
3. **Watch the plant**: Lush dark growth may mean too much nitrogen
4. **Test soil**: Annual lab test gives complete picture
5. **Compost is king**: Regular compost reduces need for other inputs

