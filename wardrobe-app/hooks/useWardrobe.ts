import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { WardrobeItem } from '../types/item';
import { useWardrobeStore } from '../store/wardrobeStore';
import { useAuthStore } from '../store/authStore';

export function useWardrobe() {
  const setItems = useWardrobeStore((s) => s.setItems);
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ['wardrobe', user?.username],
    queryFn: async () => {
      // Only fetch mock wardrobe for default demo user drip_user
      if (user && user.username !== 'drip_user') {
        return [];
      }
      const { data } = await api.get<WardrobeItem[]>('/api/wardrobe');
      return data;
    },
  });

  useEffect(() => {
    if (query.data && user?.username === 'drip_user') {
      setItems(query.data);
    }
  }, [query.data, user?.username]);

  return query;
}

export function useWishlist() {
  const setWishlist = useWardrobeStore((s) => s.setWishlist);
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ['wishlist', user?.username],
    queryFn: async () => {
      if (user && user.username !== 'drip_user') {
        return [];
      }
      const { data } = await api.get<WardrobeItem[]>('/api/wishlist');
      return data;
    },
  });

  useEffect(() => {
    if (query.data && user?.username === 'drip_user') {
      setWishlist(query.data);
    }
  }, [query.data, user?.username]);

  return query;
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
