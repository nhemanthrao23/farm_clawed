/**
 * Farm Profile Schema Tests
 */

import { describe, it, expect } from "vitest";
import { validateFarmProfile, FarmProfileSchema } from "./farm-profile.js";

describe("FarmProfileSchema", () => {
  it("validates a complete farm profile", () => {
    const profile = {
      name: "Test Farm",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        elevation_m: 16,
        timezone: "America/Los_Angeles",
      },
      climate: {
        zone: "10a",
        avg_rainfall_mm: 500,
        frost_free_days: 300,
      },
      scale: {
        type: "garden",
        area_sqft: 1000,
        plant_count: 50,
      },
    };

    const result = validateFarmProfile(profile);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Test Farm");
      expect(result.data.location.latitude).toBe(37.7749);
    }
  });

  it("validates minimal farm profile", () => {
    const profile = {
      name: "Minimal Farm",
      location: {
        latitude: 0,
        longitude: 0,
      },
    };

    const result = validateFarmProfile(profile);
    expect(result.ok).toBe(true);
  });

  it("rejects invalid latitude", () => {
    const profile = {
      name: "Invalid Farm",
      location: {
        latitude: 100, // Invalid: must be -90 to 90
        longitude: 0,
      },
    };

    const result = validateFarmProfile(profile);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("rejects invalid scale type", () => {
    const profile = {
      name: "Invalid Farm",
      location: {
        latitude: 0,
        longitude: 0,
      },
      scale: {
        type: "invalid_type",
      },
    };

    const result = validateFarmProfile(profile as unknown);
    expect(result.ok).toBe(false);
  });

  it("accepts all valid scale types", () => {
    const scaleTypes = ["container", "garden", "small_farm", "orchard", "ranch", "commercial"];

    for (const type of scaleTypes) {
      const profile = {
        name: "Test Farm",
        location: { latitude: 0, longitude: 0 },
        scale: { type },
      };

      const result = validateFarmProfile(profile);
      expect(result.ok).toBe(true);
    }
  });
});
