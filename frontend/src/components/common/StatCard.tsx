import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadow } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: number;
  trendLabel?: string;
  color?: string;
  isDark?: boolean;
  style?: ViewStyle;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendLabel,
  color = colors.primary,
  isDark = false,
  style,
}) => {
  const backgroundColor = isDark ? colors.card.dark : colors.card.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryColor = isDark ? colors.text.secondary.dark : colors.text.secondary.light;

  const trendColor = trend
    ? trend > 0
      ? colors.success
      : colors.error
    : secondaryColor;
  const trendArrow = trend ? (trend > 0 ? '↑' : '↓') : '';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        isDark ? styles.darkShadow : shadow.md,
        style,
      ]}>
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        )}
        {trend !== undefined && (
          <Text style={[styles.trend, { color: trendColor }]}>
            {trendArrow} {Math.abs(trend)}%
          </Text>
        )}
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={[styles.label, { color: secondaryColor }]}>{label}</Text>
      {trendLabel && (
        <Text style={[styles.trendLabel, { color: secondaryColor }]}>{trendLabel}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    flex: 1,
  },
  darkShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  trend: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  value: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    marginBottom: spacing[1],
  },
  label: {
    fontSize: fontSize.sm,
  },
  trendLabel: {
    fontSize: fontSize.xs,
    marginTop: spacing[1],
  },
});

export default StatCard;
