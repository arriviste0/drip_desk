import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useAuthStore } from '../store/authStore';
import { WardrobeItem } from '../types/item';
import { useEffect } from 'react';

export function useWardrobe() {
  const user = useAuthStore((s) => s.user);
  const setItems = useWardrobeStore((s) => s.setItems);

  const query = useQuery({
    queryKey: ['wardrobe', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await api.get<WardrobeItem[]>('/api/wardrobe');
      return data;
    },
    staleTime: 0,
  });

  // Sync server data into Zustand store whenever it changes
  useEffect(() => {
    if (query.data) {
      setItems(query.data);
    } else if (!user) {
      setItems([]);
    }
  }, [query.data, setItems, user]);

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useWishlist() {
  const user = useAuthStore((s) => s.user);
  const setWishlist = useWardrobeStore((s) => s.setWishlist);

  const query = useQuery({
    queryKey: ['wishlist', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await api.get<WardrobeItem[]>('/api/wishlist');
      return data;
    },
    staleTime: 0,
  });

  // Sync server data into Zustand store whenever it changes
  useEffect(() => {
    if (query.data) {
      setWishlist(query.data);
    } else if (!user) {
      setWishlist([]);
    }
  }, [query.data, setWishlist, user]);

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  const removeItem = useWardrobeStore((s) => s.removeItem);
  const removeFromWishlist = useWardrobeStore((s) => s.removeFromWishlist);

  return useMutation({
    mutationFn: async (id: string) => {
      // Optimistically update local store immediately
      removeItem(id);
      removeFromWishlist(id);
      await api.delete(`/api/items/${id}`).catch(() => {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}
