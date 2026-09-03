import type { Festival } from '../types';

interface FestivalSelectorProps {
  festivals: Festival[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FestivalSelector({ festivals, selectedId, onSelect }: FestivalSelectorProps) {
  return (
    <select
      value={selectedId ?? ''}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-yellow-500"
    >
      {festivals.length === 0 && <option value="">Ei festivaaleja</option>}
      {festivals.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}
