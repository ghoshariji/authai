import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  isDark?: boolean;
  padding?: number;
  elevated?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  isDark = false,
  padding = spacing[4],
  elevated = true,
}) => {
  const backgroundColor = isDark ? colors.card.dark : colors.card.light;

  const cardContent = (
    <View
      style={[
        styles.card,
        { backgroundColor, padding },
        elevated && (isDark ? styles.darkShadow : shadow.md),
        style,
      ]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  darkShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default Card;
