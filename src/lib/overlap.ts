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

export interface EventLayout {
  col: number;
  colCount: number;
}

/** Sijoittaa saman päivän eventit sarakkeisiin niin, että ajallisesti päällekkäiset eivät koskaan jaa saraketta. */
export function layoutDayEvents(dayEvents: FestivalEventWithTheater[]): Map<string, EventLayout> {
  const layout = new Map<string, EventLayout>();
  if (dayEvents.length === 0) return layout;

  const withTimes = dayEvents.map((event) => {
    const start = toMinutes(event.startTime);
    let end = toMinutes(event.endTime);
    if (end <= start) end += 24 * 60;
    return { event, start, end };
  });

  const sorted = [...withTimes].sort((a, b) => a.start - b.start || a.end - b.end);

  const clusters: (typeof sorted)[] = [];
  let currentCluster: typeof sorted = [];
  let clusterEnd = -Infinity;

  for (const item of sorted) {
    if (currentCluster.length > 0 && item.start >= clusterEnd) {
      clusters.push(currentCluster);
      currentCluster = [];
      clusterEnd = -Infinity;
    }
    currentCluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  for (const cluster of clusters) {
    const columnEnds: number[] = [];
    const assigned: { id: string; col: number }[] = [];
    for (const item of cluster) {
      let col = columnEnds.findIndex((end) => end <= item.start);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(item.end);
      } else {
        columnEnds[col] = item.end;
      }
      assigned.push({ id: item.event.id, col });
    }
    const colCount = columnEnds.length;
    for (const { id, col } of assigned) {
      layout.set(id, { col, colCount });
    }
  }

  return layout;
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
