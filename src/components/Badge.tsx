import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Radius } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  style?: ViewStyle;
}

const VARIANT_STYLES = {
  primary: {
    bg: Colors.primaryLight,
    text: Colors.primary,
  },
  success: {
    bg: Colors.successBg,
    text: Colors.successText,
  },
  warning: {
    bg: Colors.warningBg,
    text: Colors.warningText,
  },
  error: {
    bg: Colors.errorBg,
    text: Colors.errorText,
  },
  neutral: {
    bg: Colors.gray100,
    text: Colors.gray500,
  },
};

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const { bg, text } = VARIANT_STYLES[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
