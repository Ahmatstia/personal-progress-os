import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 Seeding database...");

  const goal = await prisma.goal.create({
    data: {
      name: "Belajar AI / Machine Learning",
      description:
        "Roadmap belajar AI dan Machine Learning dari fundamental sampai project.",
      type: "LEARNING",
      status: "ACTIVE",
    },
  });

  const stage = await prisma.stage.create({
    data: {
      goalId: goal.id,
      name: "Phase 0 — Fundamental",
      description: "Membangun fondasi sebelum masuk ke Machine Learning.",
      order: 0,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        stageId: stage.id,
        name: "Python Fundamental",
        description: "Memahami dasar-dasar Python.",
        type: "CONCEPT",
        priority: "HIGH",
        estimatedHours: 5,
      },
      {
        stageId: stage.id,
        name: "Tipe Data & Variabel",
        description: "Memahami int, float, string, boolean, dan casting.",
        type: "CONCEPT",
        priority: "HIGH",
        estimatedHours: 3,
      },
      {
        stageId: stage.id,
        name: "Struktur Data",
        description: "List, tuple, dictionary, dan set.",
        type: "CONCEPT",
        priority: "MEDIUM",
        estimatedHours: 4,
      },
    ],
  });

  console.log("✅ Seed selesai!");
  console.log(`Goal: ${goal.name}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
