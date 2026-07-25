import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/user';
import { JWT_KEY } from '../lib/constants';
import { useWardrobeStore } from './wardrobeStore';
import { useFollowStore } from './followStore';
import { usePostStore } from './postStore';
import api from '../lib/axios';

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

    // Clear previous user data from local stores completely
    usePostStore.getState().clearPosts();
    useWardrobeStore.getState().clearWardrobe();

    set({ user, token, isAuthenticated: true });

    // Load wardrobe user namespace
    useWardrobeStore.getState().loadUserWardrobe(user.username || user.email);

    // Fetch wardrobe items and wishlist from server and sync to Zustand store
    try {
      const [wardrobeRes, wishlistRes] = await Promise.all([
        api.get('/api/wardrobe', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (Array.isArray(wardrobeRes.data)) {
        useWardrobeStore.getState().setItems(wardrobeRes.data);
      } else {
        useWardrobeStore.getState().setItems([]);
      }
      if (Array.isArray(wishlistRes.data)) {
        useWardrobeStore.getState().setWishlist(wishlistRes.data);
      } else {
        useWardrobeStore.getState().setWishlist([]);
      }
    } catch {
      // Server may be unavailable — keep clean
    }

    // Load following list from server
    useFollowStore.getState().loadFollowing(user.username || user.email);
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(JWT_KEY);
    useWardrobeStore.getState().clearWardrobe();
    usePostStore.getState().clearPosts();
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user }),
}));
