import { User } from './user';
import { WardrobeItem } from './item';

export type ListingCondition = 'new_with_tags' | 'like_new' | 'good' | 'fair';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';
export type ListingStatus = 'active' | 'sold' | 'reserved' | 'removed';

export interface MarketplaceListing {
  id: string;
  seller: User;
  item: WardrobeItem;
  price: number;
  condition: ListingCondition;
  description?: string;
  status: ListingStatus;
  offersCount: number;
  viewsCount: number;
  shippingPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  id: string;
  listingId: string;
  listing?: MarketplaceListing;
  buyer: User;
  amount: number;
  status: OfferStatus;
  message?: string;
  expiresAt: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  imageUrl?: string;
  readAt?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  listingId?: string;
  listing?: MarketplaceListing;
  updatedAt: string;
}
