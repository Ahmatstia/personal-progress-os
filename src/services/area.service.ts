import {
  createArea as createAreaRecord,
  deleteArea as deleteAreaRecord,
  findArea as findAreaRecord,
  findAreaByName as findAreaByNameRecord,
  findAreas as findAreasRecord,
  updateArea as updateAreaRecord,
} from "@/repositories/area.repository";
import {
  createAreaSchema,
  updateAreaSchema,
  type CreateAreaInput,
  type UpdateAreaInput,
} from "@/schemas/area.schema";
import { requireUserId } from "@/lib/ownership";
import { prisma } from "@/lib/prisma";

export class AreaServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "AREA_NOT_FOUND" | "AREA_NAME_EXISTS" | "AREA_HAS_GOALS" | "INVALID_INPUT" = "AREA_NOT_FOUND"
  ) {
    super(message);
    this.name = "AreaServiceError";
  }
}

export async function createArea(input: CreateAreaInput, userId?: string) {
  const owner = requireUserId(userId);
  const parsed = createAreaSchema.parse(input);

  const existing = await findAreaByNameRecord(owner, parsed.name);
  if (existing) {
    throw new AreaServiceError("Area dengan nama ini sudah ada.", "AREA_NAME_EXISTS");
  }

  return createAreaRecord(owner, parsed);
}

export async function getAreas(userId?: string, filter?: { isActive?: boolean }) {
  const owner = requireUserId(userId);
  return findAreasRecord(owner, filter);
}

export async function getArea(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const area = await findAreaRecord(owner, id);
  if (!area) {
    throw new AreaServiceError("Area tidak ditemukan.", "AREA_NOT_FOUND");
  }
  return area;
}

export async function updateArea(id: string, input: UpdateAreaInput, userId?: string) {
  const owner = requireUserId(userId);
  const existing = await findAreaRecord(owner, id);
  if (!existing) {
    throw new AreaServiceError("Area tidak ditemukan.", "AREA_NOT_FOUND");
  }

  const parsed = updateAreaSchema.parse(input);

  if (parsed.name && parsed.name !== existing.name) {
    const duplicate = await findAreaByNameRecord(owner, parsed.name);
    if (duplicate && duplicate.id !== id) {
      throw new AreaServiceError("Area dengan nama ini sudah ada.", "AREA_NAME_EXISTS");
    }
  }

  await updateAreaRecord(owner, id, parsed);
  return findAreaRecord(owner, id);
}

export async function archiveArea(id: string, userId?: string) {
  return updateArea(id, { isActive: false }, userId);
}

export async function deleteArea(id: string, userId?: string) {
  const owner = requireUserId(userId);
  const existing = await findAreaRecord(owner, id);
  if (!existing) {
    throw new AreaServiceError("Area tidak ditemukan.", "AREA_NOT_FOUND");
  }

  // Check if any goals are associated with this area (Area -> Goal is Restrict)
  const goalCount = await prisma.goal.count({
    where: { userId: owner, areaId: id },
  });
  if (goalCount > 0) {
    throw new AreaServiceError(
      `Tidak dapat menghapus area karena masih memiliki ${goalCount} goal. Pindahkan atau hapus goal terlebih dahulu.`,
      "AREA_HAS_GOALS"
    );
  }

  await deleteAreaRecord(owner, id);
  return { success: true, id };
}
