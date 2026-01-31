---
name: seasonal-planner
description: Planting calendars, seasonal tasks, and timing recommendations.
homepage: https://github.com/rahulraonatarajan/farm_clawed
metadata:
  farm_clawed:
    emoji: "📅"
    category: "planning"
    requires:
      depth: 0
    provides:
      - "planting_calendar"
      - "seasonal_tasks"
      - "timing_recommendations"
---

# Seasonal Planner Skill

Provides planting calendars, seasonal task lists, and timing recommendations based on your climate zone and current conditions.

## When to Use

Use this skill when:
- Planning what to plant and when
- Creating seasonal task lists
- Deciding on timing for garden activities
- Preparing for seasonal transitions

## Data Sources

This skill uses:
- `farm_profile.yaml` - Climate zone, frost dates
- `season_calendar.yaml` - Custom seasonal settings
- `farm_map.geojson` - Current plantings
- Regional planting guides (built-in)

## Example Outputs

### Monthly Planner

```
MONTHLY PLANNER - February 2025
Zone: 9b | Frost Risk: Low-Moderate

━━━ THIS MONTH'S PRIORITIES ━━━

🌱 PLANTING
Start Indoors:
- Tomatoes (week 2-3)
- Peppers (week 1-2)
- Eggplant (week 2-3)

Direct Sow (if soil >50°F):
- Peas
- Lettuce
- Spinach
- Radishes

Transplant:
- Onion sets
- Potatoes (late month)

🌳 FRUIT TREES
- Final dormant pruning (before buds swell)
- Dormant oil spray for scale/mites
- Pre-bloom fertilization (late month)
- Check irrigation systems

Your Lemon Tree:
- Status: Winter dormancy ending
- Tasks:
  □ Light fertilization (1/4 strength)
  □ Monitor for new growth
  □ Watch for aphids on new leaves
  □ Protect if late frost threatens

🛠️ MAINTENANCE
- Clean and sharpen tools
- Order seeds for spring
- Build/repair raised beds
- Turn compost pile
- Apply compost to beds

📊 TRACKING
- Log: Hours worked, observations
- Photo: Dormant tree shapes, bed prep
- Record: Last frost date when it occurs

━━━ WEATHER WATCH ━━━
- Frost possible through mid-month
- Rain likely: Good time to transplant
- Prepare for spring warmup

━━━ NEXT MONTH PREVIEW ━━━
March: Full spring planting mode
- Transplant tomatoes/peppers (after last frost)
- Direct sow warm-season crops
- Major fruit tree activity (bloom)
```

### Annual Overview

```
ANNUAL GARDEN CALENDAR - Zone 9b

JAN  ❄️  Planning, bare-root planting, tool prep
FEB  🌱  Indoor starts, dormant pruning, early peas
MAR  🌸  Transplanting, spring planting, fruit bloom
APR  🌿  Warm season planting, irrigation setup
MAY  ☀️  Full production, pest monitoring
JUN  🍅  Harvest begins, succession planting
JUL  🌡️  Heat management, water focus
AUG  🥒  Peak harvest, fall crop starts
SEP  🍂  Fall planting, garlic/onions, cover crops
OCT  🎃  Final harvests, bed prep, mulching
NOV  🍁  Clean up, compost, tool maintenance
DEC  ⛄  Rest, planning, seed orders

Your Lemon Tree Annual Cycle:
- Feb-Mar: Pre-bloom feeding, watch for growth
- Mar-Apr: Bloom period, pollination
- Apr-May: Fruit set, thin if heavy
- Jun-Aug: Fruit development, consistent water
- Sep-Oct: Fruit maturing
- Nov-Feb: Harvest window, reduce water/feeding
```

### Task Timing Guide

```
TIMING GUIDE - Best Practices

WATERING
- Best time: Early morning (5-9 AM)
- Acceptable: Evening (avoid if fungal issues)
- Avoid: Midday (evaporation loss)

FERTILIZING
- Best time: Morning, on watered soil
- Avoid: Hot afternoons, dry soil
- Citrus: Light in winter, heavy in spring

TRANSPLANTING
- Best time: Cloudy day or evening
- Water before AND after
- Avoid: Hot, windy days

PRUNING
- Dormant trees: Late winter (Jan-Feb)
- Flowering shrubs: After bloom
- Citrus: Spring after frost risk
- Avoid: Fall (encourages tender growth)

PEST TREATMENT
- Sprays: Early morning or evening
- Avoid: When bees active, hot days
- Oils: When temps 40-85°F

HARVESTING
- Leafy greens: Morning (crisp and hydrated)
- Tomatoes: When fully colored
- Citrus: Taste test for ripeness
```

## Planting Calendar Generator

```
CUSTOM PLANTING CALENDAR

Based on your last frost date: February 15
And first frost date: November 30

CROP: Tomatoes
- Start indoors: Jan 15 - Feb 1 (6-8 weeks before)
- Transplant: Mar 1 - Mar 15 (2+ weeks after frost)
- First harvest: Jun 1 - Jun 15 (~90 days)
- Season end: Nov 15 (2 weeks before frost)

CROP: Lettuce (spring)
- Direct sow: Feb 1 - Mar 15
- First harvest: Mar 15 - Apr 30 (45 days)
- Succession: Every 2 weeks

CROP: Garlic
- Plant: Oct 15 - Nov 15
- Harvest: Jun 1 - Jul 1
- Cure: 2-4 weeks in dry shade
```

## Commands

```bash
# Get this month's tasks
farm_clawed farm plan month

# Get annual overview
farm_clawed farm plan year

# Get planting dates for a crop
farm_clawed farm plan plant --crop "tomatoes"

# Get task list for today
farm_clawed farm plan today

# Export calendar (iCal format)
farm_clawed farm plan export --format ical
```

## Calendar Integration

farm_clawed can export tasks to:
- iCal (.ics files)
- Google Calendar
- Apple Reminders
- CSV for spreadsheets

## Tips

1. **Adjust for microclimates**: South-facing spots are 1-2 weeks earlier
2. **Use succession planting**: Stagger plantings for continuous harvest
3. **Keep records**: Note actual dates vs. planned for future reference
4. **Weather trumps calendar**: Adjust based on actual conditions
5. **Plan for preservation**: Schedule harvests with processing capacity

