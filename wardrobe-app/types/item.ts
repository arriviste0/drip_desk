export type ClothingCategory =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories'
  | 'bags';

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | string;

export interface WardrobeItem {
  id: string;
  userId?: string;
  name: string;
  brand?: string;
  category: ClothingCategory;
  itemType?: string;
  color?: string[];
  primaryColor?: string;
  secondaryColor?: string;
  size?: ClothingSize;
  material?: string;
  pattern?: string;
  seasons?: string[];
  occasions?: string[];
  imageUrl: string;
  tags?: string[];
  wearCount: number;
  lastWornAt?: string;
  purchasePrice?: number;
  currency?: string;
  notes?: string;
  productUrl?: string;
  isForSale?: boolean;
  isWishlist?: boolean;
  createdAt: string;
  updatedAt: string;
}
