import React from 'react';
import { View, StyleSheet, type DimensionValue, type ViewStyle } from 'react-native';

type Props = {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export default function SkeletonBlock({ width = '100%', height, borderRadius = 12, style }: Props) {
  return (
    <View
      style={[
        styles.block,
        { width, height, borderRadius },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
});