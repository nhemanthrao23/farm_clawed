/**
 * Season Calendar Schema
 *
 * Seasonal patterns, planting windows, frost dates.
 */

import { z } from "zod";

export const SeasonSchema = z.object({
  start: z.string().describe("MM-DD format"),
  end: z.string().describe("MM-DD format"),
  activities: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const FrostDatesSchema = z.object({
  average_last: z.string().optional().describe("MM-DD format"),
  average_first: z.string().optional().describe("MM-DD format"),
  record_last: z.string().optional(),
  record_first: z.string().optional(),
});

export const CropCalendarSchema = z.object({
  crop: z.string(),
  sow_indoors: z.string().optional().describe("MM-DD range"),
  transplant: z.string().optional(),
  direct_sow: z.string().optional(),
  harvest: z.string().optional(),
  notes: z.string().optional(),
});

export const SeasonCalendarSchema = z.object({
  hemisphere: z.union([z.literal("northern"), z.literal("southern")]).default("northern"),
  climate_type: z.string().optional(),
  seasons: z
    .object({
      spring: SeasonSchema.optional(),
      summer: SeasonSchema.optional(),
      fall: SeasonSchema.optional(),
      winter: SeasonSchema.optional(),
    })
    .optional(),
  frost_dates: FrostDatesSchema.optional(),
  crop_calendars: z.array(CropCalendarSchema).optional(),
  custom_periods: z
    .array(
      z.object({
        name: z.string(),
        start: z.string(),
        end: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export type Season = z.infer<typeof SeasonSchema>;
export type FrostDates = z.infer<typeof FrostDatesSchema>;
export type CropCalendar = z.infer<typeof CropCalendarSchema>;
export type SeasonCalendar = z.infer<typeof SeasonCalendarSchema>;

/**
 * Validate season calendar
 */
export function validateSeasonCalendar(
  data: unknown,
): { ok: true; data: SeasonCalendar } | { ok: false; errors: string[] } {
  const result = SeasonCalendarSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/**
 * Get current season based on date and hemisphere
 */
export function getCurrentSeason(calendar: SeasonCalendar, date: Date = new Date()): string {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const mmdd = `${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

  const parseRange = (start: string, end: string): boolean => {
    return mmdd >= start && mmdd <= end;
  };

  if (calendar.hemisphere === "northern") {
    if (
      calendar.seasons?.spring &&
      parseRange(calendar.seasons.spring.start, calendar.seasons.spring.end)
    ) {
      return "spring";
    }
    if (
      calendar.seasons?.summer &&
      parseRange(calendar.seasons.summer.start, calendar.seasons.summer.end)
    ) {
      return "summer";
    }
    if (
      calendar.seasons?.fall &&
      parseRange(calendar.seasons.fall.start, calendar.seasons.fall.end)
    ) {
      return "fall";
    }
    return "winter";
  }

  // Southern hemisphere (seasons flipped)
  if (
    calendar.seasons?.spring &&
    parseRange(calendar.seasons.spring.start, calendar.seasons.spring.end)
  ) {
    return "spring";
  }
  if (
    calendar.seasons?.summer &&
    parseRange(calendar.seasons.summer.start, calendar.seasons.summer.end)
  ) {
    return "summer";
  }
  if (
    calendar.seasons?.fall &&
    parseRange(calendar.seasons.fall.start, calendar.seasons.fall.end)
  ) {
    return "fall";
  }
  return "winter";
}

/**
 * Check if date is within frost risk window
 */
export function isInFrostWindow(calendar: SeasonCalendar, date: Date = new Date()): boolean {
  if (!calendar.frost_dates?.average_first || !calendar.frost_dates?.average_last) {
    return false;
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const mmdd = `${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

  const firstFrost = calendar.frost_dates.average_first;
  const lastFrost = calendar.frost_dates.average_last;

  // In northern hemisphere: frost window is roughly Nov-Feb
  // Check if date is after first frost OR before last frost
  return mmdd >= firstFrost || mmdd <= lastFrost;
}
