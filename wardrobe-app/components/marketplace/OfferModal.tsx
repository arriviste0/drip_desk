import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { NBBottomSheet, NBButton, NBInput, useToast } from '../ui';
import { formatINR } from '../../lib/format';
import { colors } from '../../lib/theme';
import api from '../../lib/axios';

export interface OfferModalRef {
  expand: () => void;
  close: () => void;
}

interface OfferModalProps {
  listingId: string;
  price: number;
  onOfferSent?: () => void;
}

export const OfferModal = forwardRef<OfferModalRef, OfferModalProps>(
  ({ listingId, price, onOfferSent }, ref) => {
    const sheetRef = useRef<BottomSheet>(null);
    const showToast = useToast();

    const [amount, setAmount] = useState('');
    const [error, setError] = useState<string | undefined>();
    const [sending, setSending] = useState(false);

    useImperativeHandle(ref, () => ({
      expand: () => sheetRef.current?.expand(),
      close: () => sheetRef.current?.close(),
    }));

    async function handleSend() {
      const value = parseFloat(amount);
      if (!amount.trim() || isNaN(value) || value <= 0) {
        setError('Enter a valid offer amount');
        return;
      }
      setError(undefined);
      setSending(true);
      try {
        await api.post('/api/offers', { listingId, amount: value });
        showToast('Offer sent!', 'success');
        setAmount('');
        sheetRef.current?.close();
        onOfferSent?.();
      } catch (err: any) {
        const msg = err.response?.data?.message ?? 'Could not send offer';
        showToast(msg, 'error');
      } finally {
        setSending(false);
      }
    }

    return (
      <NBBottomSheet ref={sheetRef} snapPoints={['45%']}>
        <View style={{ padding: 20, gap: 16 }}>
          <Text style={{ fontFamily: 'DelaGothicOne', fontSize: 20, color: colors.black }}>
            Make an Offer
          </Text>
          <Text style={{ fontFamily: 'SpaceGrotesk-Medium', fontSize: 13, color: '#666' }}>
            Listed at {formatINR(price)}. Sellers are more likely to accept a fair offer.
          </Text>

          <NBInput
            label="Your offer (₹)"
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            error={error}
          />

          <NBButton
            label="Send Offer"
            variant="primary"
            fullWidth
            loading={sending}
            onPress={handleSend}
          />
        </View>
      </NBBottomSheet>
    );
  }
);

OfferModal.displayName = 'OfferModal';
