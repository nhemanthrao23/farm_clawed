---
name: guild-polyculture
description: Plant guild design and polyculture planning for regenerative systems.
homepage: https://github.com/rahulraonatarajan/farm_clawed
metadata:
  farm_clawed:
    emoji: "🌳"
    category: "planting"
    requires:
      depth: 2
    provides:
      - "guild_design"
      - "companion_planting"
      - "polyculture_planning"
---

# Guild and Polyculture Skill

Design plant guilds and polycultures that mimic natural ecosystems, reduce inputs, and increase resilience.

## What is a Guild?

A guild is a community of plants (and sometimes animals) that support each other, centered around a main productive element. Each member serves one or more functions in the system.

## Guild Functions

Every guild should include plants that provide:

| Function | Purpose | Examples |
|----------|---------|----------|
| **Nitrogen fixers** | Add nitrogen to soil | Clover, beans, lupine |
| **Dynamic accumulators** | Mine deep nutrients | Comfrey, yarrow, dandelion |
| **Pest repellent** | Confuse/deter pests | Garlic, marigold, nasturtium |
| **Pollinator attractors** | Bring beneficial insects | Bee balm, borage, lavender |
| **Mulch producers** | Generate organic matter | Comfrey, rhubarb |
| **Ground cover** | Protect soil, retain moisture | Clover, strawberry |

## When to Use

Use this skill when:
- Designing plantings around fruit trees
- Planning vegetable polycultures
- Creating low-maintenance food systems
- Reducing pest and fertilizer inputs

## Data Sources

This skill uses:
- `guilds.yaml` - Your defined guilds
- `farm_map.geojson` - Current plantings
- `season_calendar.yaml` - Planting timing
- Built-in companion planting database

## Example Outputs

### Guild Design for Your Lemon

```
CITRUS GUILD DESIGN - Meyer Lemon Container

━━━ GUILD OVERVIEW ━━━

Anchor: Meyer Lemon (container, 15-gallon)

Challenge: Limited space in container
Solution: Compact guild with container companions

━━━ RECOMMENDED PLANTS ━━━

LAYER 1: Ground Cover (in pot)
- White Dutch Clover
  Function: Nitrogen fixer, living mulch
  Spacing: Seed around trunk, 2" from stem
  Benefits: Feeds lemon, retains moisture
  
LAYER 2: Herbs (companion containers)
- Rosemary (12" pot nearby)
  Function: Pest repellent
  Benefits: Confuses citrus pests
  
- Garlic chives (6" pot)
  Function: Pest repellent, edible
  Benefits: Deters aphids

LAYER 3: Dynamic Accumulator
- Dwarf Comfrey (Bocking 14)
  Function: Nutrient mining, mulch
  Location: Separate container, harvest leaves
  Use: Chop leaves around lemon for mulch

LAYER 4: Pollinator (seasonal)
- Nasturtium (trailing, summer)
  Function: Trap crop, pollinator, edible
  Benefits: Aphids prefer it to citrus!

━━━ SPACING DIAGRAM (TOP VIEW) ━━━

        [Rosemary]
            |
    [Chives]-[LEMON]-[Nasturtium]
            |
        [Comfrey]

━━━ IMPLEMENTATION TIMELINE ━━━

Now (Winter):
- Plant clover seeds in lemon container
- Start garlic chives in small pot

Spring:
- Add rosemary nearby
- Plant nasturtium when frost passes
- Transplant comfrey to own container

Ongoing:
- Harvest comfrey leaves monthly for mulch
- Let clover flower for bees
- Replace nasturtium if aphids devastate it
```

### Vegetable Polyculture Design

```
THREE SISTERS POLYCULTURE

Classic Native American polyculture adapted for your garden.

━━━ COMPONENTS ━━━

1. CORN (structure)
   - Variety: 'Golden Bantam' or similar
   - Function: Trellis for beans
   - Spacing: 4x4 foot blocks (minimum 16 plants)
   
2. BEANS (nitrogen)
   - Variety: Pole beans (not bush)
   - Function: Fix nitrogen, climb corn
   - Spacing: 3-4 seeds per corn stalk
   
3. SQUASH (ground cover)
   - Variety: Winter squash or pumpkin
   - Function: Living mulch, weed suppression
   - Spacing: 1 per 4 corn stalks

━━━ PLANTING SEQUENCE ━━━

Week 1: Plant corn in blocks (not rows)
Week 3: When corn is 6" tall, plant beans at base
Week 4: Plant squash between corn blocks

━━━ YIELD COMPARISON ━━━

Monoculture yields (same space):
- Corn only: 20 ears
- Beans only: 10 lbs
- Squash only: 30 lbs

Polyculture yields:
- Corn: 18 ears
- Beans: 8 lbs  
- Squash: 25 lbs
- PLUS: No fertilizer needed (beans fix nitrogen)
- PLUS: 90% less weeding (squash shades soil)
- PLUS: Higher total calories per square foot

━━━ COMMON ISSUES ━━━

Problem: Beans strangle corn
Solution: Choose shorter bean varieties, thin if needed

Problem: Squash overtakes everything  
Solution: Trim vines, redirect growth

Problem: Raccoons eat everything
Solution: Fence the whole block
```

### Companion Planting Quick Reference

```
COMPANION PLANTING MATRIX

✓ = Good companions
✗ = Keep apart
○ = Neutral

         Tomato  Pepper  Basil  Carrot  Beans  Squash
Tomato     -       ✓       ✓      ✓       ✗      ○
Pepper     ✓       -       ✓      ○       ○      ○
Basil      ✓       ✓       -      ○       ○      ○
Carrot     ✓       ○       ○      -       ✓      ○
Beans      ✗       ○       ○      ✓       -      ✓
Squash     ○       ○       ○      ○       ✓      -

KEY RELATIONSHIPS:

Tomato + Basil:
- Basil repels tomato hornworm
- May improve tomato flavor
- Same water/sun needs

Tomato + Beans:
- Beans fix nitrogen, tomatoes need nitrogen
- BUT beans attract pests that spread to tomatoes
- Keep separate or accept the trade-off

Carrots + Beans:
- Beans shade carrots in hot weather
- Different root depths (no competition)
- Beans fix nitrogen for next crop
```

## Seven-Layer Forest Garden

For larger spaces at permaculture depth 3:

```
FOREST GARDEN LAYERS

7. CANOPY - Full-size fruit/nut trees
   Examples: Apple, pear, walnut
   
6. UNDERSTORY - Smaller trees
   Examples: Dwarf fruit, mulberry, elderberry
   
5. SHRUB - Berry bushes
   Examples: Blueberry, currant, gooseberry
   
4. HERBACEOUS - Perennial plants
   Examples: Comfrey, rhubarb, artichoke
   
3. GROUND COVER - Low spreaders
   Examples: Strawberry, clover, thyme
   
2. VINE - Climbing plants
   Examples: Grape, kiwi, passion fruit
   
1. ROOT - Underground harvest
   Examples: Potato, garlic, Jerusalem artichoke
```

## Commands

```bash
# Design guild for a tree
farm_clawed farm guild design --anchor "apple tree"

# Get companion suggestions
farm_clawed farm guild companions --plant "tomato"

# Check polyculture compatibility
farm_clawed farm guild check --plants "corn,beans,squash"

# View saved guilds
farm_clawed farm guild list
```

## Tips

1. **Start simple**: Begin with 3-4 plants, not all seven layers
2. **Observe before planting**: See what already grows well together
3. **Expect evolution**: Guilds change over time as plants establish
4. **Accept some chaos**: Nature isn't tidy, and that's okay
5. **Document what works**: Your site is unique; note successes

