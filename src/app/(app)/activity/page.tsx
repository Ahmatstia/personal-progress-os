import { requirePageUser } from "@/lib/auth";
import { getActivities } from "@/services/activity.service";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { ActivityManager } from "./ActivityManager";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const user = await requirePageUser();
  const activities = await getActivities(user.id, { limit: 50 });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Riwayat & Tracking"
        title="Aktivitas"
        description="Riwayat log aktivitas harian untuk merekam waktu, energi, dan produktivitas Anda."
      />
      <ActivityManager initialActivities={activities} />
    </div>
  );
}
