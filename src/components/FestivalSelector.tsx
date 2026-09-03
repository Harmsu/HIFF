import { useState } from 'react';
import type { Festival } from '../types';

interface FestivalSelectorProps {
  festivals: Festival[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (festival: Omit<Festival, 'id'>) => Promise<Festival>;
}

export function FestivalSelector({ festivals, selectedId, onSelect, onCreate }: FestivalSelectorProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const created = await onCreate({
        name,
        year: Number(year),
        startDate: startDate || null,
        endDate: endDate || null,
      });
      onSelect(created.id);
      setCreating(false);
      setName('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Virhe tallennettaessa');
    } finally {
      setSaving(false);
    }
  };

  if (creating) {
    return (
      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nimi</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="esim. HIFF 2026"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vuosi</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alkupvm (valinnainen)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Loppupvm (valinnainen)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Tallennetaan...' : 'Luo festivaali'}
          </button>
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            Peruuta
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-yellow-500"
      >
        {festivals.length === 0 && <option value="">Ei festivaaleja</option>}
        {festivals.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name} ({f.year})
          </option>
        ))}
      </select>
      <button
        onClick={() => setCreating(true)}
        className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 whitespace-nowrap"
      >
        + Uusi
      </button>
    </div>
  );
}
