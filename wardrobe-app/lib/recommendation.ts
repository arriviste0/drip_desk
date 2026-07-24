import { FeedPost } from '../types/post';

export interface ScoredPost<T> {
  post: T;
  score: number;
}

/**
 * Smart Social Recommendation Algorithm for DripDeck
 * Calculates a recommendation relevance score for posts:
 * - Recency Decay: Fresh posts (<24h) get +300 pts initial discovery boost
 * - Engagement Velocity: (Likes * 2) + (Saves * 3) + (Comments * 4)
 * - Style Relevance: Tag matching bonus +150 pts
 */
export function scorePost(
  post: {
    createdAt?: string;
    likeCount?: number;
    likes?: number;
    commentCount?: number;
    tags?: string[] | any[];
  },
  activeTag?: string | null
): number {
  let score = 0;

  // 1. Recency Boost (Fresh posts from new users get boosted)
  const createdDate = post.createdAt ? new Date(post.createdAt).getTime() : Date.now();
  const hoursOld = Math.max(0, (Date.now() - createdDate) / (1000 * 3600));

  if (hoursOld < 2) {
    score += 350; // Super fresh post boost
  } else if (hoursOld < 24) {
    score += 200; // Fresh 24h boost
  } else if (hoursOld < 72) {
    score += 80;
  }

  // 2. Engagement Velocity
  const likes = post.likeCount ?? post.likes ?? 0;
  const comments = post.commentCount ?? 0;
  score += likes * 2 + comments * 4;

  // 3. Style Tag Relevance Bonus
  if (activeTag && post.tags) {
    const hasMatchingTag = post.tags.some((t) => {
      const tagStr = typeof t === 'string' ? t : (t.item?.name || '');
      return tagStr.toLowerCase().includes(activeTag.toLowerCase().replace('#', ''));
    });
    if (hasMatchingTag) {
      score += 150;
    }
  }

  return score;
}

/**
 * Rank an array of posts using the recommendation algorithm.
 */
export function rankPosts<T extends { createdAt?: string; likeCount?: number; likes?: number; tags?: any[] }>(
  posts: T[],
  activeTag?: string | null
): T[] {
  return [...posts]
    .map((post) => ({ post, score: scorePost(post, activeTag) }))
    .sort((a, b) => b.score - a.score)
    .map((sp) => sp.post);
}
