import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

interface BadgeProps {
  label: string;
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  color = '#FFFFFF',
  backgroundColor = colors.primary,
  size = 'md',
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        size === 'sm' && styles.small,
        style,
      ]}>
      <Text style={[styles.text, { color }, size === 'sm' && styles.smallText]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  smallText: {
    fontSize: 9,
  },
});

export default Badge;
