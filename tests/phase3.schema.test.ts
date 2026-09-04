import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { validateTaskParents, TaskValidationError } from "../src/services/task-validation.service";

const USER_A = "phase3_test_user_a";
const USER_B = "phase3_test_user_b";

describe("Phase 3: Database & Migration Implementation Verification", () => {
  let goalA: { id: string };
  let goalB: { id: string };
  let stageA: { id: string; goalId: string };
  let projectA: { id: string; goalId: string | null };
  let milestoneA: { id: string; projectId: string };

  beforeAll(async () => {
    // Clean up potential remnants
    await prisma.user.deleteMany({
      where: { id: { in: [USER_A, USER_B] } },
    });

    // Create test users
    await prisma.user.createMany({
      data: [
        { id: USER_A, email: "phase3_a@example.com", name: "Phase3 User A" },
        { id: USER_B, email: "phase3_b@example.com", name: "Phase3 User B" },
      ],
    });

    // 1. Goal.title verification
    goalA = await prisma.goal.create({
      data: {
        userId: USER_A,
        title: "Master Architecture",
        type: "LEARNING",
      },
    });

    goalB = await prisma.goal.create({
      data: {
        userId: USER_B,
        title: "User B Goal",
        type: "ACHIEVEMENT",
      },
    });

    stageA = await prisma.stage.create({
      data: {
        userId: USER_A,
        goalId: goalA.id,
        name: "Stage 1",
        order: 0,
      },
    });

    projectA = await prisma.project.create({
      data: {
        userId: USER_A,
        goalId: goalA.id,
        title: "Project Core Engine",
      },
    });

    milestoneA = await prisma.milestone.create({
      data: {
        userId: USER_A,
        projectId: projectA.id,
        title: "Milestone Alpha",
        order: 0,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [USER_A, USER_B] } },
    });
  });

  // 1. Goal.title
  it("1. Goal.title is persisted and accessible", async () => {
    const fetched = await prisma.goal.findUnique({ where: { id: goalA.id } });
    expect(fetched?.title).toBe("Master Architecture");
  });

  // 2. Task.title
  it("2. Task.title is persisted and accessible", async () => {
    const task = await prisma.task.create({
      data: {
        userId: USER_A,
        stageId: stageA.id,
        goalId: goalA.id,
        title: "Write Prisma schema",
      },
    });
    expect(task.title).toBe("Write Prisma schema");
  });

  // 3. Task without structural parent -> rejected
  it("3. Task without structural parent is rejected by service and chk_task_parent constraint", async () => {
    // Service level rejection
    await expect(validateTaskParents(USER_A, {})).rejects.toThrow(TaskValidationError);
    await expect(validateTaskParents(USER_A, {})).rejects.toMatchObject({
      code: "MISSING_STRUCTURAL_PARENT",
    });

    // Database level CHECK constraint (chk_task_parent) rejection
    await expect(
      prisma.$executeRawUnsafe(`
        INSERT INTO "Task" ("id", "userId", "title", "createdAt", "updatedAt")
        VALUES ('orphan_task_test', '${USER_A}', 'Orphan Task', NOW(), NOW())
      `)
    ).rejects.toThrow();
  });

  // 4. Task with valid Stage -> accepted
  it("4. Task with valid Stage is accepted and resolves goalId", async () => {
    const resolved = await validateTaskParents(USER_A, { stageId: stageA.id });
    expect(resolved.stageId).toBe(stageA.id);
    expect(resolved.goalId).toBe(stageA.goalId);
  });

  // 5. Task with invalid Stage ownership -> rejected
  it("5. Task with invalid Stage ownership is rejected", async () => {
    await expect(
      validateTaskParents(USER_B, { stageId: stageA.id })
    ).rejects.toMatchObject({
      code: "STAGE_NOT_FOUND",
    });
  });

  // 6. Task Stage + Project combination -> rejected
  it("6. Task with both Stage and Project is rejected (cross-track conflict)", async () => {
    await expect(
      validateTaskParents(USER_A, {
        stageId: stageA.id,
        projectId: projectA.id,
      })
    ).rejects.toMatchObject({
      code: "CROSS_TRACK_CONFLICT",
    });
  });

  // 7. Task Milestone without matching Project -> rejected
  it("7. Task Milestone without matching Project is rejected", async () => {
    // Create another project for User A
    const otherProject = await prisma.project.create({
      data: {
        userId: USER_A,
        title: "Unrelated Project",
      },
    });

    await expect(
      validateTaskParents(USER_A, {
        milestoneId: milestoneA.id,
        projectId: otherProject.id,
      })
    ).rejects.toMatchObject({
      code: "PROJECT_ID_MISMATCH",
    });
  });

  // 8. Task Project + Goal mismatch -> rejected
  it("8. Task Project + Goal mismatch is rejected", async () => {
    await expect(
      validateTaskParents(USER_A, {
        projectId: projectA.id,
        goalId: goalB.id, // Does not match projectA.goalId (which is goalA.id)
      })
    ).rejects.toMatchObject({
      code: "GOAL_ID_MISMATCH",
    });
  });

  // 9. Cross-user parent reference -> rejected
  it("9. Cross-user parent reference is rejected", async () => {
    await expect(
      validateTaskParents(USER_B, {
        projectId: projectA.id,
      })
    ).rejects.toMatchObject({
      code: "PROJECT_NOT_FOUND",
    });
  });

  // 10. Two active Sessions for same user -> second rejected (database partial unique index)
  it("10. Two active Sessions for same user is rejected by idx_unique_active_session_per_user", async () => {
    const taskA = await prisma.task.create({
      data: {
        userId: USER_A,
        stageId: stageA.id,
        goalId: goalA.id,
        title: "Task for Session 1",
      },
    });

    const taskB = await prisma.task.create({
      data: {
        userId: USER_A,
        stageId: stageA.id,
        goalId: goalA.id,
        title: "Task for Session 2",
      },
    });

    // Create first active session (endedAt = null)
    const session1 = await prisma.session.create({
      data: {
        userId: USER_A,
        taskId: taskA.id,
        startedAt: new Date(),
        endedAt: null,
      },
    });
    expect(session1.endedAt).toBeNull();

    // Attempt to create second active session for same user -> must throw DB error
    await expect(
      prisma.session.create({
        data: {
          userId: USER_A,
          taskId: taskB.id,
          startedAt: new Date(),
          endedAt: null,
        },
      })
    ).rejects.toThrow();

    // Cleanup session 1
    await prisma.session.delete({ where: { id: session1.id } });
  });

  // 11. Same user may have multiple completed Sessions
  it("11. Same user may have multiple completed Sessions", async () => {
    const task = await prisma.task.create({
      data: {
        userId: USER_A,
        stageId: stageA.id,
        goalId: goalA.id,
        title: "Multi completed sessions task",
      },
    });

    const session1 = await prisma.session.create({
      data: {
        userId: USER_A,
        taskId: task.id,
        startedAt: new Date("2026-09-01T10:00:00Z"),
        endedAt: new Date("2026-09-01T11:00:00Z"),
        durationMinutes: 60,
      },
    });

    const session2 = await prisma.session.create({
      data: {
        userId: USER_A,
        taskId: task.id,
        startedAt: new Date("2026-09-02T10:00:00Z"),
        endedAt: new Date("2026-09-02T11:30:00Z"),
        durationMinutes: 90,
      },
    });

    expect(session1.id).toBeDefined();
    expect(session2.id).toBeDefined();

    const count = await prisma.session.count({
      where: { userId: USER_A, taskId: task.id, endedAt: { not: null } },
    });
    expect(count).toBe(2);
  });

  // 12. Milestone deletion preserves Task (SetNull)
  it("12. Milestone deletion preserves Task with milestoneId set to null", async () => {
    const mProject = await prisma.project.create({
      data: { userId: USER_A, title: "Project for Milestone Del" },
    });
    const milestone = await prisma.milestone.create({
      data: { userId: USER_A, projectId: mProject.id, title: "Transient Milestone", order: 1 },
    });
    const task = await prisma.task.create({
      data: {
        userId: USER_A,
        projectId: mProject.id,
        milestoneId: milestone.id,
        title: "Task under transient milestone",
      },
    });

    // Delete milestone
    await prisma.milestone.delete({ where: { id: milestone.id } });

    // Task still exists, milestoneId is null
    const after = await prisma.task.findUnique({ where: { id: task.id } });
    expect(after).not.toBeNull();
    expect(after?.milestoneId).toBeNull();
    expect(after?.projectId).toBe(mProject.id);
  });

  // 13. Project deletion cascades Tasks
  it("13. Project deletion cascades Tasks", async () => {
    const project = await prisma.project.create({
      data: { userId: USER_A, title: "Doomed Project" },
    });
    const task = await prisma.task.create({
      data: {
        userId: USER_A,
        projectId: project.id,
        title: "Doomed Project Task",
      },
    });

    await prisma.project.delete({ where: { id: project.id } });

    const after = await prisma.task.findUnique({ where: { id: task.id } });
    expect(after).toBeNull();
  });

  // 14. Stage deletion cascades Goal-track Tasks
  it("14. Stage deletion cascades Goal-track Tasks", async () => {
    const stage = await prisma.stage.create({
      data: { userId: USER_A, goalId: goalA.id, name: "Doomed Stage", order: 99 },
    });
    const task = await prisma.task.create({
      data: {
        userId: USER_A,
        stageId: stage.id,
        goalId: goalA.id,
        title: "Doomed Stage Task",
      },
    });

    await prisma.stage.delete({ where: { id: stage.id } });

    const after = await prisma.task.findUnique({ where: { id: task.id } });
    expect(after).toBeNull();
  });

  // 15. Goal deletion preserves Project (SetNull) but removes Stage-track Tasks
  it("15. Goal deletion preserves Project but cascades Stages and their Tasks", async () => {
    const goal = await prisma.goal.create({
      data: { userId: USER_A, title: "Doomed Goal", type: "LEARNING" },
    });
    const stage = await prisma.stage.create({
      data: { userId: USER_A, goalId: goal.id, name: "Stage under doomed goal", order: 0 },
    });
    const stageTask = await prisma.task.create({
      data: { userId: USER_A, stageId: stage.id, goalId: goal.id, title: "Task under doomed goal stage" },
    });
    const project = await prisma.project.create({
      data: { userId: USER_A, goalId: goal.id, title: "Project linked to doomed goal" },
    });

    // Delete Goal
    await prisma.goal.delete({ where: { id: goal.id } });

    // Project preserved, goalId set to null
    const preservedProject = await prisma.project.findUnique({ where: { id: project.id } });
    expect(preservedProject).not.toBeNull();
    expect(preservedProject?.goalId).toBeNull();

    // Stage and stageTask cascaded
    const cascadedStage = await prisma.stage.findUnique({ where: { id: stage.id } });
    expect(cascadedStage).toBeNull();
    const cascadedTask = await prisma.task.findUnique({ where: { id: stageTask.id } });
    expect(cascadedTask).toBeNull();
  });
});
