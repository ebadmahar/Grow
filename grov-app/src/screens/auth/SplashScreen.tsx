import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme';
import { GrovMark } from '../../components/common/GrovMark';
import { useAuth } from '../../context/AuthContext';

export const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, token, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    if (!isLoading) {
      const timer = setTimeout(() => {
        if (token && user) {
          navigation.replace('MainApp');
        } else {
          navigation.replace('Welcome');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, token, user]);

  const fillWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background Glow */}
      <View style={styles.glowCircle} />

      <View style={styles.centerContent}>
        {/* Splash Mark */}
        <View style={styles.splashMark}>
          <GrovMark size={44} color={Colors.lime} strokeWidth={3} />
        </View>

        {/* Brand Name & Tagline */}
        <Text style={styles.splashName}>Grōv</Text>
        <Text style={styles.splashTagline}>Restoration in the field</Text>
      </View>

      {/* Bottom Loader Bar */}
      <View style={[styles.loaderTrack, { bottom: Math.max(insets.bottom + 48, 48) }]}>
        <Animated.View style={[styles.loaderFill, { width: fillWidth }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowCircle: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(200, 255, 85, 0.05)',
  },
  centerContent: {
    alignItems: 'center',
    gap: 12,
  },
  splashMark: {
    width: 86,
    height: 86,
    borderRadius: 26,
    backgroundColor: '#1E3228',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  splashName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#FFFFFF',
  },
  splashTagline: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.38)',
    letterSpacing: 0.2,
  },
  loaderTrack: {
    position: 'absolute',
    width: 40,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  loaderFill: {
    height: '100%',
    backgroundColor: Colors.lime,
    borderRadius: 999,
  },
});
