import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ executeAICommand: vi.fn(async () => ({ success: true, code: "OK", message: "Aman", interpretation: { intent: "TODAY" } })) }));
vi.mock("../src/services/ai-command.service", () => ({ executeAICommand: state.executeAICommand }));

import { POST } from "../src/app/api/ai/command/route";

describe("POST /api/ai/command", () => {
  it("rejects invalid payloads", async () => {
    const response = await POST(new Request("http://localhost/api/ai/command", { method: "POST", body: "{}" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: { code: "INVALID_INPUT" } });
  });

  it("passes validated commands to the command service", async () => {
    const response = await POST(new Request("http://localhost/api/ai/command", { method: "POST", body: JSON.stringify({ text: "apa hari ini" }) }));
    expect(response.status).toBe(200);
    expect(state.executeAICommand).toHaveBeenCalledWith({ text: "apa hari ini", confirmed: false });
  });
});
