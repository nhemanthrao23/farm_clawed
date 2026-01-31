---
name: microclimate-risk
description: Frost, heat, and microclimate alerts based on sensor data and forecasts.
homepage: https://github.com/rahulraonatarajan/farm_clawed
metadata:
  farm_clawed:
    emoji: "🌡️"
    category: "climate"
    requires:
      depth: 0
    provides:
      - "frost_alerts"
      - "heat_alerts"
      - "microclimate_analysis"
---

# Microclimate Risk Skill

Monitors temperature trends and provides alerts for frost, heat stress, and other microclimate risks.

## When to Use

Use this skill when:
- Cold weather is forecasted
- Heat waves are expected
- Planning frost protection
- Assessing microclimates on your site

## Data Sources

This skill uses:
- `sensor_readings.csv` - Soil and air temperature
- `farm_profile.yaml` - Climate zone and frost dates
- `season_calendar.yaml` - Frost windows
- Weather forecast APIs (when available)

## Risk Thresholds

### Cold/Frost Risk

| Soil Temp (°F) | Risk Level | Action |
|----------------|------------|--------|
| > 50 | None | Normal operations |
| 40-50 | Watch | Monitor overnight temps |
| 35-40 | Warning | Prepare frost protection |
| 32-35 | Critical | Deploy protection NOW |
| < 32 | Freeze | Emergency measures |

### Heat Risk

| Temp (°F) | Risk Level | Action |
|-----------|------------|--------|
| < 85 | None | Normal operations |
| 85-95 | Watch | Ensure adequate water |
| 95-105 | Warning | Shade cloth, extra water |
| > 105 | Critical | Emergency irrigation |

## Example Outputs

### Frost Alert

```
⚠️ FROST ALERT - January 31, 2025 Evening

Current Conditions:
- Soil Temperature: 54.5°F (falling)
- Ambient Temperature: ~52°F
- Humidity: 70%
- Wind: Calm

Forecast:
- Tonight's low: 38°F
- Tomorrow morning: 35°F
- Clear skies (radiational cooling risk)

Risk Assessment: MODERATE
Your lemon tree may experience stress below 35°F.

RECOMMENDED ACTIONS:

Immediate (before sunset):
1. Water the soil thoroughly
   - Wet soil holds heat better
   - Provides thermal mass

2. Move containers closer to house
   - Building radiates heat
   - Protection from wind

3. Prepare covering
   - Frost cloth or old sheet
   - Do NOT use plastic directly on leaves
   - Drape loosely, secure edges

Tonight:
- Set phone alarm for 5 AM
- Check temp before covering touches freezing
- If <35°F, consider heat source (holiday lights, etc.)

Tomorrow:
- Remove covers after temps rise above 40°F
- Check for any damage
- Water again if soil dried

Sources used:
- sensor_readings.csv (soil temp trend)
- farm_profile.yaml (zone 9b, frost sensitive)
- season_calendar.yaml (within frost window)
```

### Heat Wave Preparation

```
🌡️ HEAT ADVISORY - Summer Example

Expected high: 102°F for 3 days

Preparation Checklist:
□ Deep water all plants today (before heat)
□ Apply additional mulch (3-4 inches)
□ Set up shade cloth on sensitive plants
□ Move containers to afternoon shade
□ Check irrigation system functioning
□ Fill water reservoirs

During Heat Wave:
- Water in early morning (5-7 AM)
- Check soil moisture twice daily
- Watch for wilting (emergency indicator)
- Avoid fertilizing (stresses plants)

After Heat Wave:
- Resume normal watering after 2 days
- Check for sun scald on fruits
- Prune any heat-damaged growth
```

## Microclimate Mapping

Your site has unique microclimates:

### Warm Spots
- South-facing walls (thermal mass)
- Dark-colored surfaces
- Protected from wind
- Near building heat exhaust

### Cold Spots
- North-facing areas
- Low spots (cold air pools)
- Exposed to wind
- Away from structures

### Recommendations by Microclimate

| Location | Best For | Avoid |
|----------|----------|-------|
| Against south wall | Citrus, figs, tomatoes | Lettuce, spinach |
| Low north corner | Berries, cool crops | Frost-sensitive plants |
| Open center | Full sun crops | Heat-sensitive in summer |

## Commands

```bash
# Check current risk
farm_clawed farm climate status

# Get frost alerts
farm_clawed farm climate frost-check

# Get heat alerts
farm_clawed farm climate heat-check

# Map microclimates (requires multiple sensors)
farm_clawed farm climate map
```

## Emergency Contacts

Configure in your farm profile:
- Local frost/freeze warning: [Weather Service]
- Extension service: [Local agricultural extension]
- Nursery advice line: [Your nursery]

## Tips

1. **Wet soil = warmer**: Water before frost for thermal mass
2. **Cover loosely**: Air gap provides insulation
3. **Cold air sinks**: Plant frost-sensitive crops on slopes
4. **Morning sun**: East exposure warms plants quickly after cold night
5. **Thermal mass**: Rocks, water containers store daytime heat

