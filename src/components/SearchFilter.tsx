import type { EventType, Theater } from '../types';

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: EventType | 'kaikki';
  onTypeFilterChange: (value: EventType | 'kaikki') => void;
  theaterFilter: string;
  onTheaterFilterChange: (value: string) => void;
  theaters: Theater[];
}

export function SearchFilter({
  search, onSearchChange, typeFilter, onTypeFilterChange, theaterFilter, onTheaterFilterChange, theaters,
}: SearchFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Hae nimellä..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500"
      />
      <select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value as EventType | 'kaikki')}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500"
      >
        <option value="kaikki">Kaikki tyypit</option>
        <option value="elokuva">🎬 Elokuva</option>
        <option value="ravintola">🍽️ Ravintola</option>
        <option value="muu">📌 Muu</option>
      </select>
      <select
        value={theaterFilter}
        onChange={(e) => onTheaterFilterChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500"
      >
        <option value="">Kaikki paikat</option>
        {theaters.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}
