---
name: ipm-observation
description: Integrated Pest Management observation logging and recommendations.
homepage: https://github.com/rahulraonatarajan/farm_clawed
metadata:
  farm_clawed:
    emoji: "🐛"
    category: "pest-management"
    requires:
      depth: 0
    provides:
      - "pest_observations"
      - "ipm_recommendations"
---

# IPM Observation Skill

Integrated Pest Management (IPM) observation logging and evidence-based pest control recommendations.

## What is IPM?

IPM is an ecosystem-based strategy that focuses on long-term prevention through:
1. **Prevention** - Cultural practices that discourage pests
2. **Monitoring** - Regular observation to catch problems early
3. **Identification** - Knowing what you're dealing with
4. **Thresholds** - Acting only when damage exceeds tolerance
5. **Control** - Least toxic effective methods first

## When to Use

Use this skill when:
- Conducting routine plant health checks
- Noticing unusual damage or pests
- Planning preventive measures
- Deciding whether intervention is needed

## Observation Protocol

### Weekly Checklist

**Inspect these areas:**
- [ ] Leaf tops (feeding damage)
- [ ] Leaf undersides (eggs, hiding pests)
- [ ] Stems and branches (scale, borers)
- [ ] Growing tips (aphids love these)
- [ ] Soil surface (fungus gnats, slugs)
- [ ] Fruit/flowers (caterpillars, beetles)

### What to Record

For each observation:
- Date and time
- Location (which plant/area)
- Pest/disease identification (or description)
- Severity (trace/light/moderate/severe)
- Beneficials present
- Weather conditions
- Photos (highly valuable!)

## Example Outputs

### Observation Log Entry

```
IPM OBSERVATION - January 31, 2025

Plant: Meyer Lemon (Container)
Observer: AI + Photo tags

FINDINGS:

1. Leaf Condition
   - Status: Yellow spotting on older leaves
   - Possible causes: 
     a) Nitrogen deficiency (most likely given low EC)
     b) Overwatering (check drainage)
     c) Spider mites (inspect undersides)
   - Action: Check leaf undersides with magnifier
   
2. New Growth
   - Status: Healthy, light green
   - Positive sign of plant vigor
   
3. Pests Observed
   - None visible on quick inspection
   - Recommend: Detailed inspection of leaf undersides
   
4. Beneficials Observed
   - Small spider (predator - good!)
   
5. Soil Surface
   - Dry, rocks as mulch
   - No fungus gnats observed

ASSESSMENT: LOW CONCERN
The yellowing is likely nutritional, not pest-related.
Prioritize fertility before pest investigation.

NEXT INSPECTION: 1 week
Focus on: Leaf undersides, response to feeding
```

### Pest Identification Guide

```
COMMON CITRUS PESTS - Quick Reference

APHIDS
- Appearance: Small soft-bodied, often green/black
- Location: Growing tips, new leaves
- Damage: Curled leaves, sticky honeydew
- Control: 
  1. Strong water spray (knock them off)
  2. Encourage ladybugs
  3. Insecticidal soap if severe

SCALE
- Appearance: Brown/white bumps on stems
- Location: Stems, leaf undersides
- Damage: Yellow leaves, branch dieback
- Control:
  1. Scrub off with soft brush
  2. Horticultural oil spray
  3. Systemic treatment if severe

SPIDER MITES
- Appearance: Tiny dots, fine webbing
- Location: Leaf undersides
- Damage: Stippled leaves, bronzing
- Control:
  1. Increase humidity
  2. Water spray leaf undersides
  3. Miticide if severe

CITRUS LEAFMINER
- Appearance: Silvery trails in leaves
- Location: New growth
- Damage: Distorted new leaves
- Control:
  1. Remove affected leaves
  2. Spinosad spray on new growth
  3. Most trees tolerate light damage

SNAILS/SLUGS
- Appearance: Slime trails, holes in leaves
- Location: Night feeders, hide by day
- Control:
  1. Handpick at night
  2. Copper tape barriers
  3. Iron phosphate bait
```

## Action Thresholds

Not every pest sighting requires action:

| Pest Level | Action |
|------------|--------|
| Trace (1-2 pests) | Monitor, no action |
| Light (<10% damage) | Cultural controls |
| Moderate (10-25% damage) | Targeted treatment |
| Severe (>25% damage) | Intervention required |

## Prevention Strategies

### Cultural Controls
- Right plant, right place
- Healthy soil = healthy plants
- Good air circulation
- Clean up debris
- Rotate crops (annuals)

### Physical Controls
- Row covers
- Sticky traps
- Handpicking
- Barriers (copper, diatomaceous earth)

### Biological Controls
- Encourage beneficial insects
- Release predators (ladybugs, lacewings)
- Beneficial nematodes for soil pests

### Chemical Controls (Last Resort)
- Start with least toxic (soap, oil)
- Target specific pest
- Follow label exactly
- Protect beneficials

## Commands

```bash
# Log an observation
farm_clawed farm ipm log --plant "lemon" --observation "yellow leaves"

# Get pest ID help
farm_clawed farm ipm identify --description "small green bugs on tips"

# View observation history
farm_clawed farm ipm history --days 30

# Get treatment recommendations
farm_clawed farm ipm treat --pest "aphids" --severity "light"
```

## Photo Tags for IPM

Tag your photos with:
- `pest-aphids`, `pest-scale`, `pest-mites`, etc.
- `damage-holes`, `damage-yellowing`, `damage-wilting`
- `beneficial-ladybug`, `beneficial-spider`
- `disease-fungal`, `disease-bacterial`

These tags help the AI track patterns over time.

## Tips

1. **Scout regularly**: Weekly is better than waiting for problems
2. **Know your beneficials**: Don't kill the good guys!
3. **Tolerance is okay**: Some pest pressure is normal
4. **Photos are powerful**: Visual record helps track trends
5. **Prevention > cure**: Healthy plants resist pests better

