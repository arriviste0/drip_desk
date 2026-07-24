import { create } from 'zustand';
import { WardrobeItem } from '../types/item';

export interface SavedOutfit {
  id: string;
  name: string;
  items: WardrobeItem[];
  createdAt: string;
}

interface UserWardrobeData {
  items: WardrobeItem[];
  wishlist: WardrobeItem[];
  outfits: SavedOutfit[];
}

const userWardrobeCache: Record<string, UserWardrobeData> = {};

interface WardrobeState {
  currentUsername: string | null;
  items: WardrobeItem[];
  wishlist: WardrobeItem[];
  outfits: SavedOutfit[];

  loadUserWardrobe: (username: string) => void;
  clearWardrobe: () => void;

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

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  currentUsername: null,
  items: [],
  wishlist: [],
  outfits: [],

  loadUserWardrobe: (username: string) => {
    // If cache has data for this user, restore it; otherwise reset to empty for new user!
    const userData = userWardrobeCache[username] ?? { items: [], wishlist: [], outfits: [] };
    set({
      currentUsername: username,
      items: userData.items,
      wishlist: userData.wishlist,
      outfits: userData.outfits,
    });
  },

  clearWardrobe: () => {
    set({ currentUsername: null, items: [], wishlist: [], outfits: [] });
  },

  setItems: (items) => {
    const { currentUsername, wishlist, outfits } = get();
    if (currentUsername) userWardrobeCache[currentUsername] = { items, wishlist, outfits };
    set({ items });
  },

  addItem: (item) => {
    const newItems = [item, ...get().items];
    const { currentUsername, wishlist, outfits } = get();
    if (currentUsername) userWardrobeCache[currentUsername] = { items: newItems, wishlist, outfits };
    set({ items: newItems });
  },

  removeItem: (id) => {
    const newItems = get().items.filter((i) => i.id !== id);
    const { currentUsername, wishlist, outfits } = get();
    if (currentUsername) userWardrobeCache[currentUsername] = { items: newItems, wishlist, outfits };
    set({ items: newItems });
  },

  setWishlist: (wishlist) => {
    const { currentUsername, items, outfits } = get();
    if (currentUsername) userWardrobeCache[currentUsername] = { items, wishlist, outfits };
    set({ wishlist });
  },

  addToWishlist: (item) => {
    const newWishlist = [item, ...get().wishlist];
    const { currentUsername, items, outfits } = get();
    if (currentUsername) userWardrobeCache[currentUsername] = { items, wishlist: newWishlist, outfits };
    set({ wishlist: newWishlist });
  },

  removeFromWishlist: (id) => {
    const newWishlist = get().wishlist.filter((i) => i.id !== id);
    const { currentUsername, items, outfits } = get();
    if (currentUsername) userWardrobeCache[currentUsername] = { items, wishlist: newWishlist, outfits };
    set({ wishlist: newWishlist });
  },

  moveWishlistToCloset: (id) => {
    const state = get();
    const itemToMove = state.wishlist.find((i) => i.id === id);
    if (!itemToMove) return;
    const updatedItem: WardrobeItem = { ...itemToMove, isWishlist: false };
    const newWishlist = state.wishlist.filter((i) => i.id !== id);
    const newItems = [updatedItem, ...state.items];
    if (state.currentUsername) {
      userWardrobeCache[state.currentUsername] = { items: newItems, wishlist: newWishlist, outfits: state.outfits };
    }
    set({ wishlist: newWishlist, items: newItems });
  },

  addOutfit: (outfit) => {
    const newOutfits = [outfit, ...get().outfits];
    const { currentUsername, items, wishlist } = get();
    if (currentUsername) userWardrobeCache[currentUsername] = { items, wishlist, outfits: newOutfits };
    set({ outfits: newOutfits });
  },

  removeOutfit: (id) => {
    const newOutfits = get().outfits.filter((o) => o.id !== id);
    const { currentUsername, items, wishlist } = get();
    if (currentUsername) userWardrobeCache[currentUsername] = { items, wishlist, outfits: newOutfits };
    set({ outfits: newOutfits });
  },
}));
