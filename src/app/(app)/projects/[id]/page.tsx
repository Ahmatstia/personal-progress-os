import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth";
import { getProject } from "@/services/project.service";
import { ProjectDetailView } from "./ProjectDetailView";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser();
  const { id } = await params;

  let project = null;
  try {
    project = await getProject(id, user.id);
  } catch {
    project = null;
  }

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project as unknown as Parameters<typeof ProjectDetailView>[0]["project"]} />;
}
