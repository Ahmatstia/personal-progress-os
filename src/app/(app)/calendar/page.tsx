import { requirePageUser } from "@/lib/auth";
import { getCalendarEvents } from "@/services/calendar-event.service";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { CalendarManager } from "./CalendarManager";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await requirePageUser();
  const events = await getCalendarEvents(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Manajemen Waktu"
        title="Kalender"
        description="Jadwal waktu terstruktur untuk alokasi fokus, deadline, dan komitmen pribadi."
      />
      <CalendarManager initialEvents={events} />
    </div>
  );
}
