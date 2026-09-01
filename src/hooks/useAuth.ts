import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUsername(null);
      setEmail('');
      setLoading(false);
      return;
    }
    api.me()
      .then((data) => {
        setUsername(data.username);
        setEmail(data.email);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const signIn = useCallback(async (username: string, password: string) => {
    const { token } = await api.login(username, password);
    localStorage.setItem('token', token);
    setToken(token);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUsername(null);
    setEmail('');
  }, []);

  return {
    user: token ? { username, email } : null,
    loading,
    signIn,
    signOut,
  };
}
