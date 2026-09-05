import type { CalendarEvent, Session } from "@/generated/prisma/client";
import type { TimeConflict, ConflictSeverity } from "./insights-types";

function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  const sA = startA.getTime();
  const eA = endA.getTime();
  const sB = startB.getTime();
  const eB = endB.getTime();

  // Strict interval overlap: boundary touching (eA === sB) is NOT a conflict
  return sA < eB && eA > sB;
}

export function detectConflicts(
  calendarEvents: CalendarEvent[],
  activeSession: (Session & { task?: { id: string; title: string } }) | null = null,
  referenceDate: Date = new Date()
): TimeConflict[] {
  const conflicts: TimeConflict[] = [];
  const processedPairs = new Set<string>();

  // 1. Calendar Event vs Calendar Event
  for (let i = 0; i < calendarEvents.length; i++) {
    const eventA = calendarEvents[i];
    const startA = new Date(eventA.startTime);
    const endA = new Date(eventA.endTime);

    for (let j = i + 1; j < calendarEvents.length; j++) {
      const eventB = calendarEvents[j];
      const startB = new Date(eventB.startTime);
      const endB = new Date(eventB.endTime);

      if (intervalsOverlap(startA, endA, startB, endB)) {
        const pairKey = [eventA.id, eventB.id].sort().join("::");
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const isExactSame = startA.getTime() === startB.getTime() && endA.getTime() === endB.getTime();
        const overlapStart = new Date(Math.max(startA.getTime(), startB.getTime()));
        const overlapEnd = new Date(Math.min(endA.getTime(), endB.getTime()));
        const overlapMinutes = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000);

        let severity: ConflictSeverity = "MEDIUM";
        if (isExactSame || overlapMinutes >= 60) severity = "HIGH";
        else if (overlapMinutes < 15) severity = "LOW";

        conflicts.push({
          id: `conflict-event-${eventA.id}-${eventB.id}`,
          conflictType: isExactSame ? "DOUBLE_BOOKING" : "EVENT_OVERLAP",
          severity,
          entities: [
            {
              type: "CALENDAR_EVENT",
              id: eventA.id,
              title: eventA.title,
              startTime: startA,
              endTime: endA,
            },
            {
              type: "CALENDAR_EVENT",
              id: eventB.id,
              title: eventB.title,
              startTime: startB,
              endTime: endB,
            },
          ],
          startTime: overlapStart,
          endTime: overlapEnd,
          explanation: isExactSame
            ? `Jadwal ganda persis: "${eventA.title}" dan "${eventB.title}" dimulai dan berakhir di waktu yang sama.`
            : `Tumpang tindih jadwal selama ${overlapMinutes} menit antara "${eventA.title}" dan "${eventB.title}".`,
        });
      }
    }
  }

  // 2. Active Session vs Calendar Events
  // If user is currently in an active session, check if any calendar event is currently running or starting
  if (activeSession && activeSession.startedAt && !activeSession.endedAt) {
    const sessionStart = new Date(activeSession.startedAt);
    // Active session has no endedAt, assume it is running up to now or now + 15m
    const sessionEffectiveEnd = new Date(Math.max(referenceDate.getTime(), sessionStart.getTime() + 25 * 60000));

    for (const event of calendarEvents) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      if (intervalsOverlap(sessionStart, sessionEffectiveEnd, eventStart, eventEnd)) {
        const conflictId = `conflict-session-${activeSession.id}-event-${event.id}`;
        conflicts.push({
          id: conflictId,
          conflictType: "SESSION_EVENT_COLLISION",
          severity: "HIGH",
          entities: [
            {
              type: "SESSION",
              id: activeSession.id,
              title: activeSession.task?.title ? `Sesi Fokus: ${activeSession.task.title}` : "Sesi Fokus Aktif",
              startTime: sessionStart,
              endTime: sessionEffectiveEnd,
            },
            {
              type: "CALENDAR_EVENT",
              id: event.id,
              title: event.title,
              startTime: eventStart,
              endTime: eventEnd,
            },
          ],
          startTime: new Date(Math.max(sessionStart.getTime(), eventStart.getTime())),
          endTime: new Date(Math.min(sessionEffectiveEnd.getTime(), eventEnd.getTime())),
          explanation: `Sesi fokus yang sedang aktif bertabrakan dengan agenda kalender "${event.title}".`,
        });
      }
    }
  }

  // Deterministic sort: HIGH severity first, then by startTime ASC
  const severityWeight: Record<ConflictSeverity, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  conflicts.sort((a, b) => {
    if (severityWeight[b.severity] !== severityWeight[a.severity]) {
      return severityWeight[b.severity] - severityWeight[a.severity];
    }
    return a.startTime.getTime() - b.startTime.getTime();
  });

  return conflicts;
}
