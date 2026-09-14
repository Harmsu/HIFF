import { useState } from 'react';
import { createPortal } from 'react-dom';
import { api, getToken } from '../api/client';
import type { TicketMeta } from '../types';

interface TicketQuickOpenProps {
  eventId: string;
  tickets: TicketMeta[];
  className?: string;
}

export function TicketQuickOpen({ eventId, tickets, className }: TicketQuickOpenProps) {
  const [open, setOpen] = useState(false);
  const [srcs, setSrcs] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (tickets.length === 0) return null;

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const blobs = await Promise.all(
        tickets.map((t) =>
          fetch(api.ticketFileUrl(eventId, t.slot), {
            headers: { Authorization: `Bearer ${getToken()}` },
          }).then((r) => r.blob())
        )
      );
      setSrcs(blobs.map((b) => URL.createObjectURL(b)));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    srcs?.forEach((s) => URL.revokeObjectURL(s));
    setSrcs(null);
  };

  const trigger = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    handleOpen();
  };

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={trigger}
        onKeyDown={(e) => {
          if (e.key === 'Enter') trigger(e);
        }}
        title="Näytä liput"
        className={className ?? 'p-1.5 rounded hover:bg-yellow-50 text-yellow-700 cursor-pointer'}
      >
        🎟️
      </span>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 bg-black z-[70] flex flex-col items-center justify-center overflow-auto gap-2 p-2"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
          >
            {loading && <p className="text-white">Ladataan...</p>}
            {srcs?.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Lippu ${i + 1}`}
                className="max-w-full object-contain"
                style={{ maxHeight: srcs.length > 1 ? '48vh' : '100vh' }}
              />
            ))}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClose(); }}
              className="fixed top-4 right-4 w-10 h-10 rounded-full bg-white/90 text-black text-xl leading-none"
            >
              ✕
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
