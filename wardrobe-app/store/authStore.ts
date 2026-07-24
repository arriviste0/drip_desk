import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/user';
import { JWT_KEY } from '../lib/constants';
import { useWardrobeStore } from './wardrobeStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async (token, user) => {
    await SecureStore.setItemAsync(JWT_KEY, token);
    useWardrobeStore.getState().loadUserWardrobe(user.username || user.email);
    set({ user, token, isAuthenticated: true });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(JWT_KEY);
    useWardrobeStore.getState().clearWardrobe();
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user }),
}));
