---
name: irrigation-policy
description: Water scheduling recommendations based on sensor data, weather, and plant needs.
homepage: https://github.com/rahulraonatarajan/farm_clawed
metadata:
  farm_clawed:
    emoji: "💧"
    category: "water"
    requires:
      depth: 0
    provides:
      - "watering_schedule"
      - "water_recommendations"
---

# Irrigation Policy Skill

Provides intelligent watering recommendations based on soil moisture, weather conditions, and plant requirements.

## When to Use

Use this skill when:
- Planning daily/weekly watering schedules
- Responding to sensor alerts (dry or wet soil)
- Adjusting for weather forecasts
- Optimizing water usage

## Data Sources

This skill uses:
- `sensor_readings.csv` - Current soil moisture and temperature
- `water_assets.csv` - Available irrigation infrastructure
- `season_calendar.yaml` - Current season and typical needs
- `farm_profile.yaml` - Climate and water constraints
- Weather forecast (if available)

## Watering Decision Framework

### Moisture Thresholds

| Soil Moisture | Status | Action |
|--------------|--------|--------|
| < 20% | Critical dry | Water immediately |
| 20-35% | Dry | Schedule watering |
| 35-60% | Optimal | No action needed |
| 60-80% | Moist | Skip next watering |
| > 80% | Saturated | Check drainage |

### Temperature Adjustments

- **Hot day (>85°F)**: Water early morning, increase amount 20%
- **Cold day (<50°F)**: Reduce watering, avoid wet foliage
- **Frost risk (<35°F)**: Water before sunset for thermal mass

### Seasonal Multipliers

- **Spring**: 0.8x baseline (cool, rain likely)
- **Summer**: 1.2x baseline (hot, dry)
- **Fall**: 0.7x baseline (cooler, less growth)
- **Winter**: 0.4x baseline (dormant period)

## Example Outputs

### Daily Recommendation

```
WATERING RECOMMENDATION - January 31, 2025

Current Conditions:
- Soil Moisture: 38% (Dry range)
- Soil Temp: 54°F
- Last Watered: 3 days ago

Recommendation: WATER TODAY
- Amount: 0.5 gallons
- Time: Morning (before 9 AM)
- Method: Slow drip at root zone

Reasoning:
- Moisture below optimal threshold (38% < 40%)
- No rain forecasted next 5 days
- Cool temps mean slower evaporation

Next Check: Tomorrow morning
```

### Weekly Schedule

```
WEEKLY WATERING SCHEDULE

Mon: ✓ Water (0.5 gal)
Tue: Skip - soil recovering
Wed: ✓ Water (0.5 gal) if <45% moisture
Thu: Skip
Fri: ✓ Water (0.5 gal)
Sat: Skip
Sun: ✓ Check and water if needed

Estimated weekly usage: 1.5-2.0 gallons
Baseline comparison: 3.5 gallons (43% savings)
```

## Integration with Actuators

If smart valves are configured (`water_assets.csv` with `smart_enabled: true`):

1. **Automation Level 0-1**: Recommendations only
2. **Automation Level 2**: Create approval request
3. **Automation Level 3+**: Execute within guardrails

### Safety Limits (always enforced)

- Max single watering: 2 gallons (configurable)
- Max daily watering: 5 gallons (configurable)
- Min time between waterings: 4 hours
- Never water if moisture > 70%

## Commands

```bash
# Get current recommendation
farm_clawed farm water status

# Get weekly schedule
farm_clawed farm water schedule --days 7

# Log manual watering
farm_clawed farm water log --amount 0.5 --zone zone-1
```

## Tips

1. **Deep watering is better**: Less frequent, deeper watering encourages root growth
2. **Morning is best**: Reduces evaporation and fungal issues
3. **Mulch helps**: 3-4 inches of mulch reduces watering needs 25-50%
4. **Watch the plant**: Sensor data helps, but observe leaf health too

