import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  isDark?: boolean;
  transparent?: boolean;
  style?: ViewStyle;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  isDark = false,
  transparent = false,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const backgroundColor = transparent
    ? 'transparent'
    : isDark
    ? colors.surface.dark
    : colors.surface.light;
  const textColor = isDark ? colors.text.primary.dark : colors.text.primary.light;
  const borderColor = isDark ? colors.border.dark : colors.border.light;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingTop: insets.top + spacing[2],
          borderBottomColor: borderColor,
        },
        !transparent && styles.withBorder,
        style,
      ]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor}
      />
      <View style={styles.content}>
        <View style={styles.left}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.backIcon, { color: textColor }]}>←</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.center}>
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: isDark ? colors.text.secondary.dark : colors.text.secondary.light }]}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.right}>{rightAction}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  withBorder: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  left: {
    width: 40,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: spacing[1],
  },
  backIcon: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});

export default Header;
