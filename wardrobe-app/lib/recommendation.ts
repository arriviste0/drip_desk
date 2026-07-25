import { FeedPost } from '../types/post';

export interface RecommendationContext {
  followedUsernames?: string[];
  userPreferredCategories?: string[];
  activeTag?: string | null;
}

/**
 * Advanced Instagram x Pinterest Recommendation Engine for DripDeck
 *
 * Algorithm Score Formula:
 *   Score = (S_Affinity + S_Follow + S_Velocity) * TimeDecay(hoursOld)
 *
 * Factors:
 * 1. Engagement Velocity: Likes * 2 + Comments * 4 + Pins * 6 (Pinterest Pins weighted highest)
 * 2. Follower Priority: +300 pts if creator is followed by user
 * 3. Style Affinity: +200 pts if post tags match user's preferred categories
 * 4. Recency Decay: smooth gravity decay curve 1 / (hoursOld + 2)^1.2
 */
export function scorePost(
  post: {
    user?: { username: string };
    createdAt?: string;
    likeCount?: number;
    likes?: number;
    commentCount?: number;
    pinCount?: number;
    tags?: string[] | any[];
    caption?: string;
  },
  context?: RecommendationContext | string | null
): number {
  const ctx: RecommendationContext = typeof context === 'string'
    ? { activeTag: context }
    : context ?? {};

  let baseScore = 0;

  // 1. Engagement Velocity (Pins > Comments > Likes)
  const likes = post.likeCount ?? post.likes ?? 0;
  const comments = post.commentCount ?? 0;
  const pins = post.pinCount ?? 0;
  baseScore += likes * 2 + comments * 4 + pins * 6;

  // 2. Follower Priority (+300 pts)
  if (post.user?.username && ctx.followedUsernames?.includes(post.user.username)) {
    baseScore += 300;
  }

  // 3. Category & Style Tag Affinity Bonus (+200 pts)
  if (post.tags) {
    const postTagStrings = post.tags.map((t) => {
      if (typeof t === 'string') return t.toLowerCase();
      return (t.item?.name || t.item?.category || '').toLowerCase();
    });

    if (ctx.activeTag) {
      const cleanActive = ctx.activeTag.toLowerCase().replace('#', '');
      const match = postTagStrings.some((str) => str.includes(cleanActive)) ||
        (post.caption && post.caption.toLowerCase().includes(cleanActive));
      if (match) baseScore += 200;
    }

    if (ctx.userPreferredCategories && ctx.userPreferredCategories.length > 0) {
      const categoryMatch = ctx.userPreferredCategories.some((cat) =>
        postTagStrings.some((str) => str.includes(cat.toLowerCase()))
      );
      if (categoryMatch) baseScore += 150;
    }
  }

  // 4. Recency Gravity Time Decay Curve: 1 / (hoursOld + 2)^1.2
  const createdDate = post.createdAt ? new Date(post.createdAt).getTime() : Date.now();
  const hoursOld = Math.max(0, (Date.now() - createdDate) / (1000 * 3600));

  // Base boost for new content (Discovery Boost for fresh posts)
  const freshBoost = hoursOld < 2 ? 350 : hoursOld < 24 ? 180 : 0;
  const decayFactor = 1 / Math.pow(hoursOld + 2, 1.2);

  return (baseScore + freshBoost) * decayFactor;
}

/**
 * Rank posts using the multi-factor recommendation algorithm.
 */
export function rankPosts<T extends { user?: { username: string }; createdAt?: string; likeCount?: number; likes?: number; commentCount?: number; tags?: any[] }>(
  posts: T[],
  context?: RecommendationContext | string | null
): T[] {
  return [...posts]
    .map((post) => ({ post, score: scorePost(post, context) }))
    .sort((a, b) => b.score - a.score)
    .map((sp) => sp.post);
}
