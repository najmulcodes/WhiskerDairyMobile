import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, FontSize } from '../theme/colors';
import { useServerWaking, WAKING_MESSAGE } from '../lib/api';

interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export function Loader({
  fullScreen = false,
  message,
  size = 'large',
  color = Colors.primary,
}: LoaderProps) {
  const waking = useServerWaking();
  const shownMessage = waking ? WAKING_MESSAGE : message;

  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
        {shownMessage && <Text style={styles.message}>{shownMessage}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={color} />
      {shownMessage && <Text style={styles.message}>{shownMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
