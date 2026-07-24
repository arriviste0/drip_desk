import { create } from 'zustand';
import { FeedPost } from '../types/post';

interface PostState {
  localPosts: FeedPost[];
  addPost: (post: FeedPost) => void;
  editPost: (id: string, caption: string) => void;
  deletePost: (id: string) => void;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
}

const INITIAL_USER_POSTS: FeedPost[] = [
  {
    id: 'user-post-1',
    user: {
      username: 'drip_user',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
      isVerified: true,
    },
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=700'],
    caption: 'Oversized Vintage Bomber & Cargo Parachute Fit 🖤 #streetwear #OOTD',
    tags: [
      { id: 't1', itemId: 'n1', x: 0.5, y: 0.3 },
      { id: 't2', itemId: 'n2', x: 0.5, y: 0.7 },
    ],
    likeCount: 142,
    commentCount: 18,
    isLiked: true,
    isSaved: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'user-post-2',
    user: {
      username: 'drip_user',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
      isVerified: true,
    },
    images: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=700'],
    caption: 'Clean Girl Capsule Look ✨ Cashmere Knit & High-Waist Trousers #minimalist #cleanstyle',
    tags: [
      { id: 't3', itemId: 'c1', x: 0.5, y: 0.3 },
      { id: 't4', itemId: 'c2', x: 0.5, y: 0.7 },
    ],
    likeCount: 98,
    commentCount: 12,
    isLiked: false,
    isSaved: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

export const usePostStore = create<PostState>((set) => ({
  localPosts: INITIAL_USER_POSTS,
  addPost: (post) => set((s) => ({ localPosts: [post, ...s.localPosts] })),
  editPost: (id, caption) =>
    set((s) => ({
      localPosts: s.localPosts.map((p) => (p.id === id ? { ...p, caption } : p)),
    })),
  deletePost: (id) =>
    set((s) => ({
      localPosts: s.localPosts.filter((p) => p.id !== id),
    })),
  toggleLike: (id) =>
    set((s) => ({
      localPosts: s.localPosts.map((p) =>
        p.id === id
          ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) }
          : p
      ),
    })),
  toggleSave: (id) =>
    set((s) => ({
      localPosts: s.localPosts.map((p) =>
        p.id === id ? { ...p, isSaved: !p.isSaved } : p
      ),
    })),
}));
