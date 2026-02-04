# CSV and GeoJSON Import

Import farm data from CSV files and GeoJSON for field boundaries. This works with any FMIS system that can export data.

## Overview

The CSV/GeoJSON importer provides a flexible way to bring farm data into farm_clawed:

- **CSV** - Tabular data like field lists, sensor readings, crop records
- **GeoJSON** - Field boundaries and zone polygons

## CSV Import

### Supported Formats

- Standard comma-separated values
- Headers in the first row (optional)
- Quoted fields for values containing commas

### Example: Field List

Create a CSV file with your fields:

```csv
name,area,unit,crop,notes
North Field,45.5,acres,corn,Tile drained
South Pasture,32.0,acres,grass,Rotational grazing
Garden Plot,0.25,acres,vegetables,
```

### Import Steps

1. Go to **Setup** > **Step 3: Data Sources**
2. Select **Manual / CSV Upload**
3. Click **Import CSV**
4. Map columns to farm_clawed fields:
   - `name` → Field Name
   - `area` → Area
   - `unit` → Area Unit
5. Review the imported data
6. Click **Confirm Import**

### Column Mapping

You can map any column to farm_clawed fields:

| CSV Column | farm_clawed Field | Transform |
|------------|-------------------|-----------|
| name | Field Name | trim |
| area | Area | toNumber |
| unit | Area Unit | lowercase |
| crop | Crop Type | - |
| notes | Notes | - |

## GeoJSON Import

### Supported Formats

- GeoJSON FeatureCollection
- Single GeoJSON Feature
- Polygon and MultiPolygon geometries

### Example: Field Boundaries

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "North Field",
        "acres": 45.5
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[...], [...], ...]]
      }
    }
  ]
}
```

### Import Steps

1. Go to **Setup** > **Step 3: Data Sources**
2. Select **Manual / CSV Upload**
3. Click **Import GeoJSON**
4. Select your `.geojson` file
5. Map properties to farm_clawed fields
6. Click **Confirm Import**

## ISOBUS / ISO 11783 / ISOXML Data

Many FMIS systems and agricultural equipment use ISOBUS (ISO 11783) for data exchange. This standard uses XML-based formats (ISOXML/ISO-XML).

### Exporting from ISOBUS Systems

If you have ISOXML data, export it to a more portable format:

1. **Your FMIS** - Most systems can export to CSV or shapefile
2. **QGIS** - Open ISOXML and export to GeoJSON
3. **FMIS Export Tools** - Many vendors provide export utilities

### Common ISOXML Data Types

| ISOXML Element | CSV Equivalent |
|----------------|----------------|
| Partfield | Field boundaries |
| Task | Operations records |
| Time Log | Equipment usage |
| Product | Input applications |

## Templates

farm_clawed provides CSV templates for common imports:

### Field Template

```csv
name,area_acres,boundary_geojson,zone_type,permaculture_zone,sector,notes
```

### Sensor Reading Template

```csv
timestamp,sensor_id,sensor_type,value,unit,location
```

### Water Asset Template

```csv
name,type,capacity_gallons,flow_rate_gpm,automation_ready,notes
```

Download templates from the Setup wizard or from `docs/TEMPLATES/`.

## Best Practices

1. **Validate before import** - Preview data and check for errors
2. **Start small** - Import a few records first to verify mapping
3. **Back up first** - Export your existing farm_clawed data before bulk imports
4. **Use consistent units** - Standardize on acres or hectares

## Troubleshooting

### "Column not found" Error

The CSV column name doesn't match the mapping. Check for:
- Extra spaces in column names
- Different capitalization
- Hidden characters (especially from Excel exports)

### Invalid GeoJSON

Common issues:
- Unclosed polygons (first and last coordinate must match)
- Invalid coordinate order (longitude, latitude not latitude, longitude)
- Missing `type` property

### Large File Imports

For files > 10MB:
- Split into smaller files
- Import in batches
- Use the CLI: `farm_clawed import --csv fields.csv`

