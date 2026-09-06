import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../theme';
import { GrovMark } from '../../components/common/GrovMark';
import { MaterialIcons } from '@expo/vector-icons';

export const WelcomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.welcomeShell}>
        {/* Top Hero Block */}
        <View style={styles.heroBlock}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          {/* Top Brand Tag inside Hero (Safe area adjusted) */}
          <View style={[styles.heroTop, { paddingTop: Math.max(insets.top + 12, 20) }]}>
            <View style={styles.heroMark}>
              <GrovMark size={18} color={Colors.lime} strokeWidth={2.2} />
            </View>
            <Text style={styles.heroBrandName}>Grōv</Text>
          </View>

          {/* Bottom Badges inside Hero */}
          <View style={styles.heroBottom}>
            <View style={styles.heroCaption}>
              <MaterialIcons name="verified" size={13} color="#1A6636" />
              <Text style={styles.heroCaptionText}>Field-ready reporting</Text>
            </View>
            <View style={styles.heroCounter}>
              <Text style={styles.heroCounterText}>74.5K Trees</Text>
            </View>
          </View>
        </View>

        {/* Content Block Below Hero */}
        <View style={[styles.contentBlock, { paddingBottom: Math.max(insets.bottom + 24, 32) }]}>
          <View style={styles.copyBlock}>
            <Text style={styles.entryKicker}>RESTORATION, TOGETHER</Text>
            <Text style={styles.entryH1}>Build the record.{"\n"}Grow the future.</Text>
            <Text style={styles.entrySub}>
              Log every action, add evidence, and return to see what takes root.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.88}
            >
              <Text style={styles.btnPrimaryText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signInLink}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.signInText}>
                Already have an account? <Text style={styles.signInSpan}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
  },
  welcomeShell: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  heroBlock: {
    height: 380,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 21, 18, 0.45)',
  },
  heroTop: {
    position: 'absolute',
    left: 20,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  heroMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBrandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroBottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCaption: {
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroCaptionText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.ink,
  },
  heroCounter: {
    backgroundColor: Colors.lime,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroCounterText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.ink,
  },
  contentBlock: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    justifyContent: 'space-between',
    minHeight: 300,
  },
  copyBlock: {
    gap: 10,
  },
  entryKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#6B8A68',
    textTransform: 'uppercase',
  },
  entryH1: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 38,
    color: Colors.text1,
  },
  entrySub: {
    fontSize: 14,
    color: '#6B8A68',
    lineHeight: 22,
  },
  actions: {
    gap: 10,
    marginTop: 24,
  },
  btnPrimary: {
    backgroundColor: Colors.ink,
    borderRadius: Radius.sm,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  signInLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signInText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B8A68',
  },
  signInSpan: {
    color: Colors.text1,
    fontWeight: '700',
  },
});
