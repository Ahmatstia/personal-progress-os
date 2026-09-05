import { prisma } from "@/lib/prisma";

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function upsertUserByEmail(email: string, name?: string | null) {
  const normalizedEmail = email.toLowerCase();
  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: name ? { name } : {},
    create: {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      name: name ?? null,
    },
  });
}
