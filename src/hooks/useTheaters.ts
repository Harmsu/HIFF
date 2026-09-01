import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { Theater } from '../types';

export function useTheaters(enabled: boolean) {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTheaters = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTheaters();
      setTheaters(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchTheaters();
    } else {
      setLoading(false);
    }
  }, [enabled, fetchTheaters]);

  const addTheater = async (theater: Omit<Theater, 'id'>) => {
    const created = await api.createTheater(theater);
    setTheaters((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  };

  const updateTheater = async (id: string, theater: Omit<Theater, 'id'>) => {
    const updated = await api.updateTheater(id, theater);
    setTheaters((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const deleteTheater = async (id: string) => {
    await api.deleteTheater(id);
    setTheaters((prev) => prev.filter((t) => t.id !== id));
  };

  return { theaters, loading, addTheater, updateTheater, deleteTheater, refresh: fetchTheaters };
}
