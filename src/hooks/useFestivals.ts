import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { Festival } from '../types';

export function useFestivals(enabled: boolean) {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFestivals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFestivals();
      setFestivals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tuntematon virhe');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchFestivals();
    } else {
      setLoading(false);
    }
  }, [enabled, fetchFestivals]);

  const addFestival = async (festival: Omit<Festival, 'id'>) => {
    const created = await api.createFestival(festival);
    setFestivals((prev) => [created, ...prev]);
    return created;
  };

  const updateFestival = async (id: string, festival: Omit<Festival, 'id'>) => {
    const updated = await api.updateFestival(id, festival);
    setFestivals((prev) => prev.map((f) => (f.id === id ? updated : f)));
  };

  const deleteFestival = async (id: string) => {
    await api.deleteFestival(id);
    setFestivals((prev) => prev.filter((f) => f.id !== id));
  };

  return { festivals, loading, error, addFestival, updateFestival, deleteFestival, refresh: fetchFestivals };
}
