import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api, getToken } from '../api/client';
import type { TicketMeta } from '../types';

function useTicketImageSrc(eventId: string, slot: 1 | 2, uploadedAt: string | undefined) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!uploadedAt) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;

    fetch(api.ticketFileUrl(eventId, slot), {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('Lipun lataus epäonnistui'))))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [eventId, slot, uploadedAt]);

  return src;
}

function TicketLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 bg-black z-[70] flex items-center justify-center overflow-auto"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <img src={src} alt="Lippu" className="max-w-none w-auto h-auto" style={{ maxHeight: '100vh' }} />
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="fixed w-10 h-10 rounded-full bg-white/90 text-black text-xl leading-none"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
          right: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
        }}
      >
        ✕
      </button>
    </div>,
    document.body
  );
}

interface TicketSlotProps {
  eventId: string;
  slot: 1 | 2;
  ticket: TicketMeta | undefined;
  onChanged: () => void;
}

function TicketSlot({ eventId, slot, ticket, onChanged }: TicketSlotProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbSrc = useTicketImageSrc(eventId, slot, ticket?.uploadedAt);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await api.uploadTicket(eventId, slot, file);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Latausvirhe');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Poistetaanko lippu ${slot}?`)) return;
    setError(null);
    try {
      await api.deleteTicket(eventId, slot);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Poisto epäonnistui');
    }
  };

  return (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-1">Lippu {slot}</div>
      {ticket ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 shrink-0"
          >
            {thumbSrc && <img src={thumbSrc} alt={`Lippu ${slot}`} className="w-full h-full object-cover" />}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-600 hover:underline"
          >
            🗑️ Poista
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-2 px-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? 'Ladataan...' : '📎 Lisää lippu'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      {lightboxOpen && thumbSrc && <TicketLightbox src={thumbSrc} onClose={() => setLightboxOpen(false)} />}
    </div>
  );
}

interface TicketSectionProps {
  eventId: string;
}

export function TicketSection({ eventId }: TicketSectionProps) {
  const [tickets, setTickets] = useState<TicketMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getTickets(eventId);
      setTickets(data);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;

  const bySlot = (slot: 1 | 2) => tickets.find((t) => t.slot === slot);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">Liput</label>
      <div className="grid grid-cols-2 gap-3">
        <TicketSlot eventId={eventId} slot={1} ticket={bySlot(1)} onChanged={load} />
        <TicketSlot eventId={eventId} slot={2} ticket={bySlot(2)} onChanged={load} />
      </div>
    </div>
  );
}
