import type { FestivalEventWithTheater } from '../types';

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Palauttaa niiden eventtien id:t, jotka menevät ajallisesti päällekkäin jonkin toisen saman päivän eventin kanssa. */
export function findOverlappingIds(dayEvents: FestivalEventWithTheater[]): Set<string> {
  const overlapping = new Set<string>();
  for (let i = 0; i < dayEvents.length; i++) {
    for (let j = i + 1; j < dayEvents.length; j++) {
      const a = dayEvents[i];
      const b = dayEvents[j];
      const aStart = toMinutes(a.startTime);
      let aEnd = toMinutes(a.endTime);
      if (aEnd <= aStart) aEnd += 24 * 60;
      const bStart = toMinutes(b.startTime);
      let bEnd = toMinutes(b.endTime);
      if (bEnd <= bStart) bEnd += 24 * 60;
      if (aStart < bEnd && bStart < aEnd) {
        overlapping.add(a.id);
        overlapping.add(b.id);
      }
    }
  }
  return overlapping;
}

export function groupByDate(events: FestivalEventWithTheater[]): Map<string, FestivalEventWithTheater[]> {
  const map = new Map<string, FestivalEventWithTheater[]>();
  for (const event of events) {
    const list = map.get(event.date);
    if (list) {
      list.push(event);
    } else {
      map.set(event.date, [event]);
    }
  }
  return map;
}
