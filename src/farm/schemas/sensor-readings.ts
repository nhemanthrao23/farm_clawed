/**
 * Sensor Readings Schema
 *
 * Time-series sensor data: moisture, temperature, EC, etc.
 */

import { z } from "zod";

export const ReadingTypeSchema = z.union([
  z.literal("moisture"),
  z.literal("temperature"),
  z.literal("ec"),
  z.literal("ph"),
  z.literal("humidity"),
  z.literal("light"),
  z.literal("flow"),
  z.literal("pressure"),
  z.literal("battery"),
  z.literal("other"),
]);

export const UnitSchema = z.union([
  z.literal("percent"),
  z.literal("fahrenheit"),
  z.literal("celsius"),
  z.literal("mS/cm"),
  z.literal("pH"),
  z.literal("lux"),
  z.literal("gpm"),
  z.literal("psi"),
  z.literal("volts"),
  z.literal("other"),
]);

export const SensorReadingSchema = z.object({
  timestamp: z.string().describe("ISO 8601 timestamp"),
  sensor_id: z.string(),
  reading_type: ReadingTypeSchema,
  value: z.number(),
  unit: UnitSchema,
  battery_pct: z.number().min(0).max(100).optional(),
  quality: z.union([z.literal("good"), z.literal("suspect"), z.literal("bad")]).optional(),
  notes: z.string().optional(),
});

export const SensorReadingsListSchema = z.array(SensorReadingSchema);

export type ReadingType = z.infer<typeof ReadingTypeSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type SensorReading = z.infer<typeof SensorReadingSchema>;
export type SensorReadingsList = z.infer<typeof SensorReadingsListSchema>;

/**
 * Validate sensor readings list
 */
export function validateSensorReadings(
  data: unknown,
): { ok: true; data: SensorReadingsList } | { ok: false; errors: string[] } {
  const result = SensorReadingsListSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/**
 * Parse CSV sensor readings
 */
export function parseSensorReadingsCsv(csv: string): SensorReading[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const readings: SensorReading[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    readings.push({
      timestamp: row["timestamp"] || new Date().toISOString(),
      sensor_id: row["sensor_id"] || "",
      reading_type: (row["reading_type"] as ReadingType) || "other",
      value: parseFloat(row["value"]) || 0,
      unit: (row["unit"] as Unit) || "other",
      battery_pct: row["battery_pct"] ? parseFloat(row["battery_pct"]) : undefined,
    });
  }

  return readings;
}

/**
 * Get latest reading for a sensor
 */
export function getLatestReading(
  readings: SensorReading[],
  sensorId: string,
  type?: ReadingType,
): SensorReading | null {
  const filtered = readings
    .filter((r) => r.sensor_id === sensorId && (!type || r.reading_type === type))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return filtered[0] || null;
}

/**
 * Get readings in time range
 */
export function getReadingsInRange(
  readings: SensorReading[],
  startTime: Date,
  endTime: Date,
): SensorReading[] {
  return readings.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return t >= startTime.getTime() && t <= endTime.getTime();
  });
}

/**
 * Calculate average value for a sensor in time range
 */
export function getAverageReading(
  readings: SensorReading[],
  sensorId: string,
  type: ReadingType,
  startTime: Date,
  endTime: Date,
): number | null {
  const filtered = getReadingsInRange(readings, startTime, endTime).filter(
    (r) => r.sensor_id === sensorId && r.reading_type === type,
  );
  if (filtered.length === 0) return null;
  return filtered.reduce((sum, r) => sum + r.value, 0) / filtered.length;
}
