import Database from "better-sqlite3";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🚀 Starting data migration from SQLite (dev.db) to Supabase PostgreSQL...\n");
  const sqlite = new Database("./prisma/dev.db");

  // 1. Migrate Users
  const users = sqlite.prepare("SELECT * FROM User").all() as any[];
  console.log(`👤 Migrating ${users.length} Users...`);
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
    });
  }

  // 2. Migrate Goals
  const goals = sqlite.prepare("SELECT * FROM Goal").all() as any[];
  console.log(`🎯 Migrating ${goals.length} Goals...`);
  for (const g of goals) {
    await prisma.goal.upsert({
      where: { id: g.id },
      update: {},
      create: {
        id: g.id,
        userId: g.userId,
        name: g.name,
        description: g.description,
        type: g.type,
        status: g.status,
        targetDate: g.targetDate ? new Date(g.targetDate) : null,
        createdAt: new Date(g.createdAt),
        updatedAt: new Date(g.updatedAt),
      },
    });
  }

  // 3. Migrate Stages
  const stages = sqlite.prepare("SELECT * FROM Stage").all() as any[];
  console.log(`🪜 Migrating ${stages.length} Stages...`);
  for (const s of stages) {
    await prisma.stage.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        userId: s.userId,
        goalId: s.goalId,
        name: s.name,
        description: s.description,
        order: s.order,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
    });
  }

  // 4. Migrate Tasks
  const tasks = sqlite.prepare("SELECT * FROM Task").all() as any[];
  console.log(`📋 Migrating ${tasks.length} Tasks...`);
  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        userId: t.userId,
        stageId: t.stageId,
        name: t.name,
        description: t.description,
        type: t.type,
        priority: t.priority,
        status: t.status,
        estimatedHours: t.estimatedHours,
        actualHours: t.actualHours,
        startedAt: t.startedAt ? new Date(t.startedAt) : null,
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
        notes: t.notes,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      },
    });
  }

  // 5. Migrate Sessions
  const sessions = sqlite.prepare("SELECT * FROM Session").all() as any[];
  console.log(`⏱️ Migrating ${sessions.length} Sessions...`);
  for (const s of sessions) {
    await prisma.session.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        userId: s.userId,
        taskId: s.taskId,
        startedAt: new Date(s.startedAt),
        endedAt: s.endedAt ? new Date(s.endedAt) : null,
        durationMinutes: s.durationMinutes,
        activity: s.activity,
        understanding: s.understanding,
        obstacle: s.obstacle,
        nextAction: s.nextAction,
        createdAt: new Date(s.createdAt),
      },
    });
  }

  // 6. Migrate DailyFocus
  const focuses = sqlite.prepare("SELECT * FROM DailyFocus").all() as any[];
  console.log(`🎯 Migrating ${focuses.length} DailyFocus items...`);
  for (const f of focuses) {
    await prisma.dailyFocus.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        userId: f.userId,
        taskId: f.taskId,
        date: new Date(f.date),
        order: f.order,
        createdAt: new Date(f.createdAt),
      },
    });
  }

  // 7. Migrate Captures
  const captures = sqlite.prepare("SELECT * FROM Capture").all() as any[];
  console.log(`📥 Migrating ${captures.length} Captures...`);
  for (const c of captures) {
    await prisma.capture.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        userId: c.userId,
        content: c.content,
        createdAt: new Date(c.createdAt),
      },
    });
  }

  // 8. Migrate Reviews
  const reviews = sqlite.prepare("SELECT * FROM Review").all() as any[];
  console.log(`📝 Migrating ${reviews.length} Reviews...`);
  for (const r of reviews) {
    await prisma.review.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        userId: r.userId,
        goalId: r.goalId,
        periodStart: new Date(r.periodStart),
        periodEnd: new Date(r.periodEnd),
        learningHours: r.learningHours,
        tasksCompleted: r.tasksCompleted,
        understanding: r.understanding,
        wentWell: r.wentWell,
        difficulties: r.difficulties,
        improvements: r.improvements,
        nextFocus: r.nextFocus,
        createdAt: new Date(r.createdAt),
      },
    });
  }

  console.log("\n✅ ALL DATA SUCCESSFULLY MIGRATED TO SUPABASE!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
