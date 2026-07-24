export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  wardrobeCount: number;
  salesCount?: number;
  responseRate?: number;
  isFollowing?: boolean;
  isVerified?: boolean;
  visibility?: ProfileVisibility;
  createdAt: string;
}

export type ProfileVisibility = 'public' | 'friends' | 'private';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'offer' | 'sale' | 'mention';
  actor: Pick<User, 'id' | 'username' | 'avatar'>;
  entityId?: string;
  entityType?: 'post' | 'listing' | 'item';
  message: string;
  read: boolean;
  createdAt: string;
}
