import type { FestivalEventWithTheater } from '../types';
import { findOverlappingIds, groupByDate, layoutDayEvents } from '../lib/overlap';

interface CalendarViewProps {
  events: FestivalEventWithTheater[];
  onEdit: (event: FestivalEventWithTheater) => void;
  onInvite: (event: FestivalEventWithTheater) => void;
}

const TYPE_COLOR: Record<string, string> = {
  elokuva: 'bg-yellow-100 border-yellow-400 text-yellow-900',
  ravintola: 'bg-green-100 border-green-400 text-green-900',
  muu: 'bg-cyan-100 border-cyan-400 text-cyan-900',
};

const HOUR_HEIGHT = 56; // px per tunti

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function dayRange(dayEvents: FestivalEventWithTheater[]): { startHour: number; endHour: number } {
  let minStart = Infinity;
  let maxEnd = -Infinity;
  for (const event of dayEvents) {
    const start = toMinutes(event.startTime);
    let end = toMinutes(event.endTime);
    if (end <= start) end += 24 * 60;
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;
  }
  // Näytä päivä alkaen tunti ennen ensimmäistä tapahtumaa, jotta scrollausta ei tarvita
  const startHour = Math.max(Math.floor(minStart / 60) - 1, 0);
  return { startHour, endHour: Math.ceil(maxEnd / 60) };
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('fi-FI', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function CalendarView({ events, onEdit, onInvite }: CalendarViewProps) {
  const grouped = groupByDate(events);
  const dates = [...grouped.keys()].sort();

  if (dates.length === 0) {
    return <p className="text-center text-gray-500 py-8">Ei tapahtumia näytettäväksi kalenterissa.</p>;
  }

  return (
    <div className="space-y-6">
      {dates.map((date) => {
        const dayEvents = grouped.get(date)!;
        const overlapping = findOverlappingIds(dayEvents);
        const layout = layoutDayEvents(dayEvents);
        const { startHour, endHour } = dayRange(dayEvents);
        const totalHours = endHour - startHour;
        const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

        return (
          <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2 bg-yellow-100 border-b border-yellow-300 font-semibold text-gray-800 capitalize">
              {formatDateHeader(date)}
              {overlapping.size > 0 && (
                <span className="ml-2 text-red-600 text-sm font-normal">⚠️ Päällekkäisyys</span>
              )}
            </div>
            <div className="flex">
              <div className="w-14 flex-shrink-0 border-r border-gray-100 relative" style={{ height: totalHours * HOUR_HEIGHT }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 text-xs text-gray-400 -translate-y-1/2 text-right pr-1"
                    style={{ top: (h - startHour) * HOUR_HEIGHT }}
                  >
                    {String(h % 24).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              <div className="flex-1 relative" style={{ height: totalHours * HOUR_HEIGHT }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: (h - startHour) * HOUR_HEIGHT }}
                  />
                ))}
                {dayEvents.map((event) => {
                  const start = toMinutes(event.startTime);
                  let end = toMinutes(event.endTime);
                  if (end <= start) end += 24 * 60;
                  const top = ((start - startHour * 60) / 60) * HOUR_HEIGHT;
                  const height = Math.max(((end - start) / 60) * HOUR_HEIGHT, 28);
                  const isOverlapping = overlapping.has(event.id);
                  const { col, colCount } = layout.get(event.id)!;
                  const widthPercent = 100 / colCount;
                  const leftPercent = col * widthPercent;

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEdit(event)}
                      className={`absolute rounded-lg border-l-4 px-2 py-1 text-left text-xs overflow-hidden ${TYPE_COLOR[event.type]} ${
                        isOverlapping ? 'ring-2 ring-red-500' : ''
                      }`}
                      style={{
                        top,
                        height,
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
                      }}
                    >
                      <div className="font-semibold truncate">
                        {isOverlapping && '⚠️ '}{event.name}
                      </div>
                      <div className="truncate opacity-80">
                        {event.startTime}–{event.endTime}{event.theaterName ? ` · ${event.theaterName}` : ''}
                      </div>
                      {event.highlight && <div className="truncate font-bold">{event.highlight}</div>}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); onInvite(event); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onInvite(event); } }}
                        className="absolute top-1 right-1 opacity-70 hover:opacity-100"
                        title="Lähetä kalenterikutsu"
                      >
                        📧
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
