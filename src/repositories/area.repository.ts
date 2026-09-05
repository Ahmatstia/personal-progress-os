import { prisma } from "@/lib/prisma";

export function createArea(
  userId: string,
  data: {
    name: string;
    description?: string | null;
    color?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }
) {
  return prisma.area.create({
    data: {
      userId,
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? "#6366f1",
      icon: data.icon ?? "compass",
      order: data.order ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

export function findArea(userId: string, id: string) {
  return prisma.area.findFirst({
    where: { id, userId },
    include: {
      _count: {
        select: {
          goals: true,
          projects: true,
          tasks: true,
        },
      },
    },
  });
}

export function findAreaByName(userId: string, name: string) {
  return prisma.area.findFirst({
    where: { userId, name },
  });
}

export function findAreas(userId: string, filter?: { isActive?: boolean }) {
  return prisma.area.findMany({
    where: {
      userId,
      ...(filter?.isActive !== undefined && { isActive: filter.isActive }),
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: {
          goals: true,
          projects: true,
          tasks: true,
        },
      },
      goals: {
        select: { id: true, title: true, status: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
      },
      projects: {
        select: { id: true, title: true, status: true },
        orderBy: { updatedAt: "desc" },
        take: 4,
      },
    },
  });
}

export function updateArea(
  userId: string,
  id: string,
  data: {
    name?: string;
    description?: string | null;
    color?: string;
    icon?: string;
    order?: number;
    isActive?: boolean;
  }
) {
  return prisma.area.updateMany({
    where: { id, userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

export function deleteArea(userId: string, id: string) {
  return prisma.area.deleteMany({
    where: { id, userId },
  });
}
