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

const INITIAL_USER_POSTS: FeedPost[] = [];

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
