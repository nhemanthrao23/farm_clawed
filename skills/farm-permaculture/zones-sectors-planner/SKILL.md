---
name: zones-sectors-planner
description: Permaculture zone and sector analysis for efficient site design.
homepage: https://github.com/rahulraonatarajan/farm_clawed
metadata:
  farm_clawed:
    emoji: "🗺️"
    category: "design"
    requires:
      depth: 2
    provides:
      - "zone_analysis"
      - "sector_analysis"
      - "placement_recommendations"
---

# Zones and Sectors Planner Skill

Apply permaculture's zones and sectors framework to optimize your site design for efficiency, energy flow, and productivity.

## Core Concepts

### Zones (Human Energy)

Zones organize elements by frequency of human attention needed:

| Zone | Name | Visit Frequency | Examples |
|------|------|-----------------|----------|
| 0 | Home | Constant | Kitchen, living areas |
| 1 | Intensive | Daily/multiple | Herbs, salad, chicken coop |
| 2 | Semi-intensive | Few times/week | Main garden, orchard |
| 3 | Occasional | Weekly/monthly | Field crops, pasture |
| 4 | Managed wild | Rarely | Timber, foraging |
| 5 | Wilderness | Never | Wildlife, observation |

### Sectors (External Energy)

Sectors map energies entering your site from outside:

- **Sun sector**: Solar path, seasonal variation
- **Wind sector**: Prevailing winds, storms
- **Water sector**: Rain direction, flooding, drainage
- **Fire sector**: Wildfire risk direction
- **View sector**: Desirable and undesirable views
- **Noise sector**: Traffic, neighbors
- **Wildlife sector**: Animal movement corridors

## When to Use

Use this skill when:
- Planning initial site layout
- Deciding where to place elements
- Troubleshooting inefficient patterns
- Expanding or redesigning areas

## Data Sources

This skill uses:
- `farm_profile.yaml` - Site location, constraints
- `farm_map.geojson` - Current layout
- `zones_0_5.geojson` - Zone boundaries
- `sectors.yaml` - Sector analysis
- Your movement patterns and observations

## Example Outputs

### Zone Analysis

```
ZONE ANALYSIS - Your Site

━━━ CURRENT CONFIGURATION ━━━

ZONE 0 - House
- Location: Center of property
- Access points: Front door (E), Back door (W)
- Kitchen window faces: West
- Key observation: Kitchen window overlooks back garden ✓

ZONE 1 - Should be within 50 steps of door
Current Zone 1 elements:
✓ Meyer Lemon container (12 steps) - Good!
✗ Herb spiral (needs creation)
✗ Salad greens bed (needs creation)

Recommendation:
The lemon is well-placed for daily observation.
Add herb spiral near kitchen door for easy access.

ZONE 2 - Main production (50-200 steps)
Current elements:
- Main garden beds (planned)
- Compost system (planned)

ZONES 3-5 - Not applicable for your scale

━━━ PLACEMENT RECOMMENDATIONS ━━━

Based on your site:

MOVE CLOSER (to Zone 1):
- Daily harvest crops → near kitchen door
- Propagation area → visible from window

MOVE FURTHER (to Zone 2):
- Storage crops → less frequent access needed
- Larger fruit trees → weekly attention sufficient

ADD TO ZONE 1:
1. Herb spiral (8 steps from door)
2. Salad table (under kitchen window)
3. Container strawberries (on patio)
```

### Sector Analysis

```
SECTOR ANALYSIS - Your Site

━━━ SUN SECTOR ━━━

Solar Arc:
- Summer: Rise 60° (NE) → Set 300° (NW)
- Winter: Rise 120° (SE) → Set 240° (SW)

Implications:
- South side receives maximum sun year-round
- North side gets minimal winter sun
- East side: Morning sun, afternoon shade

Recommendations:
- Fruit trees: South/southwest exposure
- Heat-loving crops: South-facing beds
- Shade-tolerant: North side of structures

━━━ WIND SECTOR ━━━

Prevailing: West (270°)
Storm winds: Southwest (225°)

Current windbreaks:
- Fence + hedge: 60% effective on W/SW
- House: 90% effective on N

Recommendations:
- Protect tender plants from SW storms
- Use house as windbreak for Zone 1
- Consider living windbreak on west

━━━ WATER SECTOR ━━━

Drainage: Flows south (180°)
Slope: 3%
Issues: Pooling in NE corner

Recommendations:
- Place water-loving plants in NE
- Install rain garden in pooling area
- Route swales to intercept slope water

━━━ FIRE SECTOR ━━━

Risk direction: NE hills (45°)
Risk level: Moderate

Recommendations:
- Maintain defensible space (30')
- High-moisture plants toward fire sector
- No brush piles on NE side
```

### Element Placement Guide

```
ELEMENT PLACEMENT GUIDE

Where should each element go?

MEYER LEMON TREE (current)
Zone: 1 ✓ (daily observation for pests/water)
Sector considerations:
- Sun: Needs full south exposure ✓
- Wind: Protected from cold north winds ✓
- Frost: Near house for thermal mass ✓
Current placement: OPTIMAL

FUTURE APPLE TREE
Zone: 2 (weekly attention when established)
Sector considerations:
- Sun: Full sun required
- Wind: Pollination needs some air movement
- Pest: Away from street lights (moths)
Recommended: Southwest corner, 15' from house

COMPOST SYSTEM
Zone: 2 (access when adding/turning)
Sector considerations:
- Sun: Partial shade OK (prevents drying)
- Wind: Downwind of living areas
- Water: Not in drainage path
Recommended: West side, behind screening

CHICKEN COOP (future)
Zone: 1-2 edge (daily egg collection)
Sector considerations:
- Sun: Morning sun for early activity
- Wind: Protected from prevailing wind
- Noise: Away from bedroom windows
Recommended: Southeast, with morning access

SITTING AREA
Zone: 1 (frequent use)
Sector considerations:
- Sun: Afternoon shade in summer
- Wind: Protected from prevailing wind
- View: Overlook garden
Recommended: Under deciduous tree, facing garden
```

## Design Process

1. **Map zones from door outward**
   - Walk your daily path
   - Note what you access most

2. **Overlay sectors**
   - Mark sun angles
   - Note wind patterns
   - Identify water flow

3. **Place elements at zone/sector intersection**
   - Match needs to conditions
   - Stack functions where possible

4. **Test with observation**
   - Live with design before permanent changes
   - Adjust based on reality

## Commands

```bash
# Analyze current zones
farm_clawed farm zones analyze

# Suggest placements
farm_clawed farm zones place --element "fruit tree"

# Run sector analysis
farm_clawed farm sectors analyze

# Generate combined zone/sector map
farm_clawed farm design map
```

## Tips

1. **Zones are flexible**: They follow YOUR patterns, not rigid distances
2. **Sectors change seasonally**: Summer sun differs from winter
3. **Stacking is key**: Good design places elements to serve multiple zones
4. **Observe before acting**: Spend a full year watching your site
5. **Start with Zone 1**: Get the daily-use area right first

