import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createSessionToken } from "../src/lib/auth";
import { POST as createGoal } from "../src/app/api/goals/route";
import { POST as createStage } from "../src/app/api/stages/route";
import { PATCH as patchTask, DELETE as removeTask } from "../src/app/api/tasks/[id]/route";
import { POST as startTaskSession } from "../src/app/api/tasks/[id]/sessions/route";
import { GET as getSession } from "../src/app/api/sessions/[id]/route";
import { POST as endSession } from "../src/app/api/sessions/[id]/end/route";
import { GET as getReview, PATCH as patchReview } from "../src/app/api/reviews/[id]/route";
import { GET as getGoalReviews } from "../src/app/api/goals/[id]/reviews/route";
import { GET as getToday } from "../src/app/api/today/route";
import { POST as addFocus } from "../src/app/api/today/focus/route";
import { GET as getAnalytics } from "../src/app/api/analytics/route";
import { POST as aiCommand } from "../src/app/api/ai/command/route";

const A = "HTTP_USER_A";
const B = "HTTP_USER_B";
const cookie = (userId: string) => `${"ppos_session"}=${createSessionToken(userId)}`;
const request = (userId: string | null, url: string, init: RequestInit = {}) => new Request(`http://localhost${url}`, { ...init, headers: { ...(init.headers ?? {}), ...(userId ? { cookie: cookie(userId) } : {}) } });
const context = (id: string) => ({ params: Promise.resolve({ id }) });

let goalA: { id: string };
let goalB: { id: string };
let stageA: { id: string };
let stageB: { id: string };
let taskA: { id: string };
let taskB: { id: string };
let sessionB: { id: string };
let reviewB: { id: string };

describe("Phase 15 HTTP-level two-user security", () => {
  beforeAll(async () => {
    vi.stubEnv("NODE_ENV", "production");
    await prisma.user.createMany({ data: [{ id: A, email: "http-a@example.com", name: "A" }, { id: B, email: "http-b@example.com", name: "B" }] });
    goalA = await prisma.goal.create({ data: { userId: A, name: "Goal A", type: "LEARNING" } });
    goalB = await prisma.goal.create({ data: { userId: B, name: "Goal B", type: "LEARNING" } });
    stageA = await prisma.stage.create({ data: { userId: A, goalId: goalA.id, name: "Stage A" } });
    stageB = await prisma.stage.create({ data: { userId: B, goalId: goalB.id, name: "Stage B" } });
    taskA = await prisma.task.create({ data: { userId: A, stageId: stageA.id, name: "Task A" } });
    taskB = await prisma.task.create({ data: { userId: B, stageId: stageB.id, name: "Task B" } });
    sessionB = await prisma.session.create({ data: { userId: B, taskId: taskB.id, startedAt: new Date() } });
    reviewB = await prisma.review.create({ data: { userId: B, goalId: goalB.id, periodStart: new Date("2026-09-01"), periodEnd: new Date("2026-09-07") } });
    await prisma.dailyFocus.create({ data: { userId: B, taskId: taskB.id, date: new Date("2026-09-01"), order: 0 } });
    await prisma.capture.create({ data: { userId: B, content: "B private capture" } });
  });

  afterAll(async () => { await prisma.user.deleteMany({ where: { id: { in: [A, B] } } }); vi.unstubAllEnvs(); });

  it("anonymous protected request is rejected", async () => { expect((await getToday(request(null, "/api/today"))).status).toBe(401); });
  it("invalid cookie is rejected", async () => { expect((await getToday(new Request("http://localhost/api/today", { headers: { cookie: "ppos_session=invalid" } }))).status).toBe(401); });
  it("forged cookie is rejected", async () => { expect((await getSession(request(null, `/api/sessions/${sessionB.id}`, { headers: { cookie: cookie("forged") } }), context(sessionB.id))).status).toBe(401); });
  it("A cannot update B task", async () => { expect((await patchTask(request(A, `/api/tasks/${taskB.id}`, { method: "PATCH", body: JSON.stringify({ name: "attack" }) }), context(taskB.id))).status).toBe(404); });
  it("A can update own task", async () => { expect((await patchTask(request(A, `/api/tasks/${taskA.id}`, { method: "PATCH", body: JSON.stringify({ name: "Task A updated" }) }), context(taskA.id))).status).toBe(200); });
  it("A cannot delete B task", async () => { expect((await removeTask(request(A, `/api/tasks/${taskB.id}`, { method: "DELETE" }), context(taskB.id))).status).toBe(404); });
  it("A cannot complete B task", async () => { expect((await patchTask(request(A, `/api/tasks/${taskB.id}`, { method: "PATCH", body: JSON.stringify({ status: "COMPLETED" }) }), context(taskB.id))).status).toBe(404); expect((await prisma.task.findUnique({ where: { id: taskB.id } }))?.status).toBe("NOT_STARTED"); });
  it("A cannot reopen B task", async () => { expect((await patchTask(request(A, `/api/tasks/${taskB.id}`, { method: "PATCH", body: JSON.stringify({ status: "IN_PROGRESS" }) }), context(taskB.id))).status).toBe(404); });
  it("A cannot create a stage under B goal", async () => { expect((await createStage(request(A, "/api/stages", { method: "POST", body: JSON.stringify({ goalId: goalB.id, name: "attack" }) }))).status).toBe(404); });
  it("A cannot mutate B stage", async () => { expect((await (await import("../src/app/api/stages/[id]/route")).PATCH(request(A, `/api/stages/${stageB.id}`, { method: "PATCH", body: JSON.stringify({ name: "attack" }) }), context(stageB.id))).status).toBe(404); });
  it("A cannot delete B stage", async () => { expect((await (await import("../src/app/api/stages/[id]/route")).DELETE(request(A, `/api/stages/${stageB.id}`, { method: "DELETE" }), context(stageB.id))).status).toBe(404); });
  it("A cannot reorder B stage", async () => { expect((await (await import("../src/app/api/stages/[id]/route")).PATCH(request(A, `/api/stages/${stageB.id}`, { method: "PATCH", body: JSON.stringify({ order: "up" }) }), context(stageB.id))).status).toBe(404); });
  it("A cannot access B session", async () => { expect((await getSession(request(A, `/api/sessions/${sessionB.id}`), context(sessionB.id))).status).toBe(404); });
  it("A cannot end B session", async () => { expect((await endSession(request(A, `/api/sessions/${sessionB.id}/end`, { method: "POST", body: JSON.stringify({}) }), context(sessionB.id))).status).toBe(404); });
  it("A cannot start a session on B task", async () => { expect((await startTaskSession(request(A, `/api/tasks/${taskB.id}/sessions`, { method: "POST", body: JSON.stringify({}) }), context(taskB.id))).status).toBe(404); });
  it("A cannot read B review", async () => { expect((await getReview(request(A, `/api/reviews/${reviewB.id}`), context(reviewB.id))).status).toBe(404); });
  it("A cannot update B review", async () => { expect((await patchReview(request(A, `/api/reviews/${reviewB.id}`, { method: "PATCH", body: JSON.stringify({ periodStart: "2026-09-01T00:00:00.000Z", periodEnd: "2026-09-07T00:00:00.000Z", nextFocus: "attack" }) }), context(reviewB.id))).status).toBe(404); });
  it("A cannot list B goal reviews", async () => { const response = await getGoalReviews(request(A, `/api/goals/${goalB.id}/reviews`), context(goalB.id)); expect(response.status).toBe(200); expect((await response.json()).data).toHaveLength(0); });
  it("A Today excludes B data", async () => { const body = await (await getToday(request(A, "/api/today"))).json(); expect(JSON.stringify(body)).not.toContain("Task B"); });
  it("A analytics excludes B data", async () => { const body = await (await getAnalytics(request(A, "/api/analytics"))).json(); expect(JSON.stringify(body)).not.toContain("Task B"); });
  it("A focus cannot target B task", async () => { expect((await addFocus(request(A, "/api/today/focus", { method: "POST", body: JSON.stringify({ taskId: taskB.id }) }))).status).toBe(404); });
  it("A AI search cannot return B task", async () => { const body = await (await aiCommand(request(A, "/api/ai/command", { method: "POST", body: JSON.stringify({ text: "cari task", context: { taskName: "Task B" } }) }))).json(); expect(JSON.stringify(body)).not.toContain("Task B"); });
  it("A AI cannot complete B task", async () => { const response = await aiCommand(request(A, "/api/ai/command", { method: "POST", body: JSON.stringify({ text: "selesaikan task", confirmed: true, context: { taskId: taskB.id } }) })); expect(response.status).not.toBe(200); expect((await prisma.task.findUnique({ where: { id: taskB.id } }))?.status).toBe("NOT_STARTED"); });
  it("body userId injection cannot change identity", async () => { const response = await createGoal(request(A, "/api/goals", { method: "POST", body: JSON.stringify({ userId: B, name: "Injected", type: "LEARNING" }) })); const created = await response.json(); expect(created.userId).toBe(A); });
  it("query userId injection cannot change identity", async () => { const body = await (await getAnalytics(request(A, "/api/analytics?userId=HTTP_USER_B"))).json(); expect(JSON.stringify(body)).not.toContain("Task B"); });
  it("header userId injection cannot change identity", async () => { const body = await (await getAnalytics(request(A, "/api/analytics", { headers: { userId: B } }))).json(); expect(JSON.stringify(body)).not.toContain("Task B"); });
});
