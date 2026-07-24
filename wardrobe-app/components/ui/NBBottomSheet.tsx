import React, { forwardRef, useCallback, useState } from 'react';
import { View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { colors } from '../../lib/theme';

interface NBBottomSheetProps {
  snapPoints: (string | number)[];
  children: React.ReactNode;
}

export const NBBottomSheet = forwardRef<BottomSheet, NBBottomSheetProps>(
  ({ snapPoints, children }, ref) => {
    const [currentIndex, setCurrentIndex] = useState(-1);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) =>
        currentIndex >= 0 ? (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.4}
          />
        ) : null,
      [currentIndex]
    );

    const renderHandle = useCallback(
      () => (
        <View
          style={{
            alignItems: 'center',
            paddingTop: 12,
            paddingBottom: 8,
            backgroundColor: colors.white,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
          }}
        >
          <View
            style={{
              width: 36,
              height: 5,
              backgroundColor: '#E5E7EB',
              borderRadius: 3,
            }}
          />
        </View>
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        index={-1}
        onChange={setCurrentIndex}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleComponent={renderHandle}
        backgroundStyle={{
          backgroundColor: colors.white,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

NBBottomSheet.displayName = 'NBBottomSheet';
