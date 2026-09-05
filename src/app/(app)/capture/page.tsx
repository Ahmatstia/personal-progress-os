import { requirePageUser } from "@/lib/auth";
import { getCaptures } from "@/services/capture.service";
import { getAreas } from "@/services/area.service";
import { getProjects } from "@/services/project.service";
import { getGoals } from "@/services/goal.service";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { CaptureInboxManager } from "./CaptureInboxManager";

export const dynamic = "force-dynamic";

export default async function CapturePage() {
  const user = await requirePageUser();

  const [initialCaptures, areas, projects, goals] = await Promise.all([
    getCaptures(undefined, user.id),
    getAreas(user.id, { isActive: true }),
    getProjects(user.id),
    getGoals(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox Catatan Cepat"
        description="Tangkap ide, pemikiran, dan calon task seketika — tinjau dan konversikan menjadi Task atau Goal yang terstruktur."
      />
      <CaptureInboxManager
        initialCaptures={initialCaptures}
        areas={areas}
        projects={projects}
        goals={goals}
      />
    </div>
  );
}
