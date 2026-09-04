-- ==============================================================================
-- MYLIFE TARGET SCHEMA MIGRATION SCRIPT (POSTGRESQL)
-- 100% Non-destructive: Preserves all existing User, Goal, Stage, Task, Session, DailyFocus data.
-- ==============================================================================

BEGIN;

-- 1. Create Enums if not exists
DO $$ BEGIN
  CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "GoalType" AS ENUM ('LEARNING', 'ACHIEVEMENT', 'HABIT', 'MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ObjectiveStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TaskType" AS ENUM ('TASK', 'LEARNING', 'BUG', 'IMPROVEMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CaptureStatus" AS ENUM ('PENDING', 'PROCESSED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CaptureCategory" AS ENUM ('IDEA', 'TASK_CANDIDATE', 'NOTE', 'REMINDER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "EventType" AS ENUM ('PERSONAL', 'WORK', 'BLOCKED', 'REMINDER', 'TASK_DEADLINE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ActivityCategory" AS ENUM ('WORK', 'LEARNING', 'HEALTH_FITNESS', 'PERSONAL', 'REST', 'CHORE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('TASK_DUE', 'DAILY_FOCUS_REMINDER', 'WEEKLY_REVIEW_REMINDER', 'CALENDAR_EVENT', 'MILESTONE_DEADLINE', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Update User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" text;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" text;

-- 3. Create UserPreference table
CREATE TABLE IF NOT EXISTS "UserPreference" (
  "id" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL UNIQUE,
  "theme" "Theme" NOT NULL DEFAULT 'SYSTEM',
  "weekStartDay" integer NOT NULL DEFAULT 1,
  "dailyFocusLimit" integer NOT NULL DEFAULT 5,
  "enableNotifications" boolean NOT NULL DEFAULT true,
  "enableAiAssistance" boolean NOT NULL DEFAULT true,
  "timezone" text NOT NULL DEFAULT 'Asia/Jakarta',
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Create Area table
CREATE TABLE IF NOT EXISTS "Area" (
  "id" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "color" text NOT NULL DEFAULT '#6366f1',
  "icon" text NOT NULL DEFAULT 'compass',
  "order" integer NOT NULL DEFAULT 0,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Area_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Area_userId_name_key" UNIQUE ("userId", "name")
);
CREATE INDEX IF NOT EXISTS "Area_userId_order_idx" ON "Area"("userId", "order");
CREATE INDEX IF NOT EXISTS "Area_userId_isActive_idx" ON "Area"("userId", "isActive");

-- 5. Update Goal table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Goal' AND column_name = 'name') THEN
    ALTER TABLE "Goal" RENAME COLUMN "name" TO "title";
  END IF;
END $$;

ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "areaId" text;
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "priority" "Priority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "completedAt" timestamp without time zone;

-- Cast Goal type & status to enums
ALTER TABLE "Goal" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Goal" ALTER COLUMN "type" TYPE "GoalType" USING (type::"GoalType");
ALTER TABLE "Goal" ALTER COLUMN "type" SET DEFAULT 'LEARNING';

ALTER TABLE "Goal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Goal" ALTER COLUMN "status" TYPE "GoalStatus" USING (status::"GoalStatus");
ALTER TABLE "Goal" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- Add Area FK to Goal (onDelete Restrict)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Goal_areaId_fkey') THEN
    ALTER TABLE "Goal" ADD CONSTRAINT "Goal_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Goal_userId_status_idx" ON "Goal"("userId", "status");
CREATE INDEX IF NOT EXISTS "Goal_userId_areaId_idx" ON "Goal"("userId", "areaId");
CREATE INDEX IF NOT EXISTS "Goal_userId_targetDate_idx" ON "Goal"("userId", "targetDate");

-- 6. Create Objective table
CREATE TABLE IF NOT EXISTS "Objective" (
  "id" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "goalId" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "targetValue" double precision NOT NULL DEFAULT 100.0,
  "currentValue" double precision NOT NULL DEFAULT 0.0,
  "unit" text NOT NULL DEFAULT '%',
  "status" "ObjectiveStatus" NOT NULL DEFAULT 'ACTIVE',
  "dueDate" timestamp without time zone,
  "completedAt" timestamp without time zone,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Objective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Objective_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Objective_userId_goalId_idx" ON "Objective"("userId", "goalId");
CREATE INDEX IF NOT EXISTS "Objective_userId_status_idx" ON "Objective"("userId", "status");

-- 7. Create Project table
CREATE TABLE IF NOT EXISTS "Project" (
  "id" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "goalId" text,
  "areaId" text,
  "title" text NOT NULL,
  "description" text,
  "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "startDate" timestamp without time zone,
  "targetDate" timestamp without time zone,
  "completedAt" timestamp without time zone,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Project_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Project_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Project_userId_status_idx" ON "Project"("userId", "status");
CREATE INDEX IF NOT EXISTS "Project_userId_goalId_idx" ON "Project"("userId", "goalId");
CREATE INDEX IF NOT EXISTS "Project_userId_areaId_idx" ON "Project"("userId", "areaId");
CREATE INDEX IF NOT EXISTS "Project_userId_targetDate_idx" ON "Project"("userId", "targetDate");

-- 8. Update Stage table
ALTER TABLE "Stage" ADD COLUMN IF NOT EXISTS "status" "StageStatus" NOT NULL DEFAULT 'PENDING';
CREATE INDEX IF NOT EXISTS "Stage_userId_goalId_order_idx" ON "Stage"("userId", "goalId", "order");
CREATE INDEX IF NOT EXISTS "Stage_userId_status_idx" ON "Stage"("userId", "status");

-- 9. Create Milestone table
CREATE TABLE IF NOT EXISTS "Milestone" (
  "id" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "projectId" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "order" integer NOT NULL DEFAULT 0,
  "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
  "dueDate" timestamp without time zone,
  "completedAt" timestamp without time zone,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Milestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Milestone_userId_projectId_order_idx" ON "Milestone"("userId", "projectId", "order");
CREATE INDEX IF NOT EXISTS "Milestone_userId_status_idx" ON "Milestone"("userId", "status");
CREATE INDEX IF NOT EXISTS "Milestone_userId_dueDate_idx" ON "Milestone"("userId", "dueDate");

-- 10. Update Task table
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Task' AND column_name = 'name') THEN
    ALTER TABLE "Task" RENAME COLUMN "name" TO "title";
  END IF;
END $$;

ALTER TABLE "Task" ALTER COLUMN "stageId" DROP NOT NULL;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "milestoneId" text;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "projectId" text;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "areaId" text;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "goalId" text;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "dueDate" timestamp without time zone;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "scheduledDate" timestamp without time zone;

-- Cast Task type, priority, status to enums
ALTER TABLE "Task" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "type" TYPE "TaskType" USING (
  CASE 
    WHEN type = 'CONCEPT' THEN 'LEARNING'::"TaskType"
    WHEN type = 'LEARNING' THEN 'LEARNING'::"TaskType"
    WHEN type = 'BUG' THEN 'BUG'::"TaskType"
    WHEN type = 'IMPROVEMENT' THEN 'IMPROVEMENT'::"TaskType"
    ELSE 'TASK'::"TaskType"
  END
);
ALTER TABLE "Task" ALTER COLUMN "type" SET DEFAULT 'TASK';

ALTER TABLE "Task" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "priority" TYPE "Priority" USING (priority::"Priority");
ALTER TABLE "Task" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';

ALTER TABLE "Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus" USING (
  CASE 
    WHEN status = 'NOT_STARTED' THEN 'TODO'::"TaskStatus"
    ELSE status::"TaskStatus"
  END
);
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'TODO';

-- Add Foreign Keys to Task
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Task_milestoneId_fkey') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Task_projectId_fkey') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Task_areaId_fkey') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Task_goalId_fkey') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill Task.goalId from Stage.goalId
UPDATE "Task" SET "goalId" = s."goalId"
FROM "Stage" s
WHERE "Task"."stageId" = s.id AND "Task"."goalId" IS NULL;

-- Step 3 Constraint: chk_task_parent
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_task_parent') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "chk_task_parent"
    CHECK (
      "stageId" IS NOT NULL OR
      "milestoneId" IS NOT NULL OR
      "projectId" IS NOT NULL OR
      "areaId" IS NOT NULL
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Task_userId_status_idx" ON "Task"("userId", "status");
CREATE INDEX IF NOT EXISTS "Task_userId_stageId_idx" ON "Task"("userId", "stageId");
CREATE INDEX IF NOT EXISTS "Task_userId_milestoneId_idx" ON "Task"("userId", "milestoneId");
CREATE INDEX IF NOT EXISTS "Task_userId_projectId_idx" ON "Task"("userId", "projectId");
CREATE INDEX IF NOT EXISTS "Task_userId_goalId_idx" ON "Task"("userId", "goalId");
CREATE INDEX IF NOT EXISTS "Task_userId_areaId_idx" ON "Task"("userId", "areaId");
CREATE INDEX IF NOT EXISTS "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");
CREATE INDEX IF NOT EXISTS "Task_userId_scheduledDate_idx" ON "Task"("userId", "scheduledDate");

-- 11. Step 4 Constraint: idx_unique_active_session_per_user
CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_active_session_per_user"
ON "Session" ("userId")
WHERE "endedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Session_userId_taskId_idx" ON "Session"("userId", "taskId");
CREATE INDEX IF NOT EXISTS "Session_userId_startedAt_idx" ON "Session"("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "Session_userId_endedAt_idx" ON "Session"("userId", "endedAt");

-- 12. Create CalendarEvent table
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
  "id" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "startTime" timestamp without time zone NOT NULL,
  "endTime" timestamp without time zone NOT NULL,
  "isAllDay" boolean NOT NULL DEFAULT false,
  "eventType" "EventType" NOT NULL DEFAULT 'PERSONAL',
  "recurrence" "RecurrenceType" NOT NULL DEFAULT 'NONE',
  "location" text,
  "taskId" text,
  "projectId" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CalendarEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "CalendarEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CalendarEvent_userId_startTime_endTime_idx" ON "CalendarEvent"("userId", "startTime", "endTime");
CREATE INDEX IF NOT EXISTS "CalendarEvent_userId_eventType_idx" ON "CalendarEvent"("userId", "eventType");
CREATE INDEX IF NOT EXISTS "CalendarEvent_userId_taskId_idx" ON "CalendarEvent"("userId", "taskId");

-- 13. Create Activity table
CREATE TABLE IF NOT EXISTS "Activity" (
  "id" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "title" text NOT NULL,
  "category" "ActivityCategory" NOT NULL DEFAULT 'WORK',
  "startTime" timestamp without time zone NOT NULL,
  "endTime" timestamp without time zone NOT NULL,
  "durationMinutes" integer NOT NULL,
  "productivityRating" integer,
  "energyLevel" integer,
  "notes" text,
  "taskId" text,
  "projectId" text,
  "areaId" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Activity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Activity_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Activity_userId_startTime_endTime_idx" ON "Activity"("userId", "startTime", "endTime");
CREATE INDEX IF NOT EXISTS "Activity_userId_category_idx" ON "Activity"("userId", "category");
CREATE INDEX IF NOT EXISTS "Activity_userId_areaId_idx" ON "Activity"("userId", "areaId");
CREATE INDEX IF NOT EXISTS "Activity_userId_taskId_idx" ON "Activity"("userId", "taskId");

-- 14. Update Capture table
ALTER TABLE "Capture" ADD COLUMN IF NOT EXISTS "status" "CaptureStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Capture" ADD COLUMN IF NOT EXISTS "category" "CaptureCategory" NOT NULL DEFAULT 'TASK_CANDIDATE';
ALTER TABLE "Capture" ADD COLUMN IF NOT EXISTS "convertedTaskId" text;
ALTER TABLE "Capture" ADD COLUMN IF NOT EXISTS "convertedGoalId" text;
ALTER TABLE "Capture" ADD COLUMN IF NOT EXISTS "processedAt" timestamp without time zone;
ALTER TABLE "Capture" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Capture_userId_status_idx" ON "Capture"("userId", "status");
CREATE INDEX IF NOT EXISTS "Capture_userId_createdAt_idx" ON "Capture"("userId", "createdAt");

-- 15. Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" text NOT NULL PRIMARY KEY,
  "userId" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
  "isRead" boolean NOT NULL DEFAULT false,
  "readAt" timestamp without time zone,
  "linkUrl" text,
  "entityType" text,
  "entityId" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

COMMIT;
