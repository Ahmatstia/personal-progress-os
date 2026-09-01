import type { ConfidenceLevel } from "./intents";

export function canRead(confidenceLevel: ConfidenceLevel) {
  return confidenceLevel !== "LOW";
}

export function canWrite(confidenceLevel: ConfidenceLevel, confirmed: boolean) {
  return confidenceLevel !== "LOW" && confirmed;
}
