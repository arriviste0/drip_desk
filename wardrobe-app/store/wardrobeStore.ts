import { create } from 'zustand';
import { WardrobeItem } from '../types/item';

export interface SavedOutfit {
  id: string;
  name: string;
  items: WardrobeItem[];
  createdAt: string;
}

interface WardrobeState {
  items: WardrobeItem[];
  wishlist: WardrobeItem[];
  outfits: SavedOutfit[];
  setItems: (items: WardrobeItem[]) => void;
  addItem: (item: WardrobeItem) => void;
  removeItem: (id: string) => void;
  setWishlist: (items: WardrobeItem[]) => void;
  addToWishlist: (item: WardrobeItem) => void;
  removeFromWishlist: (id: string) => void;
  moveWishlistToCloset: (id: string) => void;
  addOutfit: (outfit: SavedOutfit) => void;
  removeOutfit: (id: string) => void;
}

export const useWardrobeStore = create<WardrobeState>((set) => ({
  items: [],
  wishlist: [],
  outfits: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  setWishlist: (wishlist) => set({ wishlist }),
  addToWishlist: (item) => set((state) => ({ wishlist: [item, ...state.wishlist] })),
  removeFromWishlist: (id) => set((state) => ({ wishlist: state.wishlist.filter((i) => i.id !== id) })),
  moveWishlistToCloset: (id) =>
    set((state) => {
      const itemToMove = state.wishlist.find((i) => i.id === id);
      if (!itemToMove) return state;
      const updatedItem: WardrobeItem = { ...itemToMove, isWishlist: false };
      return {
        wishlist: state.wishlist.filter((i) => i.id !== id),
        items: [updatedItem, ...state.items],
      };
    }),
  addOutfit: (outfit) => set((state) => ({ outfits: [outfit, ...state.outfits] })),
  removeOutfit: (id) => set((state) => ({ outfits: state.outfits.filter((o) => o.id !== id) })),
}));
