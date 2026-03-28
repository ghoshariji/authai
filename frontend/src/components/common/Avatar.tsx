import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { fontSize, fontWeight } from '../../theme/typography';
import { getInitials } from '../../utils/helpers';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({
  name,
  uri,
  size = 40,
  backgroundColor,
  style,
}) => {
  const bgColor = backgroundColor || colors.primary;
  const initials = getInitials(name);
  const textSize = size * 0.4;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
        style,
      ]}>
      <Text style={[styles.initials, { fontSize: textSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: fontWeight.bold,
  },
});

export default Avatar;
