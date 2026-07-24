import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { User } from '../types/user';
import { OutfitPost } from '../types/post';
import { useAuthStore } from '../store/authStore';

export interface ProfileStats {
  posts: number;
  outfits: number;
  wardrobeValue: number;
}

export type FollowListType = 'followers' | 'following';

/** Public profile for a given username (also used for the signed-in user). */
export function useUserProfile(username?: string) {
  return useQuery({
    queryKey: ['profile', username],
    enabled: !!username,
    queryFn: async () => {
      const { data } = await api.get<User>(`/api/users/${username}`);
      return data;
    },
  });
}

export function useProfileStats(username?: string) {
  return useQuery({
    queryKey: ['profile', username, 'stats'],
    enabled: !!username,
    queryFn: async () => {
      const { data } = await api.get<ProfileStats>(`/api/users/${username}/stats`);
      return data;
    },
  });
}

export function useUserPosts(username?: string) {
  return useQuery({
    queryKey: ['profile', username, 'posts'],
    enabled: !!username,
    queryFn: async () => {
      const { data } = await api.get<OutfitPost[]>(`/api/users/${username}/posts`);
      return data;
    },
  });
}

/** Followers / following list — only fetched while `enabled` (e.g. modal open). */
export function useFollowList(username: string | undefined, type: FollowListType, enabled: boolean) {
  return useQuery({
    queryKey: ['profile', username, type],
    enabled: enabled && !!username,
    queryFn: async () => {
      const { data } = await api.get<User[]>(`/api/users/${username}/${type}`);
      return data;
    },
  });
}

/** Follow / unfollow a user with optimistic update of the cached profile + own followingCount. */
export function useFollowMutation(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentlyFollowing: boolean) => {
      if (currentlyFollowing) {
        await api.delete(`/api/users/${username}/follow`);
      } else {
        await api.post(`/api/users/${username}/follow`);
      }
    },
    onMutate: async (currentlyFollowing) => {
      await queryClient.cancelQueries({ queryKey: ['profile', username] });

      // Optimistically update the target user's cached profile
      const previous = queryClient.getQueryData<User>(['profile', username]);
      if (previous) {
        queryClient.setQueryData<User>(['profile', username], {
          ...previous,
          isFollowing: !currentlyFollowing,
          followersCount: previous.followersCount + (currentlyFollowing ? -1 : 1),
        });
      }

      // Optimistically update the logged-in user's followingCount in auth store
      const me = useAuthStore.getState().user;
      if (me) {
        useAuthStore.getState().setUser({
          ...me,
          followingCount: Math.max(0, me.followingCount + (currentlyFollowing ? -1 : 1)),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['profile', username], context.previous);
      }
      // Revert auth store followingCount on error
      const me = useAuthStore.getState().user;
      const currentlyFollowing = context?.previous?.isFollowing ?? false;
      if (me) {
        useAuthStore.getState().setUser({
          ...me,
          followingCount: Math.max(0, me.followingCount + (currentlyFollowing ? 1 : -1)),
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      // Refresh the following list so the modal stays in sync
      queryClient.invalidateQueries({ queryKey: ['profile', undefined, 'following'] });
    },
  });
}
