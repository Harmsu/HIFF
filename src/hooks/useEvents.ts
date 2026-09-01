import { useState, useEffect, useCallback } from 'react';
import { api, type EventInput, type ImportEventRow } from '../api/client';
import type { FestivalEventWithTheater } from '../types';

export function useEvents(festivalId: string | null) {
  const [events, setEvents] = useState<FestivalEventWithTheater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!festivalId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEvents(festivalId);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tuntematon virhe');
    } finally {
      setLoading(false);
    }
  }, [festivalId]);

  useEffect(() => {
    if (festivalId) {
      fetchEvents();
    } else {
      setEvents([]);
      setLoading(false);
    }
  }, [festivalId, fetchEvents]);

  const addEvent = async (event: EventInput) => {
    const created = await api.createEvent(event);
    setEvents((prev) => [...prev, created].sort(sortByDateTime));
    return created;
  };

  const updateEvent = async (id: string, event: EventInput) => {
    const updated = await api.updateEvent(id, event);
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)).sort(sortByDateTime));
  };

  const deleteEvent = async (id: string) => {
    await api.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const importEvents = async (rows: ImportEventRow[]) => {
    const result = await api.importEvents(rows);
    await fetchEvents();
    return result;
  };

  return { events, loading, error, addEvent, updateEvent, deleteEvent, importEvents, refresh: fetchEvents };
}

function sortByDateTime(a: FestivalEventWithTheater, b: FestivalEventWithTheater) {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return a.startTime.localeCompare(b.startTime);
}
