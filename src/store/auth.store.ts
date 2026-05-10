import { create } from 'zustand';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    Cookies.set('accessToken', data.accessToken, { expires: 1 });
    Cookies.set('refreshToken', data.refreshToken, { expires: 30 });
    const me = await api.get('/users/me');
    set({ user: me.data });
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    Cookies.set('accessToken', data.accessToken, { expires: 1 });
    Cookies.set('refreshToken', data.refreshToken, { expires: 30 });
    const me = await api.get('/users/me');
    set({ user: me.data });
  },

  logout: async () => {
    const refresh = Cookies.get('refreshToken');
    if (refresh) await api.delete('/auth/logout', { data: { refreshToken: refresh } }).catch(() => {});
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    set({ user: null });
  },

  fetchMe: async () => {
    try {
      const token = Cookies.get('accessToken');
      if (!token) { set({ loading: false }); return; }
      const { data } = await api.get('/users/me');
      set({ user: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
