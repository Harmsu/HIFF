import type { FestivalEventWithTheater } from '../types';

interface TableViewProps {
  events: FestivalEventWithTheater[];
  onEdit: (event: FestivalEventWithTheater) => void;
  onDelete: (id: string) => void;
  onInvite: (event: FestivalEventWithTheater) => void;
}

const TYPE_ICON: Record<string, string> = { elokuva: '🎬', ravintola: '🍽️', muu: '📌' };
const TYPE_ACCENT: Record<string, string> = {
  elokuva: 'bg-yellow-50 border-l-yellow-400',
  ravintola: 'bg-green-50 border-l-green-400',
  muu: 'bg-cyan-50 border-l-cyan-400',
};

function LinkOrText({ value }: { value: string }) {
  if (!value) return null;
  if (value.startsWith('http')) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline break-all">
        {value}
      </a>
    );
  }
  return <span className="break-words">{value}</span>;
}

function formatDate(date: string) {
  const [y, m, d] = date.split('-');
  return `${d}.${m}.${y}`;
}

export function TableView({ events, onEdit, onDelete, onInvite }: TableViewProps) {
  if (events.length === 0) {
    return <p className="text-center text-gray-500 py-8">Ei tapahtumia. Lisää ensimmäinen alta.</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className={`rounded-xl shadow-sm border border-gray-100 border-l-4 p-3 ${TYPE_ACCENT[event.type]}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium text-gray-800 break-words">
                <span className="mr-1">{TYPE_ICON[event.type]}</span>{event.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatDate(event.date)} · {event.startTime}–{event.endTime}
                {event.durationMinutes != null && ` (${event.durationMinutes} min)`}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onInvite(event)} title="Lähetä kalenterikutsu" className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600">📧</button>
              <button onClick={() => onEdit(event)} title="Muokkaa" className="p-1.5 rounded hover:bg-gray-100">✏️</button>
              <button onClick={() => onDelete(event.id)} title="Poista" className="p-1.5 rounded hover:bg-red-50 text-red-600">🗑️</button>
            </div>
          </div>

          {(event.theaterName || event.link) && (
            <div className="text-sm text-gray-600 mt-1.5 space-y-0.5">
              {event.theaterName && (
                <div>
                  📍 {event.theaterName}
                  {event.theaterLocation && <span className="text-gray-400"> — {event.theaterLocation}</span>}
                </div>
              )}
              {event.link && <div><LinkOrText value={event.link} /></div>}
            </div>
          )}

          {event.highlight && (
            <div className="text-sm font-semibold text-amber-700 bg-amber-50 rounded-md px-2 py-1 mt-1.5">
              {event.highlight}
            </div>
          )}

          {event.note && (
            <div className="text-sm text-gray-500 mt-1.5 break-words">{event.note}</div>
          )}
        </div>
      ))}
    </div>
  );
}
