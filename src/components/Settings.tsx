import { useState, useRef } from 'react';
import type { Festival } from '../types';
import type { ImportEventRow } from '../api/client';
import { api } from '../api/client';
import { parseCSV, rowsToImportEvents } from '../lib/csv';

interface SettingsProps {
  festivals: Festival[];
  onImport: (rows: ImportEventRow[]) => Promise<{ imported: number }>;
  onCreateFestival: (festival: Omit<Festival, 'id'>) => Promise<Festival>;
  onDeleteFestival: (id: string) => Promise<void>;
  onFestivalCreated?: (id: string) => void;
  username?: string;
  onSignOut?: () => void;
}

export function Settings({ festivals, onImport, onCreateFestival, onDeleteFestival, onFestivalCreated, username, onSignOut }: SettingsProps) {
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateFestival = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const created = await onCreateFestival({
        name,
        year: Number(year),
        startDate: startDate || null,
        endDate: endDate || null,
      });
      onFestivalCreated?.(created.id);
      setName('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Virhe tallennettaessa');
    } finally {
      setCreating(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        const { events, skipped } = rowsToImportEvents(rows);
        if (events.length === 0) {
          throw new Error('Tiedostossa ei ollut kelvollisia rivejä. Tarkista otsikkorivi.');
        }
        const result = await onImport(events);
        setStatus(`Tuotu ${result.imported} tapahtumaa${skipped > 0 ? ` (${skipped} riviä ohitettu puutteellisina)` : ''}.`);
      } catch (error) {
        setStatus('Virhe tuonnissa: ' + (error instanceof Error ? error.message : 'Tuntematon virhe'));
      } finally {
        setTimeout(() => setStatus(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDelete = async (festival: Festival) => {
    if (!window.confirm(`Poistetaanko "${festival.name} (${festival.year})" ja kaikki sen tapahtumat? Tätä ei voi perua.`)) {
      return;
    }
    await onDeleteFestival(festival.id);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Asetukset</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">CSV-tuonti</h2>
        <p className="text-sm text-gray-600 mb-4">
          Tuo aiempien vuosien tapahtumat CSV-tiedostosta. Otsikkorivin sarakkeet: festivaali, vuosi, tyyppi,
          pvm, nimi, linkki, paikka, sijainti, alku, loppu, kesto, huom, note. Puuttuvat festivaalit ja paikat
          luodaan automaattisesti, olemassa olevaa dataa ei korvata.
        </p>
        <button
          onClick={handleImportClick}
          className="w-full py-2 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Tuo CSV-tiedosto
        </button>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Lisää uusi festivaali</h2>
        <form onSubmit={handleCreateFestival} className="space-y-3">
          {createError && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{createError}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nimi</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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
          <button
            type="submit"
            disabled={creating}
            className="w-full py-2 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {creating ? 'Tallennetaan...' : 'Luo festivaali'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Festivaalit / vuodet</h2>
        {festivals.length === 0 && <p className="text-sm text-gray-500">Ei vielä festivaaleja.</p>}
        <ul className="divide-y divide-gray-100">
          {festivals.map((f) => (
            <li key={f.id} className="py-2 flex items-center justify-between gap-2">
              <span className="text-sm text-gray-700">{f.name} ({f.year})</span>
              <div className="flex gap-2">
                <a
                  href={api.exportEventsUrl(f.id)}
                  className="text-sm px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  onClick={(e) => {
                    // liitä token latauslinkkiin, koska <a>-lataus ei kulje fetch-clientin kautta
                    e.preventDefault();
                    const token = localStorage.getItem('token');
                    fetch(api.exportEventsUrl(f.id), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
                      .then((res) => res.blob())
                      .then((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${f.name}-${f.year}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      });
                  }}
                >
                  Vie CSV
                </a>
                <button
                  onClick={() => handleDelete(f)}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  Poista
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {username && onSignOut && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Tili</h2>
          <p className="text-sm text-gray-600 mb-4">
            Kirjautunut: <span className="font-medium">{username}</span>
          </p>
          <button
            onClick={onSignOut}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Kirjaudu ulos
          </button>
        </div>
      )}

      {status && (
        <div className="fixed bottom-24 left-4 right-4 bg-gray-800 text-white py-3 px-4 rounded-lg text-center shadow-lg">
          {status}
        </div>
      )}
    </div>
  );
}
