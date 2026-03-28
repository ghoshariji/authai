import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { colors } from '../../theme/colors';
import { fontSize } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
  isDark?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({
  fullScreen = false,
  message,
  isDark = false,
  size = 'large',
  color = colors.primary,
}) => {
  if (fullScreen) {
    return (
      <Modal transparent visible animationType="fade">
        <View style={styles.fullScreenOverlay}>
          <View style={[styles.fullScreenContent, { backgroundColor: isDark ? colors.card.dark : colors.card.light }]}>
            <ActivityIndicator size={size} color={color} />
            {message && (
              <Text style={[styles.message, { color: isDark ? colors.text.primary.dark : colors.text.primary.light }]}>
                {message}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.message, { color: isDark ? colors.text.primary.dark : colors.text.primary.light }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContent: {
    padding: spacing[8],
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  inline: {
    padding: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: spacing[3],
    fontSize: fontSize.md,
    textAlign: 'center',
  },
});

export default Loader;
