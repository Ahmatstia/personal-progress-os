import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { createSessionToken, SESSION_COOKIE, secret } from "../src/lib/auth";
import { GET as getToday } from "../src/app/api/today/route";
import { DELETE as removeSession, GET as getSession } from "../src/app/api/sessions/[id]/route";
import { DELETE as removeCapture } from "../src/app/api/captures/[id]/route";
import { DELETE as removeGoal } from "../src/app/api/goals/[id]/route";
import { DELETE as removeStage } from "../src/app/api/stages/[id]/route";
import { POST as startTaskSession } from "../src/app/api/tasks/[id]/sessions/route";
import { POST as aiCommand } from "../src/app/api/ai/command/route";
import { requireUserId } from "../src/lib/ownership";

const A = "SEC_USER_A";
const B = "SEC_USER_B";
const cookie = (userId: string) => `${SESSION_COOKIE}=${createSessionToken(userId)}`;
const rawCookie = (value: string) => `${SESSION_COOKIE}=${value}`;
const request = (userId: string | null, url: string, init: RequestInit = {}) =>
  new Request(`http://localhost${url}`, { ...init, headers: { ...(init.headers ?? {}), ...(userId ? { cookie: cookie(userId) } : {}) } });
const context = (id: string) => ({ params: Promise.resolve({ id }) });

let goalA: { id: string };
let goalB: { id: string };
let stageB: { id: string };
let taskB: { id: string };
let sessionB: { id: string };
let captureB: string;
let taskA1: { id: string };
let taskA2: { id: string };

function signPayload(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

describe("PHASE 17 security boundaries", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        { id: A, email: "sec-a@example.com", name: "Sec A" },
        { id: B, email: "sec-b@example.com", name: "Sec B" },
      ],
    });
    goalA = await prisma.goal.create({ data: { userId: A, title: "Goal Sec A", type: "LEARNING" } });
    goalB = await prisma.goal.create({ data: { userId: B, title: "Goal Sec B", type: "LEARNING" } });
    const stageA1 = await prisma.stage.create({ data: { userId: A, goalId: goalA.id, name: "Stage A1" } });
    const stageA2 = await prisma.stage.create({ data: { userId: A, goalId: goalA.id, name: "Stage A2" } });
    stageB = await prisma.stage.create({ data: { userId: B, goalId: goalB.id, name: "Stage B" } });
    taskA1 = await prisma.task.create({ data: { userId: A, stageId: stageA1.id, title: "Task A1" } });
    taskA2 = await prisma.task.create({ data: { userId: A, stageId: stageA2.id, title: "Task A2" } });
    taskB = await prisma.task.create({ data: { userId: B, stageId: stageB.id, title: "Task B" } });
    sessionB = await prisma.session.create({ data: { userId: B, taskId: taskB.id, startedAt: new Date() } });
    captureB = (await prisma.capture.create({ data: { userId: B, content: "Sec B capture" } })).id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [A, B] } } });
    vi.unstubAllEnvs();
  });

  describe("session token integrity", () => {
    it("accepts a valid signed session token", async () => {
      expect((await getToday(request(A, "/api/today"))).status).toBe(200);
    });

    it("rejects a token whose user id was altered without re-signing", async () => {
      const good = createSessionToken(A);
      const payload = good.slice(0, good.lastIndexOf("."));
      const [, expires] = payload.split(".");
      const altered = `SOMEONE_ELSE.${expires}`;
      const sig = good.slice(good.lastIndexOf(".") + 1);
      expect((await getToday(new Request("http://localhost/api/today", { headers: { cookie: rawCookie(`${altered}.${sig}`) } }))).status).toBe(401);
    });

    it("rejects a token with a tampered signature", async () => {
      const good = createSessionToken(A);
      const payload = good.slice(0, good.lastIndexOf("."));
      const badSignature = `${signPayload(payload)}EXTRA_TAMPERED_SUFFIX`;
      expect((await getToday(new Request("http://localhost/api/today", { headers: { cookie: rawCookie(`${payload}.${badSignature}`) } }))).status).toBe(401);
    });

    it("rejects an expired token even when the signature is valid", async () => {
      const expired = Math.floor(Date.now() / 1000) - 60;
      const payload = `${A}.${expired}`;
      const expiredToken = `${payload}.${signPayload(payload)}`;
      expect((await getToday(new Request("http://localhost/api/today", { headers: { cookie: rawCookie(expiredToken) } }))).status).toBe(401);
    });

    it("rejects a well-signed token for an unknown user", async () => {
      const payload = `GHOST_USER.${Math.floor(Date.now() / 1000) + 600}`;
      const token = `${payload}.${signPayload(payload)}`;
      expect((await getToday(new Request("http://localhost/api/today", { headers: { cookie: rawCookie(token) } }))).status).toBe(401);
    });
  });

  describe("scoped deletes", () => {
    it("A cannot delete B session", async () => {
      expect((await removeSession(request(A, `/api/sessions/${sessionB.id}`, { method: "DELETE" }), context(sessionB.id))).status).toBe(404);
      expect(await prisma.session.findUnique({ where: { id: sessionB.id } })).not.toBeNull();
    });

    it("A cannot delete B capture", async () => {
      expect((await removeCapture(request(A, `/api/captures/${captureB}`, { method: "DELETE" }), context(captureB))).status).toBe(404);
      expect(await prisma.capture.count({ where: { id: captureB } })).toBe(1);
    });

    it("A cannot delete B goal", async () => {
      expect((await removeGoal(request(A, `/api/goals/${goalB.id}`, { method: "DELETE" }), context(goalB.id))).status).toBe(404);
      expect(await prisma.goal.findUnique({ where: { id: goalB.id } })).not.toBeNull();
    });

    it("A cannot delete B stage", async () => {
      expect((await removeStage(request(A, `/api/stages/${stageB.id}`, { method: "DELETE" }), context(stageB.id))).status).toBe(404);
      expect(await prisma.stage.findUnique({ where: { id: stageB.id } })).not.toBeNull();
    });

    it("anonymous calls receive 401 instead of 500", async () => {
      expect((await removeSession(request(null, `/api/sessions/${sessionB.id}`, { method: "DELETE" }), context(sessionB.id))).status).toBe(401);
      expect((await getSession(request(null, `/api/sessions/${sessionB.id}`), context(sessionB.id))).status).toBe(401);
    });
  });

  describe("single active session", () => {
    it("blocks a second session on another task", async () => {
      expect((await startTaskSession(request(A, `/api/tasks/${taskA1.id}/sessions`, { method: "POST", body: "{}" }), context(taskA1.id))).status).toBe(201);
      const second = await startTaskSession(request(A, `/api/tasks/${taskA2.id}/sessions`, { method: "POST", body: "{}" }), context(taskA2.id));
      expect(second.status).toBe(409);
      expect(await prisma.session.count({ where: { userId: A, endedAt: null } })).toBe(1);
    });
  });

  describe("AI write confirmation at the HTTP boundary", () => {
    it("rejects confirmed write without a server-issued token", async () => {
      const response = await aiCommand(request(A, "/api/ai/command", { method: "POST", body: JSON.stringify({ text: "selesaikan task", confirmed: true, context: { taskId: taskA1.id } }) }));
      expect(response.status).not.toBe(200);
      const task = await prisma.task.findUnique({ where: { id: taskA1.id } });
      expect(task?.status).not.toBe("COMPLETED");
    });
  });

  describe("ownership helper", () => {
    it("throws when running in production without a user context", () => {
      vi.stubEnv("NODE_ENV", "production");
      expect(() => requireUserId()).toThrow();
      vi.unstubAllEnvs();
    });

    it("falls back to a test user in test environments", () => {
      expect(requireUserId()).toBe("test-user");
    });
  });
});