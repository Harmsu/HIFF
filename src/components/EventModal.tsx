import { useState, useEffect } from 'react';
import type { EventType, FestivalEventWithTheater, Theater } from '../types';

interface EventModalProps {
  festivalId: string;
  theaters: Theater[];
  editingEvent: FestivalEventWithTheater | null;
  onSave: (data: {
    festivalId: string;
    type: EventType;
    date: string;
    name: string;
    link: string;
    theaterId: string | null;
    startTime: string;
    endTime: string;
    durationMinutes: number | null;
    highlight: string;
    note: string;
  }) => Promise<void>;
  onCreateTheater: (theater: { name: string; location: string }) => Promise<Theater>;
  onClose: () => void;
}

const NEW_THEATER = '__new__';

function calcDuration(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  return minutes;
}

export function EventModal({ festivalId, theaters, editingEvent, onSave, onCreateTheater, onClose }: EventModalProps) {
  const [type, setType] = useState<EventType>(editingEvent?.type ?? 'elokuva');
  const [date, setDate] = useState(editingEvent?.date ?? '');
  const [name, setName] = useState(editingEvent?.name ?? '');
  const [link, setLink] = useState(editingEvent?.link ?? '');
  const [theaterId, setTheaterId] = useState(editingEvent?.theaterId ?? '');
  const [newTheaterName, setNewTheaterName] = useState('');
  const [newTheaterLocation, setNewTheaterLocation] = useState('');
  const [startTime, setStartTime] = useState(editingEvent?.startTime ?? '');
  const [endTime, setEndTime] = useState(editingEvent?.endTime ?? '');
  const [durationMinutes, setDurationMinutes] = useState<string>(
    editingEvent?.durationMinutes != null ? String(editingEvent.durationMinutes) : ''
  );
  const [durationManuallySet, setDurationManuallySet] = useState(editingEvent?.durationMinutes != null);
  const [highlight, setHighlight] = useState(editingEvent?.highlight ?? '');
  const [note, setNote] = useState(editingEvent?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!durationManuallySet) {
      const calculated = calcDuration(startTime, endTime);
      setDurationMinutes(calculated != null ? String(calculated) : '');
    }
  }, [startTime, endTime, durationManuallySet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      let finalTheaterId: string | null = theaterId || null;
      if (theaterId === NEW_THEATER) {
        if (!newTheaterName.trim()) {
          throw new Error('Uuden paikan nimi vaaditaan');
        }
        const created = await onCreateTheater({ name: newTheaterName.trim(), location: newTheaterLocation.trim() });
        finalTheaterId = created.id;
      }
      await onSave({
        festivalId,
        type,
        date,
        name,
        link,
        theaterId: finalTheaterId,
        startTime,
        endTime,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        highlight,
        note,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Virhe tallennettaessa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">
            {editingEvent ? 'Muokkaa tapahtumaa' : 'Uusi tapahtuma'}
          </h2>

          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tyyppi</label>
            <div className="flex gap-2">
              {(['elokuva', 'ravintola', 'muu'] as EventType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                    type === t
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {t === 'elokuva' ? '🎬 Elokuva' : t === 'ravintola' ? '🍽️ Ravintola' : '📌 Muu'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nimi</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Linkki (URL tai vapaa teksti)</label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https:// tai esim. White Snail"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Paikka</label>
              <select
                value={theaterId}
                onChange={(e) => setTheaterId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Ei paikkaa</option>
                {theaters.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.location ? ` — ${t.location}` : ''}
                  </option>
                ))}
                <option value={NEW_THEATER}>+ Uusi paikka...</option>
              </select>
            </div>
            {theaterId === NEW_THEATER && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Uuden paikan nimi</label>
                  <input
                    value={newTheaterName}
                    onChange={(e) => setNewTheaterName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sijainti</label>
                  <input
                    value={newTheaterLocation}
                    onChange={(e) => setNewTheaterLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pvm</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Alku</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Loppu</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Kesto (min)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => {
                  setDurationMinutes(e.target.value);
                  setDurationManuallySet(true);
                }}
                placeholder="Lasketaan automaattisesti alku/loppu-ajoista"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Huom (korostettu)</label>
              <input
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                placeholder="esim. Orion!!!"
                className="w-full px-3 py-2 border border-amber-300 bg-amber-50 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Muu tieto</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Tallennetaan...' : 'Tallenna'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            >
              Peruuta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
