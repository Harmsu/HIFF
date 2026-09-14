import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { FestivalEventWithTheater, TicketMeta } from '../types';

export function useEventTickets(events: FestivalEventWithTheater[], refreshKey: number) {
  const [ticketsByEvent, setTicketsByEvent] = useState<Record<string, TicketMeta[]>>({});
  const movieIds = events.filter((e) => e.type === 'elokuva').map((e) => e.id);
  const key = movieIds.join(',');

  useEffect(() => {
    if (!key) {
      setTicketsByEvent({});
      return;
    }
    let cancelled = false;
    Promise.all(
      key.split(',').map((id) =>
        api.getTickets(id).then((tickets) => [id, tickets] as const).catch(() => [id, []] as const)
      )
    ).then((results) => {
      if (!cancelled) setTicketsByEvent(Object.fromEntries(results));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshKey]);

  return ticketsByEvent;
}
