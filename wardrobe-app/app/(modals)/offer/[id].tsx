import {
  ActivityIndicator,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NBAvatar, NBButton, NBCard, NBEmptyState, useToast } from '../../../components/ui';
import { ScreenHeader } from '../../../components/profile/ScreenHeader';
import { formatINR } from '../../../lib/format';
import { colors } from '../../../lib/theme';
import api from '../../../lib/axios';
import { Offer } from '../../../types/marketplace';

type Decision = 'accepted' | 'rejected';

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const showToast = useToast();
  const queryClient = useQueryClient();

  const { data: offer, isLoading, isError } = useQuery({
    queryKey: ['offer', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<Offer>(`/api/offers/${id}`);
      return data;
    },
  });

  const decide = useMutation({
    mutationFn: async (status: Decision) => {
      await api.patch(`/api/offers/${id}`, { status });
      return status;
    },
    onSuccess: (status) => {
      showToast(status === 'accepted' ? 'Offer accepted!' : 'Offer declined', 'success');
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      router.back();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message ?? 'Could not update offer';
      showToast(msg, 'error');
    },
  });

  if (isLoading || !offer) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.offwhite }}>
        <ScreenHeader title="OFFER" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {isError ? (
            <NBEmptyState title="Offer not found" cta="Go back" onCta={() => router.back()} />
          ) : (
            <ActivityIndicator color={colors.black} size="large" />
          )}
        </View>
      </View>
    );
  }

  const { buyer, listing } = offer;
  const pending = offer.status === 'pending';

  return (
    <View style={{ flex: 1, backgroundColor: colors.offwhite }}>
      <ScreenHeader title="OFFER" />

      <View style={{ padding: 16, gap: 16, flex: 1 }}>
        {/* Offer amount */}
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#888' }}>
            Offer amount
          </Text>
          <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 36, color: colors.black, marginTop: 4 }}>
            {formatINR(offer.amount)}
          </Text>
          {listing ? (
            <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#888', marginTop: 2 }}>
              Listed at {formatINR(listing.price)}
            </Text>
          ) : null}
        </View>

        {/* Buyer */}
        <NBCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
            <NBAvatar uri={buyer.avatar} size="md" isVerified={buyer.isVerified} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: colors.black }}>
                {buyer.displayName}
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#888', marginTop: 2 }}>
                @{buyer.username}
              </Text>
            </View>
          </View>
        </NBCard>

        {/* Item preview */}
        {listing ? (
          <NBCard>
            <View style={{ flexDirection: 'row', gap: 12, padding: 14 }}>
              <View style={{ width: 72, height: 72, borderRadius: 10, borderWidth: 2, borderColor: colors.black, overflow: 'hidden', backgroundColor: colors.offwhite }}>
                <Image source={{ uri: listing.item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: colors.black }} numberOfLines={2}>
                  {listing.item.name}
                </Text>
                {listing.item.brand ? (
                  <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 12, color: '#888', marginTop: 2 }}>
                    {listing.item.brand}
                  </Text>
                ) : null}
              </View>
            </View>
          </NBCard>
        ) : null}

        {offer.message ? (
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontStyle: 'italic', fontSize: 14, color: '#444', lineHeight: 21 }}>
            “{offer.message}”
          </Text>
        ) : null}

        <View style={{ flex: 1 }} />

        {pending ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <NBButton
                label="Decline"
                variant="danger"
                fullWidth
                loading={decide.isPending && decide.variables === 'rejected'}
                onPress={() => decide.mutate('rejected')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <NBButton
                label="Accept"
                variant="primary"
                fullWidth
                loading={decide.isPending && decide.variables === 'accepted'}
                onPress={() => decide.mutate('accepted')}
              />
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: '#888' }}>
              This offer is {offer.status}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
