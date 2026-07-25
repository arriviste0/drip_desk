import { create } from 'zustand';

export interface Moodboard {
  id: string;
  name: string;
  coverImage?: string;
  itemCount: number;
  savedItemIds: string[];
  createdAt: string;
}

interface MoodboardState {
  boards: Moodboard[];
  createBoard: (name: string, initialItemId?: string, coverImage?: string) => Moodboard;
  pinToBoard: (boardId: string, itemId: string, imageUrl?: string) => void;
  removePinFromBoard: (boardId: string, itemId: string) => void;
}

const DEFAULT_BOARDS: Moodboard[] = [
  {
    id: 'b1',
    name: 'Fall Streetwear',
    coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=700',
    itemCount: 4,
    savedItemIds: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    name: 'Minimalist Fits',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=700',
    itemCount: 3,
    savedItemIds: [],
    createdAt: new Date().toISOString(),
  },
];

export const useMoodboardStore = create<MoodboardState>((set, get) => ({
  boards: DEFAULT_BOARDS,

  createBoard: (name, initialItemId, coverImage) => {
    const newBoard: Moodboard = {
      id: 'board_' + Date.now(),
      name: name.trim(),
      coverImage: coverImage ?? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=700',
      itemCount: initialItemId ? 1 : 0,
      savedItemIds: initialItemId ? [initialItemId] : [],
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ boards: [newBoard, ...state.boards] }));
    return newBoard;
  },

  pinToBoard: (boardId, itemId, imageUrl) => {
    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id === boardId) {
          const isAlreadyIn = b.savedItemIds.includes(itemId);
          const updatedIds = isAlreadyIn ? b.savedItemIds : [...b.savedItemIds, itemId];
          return {
            ...b,
            savedItemIds: updatedIds,
            itemCount: updatedIds.length,
            coverImage: imageUrl ?? b.coverImage,
          };
        }
        return b;
      }),
    }));
  },

  removePinFromBoard: (boardId, itemId) => {
    set((state) => ({
      boards: state.boards.map((b) => {
        if (b.id === boardId) {
          const updatedIds = b.savedItemIds.filter((id) => id !== itemId);
          return {
            ...b,
            savedItemIds: updatedIds,
            itemCount: updatedIds.length,
          };
        }
        return b;
      }),
    }));
  },
}));
