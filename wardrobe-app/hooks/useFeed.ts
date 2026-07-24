import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { FeedPost } from '../types/post';
import { usePostStore } from '../store/postStore';

interface FeedPage {
  posts: FeedPost[];
  nextCursor: string | null;
}

export function useFeed() {
  const localPosts = usePostStore((s) => s.localPosts);

  const query = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const url = pageParam ? `/api/feed?cursor=${pageParam}` : '/api/feed';
      const { data } = await api.get<FeedPage>(url);
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const serverPosts = query.data?.pages.flatMap((p) => p.posts) ?? [];
  // Prepend locally created posts so they appear at the top immediately
  const posts = [...localPosts, ...serverPosts];

  return { ...query, posts };
}
