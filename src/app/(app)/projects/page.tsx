import { requirePageUser } from "@/lib/auth";
import { getProjects } from "@/services/project.service";
import { getAreas } from "@/services/area.service";
import { getGoals } from "@/services/goal.service";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ProjectsManager } from "./ProjectsManager";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requirePageUser();
  const [projects, areas, goals] = await Promise.all([
    getProjects(user.id),
    getAreas(user.id),
    getGoals(user.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Eksekusi & Output"
        title="Projects"
        description="Kelola inisiatif kerja Anda secara terstruktur dengan Milestones dan Tasks."
      />
      <ProjectsManager
        initialProjects={projects}
        goals={goals}
        areas={areas}
      />
    </div>
  );
}
