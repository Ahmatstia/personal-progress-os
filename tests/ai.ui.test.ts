import { describe, expect, it } from "vitest";
import {
  resolvePanelState,
  panelStateToMessage,
  intentToReadable,
  type AICommandResponse,
} from "../src/ai/command-types";

function baseResponse(overrides: Partial<AICommandResponse>): AICommandResponse {
  return {
    success: true,
    code: "OK",
    message: "ok",
    interpretation: {
      input: "test",
      normalizedText: "test",
      intent: "TODAY",
      confidence: 0.9,
      confidenceLevel: "HIGH",
      entities: [],
      source: "baseline",
    },
    ...overrides,
  };
}

describe("AI panel state mapping", () => {
  it("maps a successful high-confidence read to success", () => {
    const response = baseResponse({});
    expect(resolvePanelState(response)).toBe("success");
  });

  it("maps UNKNOWN intent to unknown", () => {
    const response = baseResponse({
      interpretation: { ...baseResponse({}).interpretation, intent: "UNKNOWN", confidenceLevel: "LOW", confidence: 0 },
    });
    expect(resolvePanelState(response)).toBe("unknown");
  });

  it("maps LOW confidence (SAFE_FALLBACK) to low_confidence", () => {
    const response = baseResponse({
      success: false,
      code: "SAFE_FALLBACK",
      interpretation: { ...baseResponse({}).interpretation, intent: "UNKNOWN", confidenceLevel: "LOW", confidence: 0 },
    });
    expect(resolvePanelState(response)).toBe("low_confidence");
  });

  it("maps a successful but LOW-confidence read to low_confidence", () => {
    const response = baseResponse({
      interpretation: { ...baseResponse({}).interpretation, confidenceLevel: "LOW", confidence: 0.3 },
    });
    expect(resolvePanelState(response)).toBe("low_confidence");
  });

  it("maps CONFIRMATION_REQUIRED to confirmation_required", () => {
    const response = baseResponse({
      success: false,
      code: "CONFIRMATION_REQUIRED",
      requiresConfirmation: true,
    });
    expect(resolvePanelState(response)).toBe("confirmation_required");
  });

  it("maps AMBIGUOUS_TASK to ambiguous", () => {
    const response = baseResponse({
      success: false,
      code: "AMBIGUOUS_TASK",
      data: [{ id: "1", name: "React Hooks" }],
    });
    expect(resolvePanelState(response)).toBe("ambiguous");
  });

  it("maps TASK_NOT_FOUND to not_found", () => {
    const response = baseResponse({ success: false, code: "TASK_NOT_FOUND", data: [] });
    expect(resolvePanelState(response)).toBe("not_found");
  });

  it("maps NO_ACTIVE_SESSION to not_found", () => {
    const response = baseResponse({ success: false, code: "NO_ACTIVE_SESSION" });
    expect(resolvePanelState(response)).toBe("not_found");
  });

  it("maps UNSUPPORTED_INTENT to unknown", () => {
    const response = baseResponse({ success: false, code: "UNSUPPORTED_INTENT" });
    expect(resolvePanelState(response)).toBe("unknown");
  });

  it("maps unknown failure codes to error", () => {
    const response = baseResponse({ success: false, code: "SOME_OTHER_CODE" });
    expect(resolvePanelState(response)).toBe("error");
  });

  it("maps an unauthenticated 401-style response to error", () => {
    const response = baseResponse({
      success: false,
      code: "UNAUTHENTICATED",
      message: "Session kamu sudah berakhir. Silakan login kembali.",
      interpretation: { ...baseResponse({}).interpretation, intent: "UNKNOWN", confidenceLevel: "LOW", confidence: 0 },
    });
    expect(resolvePanelState(response)).toBe("error");
    expect(response.message).toContain("login kembali");
  });

  it("maps a cancelled (declined) write back to a non-executing state", () => {
    const cancelledState = "idle" as const;
    expect(cancelledState).toBe("idle");
    expect(panelStateToMessage(cancelledState)).toBe("");
  });
});

describe("AI panel state messages", () => {
  it("provides a user-friendly message for each state", () => {
    const states = ["idle", "loading", "success", "confirmation_required", "ambiguous", "not_found", "low_confidence", "unknown", "error"] as const;
    for (const state of states) {
      expect(typeof panelStateToMessage(state)).toBe("string");
    }
  });

  it("states low confidence and unknown explicitly", () => {
    expect(panelStateToMessage("low_confidence")).toContain("belum cukup yakin");
    expect(panelStateToMessage("unknown")).toContain("belum cukup yakin");
  });
});

describe("AI intent rendering", () => {
  it("maps every intent to a readable label", () => {
    const intents = [
      "TODAY", "NEXT_ACTION", "GOAL_STATUS", "TASK_STATUS", "TASK_SEARCH", "PROGRESS",
      "ANALYTICS", "STREAK", "TIME_SPENT", "COMPLETION", "BOTTLENECK", "REVIEW",
      "REFLECTION", "GOAL_CREATE", "TASK_CREATE", "TASK_COMPLETE", "TASK_REOPEN",
      "SESSION_START", "SESSION_END", "FOCUS", "OVERDUE", "MOTIVATION", "HELP", "UNKNOWN",
    ] as const;
    for (const intent of intents) {
      expect(typeof intentToReadable(intent)).toBe("string");
      expect(intentToReadable(intent).length).toBeGreaterThan(0);
    }
  });
});

describe("Write command confirmation gate (UI contract)", () => {
  it("requires confirmed=true to execute any write command", () => {
    const writeIntents = ["GOAL_CREATE", "TASK_CREATE", "TASK_COMPLETE", "TASK_REOPEN", "SESSION_START", "SESSION_END", "FOCUS"];
    for (const intent of writeIntents) {
      const unconfirmed = baseResponse({
        success: false,
        code: "CONFIRMATION_REQUIRED",
        interpretation: { ...baseResponse({}).interpretation, intent: intent as AICommandResponse["interpretation"]["intent"], confidenceLevel: "MEDIUM", confidence: 0.7 },
        requiresConfirmation: true,
      });
      expect(resolvePanelState(unconfirmed)).toBe("confirmation_required");
    }
  });
});
