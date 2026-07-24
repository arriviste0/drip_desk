import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { WardrobeItem } from '../types/item';
import { useWardrobeStore } from '../store/wardrobeStore';

export function useWardrobe() {
  const setItems = useWardrobeStore((s) => s.setItems);

  const query = useQuery({
    queryKey: ['wardrobe'],
    queryFn: async () => {
      const { data } = await api.get<WardrobeItem[]>('/api/wardrobe');
      return data;
    },
  });

  useEffect(() => {
    if (query.data) setItems(query.data);
  }, [query.data]);

  return query;
}

export function useWishlist() {
  const setWishlist = useWardrobeStore((s) => s.setWishlist);

  const query = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get<WardrobeItem[]>('/api/wishlist');
      return data;
    },
  });

  useEffect(() => {
    if (query.data) setWishlist(query.data);
  }, [query.data]);

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
