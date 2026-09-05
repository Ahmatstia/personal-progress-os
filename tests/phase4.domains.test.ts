import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createArea, getArea, updateArea, archiveArea, deleteArea, AreaServiceError } from "../src/services/area.service";
import { createProject, getProject, updateProject, archiveProject, deleteProject } from "../src/services/project.service";
import { createMilestone, getMilestone, getMilestonesByProject, updateMilestone, deleteMilestone } from "../src/services/milestone.service";
import { createObjective, getObjective, updateObjective, deleteObjective } from "../src/services/objective.service";
import { getUserPreference, updateUserPreference } from "../src/services/user-preference.service";
import { createCalendarEvent, getCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "../src/services/calendar-event.service";
import { createActivity, getActivity, updateActivity, deleteActivity } from "../src/services/activity.service";
import { createGoal } from "../src/services/goal.service";
import { createTask } from "../src/services/task.service";
import { createSessionToken } from "../src/lib/auth";

// API Route Handlers for HTTP-level IDOR validation
import { GET as getAreaApi, PATCH as patchAreaApi, DELETE as deleteAreaApi } from "../src/app/api/areas/[id]/route";
import { GET as getProjectApi, PATCH as patchProjectApi, DELETE as deleteProjectApi } from "../src/app/api/projects/[id]/route";
import { GET as getMilestoneApi, PATCH as patchMilestoneApi, DELETE as deleteMilestoneApi } from "../src/app/api/milestones/[id]/route";
import { GET as getObjectiveApi, PATCH as patchObjectiveApi, DELETE as deleteObjectiveApi } from "../src/app/api/objectives/[id]/route";
import { GET as getPreferencesApi } from "../src/app/api/preferences/route";
import { GET as getCalendarEventApi, PATCH as patchCalendarEventApi, DELETE as deleteCalendarEventApi } from "../src/app/api/calendar-events/[id]/route";
import { GET as getActivityApi, PATCH as patchActivityApi, DELETE as deleteActivityApi } from "../src/app/api/activities/[id]/route";

const USER_A = "phase4_user_a";
const USER_B = "phase4_user_b";

const cookie = (userId: string) => `ppos_session=${createSessionToken(userId)}`;
const req = (userId: string | null, url: string, init: RequestInit = {}) =>
  new Request(`http://localhost${url}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(userId ? { cookie: cookie(userId) } : {}),
    },
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("Phase 4: Domain & Feature Implementation Verification", () => {
  beforeAll(async () => {
    // Ensure clean state for test users
    await prisma.user.deleteMany({ where: { id: { in: [USER_A, USER_B] } } });
    await prisma.user.createMany({
      data: [
        { id: USER_A, email: "user_a@phase4.test", name: "User A" },
        { id: USER_B, email: "user_b@phase4.test", name: "User B" },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [USER_A, USER_B] } } });
  });

  // ============================================================================
  // 1. AREA DOMAIN
  // ============================================================================
  describe("1. Area Domain", () => {
    let areaA: Awaited<ReturnType<typeof createArea>>;

    it("1.1 Creates and retrieves Area for User A", async () => {
      areaA = await createArea(
        { name: "Karier & Kerja", description: "Pilar karier", color: "#6366f1" },
        USER_A
      );
      expect(areaA.id).toBeDefined();
      expect(areaA.name).toBe("Karier & Kerja");
      expect(areaA.userId).toBe(USER_A);
      expect(areaA.isActive).toBe(true);

      const fetched = await getArea(areaA.id, USER_A);
      expect(fetched.id).toBe(areaA.id);
      expect(fetched.name).toBe("Karier & Kerja");
    });

    it("1.2 Prevents duplicate Area name for same user", async () => {
      await expect(
        createArea({ name: "Karier & Kerja" }, USER_A)
      ).rejects.toThrowError(AreaServiceError);
    });

    it("1.3 Allows same Area name for a different user", async () => {
      const areaB = await createArea({ name: "Karier & Kerja" }, USER_B);
      expect(areaB.userId).toBe(USER_B);
    });

    it("1.4 Updates and archives Area", async () => {
      const updated = await updateArea(areaA.id, { description: "Pilar karier updated" }, USER_A);
      expect(updated?.description).toBe("Pilar karier updated");

      const archived = await archiveArea(areaA.id, USER_A);
      expect(archived?.isActive).toBe(false);

      // Re-activate for further tests
      await updateArea(areaA.id, { isActive: true }, USER_A);
    });

    it("1.5 IDOR: User B cannot read, update, or delete User A's Area", async () => {
      await expect(getArea(areaA.id, USER_B)).rejects.toThrowError("Area tidak ditemukan.");
      await expect(updateArea(areaA.id, { name: "Attack" }, USER_B)).rejects.toThrowError("Area tidak ditemukan.");
      await expect(deleteArea(areaA.id, USER_B)).rejects.toThrowError("Area tidak ditemukan.");
    });

    it("1.6 Area with Goals cannot be deleted (Restrict constraint)", async () => {
      const goal = await createGoal({ title: "Goal under Area", areaId: areaA.id }, USER_A);
      await expect(deleteArea(areaA.id, USER_A)).rejects.toThrowError(/masih memiliki 1 goal/);

      // Clean up goal
      await prisma.goal.delete({ where: { id: goal.id } });
    });
  });

  // ============================================================================
  // 2. PROJECT DOMAIN
  // ============================================================================
  describe("2. Project Domain", () => {
    let projectA: Awaited<ReturnType<typeof createProject>>;
    let goalA: Awaited<ReturnType<typeof createGoal>>;
    let areaA: Awaited<ReturnType<typeof createArea>>;

    beforeAll(async () => {
      areaA = await createArea({ name: "Teknologi" }, USER_A);
      goalA = await createGoal({ title: "Belajar Cloud Architecture" }, USER_A);
    });

    it("2.1 Creates Project linked to Goal and Area", async () => {
      projectA = await createProject(
        {
          title: "Sertifikasi GCP",
          description: "Persiapan ujian sertifikasi",
          goalId: goalA.id,
          areaId: areaA.id,
          priority: "HIGH",
          status: "ACTIVE",
        },
        USER_A
      );

      expect(projectA.id).toBeDefined();
      expect(projectA.title).toBe("Sertifikasi GCP");
      expect(projectA.goalId).toBe(goalA.id);
      expect(projectA.areaId).toBe(areaA.id);
    });

    it("2.2 IDOR: User A cannot link Project to User B's Goal or Area", async () => {
      const goalB = await createGoal({ title: "Goal B" }, USER_B);
      const areaB = await createArea({ name: "Area B" }, USER_B);

      await expect(
        createProject({ title: "Cross-User Goal Project", goalId: goalB.id }, USER_A)
      ).rejects.toThrowError(/Goal tidak ditemukan/);

      await expect(
        createProject({ title: "Cross-User Area Project", areaId: areaB.id }, USER_A)
      ).rejects.toThrowError(/Area tidak ditemukan/);
    });

    it("2.3 Updates and archives Project", async () => {
      const updated = await updateProject(projectA.id, { priority: "URGENT" }, USER_A);
      expect(updated?.priority).toBe("URGENT");

      const archived = await archiveProject(projectA.id, USER_A);
      expect(archived?.status).toBe("ARCHIVED");

      await updateProject(projectA.id, { status: "ACTIVE" }, USER_A);
    });

    it("2.4 IDOR: User B cannot read, update, or delete User A's Project", async () => {
      await expect(getProject(projectA.id, USER_B)).rejects.toThrowError("Project tidak ditemukan.");
      await expect(updateProject(projectA.id, { title: "Attack" }, USER_B)).rejects.toThrowError("Project tidak ditemukan.");
      await expect(deleteProject(projectA.id, USER_B)).rejects.toThrowError("Project tidak ditemukan.");
    });
  });

  // ============================================================================
  // 3. MILESTONE DOMAIN
  // ============================================================================
  describe("3. Milestone Domain", () => {
    let projectA: Awaited<ReturnType<typeof createProject>>;
    let milestoneA: Awaited<ReturnType<typeof createMilestone>>;

    beforeAll(async () => {
      projectA = await createProject({ title: "Project Milestones Test" }, USER_A);
    });

    it("3.1 Creates Milestone under Project", async () => {
      milestoneA = await createMilestone(
        {
          projectId: projectA.id,
          title: "M1: Lab Praktik 1 Selesai",
          order: 1,
        },
        USER_A
      );

      expect(milestoneA.id).toBeDefined();
      expect(milestoneA.projectId).toBe(projectA.id);
      expect(milestoneA.status).toBe("PENDING");
    });

    it("3.2 IDOR: User A cannot create Milestone under User B's Project", async () => {
      const projectB = await createProject({ title: "Project B" }, USER_B);
      await expect(
        createMilestone({ projectId: projectB.id, title: "Attack Milestone" }, USER_A)
      ).rejects.toThrowError(/Project tidak ditemukan/);
    });

    it("3.3 Updates and retrieves Milestones by Project", async () => {
      const updated = await updateMilestone(milestoneA.id, { status: "COMPLETED" }, USER_A);
      expect(updated?.status).toBe("COMPLETED");

      const list = await getMilestonesByProject(projectA.id, USER_A);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(milestoneA.id);
    });

    it("3.4 IDOR: User B cannot read, update, or delete User A's Milestone", async () => {
      await expect(getMilestone(milestoneA.id, USER_B)).rejects.toThrowError("Milestone tidak ditemukan.");
      await expect(updateMilestone(milestoneA.id, { title: "Attack" }, USER_B)).rejects.toThrowError("Milestone tidak ditemukan.");
      await expect(deleteMilestone(milestoneA.id, USER_B)).rejects.toThrowError("Milestone tidak ditemukan.");
    });

    it("3.5 Deleting Milestone sets Task.milestoneId to null (SetNull)", async () => {
      const task = await createTask(
        {
          title: "Task with Milestone",
          projectId: projectA.id,
          milestoneId: milestoneA.id,
        },
        USER_A
      );
      expect(task.milestoneId).toBe(milestoneA.id);

      await deleteMilestone(milestoneA.id, USER_A);

      const refreshedTask = await prisma.task.findUnique({ where: { id: task.id } });
      expect(refreshedTask?.milestoneId).toBeNull();
      expect(refreshedTask?.projectId).toBe(projectA.id); // Parent project remains!
    });
  });

  // ============================================================================
  // 4. OBJECTIVE DOMAIN
  // ============================================================================
  describe("4. Objective Domain", () => {
    let goalA: Awaited<ReturnType<typeof createGoal>>;
    let objectiveA: Awaited<ReturnType<typeof createObjective>>;

    beforeAll(async () => {
      goalA = await createGoal({ title: "Kebugaran & Kesehatan" }, USER_A);
    });

    it("4.1 Creates Objective under Goal", async () => {
      objectiveA = await createObjective(
        {
          goalId: goalA.id,
          title: "Lari 100km dalam sebulan",
          targetValue: 100,
          currentValue: 0,
          unit: "km",
        },
        USER_A
      );

      expect(objectiveA.id).toBeDefined();
      expect(objectiveA.goalId).toBe(goalA.id);
      expect(objectiveA.status).toBe("ACTIVE");
    });

    it("4.2 IDOR: User A cannot create Objective under User B's Goal", async () => {
      const goalB = await createGoal({ title: "Goal B Private" }, USER_B);
      await expect(
        createObjective({ goalId: goalB.id, title: "Attack Objective" }, USER_A)
      ).rejects.toThrowError(/Goal tidak ditemukan/);
    });

    it("4.3 Auto-completes Objective when currentValue reaches targetValue", async () => {
      const updated = await updateObjective(objectiveA.id, { currentValue: 100 }, USER_A);
      expect(updated?.currentValue).toBe(100);
      expect(updated?.status).toBe("COMPLETED");
      expect(updated?.completedAt).not.toBeNull();
    });

    it("4.4 IDOR: User B cannot read, update, or delete User A's Objective", async () => {
      await expect(getObjective(objectiveA.id, USER_B)).rejects.toThrowError("Objective tidak ditemukan.");
      await expect(updateObjective(objectiveA.id, { title: "Attack" }, USER_B)).rejects.toThrowError("Objective tidak ditemukan.");
      await expect(deleteObjective(objectiveA.id, USER_B)).rejects.toThrowError("Objective tidak ditemukan.");
    });
  });

  // ============================================================================
  // 5. USER PREFERENCE DOMAIN
  // ============================================================================
  describe("5. UserPreference Domain", () => {
    it("5.1 Lazy-initializes defaults for User A", async () => {
      const pref = await getUserPreference(USER_A);
      expect(pref.userId).toBe(USER_A);
      expect(pref.theme).toBe("SYSTEM");
      expect(pref.weekStartDay).toBe(1);
      expect(pref.dailyFocusLimit).toBe(5);
    });

    it("5.2 Updates UserPreference with approved Theme values", async () => {
      const darkPref = await updateUserPreference({ theme: "DARK", dailyFocusLimit: 7 }, USER_A);
      expect(darkPref.theme).toBe("DARK");
      expect(darkPref.dailyFocusLimit).toBe(7);

      const lightPref = await updateUserPreference({ theme: "LIGHT" }, USER_A);
      expect(lightPref.theme).toBe("LIGHT");
    });

    it("5.3 User B gets their own isolated preferences", async () => {
      const prefB = await getUserPreference(USER_B);
      expect(prefB.userId).toBe(USER_B);
      expect(prefB.theme).toBe("SYSTEM"); // Untouched by User A's changes
    });
  });

  // ============================================================================
  // 6. CALENDAR EVENT DOMAIN
  // ============================================================================
  describe("6. CalendarEvent Domain", () => {
    let eventA: Awaited<ReturnType<typeof createCalendarEvent>>;

    it("6.1 Creates and retrieves CalendarEvent", async () => {
      const start = new Date("2026-10-01T09:00:00Z");
      const end = new Date("2026-10-01T10:30:00Z");
      eventA = await createCalendarEvent(
        {
          title: "Sprint Planning",
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          eventType: "WORK",
          location: "Zoom",
        },
        USER_A
      );

      expect(eventA.id).toBeDefined();
      expect(eventA.title).toBe("Sprint Planning");
      expect(eventA.eventType).toBe("WORK");
    });

    it("6.2 Rejects CalendarEvent where endTime precedes startTime", async () => {
      await expect(
        createCalendarEvent(
          {
            title: "Invalid Event",
            startTime: "2026-10-01T11:00:00Z",
            endTime: "2026-10-01T10:00:00Z",
          },
          USER_A
        )
      ).rejects.toThrowError();
    });

    it("6.3 IDOR: User A cannot link CalendarEvent to User B's Project", async () => {
      const projectB = await createProject({ title: "B Project" }, USER_B);
      await expect(
        createCalendarEvent(
          {
            title: "Link Attack",
            startTime: "2026-10-01T09:00:00Z",
            endTime: "2026-10-01T10:00:00Z",
            projectId: projectB.id,
          },
          USER_A
        )
      ).rejects.toThrowError(/Project tidak ditemukan/);
    });

    it("6.4 IDOR: User B cannot read, update, or delete User A's CalendarEvent", async () => {
      await expect(getCalendarEvent(eventA.id, USER_B)).rejects.toThrowError("Calendar event tidak ditemukan.");
      await expect(updateCalendarEvent(eventA.id, { title: "Attack" }, USER_B)).rejects.toThrowError("Calendar event tidak ditemukan.");
      await expect(deleteCalendarEvent(eventA.id, USER_B)).rejects.toThrowError("Calendar event tidak ditemukan.");
    });
  });

  // ============================================================================
  // 7. ACTIVITY DOMAIN
  // ============================================================================
  describe("7. Activity Domain", () => {
    let activityA: Awaited<ReturnType<typeof createActivity>>;

    it("7.1 Creates Activity with auto-calculated duration", async () => {
      const start = new Date("2026-10-01T14:00:00Z");
      const end = new Date("2026-10-01T15:30:00Z"); // 90 minutes
      activityA = await createActivity(
        {
          title: "Deep Work Coding",
          category: "WORK",
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          productivityRating: 5,
          energyLevel: 4,
        },
        USER_A
      );

      expect(activityA.id).toBeDefined();
      expect(activityA.durationMinutes).toBe(90);
      expect(activityA.productivityRating).toBe(5);
    });

    it("7.2 Rejects Activity where endTime precedes startTime", async () => {
      await expect(
        createActivity(
          {
            title: "Invalid Activity",
            startTime: "2026-10-01T15:00:00Z",
            endTime: "2026-10-01T14:00:00Z",
          },
          USER_A
        )
      ).rejects.toThrowError();
    });

    it("7.3 IDOR: User A cannot link Activity to User B's Area", async () => {
      const areaB = await createArea({ name: "Area B Private" }, USER_B);
      await expect(
        createActivity(
          {
            title: "Link Attack",
            startTime: "2026-10-01T14:00:00Z",
            endTime: "2026-10-01T15:00:00Z",
            areaId: areaB.id,
          },
          USER_A
        )
      ).rejects.toThrowError(/Area tidak ditemukan/);
    });

    it("7.4 IDOR: User B cannot read, update, or delete User A's Activity", async () => {
      await expect(getActivity(activityA.id, USER_B)).rejects.toThrowError("Aktivitas tidak ditemukan.");
      await expect(updateActivity(activityA.id, { title: "Attack" }, USER_B)).rejects.toThrowError("Aktivitas tidak ditemukan.");
      await expect(deleteActivity(activityA.id, USER_B)).rejects.toThrowError("Aktivitas tidak ditemukan.");
    });
  });

  // ============================================================================
  // 8. HTTP API LEVEL SECURITY (IDOR)
  // ============================================================================
  describe("8. HTTP API Level Security (IDOR)", () => {
    let areaA: Awaited<ReturnType<typeof createArea>>;
    let projectA: Awaited<ReturnType<typeof createProject>>;
    let milestoneA: Awaited<ReturnType<typeof createMilestone>>;
    let goalA: Awaited<ReturnType<typeof createGoal>>;
    let objectiveA: Awaited<ReturnType<typeof createObjective>>;
    let eventA: Awaited<ReturnType<typeof createCalendarEvent>>;
    let activityA: Awaited<ReturnType<typeof createActivity>>;

    beforeAll(async () => {
      areaA = await createArea({ name: "HTTP Sec Area" }, USER_A);
      goalA = await createGoal({ title: "HTTP Sec Goal" }, USER_A);
      projectA = await createProject({ title: "HTTP Sec Project" }, USER_A);
      milestoneA = await createMilestone({ projectId: projectA.id, title: "HTTP Sec Milestone" }, USER_A);
      objectiveA = await createObjective({ goalId: goalA.id, title: "HTTP Sec Objective" }, USER_A);
      eventA = await createCalendarEvent(
        { title: "HTTP Event", startTime: "2026-10-01T10:00:00Z", endTime: "2026-10-01T11:00:00Z" },
        USER_A
      );
      activityA = await createActivity(
        { title: "HTTP Activity", startTime: "2026-10-01T10:00:00Z", endTime: "2026-10-01T11:00:00Z" },
        USER_A
      );
    });

    it("8.1 HTTP: User B cannot read or mutate User A's Area", async () => {
      expect((await getAreaApi(req(USER_B, `/api/areas/${areaA.id}`), ctx(areaA.id))).status).toBe(404);
      expect((await patchAreaApi(req(USER_B, `/api/areas/${areaA.id}`, { method: "PATCH", body: JSON.stringify({ name: "hacked" }) }), ctx(areaA.id))).status).toBe(404);
      expect((await deleteAreaApi(req(USER_B, `/api/areas/${areaA.id}`, { method: "DELETE" }), ctx(areaA.id))).status).toBe(404);
    });

    it("8.2 HTTP: User B cannot read or mutate User A's Project", async () => {
      expect((await getProjectApi(req(USER_B, `/api/projects/${projectA.id}`), ctx(projectA.id))).status).toBe(404);
      expect((await patchProjectApi(req(USER_B, `/api/projects/${projectA.id}`, { method: "PATCH", body: JSON.stringify({ title: "hacked" }) }), ctx(projectA.id))).status).toBe(404);
      expect((await deleteProjectApi(req(USER_B, `/api/projects/${projectA.id}`, { method: "DELETE" }), ctx(projectA.id))).status).toBe(404);
    });

    it("8.3 HTTP: User B cannot read or mutate User A's Milestone", async () => {
      expect((await getMilestoneApi(req(USER_B, `/api/milestones/${milestoneA.id}`), ctx(milestoneA.id))).status).toBe(404);
      expect((await patchMilestoneApi(req(USER_B, `/api/milestones/${milestoneA.id}`, { method: "PATCH", body: JSON.stringify({ title: "hacked" }) }), ctx(milestoneA.id))).status).toBe(404);
      expect((await deleteMilestoneApi(req(USER_B, `/api/milestones/${milestoneA.id}`, { method: "DELETE" }), ctx(milestoneA.id))).status).toBe(404);
    });

    it("8.4 HTTP: User B cannot read or mutate User A's Objective", async () => {
      expect((await getObjectiveApi(req(USER_B, `/api/objectives/${objectiveA.id}`), ctx(objectiveA.id))).status).toBe(404);
      expect((await patchObjectiveApi(req(USER_B, `/api/objectives/${objectiveA.id}`, { method: "PATCH", body: JSON.stringify({ title: "hacked" }) }), ctx(objectiveA.id))).status).toBe(404);
      expect((await deleteObjectiveApi(req(USER_B, `/api/objectives/${objectiveA.id}`, { method: "DELETE" }), ctx(objectiveA.id))).status).toBe(404);
    });

    it("8.5 HTTP: User B cannot read or mutate User A's CalendarEvent", async () => {
      expect((await getCalendarEventApi(req(USER_B, `/api/calendar-events/${eventA.id}`), ctx(eventA.id))).status).toBe(404);
      expect((await patchCalendarEventApi(req(USER_B, `/api/calendar-events/${eventA.id}`, { method: "PATCH", body: JSON.stringify({ title: "hacked" }) }), ctx(eventA.id))).status).toBe(404);
      expect((await deleteCalendarEventApi(req(USER_B, `/api/calendar-events/${eventA.id}`, { method: "DELETE" }), ctx(eventA.id))).status).toBe(404);
    });

    it("8.6 HTTP: User B cannot read or mutate User A's Activity", async () => {
      expect((await getActivityApi(req(USER_B, `/api/activities/${activityA.id}`), ctx(activityA.id))).status).toBe(404);
      expect((await patchActivityApi(req(USER_B, `/api/activities/${activityA.id}`, { method: "PATCH", body: JSON.stringify({ title: "hacked" }) }), ctx(activityA.id))).status).toBe(404);
      expect((await deleteActivityApi(req(USER_B, `/api/activities/${activityA.id}`, { method: "DELETE" }), ctx(activityA.id))).status).toBe(404);
    });

    it("8.7 HTTP: User Preferences isolated per authenticated user", async () => {
      const resA = await getPreferencesApi(req(USER_A, "/api/preferences"));
      expect(resA.status).toBe(200);
      const dataA = await resA.json();
      expect(dataA.data.userId).toBe(USER_A);

      const resB = await getPreferencesApi(req(USER_B, "/api/preferences"));
      expect(resB.status).toBe(200);
      const dataB = await resB.json();
      expect(dataB.data.userId).toBe(USER_B);
    });
  });
});
