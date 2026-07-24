import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeft } from 'phosphor-react-native';
import { useQuery } from '@tanstack/react-query';
import { NBAvatar, NBBadge, NBButton, NBCard, NBEmptyState } from '../../../components/ui';
import { OfferModal, OfferModalRef } from '../../../components/marketplace/OfferModal';
import { ListingCard, CONDITION_LABELS } from '../../../components/marketplace/ListingCard';
import { useToast } from '../../../components/ui';
import { formatINR } from '../../../lib/format';
import { colors } from '../../../lib/theme';
import api from '../../../lib/axios';
import { MarketplaceListing } from '../../../types/marketplace';

const SCREEN_W = Dimensions.get('window').width;

function Carousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  return (
    <View style={{ width: SCREEN_W, height: SCREEN_W }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
        scrollEventThrottle={16}
      >
        {images.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={{ width: SCREEN_W, height: SCREEN_W }}
            contentFit="cover"
            placeholder={{ blurhash: 'LGF5?xYk^6#M@-5c,1J5@[or[Q6.' }}
            transition={200}
          />
        ))}
      </ScrollView>

      {images.length > 1 ? (
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 5,
          }}
          pointerEvents="none"
        >
          {images.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === index ? colors.yellow : 'rgba(255,255,255,0.7)',
                borderWidth: 1,
                borderColor: i === index ? colors.black : 'transparent',
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function DetailCell({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ width: '50%', paddingVertical: 8 }}>
      <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 11, color: '#888', marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top } = useSafeAreaInsets();
  const showToast = useToast();
  const offerRef = useRef<OfferModalRef>(null);
  const [buying, setBuying] = useState(false);

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<MarketplaceListing>(`/api/listings/${id}`);
      return data;
    },
  });

  const sellerUsername = listing?.seller.username;
  const { data: sellerListings } = useQuery({
    queryKey: ['listings', 'seller', sellerUsername],
    enabled: !!sellerUsername,
    queryFn: async () => {
      const { data } = await api.get<MarketplaceListing[]>(`/api/users/${sellerUsername}/listings`);
      return data;
    },
  });

  async function handleBuyNow() {
    if (!listing) return;
    setBuying(true);
    try {
      await api.post('/api/orders', { listingId: listing.id });
      showToast('Order placed!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Could not complete purchase';
      showToast(msg, 'error');
    } finally {
      setBuying(false);
    }
  }

  if (isLoading || !listing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.offwhite, alignItems: 'center', justifyContent: 'center' }}>
        {isError ? (
          <NBEmptyState title="Listing unavailable" body="This item may have been removed" cta="Go back" onCta={() => router.back()} />
        ) : (
          <ActivityIndicator color={colors.black} size="large" />
        )}
      </View>
    );
  }

  const { item, seller } = listing;
  const otherListings = (sellerListings ?? []).filter((l) => l.id !== listing.id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.offwhite }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Carousel images={[item.imageUrl]} />

        <View style={{ padding: 16, gap: 16 }}>
          {/* Seller */}
          <Pressable
            onPress={() => router.push(`/user/${seller.username}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <NBAvatar uri={seller.avatar} size="md" isVerified={seller.isVerified} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                @{seller.username}
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#888', marginTop: 2 }}>
                {seller.salesCount ?? 0} sales · {seller.responseRate ?? 0}% response rate
              </Text>
            </View>
          </Pressable>

          {/* Title + price */}
          <View>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: colors.black, marginBottom: 4 }}>
              {item.name}
            </Text>
            <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 24, color: colors.black }}>
              {formatINR(listing.price)}
            </Text>
          </View>

          {/* Item details */}
          <NBCard>
            <View style={{ padding: 16 }}>
              <View style={{ marginBottom: 8 }}>
                <NBBadge label={CONDITION_LABELS[listing.condition]} variant="new" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <DetailCell label="Size" value={item.size} />
                <DetailCell label="Brand" value={item.brand} />
                <DetailCell label="Material" value={item.material} />
                <DetailCell label="Category" value={item.category} />
              </View>
            </View>
          </NBCard>

          {listing.description ? (
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 14, color: '#444', lineHeight: 21 }}>
              {listing.description}
            </Text>
          ) : null}

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <NBButton label="Make an Offer" variant="secondary" fullWidth onPress={() => offerRef.current?.expand()} />
            </View>
            <View style={{ flex: 1 }}>
              <NBButton label="Buy Now" variant="primary" fullWidth loading={buying} onPress={handleBuyNow} />
            </View>
          </View>

          {/* More from seller */}
          {otherListings.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 16, color: colors.black, marginBottom: 12 }}>
                More from @{seller.username}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4, paddingBottom: 6 }}>
                {otherListings.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    width={150}
                    onPress={() => router.push(`/(modals)/marketplace/${l.id}`)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Floating back button */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={{
          position: 'absolute',
          top: top + 8,
          left: 16,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.white,
          borderWidth: 2,
          borderColor: colors.black,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.black,
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 4,
        }}
      >
        <CaretLeft color={colors.black} size={22} weight="bold" />
      </Pressable>

      <OfferModal ref={offerRef} listingId={listing.id} price={listing.price} />
    </View>
  );
}
