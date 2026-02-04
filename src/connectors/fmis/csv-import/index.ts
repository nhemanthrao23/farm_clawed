/**
 * CSV/GeoJSON Import Module
 *
 * Import farm data from CSV files and GeoJSON for field boundaries.
 * Supports mapping columns to farm_clawed's internal schema.
 *
 * This module supports:
 * - CSV files with field/zone data
 * - GeoJSON files with boundaries
 * - Column mapping for flexible imports
 *
 * For ISOBUS/ISO 11783 (ISOXML) data:
 * Most FMIS systems can export to CSV or shape files. If you have ISOXML
 * data, export it to CSV first using your FMIS or a tool like QGIS.
 * See docs/connectors/csv-import.md for details.
 */

import { z } from "zod";

/**
 * GeoJSON types (simplified for farm_clawed)
 * Full GeoJSON typing available via @types/geojson if needed
 */
export namespace GeoJSON {
  export type Position = number[];

  export interface Point {
    type: "Point";
    coordinates: Position;
  }

  export interface MultiPoint {
    type: "MultiPoint";
    coordinates: Position[];
  }

  export interface LineString {
    type: "LineString";
    coordinates: Position[];
  }

  export interface MultiLineString {
    type: "MultiLineString";
    coordinates: Position[][];
  }

  export interface Polygon {
    type: "Polygon";
    coordinates: Position[][];
  }

  export interface MultiPolygon {
    type: "MultiPolygon";
    coordinates: Position[][][];
  }

  export type Geometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;

  export interface Feature<G extends Geometry = Geometry, P = Record<string, unknown>> {
    type: "Feature";
    geometry: G;
    properties: P;
    id?: string | number;
  }

  export interface FeatureCollection<G extends Geometry = Geometry, P = Record<string, unknown>> {
    type: "FeatureCollection";
    features: Feature<G, P>[];
  }

  export type GeoJsonObject = Geometry | Feature | FeatureCollection;
}

/**
 * Column mapping for CSV imports
 */
export interface ColumnMapping {
  /** Source column name in CSV */
  source: string;
  /** Target field in farm_clawed */
  target: string;
  /** Optional transform function */
  transform?: (value: string) => unknown;
}

/**
 * Import result for a single row
 */
export interface ImportedRow {
  index: number;
  data: Record<string, unknown>;
  errors?: string[];
}

/**
 * CSV import options
 */
export interface CsvImportOptions {
  /** Column mappings */
  mapping: ColumnMapping[];
  /** Delimiter (default: comma) */
  delimiter?: string;
  /** Skip header row (default: true) */
  hasHeader?: boolean;
  /** Row validation function */
  validator?: (row: Record<string, unknown>) => string[];
}

/**
 * GeoJSON import options
 */
export interface GeoJsonImportOptions {
  /** Property to use as ID */
  idProperty?: string;
  /** Property to use as name */
  nameProperty?: string;
  /** Additional property mappings */
  propertyMappings?: ColumnMapping[];
}

/**
 * Field data structure (internal)
 */
export interface ImportedField {
  id: string;
  name: string;
  area?: number;
  areaUnit?: string;
  boundary?: GeoJSON.Geometry;
  properties?: Record<string, unknown>;
}

/**
 * Zone data structure (internal)
 */
export interface ImportedZone {
  id: string;
  name: string;
  type?: string;
  fieldId?: string;
  boundary?: GeoJSON.Geometry;
  properties?: Record<string, unknown>;
}

/**
 * Parse CSV content into rows
 */
export function parseCsv(
  content: string,
  options: { delimiter?: string; hasHeader?: boolean } = {},
): { headers: string[]; rows: string[][] } {
  const delimiter = options.delimiter || ",";
  const hasHeader = options.hasHeader ?? true;

  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = hasHeader ? parseRow(lines[0]) : [];
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const rows = dataLines.map(parseRow);

  return { headers, rows };
}

/**
 * Import CSV data with column mapping
 */
export function importCsv(
  content: string,
  options: CsvImportOptions,
): { imported: ImportedRow[]; errors: string[] } {
  const { headers, rows } = parseCsv(content, {
    delimiter: options.delimiter,
    hasHeader: options.hasHeader,
  });

  const imported: ImportedRow[] = [];
  const globalErrors: string[] = [];

  // Validate mapping
  for (const mapping of options.mapping) {
    if (headers.length > 0 && !headers.includes(mapping.source)) {
      globalErrors.push(`Column "${mapping.source}" not found in CSV`);
    }
  }

  if (globalErrors.length > 0) {
    return { imported, errors: globalErrors };
  }

  // Process rows
  rows.forEach((row, index) => {
    const data: Record<string, unknown> = {};
    const rowErrors: string[] = [];

    for (const mapping of options.mapping) {
      const sourceIndex = headers.indexOf(mapping.source);
      if (sourceIndex >= 0 && sourceIndex < row.length) {
        const value = row[sourceIndex];
        try {
          data[mapping.target] = mapping.transform ? mapping.transform(value) : value;
        } catch (err) {
          rowErrors.push(
            `Error transforming ${mapping.source}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    // Run custom validator
    if (options.validator) {
      rowErrors.push(...options.validator(data));
    }

    imported.push({
      index: index + 1,
      data,
      errors: rowErrors.length > 0 ? rowErrors : undefined,
    });
  });

  return { imported, errors: globalErrors };
}

/**
 * Import GeoJSON features as fields/zones
 */
export function importGeoJson(
  content: string,
  options: GeoJsonImportOptions = {},
): { features: ImportedField[]; errors: string[] } {
  const features: ImportedField[] = [];
  const errors: string[] = [];

  let geojson: unknown;
  try {
    geojson = JSON.parse(content);
  } catch (err) {
    return {
      features: [],
      errors: [`Invalid GeoJSON: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  // Handle single feature or feature collection
  const geoObj = geojson as Record<string, unknown>;
  const featureList: GeoJSON.Feature[] =
    geoObj.type === "FeatureCollection" && Array.isArray(geoObj.features)
      ? (geoObj.features as unknown as GeoJSON.Feature[])
      : [geoObj as unknown as GeoJSON.Feature];

  featureList.forEach((feature, index) => {
    if (!feature.geometry) {
      errors.push(`Feature ${index} has no geometry`);
      return;
    }

    const props = feature.properties || {};
    const idProp = options.idProperty || "id";
    const nameProp = options.nameProperty || "name";

    const rawId = props[idProp];
    const rawName = props[nameProp];
    const id =
      typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : `feature_${index}`;
    const name =
      typeof rawName === "string" || typeof rawName === "number"
        ? String(rawName)
        : `Feature ${index + 1}`;

    const mappedProps: Record<string, unknown> = {};
    if (options.propertyMappings) {
      for (const mapping of options.propertyMappings) {
        const sourceValue = props[mapping.source];
        if (sourceValue !== undefined) {
          const stringValue =
            typeof sourceValue === "string" || typeof sourceValue === "number"
              ? String(sourceValue)
              : "";
          mappedProps[mapping.target] = mapping.transform
            ? mapping.transform(stringValue)
            : sourceValue;
        }
      }
    }

    features.push({
      id,
      name,
      boundary: feature.geometry,
      properties: { ...props, ...mappedProps },
    });
  });

  return { features, errors };
}

/**
 * Convert imported fields to farm_clawed farm context format
 */
export function toFarmContextFields(
  fields: ImportedField[],
): Array<{ id: string; name: string; area_acres?: number; boundary?: GeoJSON.Geometry }> {
  return fields.map((field) => ({
    id: field.id,
    name: field.name,
    area_acres: field.area,
    boundary: field.boundary,
  }));
}

/**
 * Validate field import data
 */
export const FieldImportSchema = z.object({
  name: z.string().min(1),
  area: z.number().optional(),
  areaUnit: z.string().optional(),
});

/**
 * Common transforms for CSV import
 */
export const transforms = {
  toNumber: (v: string) => parseFloat(v) || 0,
  toInteger: (v: string) => parseInt(v, 10) || 0,
  toBoolean: (v: string) => ["true", "yes", "1"].includes(v.toLowerCase()),
  toAcres: (v: string, fromUnit: string = "ac") => {
    const value = parseFloat(v) || 0;
    const conversions: Record<string, number> = {
      ac: 1,
      acre: 1,
      acres: 1,
      ha: 2.471,
      hectare: 2.471,
      sqm: 0.000247105,
      sqft: 0.0000229568,
    };
    return value * (conversions[fromUnit.toLowerCase()] || 1);
  },
  trim: (v: string) => v.trim(),
  lowercase: (v: string) => v.toLowerCase(),
  uppercase: (v: string) => v.toUpperCase(),
};
