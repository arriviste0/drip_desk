import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { FeedPost } from '../types/post';

interface FeedPage {
  posts: FeedPost[];
  nextCursor: string | null;
}

export function useFeed() {
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

  const posts = query.data?.pages.flatMap((p) => p.posts) ?? [];

  return { ...query, posts };
}
