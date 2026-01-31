---
name: soil-building
description: Soil building practices - compost, mulch, cover crops, and regenerative techniques.
homepage: https://github.com/rahulraonatarajan/farm_clawed
metadata:
  farm_clawed:
    emoji: "🪱"
    category: "soil"
    requires:
      depth: 2
    provides:
      - "soil_recommendations"
      - "compost_guidance"
      - "cover_crop_planning"
---

# Soil Building Skill

Build living soil through composting, mulching, cover cropping, and regenerative practices. Healthy soil is the foundation of all productive farming.

## Core Principle

> "Feed the soil, not the plant."

Healthy soil contains billions of organisms that:
- Make nutrients available to plants
- Improve soil structure
- Suppress diseases
- Hold water
- Sequester carbon

## When to Use

Use this skill when:
- Starting a new growing area
- Improving poor soil
- Planning compost systems
- Selecting cover crops
- Troubleshooting plant health issues

## Data Sources

This skill uses:
- `sensor_readings.csv` - EC indicates nutrient levels
- `farm_profile.yaml` - Soil type, climate
- `season_calendar.yaml` - Cover crop timing
- Soil test results (if available)

## Example Outputs

### Soil Assessment

```
SOIL ASSESSMENT - Container Mix Analysis

━━━ CURRENT READINGS ━━━

From Sensor S001:
- EC: 0.001 mS/cm (Very Low)
- Temperature: 54.5°F
- Moisture: 17%

━━━ INTERPRETATION ━━━

EC Analysis:
Very low EC indicates minimal dissolved nutrients.
Possible causes:
1. Nutrients leached out (frequent watering)
2. Depleted growing media
3. Recently repotted

Temperature Analysis:
54.5°F is below optimal for nutrient cycling.
Soil biology slows below 50°F.
Wait for soil to warm before heavy feeding.

Moisture Analysis:
17% is low - approaching stress threshold.
However, low moisture is appropriate for:
- Dormant/semi-dormant plants
- Cool weather
- Recent watering check

━━━ RECOMMENDATIONS ━━━

Immediate (This Week):
1. Light organic fertilizer application
   - Worm castings: 1/4 cup worked into surface
   - OR fish emulsion: 1/4 strength with watering
   - This gently raises EC without shock

2. Add thin mulch layer
   - 1" of compost or bark
   - Protects soil biology
   - Feeds soil slowly

Near-term (This Month):
3. Monitor EC response
   - Check in 1 week
   - Target: 0.5-1.0 mS/cm

4. As temperatures rise:
   - Increase feeding frequency
   - Soil biology will activate

━━━ SOIL BUILDING SCHEDULE ━━━

Feb: Light feeding, worm castings
Mar: Compost top-dress as growth begins
Apr: Regular feeding begins
May-Sep: Monthly compost tea or fertilizer
Oct: Final feeding, prep for dormancy
Nov-Jan: Rest, minimal intervention
```

### Composting Guide

```
COMPOSTING SYSTEM GUIDE

━━━ SYSTEM SELECTION ━━━

For your situation (container gardening, small space):

RECOMMENDED: Worm Bin (Vermicompost)

Why:
✓ Small footprint
✓ Produces premium castings
✓ Works year-round indoors
✓ No turning required
✓ Handles kitchen scraps

Setup:
- Container: 10-20 gallon bin with drainage
- Bedding: Shredded newspaper, cardboard
- Worms: 1 lb red wigglers ($30)
- Location: Shaded, 55-80°F

━━━ WHAT TO FEED ━━━

GREEN (Nitrogen-rich):
✓ Vegetable scraps
✓ Fruit scraps
✓ Coffee grounds
✓ Tea bags
✓ Fresh grass clippings

BROWN (Carbon-rich):
✓ Shredded newspaper
✓ Cardboard (torn small)
✓ Dried leaves
✓ Straw
✓ Paper towels

AVOID:
✗ Meat, dairy, oils
✗ Citrus (in worm bins - too acidic)
✗ Onions, garlic (worms dislike)
✗ Diseased plant material
✗ Pet waste

━━━ TROUBLESHOOTING ━━━

Smelly:
→ Too wet, too much green
→ Add browns, stop feeding

Fruit flies:
→ Bury food under bedding
→ Add more brown cover

Worms escaping:
→ Too wet or wrong pH
→ Add dry bedding, check conditions

Not decomposing:
→ Too dry or cold
→ Moisten, move to warmer spot
```

### Cover Crop Recommendations

```
COVER CROP GUIDE - Zone 9b

━━━ FALL/WINTER COVERS ━━━

CRIMSON CLOVER
- Sow: September-November
- Kill: Before bloom (March)
- Function: Nitrogen fixation
- Rate: 1 lb per 200 sq ft
- Notes: Beautiful red flowers if let bloom

WINTER RYE
- Sow: September-November  
- Kill: 2-3 weeks before planting
- Function: Biomass, weed suppression
- Rate: 2 lbs per 200 sq ft
- Notes: Allelopathic - suppress weeds

FAVA BEANS
- Sow: October-November
- Kill: Before harvest, or harvest beans!
- Function: Nitrogen, food, biomass
- Rate: 3 lbs per 200 sq ft
- Notes: Edible bonus

━━━ SUMMER COVERS ━━━

BUCKWHEAT
- Sow: After last frost
- Kill: At 50% bloom (6 weeks)
- Function: Pollinator support, P mining
- Rate: 3 lbs per 200 sq ft
- Notes: Fast! Can do 2-3 cycles

COWPEAS (Southern Peas)
- Sow: After soil warms
- Kill: After flowering
- Function: Nitrogen, heat tolerance
- Rate: 1 lb per 200 sq ft
- Notes: Handles hot, dry conditions

━━━ IMPLEMENTATION ━━━

Your Fall Plan:
1. After last summer harvest:
   - Lightly rake bed
   - Broadcast crimson clover seed
   - Cover with 1/4" compost
   - Water to establish

2. Let grow all winter

3. In late February:
   - Chop and drop (leave on surface)
   - OR turn under 2 weeks before planting
   - The decomposing roots feed spring crops
```

### Mulching Guide

```
MULCHING BEST PRACTICES

━━━ MULCH TYPES ━━━

WOOD CHIPS (Arborist chips)
Best for: Paths, perennials, trees
Depth: 3-6 inches
Notes: Free from tree services!
Caution: Keep away from stems

STRAW
Best for: Vegetable beds, strawberries
Depth: 4-6 inches
Notes: Decomposes in one season
Caution: May contain weed seeds

COMPOST
Best for: Top dressing, all beds
Depth: 1-2 inches
Notes: Feeds AND mulches
Caution: Use finished compost only

LEAVES
Best for: Overwintering beds
Depth: 6-12 inches (they compact)
Notes: Free! Shred for faster breakdown
Caution: Whole leaves can mat

LIVING MULCH (Clover, etc.)
Best for: Orchards, perennials
Depth: N/A
Notes: Self-renewing, adds nitrogen
Caution: May compete with young plants

━━━ APPLICATION ━━━

Container Plants (Your Lemon):
- Type: Fine bark OR compost
- Depth: 1-2 inches
- Keep: 1-2" away from trunk
- Refresh: As it decomposes

Benefits:
- Retains moisture (less watering)
- Moderates temperature
- Feeds soil biology
- Suppresses weeds
- Protects roots
```

## Soil Health Indicators

| Sign | Meaning | Action |
|------|---------|--------|
| Earthworms | Healthy biology | Keep doing what you're doing |
| Fungal threads | Maturing soil | Excellent for trees |
| Sweet smell | Aerobic, healthy | No action needed |
| Sour smell | Anaerobic | Improve drainage |
| Tight/hard | Compacted | Add compost, mulch |
| Powdery | Low organic matter | Build with compost |

## Commands

```bash
# Get soil recommendations
farm_clawed farm soil assess

# Composting guidance
farm_clawed farm soil compost

# Cover crop suggestions
farm_clawed farm soil cover-crop --season fall

# Mulching guide
farm_clawed farm soil mulch --area "garden-bed"
```

## Tips

1. **Never leave soil bare**: Mulch or cover crop always
2. **Minimize disturbance**: No-dig when possible
3. **Feed the soil, not plants**: Compost > fertilizer
4. **Diversity builds resilience**: Mix of organic matter sources
5. **Patience**: Soil building takes years, but pays forever

