import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CoinIcon from '../components/CoinIcon';
import { useAuth } from '../context/AuthContext';
import { MOCK_PROFILES } from '../data/mockProfiles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COMPACT_PERKS = [
  { icon: 'shield-checkmark', label: '100% Private' },
  { icon: 'flash', label: 'Instant Connect' },
  { icon: 'checkmark-circle', label: 'Verified Hosts' },
];

export default function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleSignIn = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await loginWithGoogle();
    } catch (e) {
      setIsLoggingIn(false);
    }
  };

  // Hero model image for discreet ambient mood
  const heroAvatar = MOCK_PROFILES[0]?.avatar;

  return (
    <View style={styles.container}>
      {/* Mood Imagery with Deep Atmospheric Vignette */}
      <View style={styles.backgroundWrap}>
        {heroAvatar && (
          <Image
            source={{ uri: heroAvatar }}
            style={styles.heroImage}
            blurRadius={10}
          />
        )}
      </View>

      {/* Deep Vignette Overlay */}
      <LinearGradient
        colors={[
          'rgba(9, 7, 12, 0.40)',
          'rgba(9, 7, 12, 0.70)',
          'rgba(9, 7, 12, 0.95)',
          '#09070C',
        ]}
        locations={[0, 0.35, 0.68, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header: Subtle Live Online Indicator */}
        <View style={styles.topSection}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>2.8K ONLINE</Text>
          </View>
        </View>

        {/* Middle: DreamDate Brand Centered in the Screen */}
        <View style={styles.centerBrandSection}>
          <LinearGradient
            colors={['#F65592', '#FF70A0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <Ionicons name="videocam" size={32} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.brandTitle}>DreamDate</Text>
          <Text style={styles.brandSubtitle}>Direct, Private Video Calls</Text>
        </View>

        {/* Bottom: Details with Generous Spacing and Zero Borders */}
        <View style={styles.bottomSection}>
          {/* Perks Row with Generous Spacing and Borderless Pills */}
          <View style={styles.perksRow}>
            {COMPACT_PERKS.map((perk, idx) => (
              <View key={idx} style={styles.perkPill}>
                <Ionicons
                  name={perk.icon as any}
                  size={12}
                  color="#F65592"
                />
                <Text style={styles.perkLabel}>{perk.label}</Text>
              </View>
            ))}
          </View>

          {/* Borderless Welcome Bonus Chip */}
          <View style={styles.bonusChipWrap}>
            <View style={styles.bonusChip}>
              <CoinIcon size={14} />
              <Text style={styles.bonusText}>100 Free Welcome Coins on Sign In</Text>
            </View>
          </View>

          {/* Google Sign-In Action */}
          <TouchableOpacity
            style={styles.googleButton}
            activeOpacity={0.88}
            onPress={handleGoogleSignIn}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#1F1F1F" />
                <Text style={styles.googleBtnText}>Connecting...</Text>
              </View>
            ) : (
              <View style={styles.googleBtnInner}>
                <View style={styles.googleIconCircle}>
                  <Text style={styles.googleIconLetter}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Subtle 1-line Footer */}
          <Text style={styles.footerNote}>18+ Only · Encrypted · Discreet Billing</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09070C',
  },
  backgroundWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.65,
    opacity: 0.50,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },

  // Top Section
  topSection: {
    paddingTop: 12,
    alignItems: 'flex-start',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38ef7d',
  },
  liveText: {
    color: '#E0E0E0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Middle Section: Centered Brand Presentation
  centerBrandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Bottom Content Section with Generous Gaps & Zero Borders
  bottomSection: {
    gap: 18,
    paddingBottom: 20,
  },

  // Compact Perks Row (Borderless)
  perksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 4,
  },
  perkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  perkLabel: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Bonus Chip (Borderless & Centered)
  bonusChipWrap: {
    alignItems: 'center',
  },
  bonusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bonusText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Primary Button
  googleButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  googleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconLetter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  googleBtnText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerNote: {
    color: 'rgba(255, 255, 255, 0.38)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
