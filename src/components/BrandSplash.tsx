import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Keep the native splash up until our full-screen overlay has been laid out.
SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_VISIBLE_MS = 800;
const FADE_MS = 300;

type Props = {
  /** True once auth/session loading has finished. */
  ready: boolean;
  children: React.ReactNode;
};

export function BrandSplash({ ready, children }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const shownAt = useRef<number | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [laidOut, setLaidOut] = useState(false);

  const onLayout = useCallback(() => {
    if (shownAt.current === null) {
      shownAt.current = Date.now();
      setLaidOut(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!ready || !laidOut || shownAt.current === null) return;
    const elapsed = Date.now() - shownAt.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => setOverlayVisible(false));
    }, wait);
    return () => clearTimeout(timer);
  }, [ready, laidOut, opacity]);

  return (
    <View style={styles.root}>
      {children}
      {overlayVisible && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity }]}
          pointerEvents="auto"
          onLayout={onLayout}
        >
          <Image
            source={require('../../assets/splash-full.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
