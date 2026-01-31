---
name: succession-planner
description: Multi-year succession planning for permaculture system development.
homepage: https://github.com/rahulraonatarajan/farm_clawed
metadata:
  farm_clawed:
    emoji: "📈"
    category: "planning"
    requires:
      depth: 3
    provides:
      - "succession_design"
      - "multi_year_planning"
      - "ecosystem_development"
---

# Succession Planner Skill

Design multi-year plans that develop your site through ecological succession, building soil, biodiversity, and productivity over time.

## What is Succession?

In nature, ecosystems develop through stages:
1. **Pioneer** - Fast-growing, soil-building species
2. **Early succession** - Shrubs, small trees establish
3. **Mid succession** - Canopy develops, understory fills
4. **Climax** - Stable, diverse, self-maintaining

Permaculture accelerates this process through intentional design.

## When to Use

Use this skill when:
- Starting a new site from scratch
- Converting lawn to food production
- Planning a food forest or orchard
- Creating long-term site development plans

## Data Sources

This skill uses:
- `succession_plan.yaml` - Your multi-year plan
- `farm_profile.yaml` - Site conditions
- `farm_map.geojson` - Current state
- `guilds.yaml` - Planned plant communities

## Example Outputs

### Five-Year Food Forest Plan

```
SUCCESSION PLAN - Container to Food Forest

Starting Point: Single Meyer Lemon in container
Goal: Productive container food forest on patio

━━━ YEAR 1: FOUNDATION ━━━

Focus: Establish anchor plant, begin guild

Actions:
1. Q1 (Winter/Spring)
   - Assess lemon health ✓
   - Add clover ground cover to container
   - Set up sensor monitoring ✓
   
2. Q2 (Spring/Summer)
   - Add rosemary companion container
   - Plant nasturtium for pest trap
   - Begin comfrey in separate pot
   
3. Q3 (Summer/Fall)
   - Observe, adjust watering with data
   - Harvest first guild components (nasturtium flowers)
   - Document what works
   
4. Q4 (Fall/Winter)
   - First lemon harvest
   - Plant garlic in small containers
   - Plan Year 2 expansion

Success Criteria:
□ Lemon produces 5+ fruit
□ Guild plants established
□ Reduced watering needs (mulch/clover effect)
□ No major pest outbreaks

━━━ YEAR 2: EXPANSION ━━━

Focus: Add second citrus, expand guild

Actions:
1. Add second citrus (kumquat or lime)
2. Install drip irrigation system
3. Add fig tree (container)
4. Expand herb collection
5. First comfrey chop-and-drop mulching

Success Criteria:
□ Two productive citrus
□ Irrigation automated
□ Producing own mulch material
□ 10+ hours/year saved vs. manual care

━━━ YEAR 3: INTEGRATION ━━━

Focus: Connect systems, increase production

Actions:
1. Add berry plants (blueberry, strawberry)
2. Install rain barrel collection
3. Create vertical growing space
4. Add dwarf pomegranate
5. Begin producing surplus for sharing

Success Criteria:
□ Year-round harvest (something always producing)
□ Water usage reduced 30% from Year 1
□ Minimal purchased inputs (making own mulch, compost)

━━━ YEAR 4: REFINEMENT ━━━

Focus: Optimize and troubleshoot

Actions:
1. Replace any plants that failed
2. Expand successful combinations
3. Add specialty plants (passion fruit vine?)
4. Document and share learnings
5. Calculate cumulative ROI

Success Criteria:
□ System largely self-maintaining
□ Positive ROI achieved
□ Techniques proven and replicable

━━━ YEAR 5: MATURITY ━━━

Focus: Sustainable abundance

Actions:
1. System maintenance only
2. Significant harvest surplus
3. Teach others your approach
4. Plan next phase (raised beds? More space?)

Success Criteria:
□ Less than 2 hours/week maintenance
□ 50+ lbs fruit/year from patio
□ Proven model ready to scale
```

### Soil Building Succession

```
SOIL SUCCESSION PLAN

Transform compacted clay into living soil.

━━━ STAGE 1: BREAK COMPACTION (Year 1) ━━━

Pioneer Plants:
- Daikon radish (tillage radish)
  • 18" deep taproot breaks hardpan
  • Leave roots to decompose
  
- Crimson clover
  • Fixes nitrogen
  • Dies back, adds organic matter

Actions:
- No tilling (preserves structure)
- Heavy mulch application (6")
- Plant pioneers in fall

Expected Changes:
- Compaction reduced
- Soil biology awakening
- Drainage improving

━━━ STAGE 2: BUILD BIOLOGY (Year 2) ━━━

Transition Plants:
- Comfrey (permanent)
  • Deep nutrient mining
  • Chop-and-drop mulch
  
- Buckwheat (summer)
  • Rapid biomass
  • Pollinator magnet
  • Mine phosphorus

Actions:
- Continue mulching
- Begin compost additions
- Plant perennial accumulators

Expected Changes:
- Visible earthworm activity
- Soil darkening (organic matter)
- Roots penetrating deeper

━━━ STAGE 3: DIVERSIFY (Year 3) ━━━

Production Plants:
- Fruit trees (finally!)
- Perennial vegetables
- Support species from guilds

Actions:
- Plant permanent elements
- Maintain mulch ring around trees
- Continue cover cropping unused areas

Expected Changes:
- Self-mulching system emerging
- Pest/disease pressure reducing
- Soil holding water better

━━━ STAGE 4: MAINTAIN (Year 4+) ━━━

Focus: Let system mature

Actions:
- Chop-and-drop comfrey 3x/year
- Top up mulch as needed
- Observe and minor adjustments

Expected State:
- Soil: Dark, crumbly, alive
- Plants: Vigorous, healthy
- Water: Infiltrates quickly
- Inputs: Minimal (self-fertile)
```

### Annual Review Framework

```
SUCCESSION REVIEW TEMPLATE

Year: ___  Season: ___

━━━ PROGRESS CHECK ━━━

Goals from Plan:
1. _________________ □ Achieved / □ Partial / □ Not yet
2. _________________ □ Achieved / □ Partial / □ Not yet
3. _________________ □ Achieved / □ Partial / □ Not yet

━━━ OBSERVATIONS ━━━

What thrived?
_________________________________

What struggled?
_________________________________

Unexpected successes?
_________________________________

Unexpected challenges?
_________________________________

━━━ METRICS ━━━

Harvest (lbs/count): _____
Water used (gal): _____
Time invested (hrs): _____
Money spent ($): _____

Compare to baseline/last year:
_________________________________

━━━ ADJUSTMENTS ━━━

For next season:
1. _________________________________
2. _________________________________

For next year:
1. _________________________________
2. _________________________________

━━━ PHOTOS ━━━

Attach comparison photos:
- Same angle as last review
- Close-ups of key plants
- Any problems observed
```

## Commands

```bash
# View current succession plan
farm_clawed farm succession view

# Check year progress
farm_clawed farm succession progress --year 1

# Generate review template
farm_clawed farm succession review

# Update plan
farm_clawed farm succession update --year 2 --notes "Added fig tree"
```

## Principles

1. **Patience**: Good systems take 5+ years to mature
2. **Flexibility**: Adjust plans based on observation
3. **Document**: Records make future planning easier
4. **Celebrate**: Mark milestones, however small
5. **Share**: Your learnings help others

## Tips

1. **Start with soil**: Healthy soil = healthy everything
2. **Pioneers earn their keep**: Nitrogen fixers and accumulators first
3. **Plan for mature size**: That small tree will grow!
4. **Stack in time**: Spring, summer, fall, winter harvests
5. **Accept setbacks**: Some plants will fail, that's data

