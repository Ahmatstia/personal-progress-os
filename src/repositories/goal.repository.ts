import { prisma } from "@/lib/prisma";

export function createGoal(userId: string, data: { name: string; type: string; description?: string | null }) {
  return prisma.goal.create({ data: { name: data.name, type: data.type, description: data.description ?? null, userId } });
}

export function findGoal(userId: string, id: string) {
  return prisma.goal.findFirst({ where: { id, userId } });
}

export function updateGoal(
  userId: string,
  id: string,
  data: {
    name?: string;
    type?: string;
    description?: string | null;
    status?: string;
    targetDate?: Date | null;
  }
) {
  return prisma.goal.updateMany({
    where: { id, userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.targetDate !== undefined && { targetDate: data.targetDate }),
    },
  });
}

export function deleteGoal(userId: string, id: string) {
  return prisma.goal.deleteMany({ where: { id, userId } });
}
