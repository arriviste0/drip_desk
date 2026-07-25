import { create } from 'zustand';

interface FollowState {
  followingUsernames: string[];
  followUser: (username: string) => void;
  unfollowUser: (username: string) => void;
  toggleFollow: (username: string) => void;
  isFollowing: (username: string) => boolean;
  loadFollowing: (myUsername: string) => Promise<void>;
}

export const useFollowStore = create<FollowState>((set, get) => ({
  followingUsernames: [],

  loadFollowing: async (myUsername: string) => {
    try {
      const api = (await import('../lib/axios')).default;
      const { data } = await api.get(`/api/users/${myUsername}/following`);
      if (Array.isArray(data)) {
        set({ followingUsernames: data.map((u: any) => u.username) });
      }
    } catch {
      // Server unavailable — keep empty
    }
  },

  followUser: (username) =>
    set((state) => ({
      followingUsernames: state.followingUsernames.includes(username)
        ? state.followingUsernames
        : [...state.followingUsernames, username],
    })),
  unfollowUser: (username) =>
    set((state) => ({
      followingUsernames: state.followingUsernames.filter((u) => u !== username),
    })),
  toggleFollow: (username) => {
    const isCurrentlyFollowing = get().followingUsernames.includes(username);
    if (isCurrentlyFollowing) {
      get().unfollowUser(username);
    } else {
      get().followUser(username);
    }
  },
  isFollowing: (username) => get().followingUsernames.includes(username),
}));
