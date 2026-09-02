import { prisma } from "@/lib/prisma";

export function createGoal(userId: string, data: { name: string; type: string; description?: string | null }) {
  return prisma.goal.create({ data: { name: data.name, type: data.type, description: data.description ?? null, userId } });
}

export function findGoal(userId: string, id: string) {
  return prisma.goal.findFirst({ where: { id, userId } });
}

export function deleteGoal(userId: string, id: string) {
  return prisma.goal.deleteMany({ where: { id, userId } });
}
