import { requirePageUser } from "@/lib/auth";
import { getAreas } from "@/services/area.service";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { AreasManager } from "./AreasManager";

export const dynamic = "force-dynamic";

export default async function AreasPage() {
  const user = await requirePageUser();
  const areas = await getAreas(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Domain Kehidupan"
        title="Areas"
        description="Kelola pilar utama kehidupan Anda untuk menyelaraskan Goals, Projects, dan Tasks."
      />
      <AreasManager initialAreas={areas} />
    </div>
  );
}
