import type { FestivalEventWithTheater } from '../types';

interface TableViewProps {
  events: FestivalEventWithTheater[];
  onEdit: (event: FestivalEventWithTheater) => void;
  onDelete: (id: string) => void;
  onInvite: (event: FestivalEventWithTheater) => void;
}

const TYPE_ICON: Record<string, string> = { elokuva: '🎬', ravintola: '🍽️', muu: '📌' };

function LinkOrText({ value }: { value: string }) {
  if (!value) return null;
  if (value.startsWith('http')) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
        {value.length > 40 ? `${value.slice(0, 40)}…` : value}
      </a>
    );
  }
  return <span>{value}</span>;
}

export function TableView({ events, onEdit, onDelete, onInvite }: TableViewProps) {
  if (events.length === 0) {
    return <p className="text-center text-gray-500 py-8">Ei tapahtumia. Lisää ensimmäinen alta.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="px-3 py-2">Pvm</th>
            <th className="px-3 py-2">Nimi</th>
            <th className="px-3 py-2">Linkki</th>
            <th className="px-3 py-2">Paikka</th>
            <th className="px-3 py-2">Alku</th>
            <th className="px-3 py-2">Loppu</th>
            <th className="px-3 py-2">Kesto</th>
            <th className="px-3 py-2">Huom</th>
            <th className="px-3 py-2">Note</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
              <td className="px-3 py-2 whitespace-nowrap">{event.date}</td>
              <td className="px-3 py-2 font-medium text-gray-800">
                <span className="mr-1">{TYPE_ICON[event.type]}</span>{event.name}
              </td>
              <td className="px-3 py-2 max-w-[160px]"><LinkOrText value={event.link} /></td>
              <td className="px-3 py-2">
                {event.theaterName}
                {event.theaterLocation && <div className="text-xs text-gray-400">{event.theaterLocation}</div>}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{event.startTime}</td>
              <td className="px-3 py-2 whitespace-nowrap">{event.endTime}</td>
              <td className="px-3 py-2 whitespace-nowrap">{event.durationMinutes != null ? `${event.durationMinutes} min` : ''}</td>
              <td className="px-3 py-2 font-semibold text-amber-700">{event.highlight}</td>
              <td className="px-3 py-2 text-gray-500 max-w-[200px]">{event.note}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="flex gap-1">
                  <button onClick={() => onInvite(event)} title="Lähetä kalenterikutsu" className="p-1.5 rounded hover:bg-violet-50 text-violet-600">📧</button>
                  <button onClick={() => onEdit(event)} title="Muokkaa" className="p-1.5 rounded hover:bg-gray-100">✏️</button>
                  <button onClick={() => onDelete(event.id)} title="Poista" className="p-1.5 rounded hover:bg-red-50 text-red-600">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
