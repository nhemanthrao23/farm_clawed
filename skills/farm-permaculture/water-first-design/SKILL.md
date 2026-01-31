---
name: water-first-design
description: Permaculture water harvesting design - swales, tanks, overflow, and catchment.
homepage: https://github.com/rahulraonatarajan/farm_clawed
metadata:
  farm_clawed:
    emoji: "💦"
    category: "water"
    requires:
      depth: 2
    provides:
      - "water_harvesting_design"
      - "swale_placement"
      - "overflow_routing"
---

# Water-First Design Skill

Permaculture principle: "Start with water." This skill helps design water harvesting, storage, and distribution systems that work with your landscape.

## Core Principle

In permaculture, water design comes before planting. The mantra is:
> "Slow it, spread it, sink it, store it"

## When to Use

Use this skill when:
- Designing or retrofitting your site's water systems
- Planning swale placement
- Sizing rainwater collection
- Creating overflow pathways
- Connecting water features

## Data Sources

This skill uses:
- `farm_map.geojson` - Site layout and elevations
- `sectors.yaml` - Water flow sectors
- `water_budget.yaml` - Annual water needs
- `water_assets.csv` - Existing infrastructure
- Rainfall data from `farm_profile.yaml`

## Water Harvesting Hierarchy

1. **Slow** - Reduce water velocity
2. **Spread** - Distribute across landscape
3. **Sink** - Infiltrate into soil
4. **Store** - In soil, tanks, ponds

### Earthworks (Passive Systems)

| Feature | Function | Best For |
|---------|----------|----------|
| Swales | Infiltration, recharge | Slopes, orchards |
| Berms | Plant mounds, edge habitat | Behind swales |
| Terraces | Level planting areas | Steep slopes |
| Rain gardens | Stormwater infiltration | Low spots |
| French drains | Redirect subsurface water | Wet areas |

### Storage (Active Systems)

| Feature | Capacity | Notes |
|---------|----------|-------|
| Rain barrel | 50-100 gal | Easy start, limited |
| IBC totes | 275 gal | Stackable, affordable |
| Cisterns | 500-10,000 gal | Underground or above |
| Ponds | Varies | Permit may be needed |
| Soil | 1" rain = 27,000 gal/acre | The best storage! |

## Example Outputs

### Site Water Analysis

```
WATER-FIRST ANALYSIS - Your Site

━━━ CURRENT CONDITIONS ━━━

Catchment Area: 1,200 sq ft roof
Annual Rainfall: 15 inches
Potential Harvest: 11,220 gallons/year
Current Storage: 55 gallons (rain barrel)
Capture Rate: 0.5%

━━━ OPPORTUNITY ASSESSMENT ━━━

You're capturing less than 1% of available rainwater!

RECOMMENDATIONS BY PRIORITY:

1. ADD STORAGE (Immediate Impact)
   Current: 1x 55-gal rain barrel
   Proposed: Add 2x 275-gal IBC totes
   New capacity: 605 gallons
   Capture rate: 5.4%
   Cost estimate: $150-200

2. INSTALL SWALE (Season 1)
   Location: Downslope of fruit tree area
   Length: 20 feet
   Depth: 12 inches
   Function: Infiltrate roof overflow
   Benefit: Deep water for tree roots

3. CREATE RAIN GARDEN (Season 2)
   Location: Low corner (current pooling issue)
   Size: 6' x 4'
   Plants: Native sedges, iris, rushes
   Function: Handle overflow, habitat

━━━ OVERFLOW ROUTING ━━━

Current: Overflow to storm drain (lost)

Proposed Path:
Rain barrel → IBC totes → Swale → Rain garden → Overflow to street

This route gives water 4 chances to infiltrate!
```

### Swale Design Guide

```
SWALE DESIGN - Basic Specifications

PURPOSE:
Capture and infiltrate roof runoff before reaching fruit trees.

LOCATION:
20 feet upslope of Meyer Lemon
On contour (use A-frame level)

DIMENSIONS:
- Length: 20 feet
- Width: 18 inches (bottom)
- Depth: 12 inches
- Berm height: 12 inches downslope

CONSTRUCTION:
1. Mark contour line with stakes
2. Dig trench along contour
3. Place soil downslope as berm
4. Compact berm gently
5. Mulch swale bottom (wood chips)
6. Plant berm with deep-rooted plants

PLANTING ON BERM:
- Fruit trees (eventually)
- Comfrey (nutrient accumulator)
- Native grasses (erosion control)
- Nitrogen fixers (clover, vetch)

OVERFLOW:
Connect to rain garden via grass waterway

MAINTENANCE:
- Clear debris from inlet
- Replenish mulch annually
- Monitor infiltration rate
```

### Rainwater Calculations

```
RAINWATER HARVESTING CALCULATOR

Your Roof:
- Area: 1,200 sq ft
- Collection efficiency: 75%

Monthly Harvest Potential (gallons):

Jan: 1,870 (2.5" rain)
Feb: 1,495 (2.0" rain)
Mar: 1,495 (2.0" rain)
Apr: 747 (1.0" rain)
May: 374 (0.5" rain)
Jun: 0 (0.0" rain)
Jul: 0 (0.0" rain)
Aug: 0 (0.0" rain)
Sep: 374 (0.5" rain)
Oct: 747 (1.0" rain)
Nov: 1,495 (2.0" rain)
Dec: 2,617 (3.5" rain)
━━━━━━━━━━━━━━━━━━━━━
Total: 11,214 gallons

Your Usage:
- Garden: 500 gal/month (growing season)
- Fruit trees: 200 gal/month (year-round)
- Annual need: ~5,400 gallons

Analysis:
Rainfall exceeds needs, but timing mismatch!
Store winter rain for summer use.

Recommended Storage:
- Minimum: 1,000 gallons (2 months buffer)
- Ideal: 2,500 gallons (5 months buffer)
```

## Design Principles

### Follow the Water

1. Observe where water goes during rain
2. Note pooling, erosion, runoff paths
3. Design to intercept before it leaves

### Stack Functions

Each water feature should serve multiple purposes:
- **Swale**: Infiltration + planting berm + wildlife corridor
- **Pond**: Storage + microclimate + habitat + beauty
- **Rain garden**: Infiltration + native plants + pollinators

### Start at the Top

Begin water harvesting at the highest point of your property and work down. Each feature feeds the next.

## Commands

```bash
# Analyze site water potential
farm_clawed farm water design

# Calculate rainwater harvest
farm_clawed farm water calculate --roof-sqft 1200 --rainfall 15

# Design swale specifications
farm_clawed farm water swale --length 20 --slope 3

# Plan overflow routing
farm_clawed farm water overflow --source "rain-barrel" --destination "garden"
```

## Resources

- Brad Lancaster's "Rainwater Harvesting" books
- Geoff Lawton's earthworks videos
- Local permaculture guild for climate-specific advice

## Tips

1. **Start small**: One rain barrel teaches a lot
2. **Observe first**: Watch water during rain before digging
3. **Mulch is storage**: 4" of mulch holds significant water
4. **Overflow is important**: Always plan where excess goes
5. **Living systems**: Plants pump water deep, improving infiltration

