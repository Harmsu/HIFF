import { useState } from 'react';
import type { FestivalEventWithTheater } from '../types';

interface SendInviteModalProps {
  event: FestivalEventWithTheater;
  defaultEmail: string;
  onSend: (id: string, email: string) => Promise<void>;
  onClose: () => void;
}

export function SendInviteModal({ event, defaultEmail, onSend, onClose }: SendInviteModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await onSend(event.id, email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lähetys epäonnistui');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-sm rounded-xl p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Lähetä kalenterikutsu</h2>
        <p className="text-sm text-gray-500 mb-4">{event.name} — {event.date} klo {event.startTime}</p>

        {sent ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Kutsu lähetetty osoitteeseen {email}.
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
            >
              Sulje
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sähköpostiosoite</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={sending}
                className="flex-1 py-2.5 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {sending ? 'Lähetetään...' : 'Lähetä'}
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
        )}
      </div>
    </div>
  );
}
