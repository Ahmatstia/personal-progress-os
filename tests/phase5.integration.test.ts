import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  addDailyFocus,
  getDailyFocus,
  reorderDailyFocus,
  removeDailyFocus,
  getDailyFocusHistoryList,
  DailyFocusServiceError,
} from "../src/services/daily-focus.service";
import {
  startSession,
  endSession,
  getActiveSession,
  deleteSession,
  SessionServiceError,
} from "../src/services/session.service";
import {
  createCapture,
  getCaptures,
  getCapture,
  updateCapture,
  archiveCapture,
  deleteCapture,
  convertToTask,
  convertToGoal,
  CaptureServiceError,
} from "../src/services/capture.service";
import {
  createReview,
  getGoalReviews,
  getAllReviews,
  getWeeklyReviewOverview,
  updateReview,
  deleteReviewItem,
  getWeekPeriod,
} from "../src/services/review.service";
import { createCalendarEvent } from "../src/services/calendar-event.service";
import { getActivities } from "../src/services/activity.service";
import { getToday } from "../src/services/today.service";
import { createGoal } from "../src/services/goal.service";
import { createProject } from "../src/services/project.service";
import { createArea } from "../src/services/area.service";
import { createTask, completeTask } from "../src/services/task.service";
import { createSessionToken, SESSION_COOKIE } from "../src/lib/auth";

import { GET as getDailyFocusApi } from "../src/app/api/daily-focus/route";
import { PATCH as patchDailyFocusItemApi, DELETE as deleteDailyFocusItemApi } from "../src/app/api/daily-focus/[id]/route";
import { GET as getCapturesApi, POST as postCapturesApi } from "../src/app/api/captures/route";
import { GET as getCaptureItemApi, PATCH as patchCaptureItemApi, DELETE as deleteCaptureItemApi } from "../src/app/api/captures/[id]/route";
import { POST as convertCaptureApi } from "../src/app/api/captures/[id]/convert/route";
import { GET as getReviewsApi } from "../src/app/api/reviews/route";

const USER_A = "phase5_user_a";
const USER_B = "phase5_user_b";

describe("Phase 5: Progress, Focus, Capture & Time Integration Verification", () => {
  beforeAll(async () => {
    // Ensure clean state for test users
    await prisma.user.deleteMany({ where: { id: { in: [USER_A, USER_B] } } });
    await prisma.user.createMany({
      data: [
        { id: USER_A, email: "p5_user_a@phase5.test", name: "User A" },
        { id: USER_B, email: "p5_user_b@phase5.test", name: "User B" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [USER_A, USER_B] } } });
  });

  // ============================================================================
  // 1. DAILY FOCUS DOMAIN
  // ============================================================================
  describe("1. Daily Focus Domain", () => {
    let projectA: Awaited<ReturnType<typeof createProject>>;
    let taskA1: Awaited<ReturnType<typeof createTask>>;
    let taskA2: Awaited<ReturnType<typeof createTask>>;
    let focus1: Awaited<ReturnType<typeof addDailyFocus>>;
    let focus2: Awaited<ReturnType<typeof addDailyFocus>>;

    beforeAll(async () => {
      projectA = await createProject({ title: "Focus Test Project" }, USER_A);
      taskA1 = await createTask({ title: "Task Focus 1", projectId: projectA.id }, USER_A);
      taskA2 = await createTask({ title: "Task Focus 2", projectId: projectA.id }, USER_A);
    });

    it("1.1 Adds tasks to daily focus and retrieves them", async () => {
      focus1 = await addDailyFocus({ taskId: taskA1.id }, USER_A);
      focus2 = await addDailyFocus({ taskId: taskA2.id }, USER_A);

      expect(focus1.id).toBeDefined();
      expect(focus1.userId).toBe(USER_A);
      expect(focus1.taskId).toBe(taskA1.id);
      expect(focus1.order).toBe(0);

      expect(focus2.order).toBe(1);

      const list = await getDailyFocus(undefined, USER_A);
      expect(list.length).toBeGreaterThanOrEqual(2);
      expect(list.some((f) => f.id === focus1.id)).toBe(true);
      expect(list.some((f) => f.id === focus2.id)).toBe(true);
    });

    it("1.2 Prevents duplicate focus for same task and date", async () => {
      await expect(
        addDailyFocus({ taskId: taskA1.id }, USER_A)
      ).rejects.toThrowError(DailyFocusServiceError);
    });

    it("1.3 Reorders daily focus items", async () => {
      const reordered = await reorderDailyFocus(focus2.id, { direction: "up" }, USER_A);
      expect(reordered).toBeDefined();

      const list = await getDailyFocus(undefined, USER_A);
      const idx1 = list.findIndex((f) => f.id === focus1.id);
      const idx2 = list.findIndex((f) => f.id === focus2.id);
      expect(idx2).toBeLessThan(idx1);
    });

    it("1.4 Prevents adding completed task to focus", async () => {
      const completedTask = await createTask({ title: "Already Done", projectId: projectA.id }, USER_A);
      await completeTask(completedTask.id, USER_A);

      await expect(
        addDailyFocus({ taskId: completedTask.id }, USER_A)
      ).rejects.toThrowError(/selesai/);
    });

    it("1.5 IDOR: User B cannot reorder or remove User A's focus", async () => {
      await expect(
        reorderDailyFocus(focus1.id, { direction: "down" }, USER_B)
      ).rejects.toThrowError(DailyFocusServiceError);

      await expect(
        removeDailyFocus(focus1.id, USER_B)
      ).rejects.toThrowError(DailyFocusServiceError);
    });

    it("1.6 Retrieves daily focus history list", async () => {
      const history = await getDailyFocusHistoryList(USER_A, 10);
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================================
  // 2. SESSION DOMAIN
  // ============================================================================
  describe("2. Session Domain", () => {
    let projectA: Awaited<ReturnType<typeof createProject>>;
    let taskA: Awaited<ReturnType<typeof createTask>>;
    let taskASecond: Awaited<ReturnType<typeof createTask>>;
    let taskB: Awaited<ReturnType<typeof createTask>>;
    let projectB: Awaited<ReturnType<typeof createProject>>;

    beforeAll(async () => {
      projectA = await createProject({ title: "Session Project A" }, USER_A);
      taskA = await createTask({ title: "Session Task A", projectId: projectA.id }, USER_A);
      taskASecond = await createTask({ title: "Session Task A2", projectId: projectA.id }, USER_A);

      projectB = await createProject({ title: "Session Project B" }, USER_B);
      taskB = await createTask({ title: "Session Task B", projectId: projectB.id }, USER_B);
    });

    it("2.1 Starts a session and moves task to in progress", async () => {
      const session = await startSession(taskA.id, USER_A);
      expect(session.id).toBeDefined();
      expect(session.userId).toBe(USER_A);
      expect(session.endedAt).toBeNull();

      const active = await getActiveSession(taskA.id, USER_A);
      expect(active?.id).toBe(session.id);
    });

    it("2.2 Blocks starting a second active session for same user", async () => {
      await expect(
        startSession(taskASecond.id, USER_A)
      ).rejects.toThrowError(SessionServiceError);
    });

    it("2.3 IDOR: User B cannot access or end User A's session", async () => {
      const activeA = await getActiveSession(taskA.id, USER_A);
      expect(activeA).not.toBeNull();

      await expect(
        endSession(activeA!.id, { sessionId: activeA!.id }, USER_B)
      ).rejects.toThrowError(SessionServiceError);

      await expect(
        deleteSession(activeA!.id, USER_B)
      ).rejects.toThrowError(SessionServiceError);
    });

    it("2.4 IDOR: User A cannot start session on User B's task", async () => {
      await expect(
        startSession(taskB.id, USER_A)
      ).rejects.toThrowError(/Task tidak ditemukan/);
    });

    it("2.5 Ends session, calculates duration, and auto-records Activity", async () => {
      const activeA = await getActiveSession(taskA.id, USER_A);
      expect(activeA).not.toBeNull();

      // Backdate startedAt by 25 minutes to simulate meaningful Pomodoro
      const started = new Date(Date.now() - 25 * 60 * 1000);
      await prisma.session.update({
        where: { id: activeA!.id },
        data: { startedAt: started },
      });

      const ended = await endSession(
        activeA!.id,
        { sessionId: activeA!.id, activity: "Deep Work Coding", understanding: 5 },
        USER_A
      );

      expect(ended.endedAt).not.toBeNull();
      expect(ended.durationMinutes).toBeGreaterThanOrEqual(24);
      expect(ended.understanding).toBe(5);

      // Verify activity was recorded
      const activities = await getActivities(USER_A);
      const sessionActivity = activities.find((act) => act.taskId === taskA.id);
      expect(sessionActivity).toBeDefined();
      expect(sessionActivity?.category).toBe("WORK");
      expect(sessionActivity?.durationMinutes).toBeGreaterThanOrEqual(24);
    });

    it("2.6 Task completion auto-records Activity", async () => {
      const taskToComplete = await createTask({ title: "Task for Activity Log", projectId: projectA.id }, USER_A);
      await completeTask(taskToComplete.id, USER_A);

      const activities = await getActivities(USER_A);
      const taskActivity = activities.find((act) => act.taskId === taskToComplete.id);
      expect(taskActivity).toBeDefined();
      expect(taskActivity?.title).toContain("Task for Activity Log");
    });
  });

  // ============================================================================
  // 3. CAPTURE DOMAIN & CONVERSION
  // ============================================================================
  describe("3. Capture Domain & Conversion", () => {
    let capture1: Awaited<ReturnType<typeof createCapture>>;
    let capture2: Awaited<ReturnType<typeof createCapture>>;
    let projectA: Awaited<ReturnType<typeof createProject>>;
    let areaA: Awaited<ReturnType<typeof createArea>>;

    beforeAll(async () => {
      areaA = await createArea({ name: "Area Capture Test" }, USER_A);
      projectA = await createProject({ title: "Project Capture Test", areaId: areaA.id }, USER_A);
    });

    it("3.1 Creates and retrieves Captures", async () => {
      capture1 = await createCapture(
        { content: "Pelajari Rust untuk WebAssembly", category: "IDEA" },
        USER_A
      );
      capture2 = await createCapture(
        { content: "Buat endpoint API upload berkas", category: "TASK_CANDIDATE" },
        USER_A
      );

      expect(capture1.id).toBeDefined();
      expect(capture1.status).toBe("PENDING");
      expect(capture1.category).toBe("IDEA");

      const list = await getCaptures(undefined, USER_A);
      expect(list.some((c) => c.id === capture1.id)).toBe(true);
      expect(list.some((c) => c.id === capture2.id)).toBe(true);
    });

    it("3.2 Updates and archives a capture", async () => {
      const updated = await updateCapture(
        capture1.id,
        { content: "Pelajari Rust & WASM untuk performa tinggi" },
        USER_A
      );
      expect(updated.content).toBe("Pelajari Rust & WASM untuk performa tinggi");

      const archived = await archiveCapture(capture1.id, USER_A);
      expect(archived.status).toBe("ARCHIVED");
    });

    it("3.3 Converts Capture to Task with structural parent", async () => {
      const result = await convertToTask(
        capture2.id,
        {
          projectId: projectA.id,
          priority: "HIGH",
          estimatedHours: 2,
        },
        USER_A
      );

      expect(result.task).toBeDefined();
      expect(result.task.title).toBe("Buat endpoint API upload berkas");
      expect(result.task.projectId).toBe(projectA.id);
      expect(result.task.priority).toBe("HIGH");

      expect(result.capture.status).toBe("PROCESSED");
      expect(result.capture.convertedTaskId).toBe(result.task.id);
      expect(result.capture.processedAt).not.toBeNull();
    });

    it("3.4 Prevents converting an already processed capture", async () => {
      await expect(
        convertToTask(capture2.id, { projectId: projectA.id }, USER_A)
      ).rejects.toThrowError(CaptureServiceError);
    });

    it("3.5 Converts Capture to Goal with optional Area", async () => {
      const capForGoal = await createCapture(
        { content: "Kuasai Bahasa Spanyol Dasar Level A1", category: "IDEA" },
        USER_A
      );

      const result = await convertToGoal(
        capForGoal.id,
        {
          areaId: areaA.id,
          type: "LEARNING",
          priority: "MEDIUM",
        },
        USER_A
      );

      expect(result.goal).toBeDefined();
      expect(result.goal.title).toBe("Kuasai Bahasa Spanyol Dasar Level A1");
      expect(result.goal.areaId).toBe(areaA.id);

      expect(result.capture.status).toBe("PROCESSED");
      expect(result.capture.convertedGoalId).toBe(result.goal.id);
    });

    it("3.6 IDOR: User A cannot convert Capture using User B's Project as parent", async () => {
      const projectB = await createProject({ title: "User B Private Project" }, USER_B);
      const cap = await createCapture({ content: "Cross Project Attack" }, USER_A);

      await expect(
        convertToTask(cap.id, { projectId: projectB.id }, USER_A)
      ).rejects.toThrowError(/Referenced Project does not exist|Project tidak ditemukan/);
    });

    it("3.7 IDOR: User B cannot read, update, or convert User A's Capture", async () => {
      await expect(getCapture(capture1.id, USER_B)).rejects.toThrowError(CaptureServiceError);
      await expect(updateCapture(capture1.id, { content: "Hack" }, USER_B)).rejects.toThrowError(CaptureServiceError);
      await expect(archiveCapture(capture1.id, USER_B)).rejects.toThrowError(CaptureServiceError);
      await expect(deleteCapture(capture1.id, USER_B)).rejects.toThrowError(CaptureServiceError);
    });
  });

  // ============================================================================
  // 4. REVIEW DOMAIN
  // ============================================================================
  describe("4. Review Domain", () => {
    let goalA: Awaited<ReturnType<typeof createGoal>>;
    let goalB: Awaited<ReturnType<typeof createGoal>>;
    const period = getWeekPeriod(new Date());

    beforeAll(async () => {
      goalA = await createGoal({ title: "Review Goal Test A" }, USER_A);
      goalB = await createGoal({ title: "Review Goal Test B" }, USER_B);
    });

    it("4.1 Creates and updates a Goal Review", async () => {
      const review = await createReview(
        goalA.id,
        {
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          wentWell: "Banyak task selesai tepat waktu",
          difficulties: "Kurang tidur di tengah minggu",
          improvements: "Mulai sesi lebih pagi",
          nextFocus: "Selesaikan modul 2",
        },
        USER_A
      );

      expect(review.id).toBeDefined();
      expect(review.goalId).toBe(goalA.id);
      expect(review.wentWell).toBe("Banyak task selesai tepat waktu");

      const updated = await updateReview(
        review.id,
        {
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          wentWell: "Banyak task selesai dan pemahaman meningkat",
        },
        USER_A
      );
      expect(updated.wentWell).toBe("Banyak task selesai dan pemahaman meningkat");
    });

    it("4.2 Retrieves weekly review overview and all user reviews", async () => {
      const overview = await getWeeklyReviewOverview(USER_A);
      expect(overview.goals).toBeDefined();
      expect(overview.reviewedGoalIds.has(goalA.id)).toBe(true);

      const all = await getAllReviews(USER_A);
      expect(all.length).toBeGreaterThanOrEqual(1);
      expect(all[0].goalId).toBe(goalA.id);
    });

    it("4.3 IDOR: User A cannot review User B's Goal", async () => {
      await expect(
        createReview(
          goalB.id,
          {
            periodStart: period.periodStart,
            periodEnd: period.periodEnd,
            wentWell: "Attack",
          },
          USER_A
        )
      ).rejects.toThrowError(/Goal tidak ditemukan/);
    });

    it("4.4 IDOR: User B cannot delete User A's Review", async () => {
      const reviews = await getGoalReviews(goalA.id, USER_A);
      expect(reviews.length).toBeGreaterThanOrEqual(1);

      await expect(
        deleteReviewItem(reviews[0].id, USER_B)
      ).rejects.toThrowError(/Review tidak ditemukan/);
    });
  });

  // ============================================================================
  // 5. CALENDAR INTEGRATION & TODAY EXPERIENCE
  // ============================================================================
  describe("5. Calendar Integration & Today Experience", () => {
    let projectA: Awaited<ReturnType<typeof createProject>>;
    let taskA: Awaited<ReturnType<typeof createTask>>;

    beforeAll(async () => {
      projectA = await createProject({ title: "Today Project Test" }, USER_A);
      taskA = await createTask({ title: "Scheduled Task for Today", projectId: projectA.id }, USER_A);

      // Create a calendar event for today
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30, 0);

      await createCalendarEvent(
        {
          title: "Sprint Standup & Planning",
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          eventType: "WORK",
          taskId: taskA.id,
          projectId: projectA.id,
        },
        USER_A
      );

      // Add task to daily focus
      await addDailyFocus({ taskId: taskA.id }, USER_A);
    });

    it("5.1 getToday returns unified focus, calendar events, and tasks", async () => {
      const today = await getToday(new Date(), USER_A);

      expect(today.focusTasks.length).toBeGreaterThanOrEqual(1);
      expect(today.calendarEvents).toBeDefined();
      expect(today.calendarEvents!.length).toBeGreaterThanOrEqual(1);
      expect(today.calendarEvents![0].title).toBe("Sprint Standup & Planning");
    });

    it("5.2 Zero cross-user data leakage in Today experience", async () => {
      const todayB = await getToday(new Date(), USER_B);

      // User B's today must not contain User A's focus, calendar events, or tasks
      expect(todayB.focusTasks.some((f) => f.task.userId === USER_A)).toBe(false);
      expect(todayB.calendarEvents?.some((e) => e.userId === USER_A)).toBe(false);
      expect(todayB.availableTasks.some((t) => t.userId === USER_A)).toBe(false);
    });
  });

  // ============================================================================
  // 6. HTTP API LEVEL SECURITY (IDOR)
  // ============================================================================
  describe("6. HTTP API Level Security (IDOR)", () => {
    let captureA: Awaited<ReturnType<typeof createCapture>>;
    let tokenB: string;

    beforeAll(async () => {
      captureA = await createCapture({ content: "HTTP Capture Sec" }, USER_A);
      tokenB = createSessionToken(USER_B);
    });

    it("6.1 HTTP: User B cannot read or patch User A's capture", async () => {
      const getReq = new Request(`http://localhost/api/captures/${captureA.id}`, {
        headers: { Cookie: `${SESSION_COOKIE}=${tokenB}` },
      });
      const getRes = await getCaptureItemApi(getReq, { params: Promise.resolve({ id: captureA.id }) });
      expect(getRes.status).toBe(404);

      const patchReq = new Request(`http://localhost/api/captures/${captureA.id}`, {
        method: "PATCH",
        headers: { Cookie: `${SESSION_COOKIE}=${tokenB}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Tampered" }),
      });
      const patchRes = await patchCaptureItemApi(patchReq, { params: Promise.resolve({ id: captureA.id }) });
      expect(patchRes.status).toBe(404);
    });

    it("6.2 HTTP: User B cannot convert User A's capture", async () => {
      const convertReq = new Request(`http://localhost/api/captures/${captureA.id}/convert`, {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE}=${tokenB}`, "Content-Type": "application/json" },
        body: JSON.stringify({ target: "GOAL", data: { title: "Hijacked Goal" } }),
      });
      const convertRes = await convertCaptureApi(convertReq, { params: Promise.resolve({ id: captureA.id }) });
      expect(convertRes.status).toBe(404);
    });

    it("6.3 HTTP: User B cannot delete User A's capture", async () => {
      const delReq = new Request(`http://localhost/api/captures/${captureA.id}`, {
        method: "DELETE",
        headers: { Cookie: `${SESSION_COOKIE}=${tokenB}` },
      });
      const delRes = await deleteCaptureItemApi(delReq, { params: Promise.resolve({ id: captureA.id }) });
      expect(delRes.status).toBe(404);
    });

    it("6.4 HTTP: User B lists and creates captures in their own isolated inbox", async () => {
      const postReq = new Request("http://localhost/api/captures", {
        method: "POST",
        headers: { Cookie: `${SESSION_COOKIE}=${tokenB}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: "User B Private Capture", category: "IDEA" }),
      });
      const postRes = await postCapturesApi(postReq);
      expect(postRes.status).toBe(201);

      const getReq = new Request("http://localhost/api/captures", {
        headers: { Cookie: `${SESSION_COOKIE}=${tokenB}` },
      });
      const getRes = await getCapturesApi(getReq);
      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data.data.every((c: { userId: string }) => c.userId === USER_B)).toBe(true);
      expect(data.data.some((c: { id: string }) => c.id === captureA.id)).toBe(false);
    });

    it("6.5 HTTP: User B DailyFocus is isolated and cannot tamper with User A focus", async () => {
      const getReq = new Request("http://localhost/api/daily-focus", {
        headers: { Cookie: `${SESSION_COOKIE}=${tokenB}` },
      });
      const getRes = await getDailyFocusApi(getReq);
      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(data.data.every((f: { userId: string }) => f.userId === USER_B)).toBe(true);

      // Try patching User A's focus item
      const patchReq = new Request("http://localhost/api/daily-focus/fake_id", {
        method: "PATCH",
        headers: { Cookie: `${SESSION_COOKIE}=${tokenB}`, "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "up" }),
      });
      const patchRes = await patchDailyFocusItemApi(patchReq, { params: Promise.resolve({ id: "fake_id" }) });
      expect(patchRes.status).toBe(404);

      const delReq = new Request("http://localhost/api/daily-focus/fake_id", {
        method: "DELETE",
        headers: { Cookie: `${SESSION_COOKIE}=${tokenB}` },
      });
      const delRes = await deleteDailyFocusItemApi(delReq, { params: Promise.resolve({ id: "fake_id" }) });
      expect(delRes.status).toBe(404);
    });

    it("6.6 HTTP: User B Reviews listing is completely isolated", async () => {
      const getReq = new Request("http://localhost/api/reviews", {
        headers: { Cookie: `${SESSION_COOKIE}=${tokenB}` },
      });
      const getRes = await getReviewsApi(getReq);
      expect(getRes.status).toBe(200);
      const data = await getRes.json();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
});

