import { User } from './user';
import { WardrobeItem } from './item';

export interface ShoppableTag {
  id: string;
  itemId: string;
  item?: WardrobeItem;
  x: number;
  y: number;
  listingId?: string;
}

export interface OutfitPost {
  id: string;
  author: User;
  imageUrl: string;
  caption?: string;
  tags: ShoppableTag[];
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  user: {
    username: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  images: string[];
  caption?: string;
  tags: ShoppableTag[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: Pick<User, 'id' | 'username' | 'avatar'>;
  body: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
}
