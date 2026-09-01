import { describe, expect, it } from "vitest";
import { calculateMomentum } from "../src/services/momentum.service";

const today = new Date("2026-09-07T12:00:00");
const day = (offset: number) => new Date(today.getTime() - offset * 86400000);

describe("momentum.service", () => {
  it("classifies activity today as ACTIVE", () => expect(calculateMomentum([day(0)], today).state).toBe("ACTIVE"));
  it("classifies three recent days as STEADY", () => expect(calculateMomentum([day(1), day(3), day(5)], today).state).toBe("STEADY"));
  it("classifies one recent day as LOW", () => expect(calculateMomentum([day(2)], today).state).toBe("LOW"));
  it("classifies no recent days as INACTIVE", () => expect(calculateMomentum([day(8)], today).state).toBe("INACTIVE"));
  it("returns deterministic local date metadata", () => expect(calculateMomentum([day(1)], today)).toMatchObject({ activeDays7: 1, lastActiveDate: "2026-09-06" }));
});
