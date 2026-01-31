# Farm Context Pack

The Farm Context Pack is a standardized set of templates that farm_clawed uses to understand your farm and provide tailored recommendations.

## Overview

Templates are YAML, CSV, or GeoJSON files that describe your farm's:
- Physical layout and location
- Water infrastructure
- Existing plantings
- Seasonal patterns
- ROI tracking inputs

## Template Categories

### Core Templates (Required for all modes)

These templates are required regardless of your permaculture depth setting.

| Template | Format | Description |
|----------|--------|-------------|
| `farm_profile.yaml` | YAML | Basic farm info, location, climate zone |
| `farm_map.geojson` | GeoJSON | Areas/fields/blocks as polygons |
| `water_assets.csv` | CSV | Water sources, valves, manifolds |
| `roi_inputs.yaml` | YAML | Cost tracking and value estimates |
| `sensor_readings.csv` | CSV | Manual or imported sensor data |
| `season_calendar.yaml` | YAML | Planting windows, frost dates |

### Permaculture Extensions (Depth 2+)

These templates unlock permaculture-specific features when `permacultureDepth >= 2`.

| Template | Format | Depth | Description |
|----------|--------|-------|-------------|
| `zones_0_5.geojson` | GeoJSON | 2+ | Permaculture zone boundaries |
| `sectors.yaml` | YAML | 2+ | Sun, wind, water flow sectors |
| `guilds.yaml` | YAML | 2+ | Plant guild definitions |
| `succession_plan.yaml` | YAML | 3 | Multi-year succession stages |
| `water_budget.yaml` | YAML | 2+ | Drought stages, priorities |

## Template Specifications

### farm_profile.yaml

Basic farm information and constraints.

```yaml
# farm_profile.yaml
name: "Santa Teresa Micro-Farm"
location:
  latitude: 37.2441
  longitude: -121.8825
  elevation_m: 200
  timezone: "America/Los_Angeles"

climate:
  zone: "9b"  # USDA hardiness zone
  avg_rainfall_mm: 380
  frost_free_days: 280
  last_frost: "2025-02-15"
  first_frost: "2025-11-30"

constraints:
  water_source: "municipal"
  water_cost_per_gallon: 0.008
  max_daily_gallons: 500
  power_available: true
  internet_available: true

scale:
  type: "container"  # container | garden | small_farm | orchard | ranch | commercial
  area_sqft: 50
  plant_count: 1

owner:
  name: "Rahul"
  experience_years: 1
  goals:
    - "Learn container citrus care"
    - "Minimize water waste"
    - "Track ROI of automation"
```

### farm_map.geojson

GeoJSON FeatureCollection defining farm areas.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "lemon-container-1",
        "name": "Santa Teresa Lemon",
        "area_type": "container",
        "area_sqft": 4,
        "crop": "Meyer Lemon",
        "planted_date": "2024-06-15",
        "irrigation_zone": "zone-1"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-121.8825, 37.2441]
      }
    }
  ]
}
```

### water_assets.csv

Water infrastructure inventory.

```csv
asset_id,asset_type,name,location,capacity_gpm,connected_to,smart_enabled,device_id
WS001,source,municipal-tap,house,5.0,,false,
V001,valve,lemon-valve,patio,2.0,WS001,true,tuya_12345
M001,manifold,patio-manifold,patio,4.0,V001,false,
S001,sensor,soil-sensor-1,lemon-container-1,,M001,true,tuya_67890
```

### roi_inputs.yaml

Cost and value tracking configuration.

```yaml
# roi_inputs.yaml
tracking_period: "monthly"

costs:
  water:
    rate_per_gallon: 0.008
    baseline_monthly_gallons: 100
  
  inputs:
    fertilizer_monthly: 5.00
    pest_control_monthly: 0.00
    amendments_monthly: 2.00
  
  time:
    hourly_value: 25.00
    baseline_hours_per_week: 2.0
  
  equipment:
    sensor_cost: 35.00
    valve_cost: 45.00
    hub_cost: 25.00

values:
  harvest:
    expected_lemons_per_year: 50
    value_per_lemon: 0.50
  
  avoided_loss:
    plant_replacement_cost: 75.00
    probability_without_monitoring: 0.15
    probability_with_monitoring: 0.02

goals:
  target_water_savings_percent: 20
  target_time_savings_percent: 50
  payback_target_months: 12
```

### sensor_readings.csv

Sensor data import format.

```csv
timestamp,sensor_id,reading_type,value,unit,battery_pct
2025-01-31T08:00:00Z,S001,moisture,17,percent,57
2025-01-31T08:00:00Z,S001,temperature,54.5,fahrenheit,57
2025-01-31T08:00:00Z,S001,ec,0.001,mS/cm,57
2025-01-31T12:00:00Z,S001,moisture,16,percent,56
2025-01-31T12:00:00Z,S001,temperature,62.3,fahrenheit,56
2025-01-31T12:00:00Z,S001,ec,0.001,mS/cm,56
```

### season_calendar.yaml

Seasonal patterns and planting windows.

```yaml
# season_calendar.yaml
hemisphere: "northern"
climate_type: "mediterranean"

seasons:
  spring:
    start: "03-01"
    end: "05-31"
    activities:
      - "fertilize citrus (March)"
      - "increase watering frequency"
      - "monitor for aphids"
  
  summer:
    start: "06-01"
    end: "08-31"
    activities:
      - "deep water 2x/week"
      - "mulch to retain moisture"
      - "harvest early lemons"
  
  fall:
    start: "09-01"
    end: "11-30"
    activities:
      - "reduce watering"
      - "final fertilize (September)"
      - "prepare for frost"
  
  winter:
    start: "12-01"
    end: "02-28"
    activities:
      - "frost protection if <35F"
      - "minimal watering"
      - "prune after harvest"

frost_dates:
  average_last: "02-15"
  average_first: "11-30"
  record_last: "03-15"
  record_first: "11-01"

citrus_specific:
  bloom_period: "03-15 to 04-30"
  harvest_period: "11-01 to 02-28"
  growth_flush: ["04-01 to 05-15", "07-01 to 08-15"]
```

## Permaculture Extension Templates

### zones_0_5.geojson

Permaculture zone boundaries (depth 2+).

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "zone": 0,
        "name": "House",
        "description": "Living space, kitchen"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-121.8826, 37.2442], ...]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "zone": 1,
        "name": "Intensive Garden",
        "description": "Daily harvest, herbs, containers",
        "visit_frequency": "daily"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-121.8825, 37.2441], ...]]
      }
    }
  ]
}
```

### sectors.yaml

Energy flow sectors (depth 2+).

```yaml
# sectors.yaml
sun:
  summer_sunrise_azimuth: 60
  summer_sunset_azimuth: 300
  winter_sunrise_azimuth: 120
  winter_sunset_azimuth: 240
  shade_sources:
    - name: "neighbor's oak"
      azimuth: 180
      shade_hours_summer: 2
      shade_hours_winter: 4

wind:
  prevailing_direction: 315  # NW
  storm_direction: 225  # SW
  wind_breaks:
    - name: "fence"
      azimuth_range: [270, 360]
      effectiveness: 0.6

water:
  slope_direction: 180  # flows south
  slope_percent: 2
  drainage_issues:
    - "pooling near patio in heavy rain"

fire:
  risk_direction: 45  # NE hills
  risk_level: "moderate"
  defensible_space_ft: 30
```

### guilds.yaml

Plant guild definitions (depth 2+).

```yaml
# guilds.yaml
guilds:
  - name: "Citrus Guild"
    anchor: "Meyer Lemon"
    layers:
      canopy: "Meyer Lemon"
      understory: null
      shrub: "Rosemary"
      herbaceous: ["Comfrey", "Yarrow", "Nasturtium"]
      ground_cover: "White Clover"
      vine: null
      root: "Garlic"
    
    functions:
      nitrogen_fixers: ["White Clover"]
      dynamic_accumulators: ["Comfrey", "Yarrow"]
      pest_repellent: ["Rosemary", "Garlic", "Nasturtium"]
      pollinator_attractors: ["Rosemary", "Yarrow"]
      mulch_producers: ["Comfrey"]
    
    spacing:
      comfrey_from_trunk_ft: 2
      clover_coverage_percent: 60
    
    notes: "Chop-and-drop comfrey 3x/year for mulch"
```

### succession_plan.yaml

Multi-year succession planning (depth 3).

```yaml
# succession_plan.yaml
start_year: 2025
planning_horizon_years: 5

stages:
  - year: 1
    name: "Establishment"
    focus: "Get lemon established, add guild understory"
    actions:
      - "Plant comfrey ring (March)"
      - "Seed white clover (April)"
      - "Add rosemary (May)"
    success_criteria:
      - "Lemon showing new growth"
      - "Comfrey established (3+ leaves)"
      - "Clover germinated"
  
  - year: 2
    name: "Guild Integration"
    focus: "Complete guild, begin chop-and-drop"
    actions:
      - "Add yarrow and nasturtium"
      - "First comfrey chop (May)"
      - "Plant garlic (October)"
    success_criteria:
      - "First lemon harvest (5+ fruit)"
      - "Reduced irrigation needs"
  
  - year: 3
    name: "Production"
    focus: "Optimize yields, expand if successful"
    actions:
      - "Evaluate for second citrus"
      - "Document water savings"
    success_criteria:
      - "20+ lemons harvested"
      - "30% water reduction vs baseline"

evaluation:
  frequency: "quarterly"
  metrics:
    - "fruit_count"
    - "water_usage"
    - "pest_pressure"
    - "soil_health_observations"
```

### water_budget.yaml

Water budget with drought stages (depth 2+).

```yaml
# water_budget.yaml
annual_budget_gallons: 3650  # 10 gal/day average

priorities:
  - rank: 1
    category: "established_perennials"
    items: ["Meyer Lemon"]
    min_percent: 60
    notes: "Never let citrus stress completely"
  
  - rank: 2
    category: "guild_support"
    items: ["Comfrey", "Rosemary"]
    min_percent: 20
  
  - rank: 3
    category: "annuals"
    items: ["Nasturtium", "Garlic"]
    min_percent: 10

drought_stages:
  - stage: 0
    name: "Normal"
    trigger: "reservoir > 80% OR no restrictions"
    allocation_percent: 100
    actions: []
  
  - stage: 1
    name: "Watch"
    trigger: "reservoir 60-80% OR voluntary restrictions"
    allocation_percent: 85
    actions:
      - "Reduce lawn/ornamental watering"
      - "Check for leaks"
  
  - stage: 2
    name: "Warning"
    trigger: "reservoir 40-60% OR mandatory restrictions"
    allocation_percent: 70
    actions:
      - "Suspend annual plantings"
      - "Deep mulch all beds"
      - "Graywater if available"
  
  - stage: 3
    name: "Emergency"
    trigger: "reservoir < 40% OR severe restrictions"
    allocation_percent: 50
    actions:
      - "Priority 1 plants only"
      - "Hand water at roots only"
      - "Consider shade cloth"

monitoring:
  check_frequency: "weekly"
  sources:
    - "Local water district alerts"
    - "Reservoir level reports"
```

## Validation

All templates are validated against Zod schemas at load time. Missing optional templates (permaculture extensions) do not cause errors when `permacultureDepth < 2`.

### Validation Rules

1. **Required fields:** Core templates must have all required fields
2. **Date formats:** ISO 8601 for timestamps, MM-DD for seasonal dates
3. **Coordinates:** WGS84 (EPSG:4326) for GeoJSON
4. **Units:** Metric preferred, imperial supported with explicit unit field
5. **IDs:** Must be unique within each template, alphanumeric + hyphens

### Error Handling

```typescript
// Example validation error
{
  "template": "water_assets.csv",
  "errors": [
    {
      "row": 3,
      "field": "capacity_gpm",
      "message": "Expected number, got 'five'"
    }
  ]
}
```

## Loading Templates

Templates are loaded from the farm workspace directory:

```
~/.farm_clawed/workspace/
├── farm_profile.yaml
├── farm_map.geojson
├── water_assets.csv
├── roi_inputs.yaml
├── sensor_readings.csv
├── season_calendar.yaml
├── zones_0_5.geojson      # Optional, depth 2+
├── sectors.yaml           # Optional, depth 2+
├── guilds.yaml            # Optional, depth 2+
├── succession_plan.yaml   # Optional, depth 3
└── water_budget.yaml      # Optional, depth 2+
```

## AI Context Integration

When the AI generates recommendations, it references templates as `sources_used`:

```json
{
  "recommendation": "Water the lemon tree with 0.5 gallons today",
  "sources_used": [
    "farm_profile.yaml:climate",
    "sensor_readings.csv:2025-01-31",
    "season_calendar.yaml:winter",
    "water_budget.yaml:stage_0"
  ],
  "confidence": 0.85
}
```

This allows users to understand what data informed each recommendation.

