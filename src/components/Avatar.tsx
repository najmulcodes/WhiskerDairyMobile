import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  StyleProp,
} from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '../theme/colors';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    '#ff7a5c',
    '#34d399',
    '#60a5fa',
    '#a78bfa',
    '#f472b6',
    '#fb923c',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Avatar({ src, name, size = 48, style, borderRadius }: AvatarProps) {
  const br = borderRadius ?? size * 0.4;
  const fontSize = size * 0.35;
  const imageStyle = style as StyleProp<ImageStyle>;

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[{ width: size, height: size, borderRadius: br }, imageStyle]}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: br,
          backgroundColor: getAvatarColor(name),
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
  },
});
