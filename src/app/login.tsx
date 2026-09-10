import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CoinIcon from '../components/CoinIcon';
import LegalViewerModal from '../components/LegalViewerModal';
import { useAuth } from '../context/AuthContext';
import { MOCK_PROFILES } from '../data/mockProfiles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HIGHLIGHT_PERKS = [
  { emoji: '🔥', label: '10K+ Online', sub: 'Live Tonight' },
  { emoji: '💋', label: '1-on-1 Video', sub: 'Private Cam' },
  { emoji: '⚡', label: '3s Connect', sub: 'Instant Cam' },
];

export default function LoginScreen() {
  const { fastLogin } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy'>('terms');

  const handleToggleTerms = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setAcceptedTerms((prev) => !prev);
  };

  const openLegalDocument = (tab: 'terms' | 'privacy') => {
    setLegalModalTab(tab);
    setLegalModalVisible(true);
  };

  const handleFastLogin = async () => {
    if (!acceptedTerms) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      Alert.alert(
        'Agreement Required',
        'Please confirm you are 18+ and accept the User Agreement & Privacy Policy to enter DreamDate.'
      );
      return;
    }

    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await fastLogin(true);
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
            blurRadius={6}
          />
        )}
      </View>

      {/* Deep Vignette Gradient Overlay */}
      <LinearGradient
        colors={[
          'rgba(9, 7, 12, 0.30)',
          'rgba(9, 7, 12, 0.60)',
          'rgba(9, 7, 12, 0.90)',
          '#09070C',
        ]}
        locations={[0, 0.30, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header: 18+ Adult Badge & Live Online Counter */}
        <View style={styles.topSection}>
          <View style={styles.ageBadge}>
            <Text style={styles.ageBadgeText}>18+ ONLY</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>4,280 ONLINE NOW</Text>
          </View>
        </View>

        {/* Middle: Brand Section */}
        <View style={styles.centerBrandSection}>
          <LinearGradient
            colors={['#F65592', '#FF70A0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <Ionicons name="videocam" size={34} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.brandTitle}>DreamDate</Text>
          <Text style={styles.brandSubtitle}>Live 1-on-1 Private Video Calls</Text>
          <Text style={styles.brandCaption}>
            Connect face-to-face with stunning female companions tonight
          </Text>
        </View>

        {/* Bottom Section: Exciting Perks, Agreement Checkbox & Fast Login */}
        <View style={styles.bottomSection}>
          {/* Exciting Live Perks Row (Well spaced with 20px padding from screen edges) */}
          <View style={styles.perksRow}>
            {HIGHLIGHT_PERKS.map((perk, idx) => (
              <View key={idx} style={styles.perkCard}>
                <Text style={styles.perkEmoji}>{perk.emoji}</Text>
                <Text style={styles.perkLabel} numberOfLines={1}>
                  {perk.label}
                </Text>
                <Text style={styles.perkSub} numberOfLines={1}>
                  {perk.sub}
                </Text>
              </View>
            ))}
          </View>

          {/* Welcome Bonus Callout */}
          <View style={styles.bonusChipWrap}>
            <View style={styles.bonusChip}>
              <CoinIcon size={16} />
              <Text style={styles.bonusText}>100 Free Welcome Coins on Fast Login</Text>
            </View>
          </View>

          {/* Mandatory Single Checkbox for User Agreement & Privacy Policy */}
          <TouchableOpacity
            style={styles.agreementRow}
            onPress={handleToggleTerms}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkboxBox,
                acceptedTerms
                  ? styles.checkboxBoxChecked
                  : { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
              ]}
            >
              {acceptedTerms && (
                <Ionicons name="checkmark" size={15} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.agreementTextWrap}>
              <Text style={styles.agreementText}>
                I confirm I am 18+ and accept the{' '}
                <Text
                  style={styles.legalLink}
                  onPress={(e) => {
                    e.stopPropagation();
                    openLegalDocument('terms');
                  }}
                >
                  User Agreement
                </Text>
                {' & '}
                <Text
                  style={styles.legalLink}
                  onPress={(e) => {
                    e.stopPropagation();
                    openLegalDocument('privacy');
                  }}
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
          </TouchableOpacity>

          {/* Fast Login Action Button */}
          <TouchableOpacity
            style={[
              styles.fastLoginButton,
              !acceptedTerms && styles.fastLoginButtonDisabled,
            ]}
            activeOpacity={0.88}
            onPress={handleFastLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.fastLoginBtnText}>Entering DreamDate...</Text>
              </View>
            ) : (
              <LinearGradient
                colors={
                  acceptedTerms
                    ? ['#F65592', '#E11D48']
                    : ['#3A3A3C', '#2C2C2E']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Ionicons
                  name="flash"
                  size={20}
                  color={acceptedTerms ? '#FFFFFF' : '#8E8E93'}
                />
                <Text
                  style={[
                    styles.fastLoginBtnText,
                    !acceptedTerms && styles.fastLoginBtnTextDisabled,
                  ]}
                >
                  Fast Login
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          {/* Footer Offline Notice */}
          <Text style={styles.footerNote}>
            100% Offline Simulation · No Phone or Email Required
          </Text>
        </View>
      </SafeAreaView>

      {/* Full Document Viewer Modal */}
      <LegalViewerModal
        visible={legalModalVisible}
        initialTab={legalModalTab}
        onClose={() => setLegalModalVisible(false)}
      />
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
    bottom: 0,
    overflow: 'hidden',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
    resizeMode: 'cover',
    opacity: 0.65,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  ageBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ageBadgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  liveText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  centerBrandSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF70A0',
    marginBottom: 8,
    textAlign: 'center',
  },
  brandCaption: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  perksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  perkCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  perkEmoji: {
    fontSize: 16,
    marginBottom: 3,
  },
  perkLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  perkSub: {
    color: '#FF70A0',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  bonusChipWrap: {
    alignItems: 'center',
  },
  bonusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 7,
  },
  bonusText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 12,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  checkboxBoxChecked: {
    backgroundColor: '#F65592',
  },
  agreementTextWrap: {
    flex: 1,
  },
  agreementText: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
  },
  legalLink: {
    color: '#F65592',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  fastLoginButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fastLoginButtonDisabled: {},
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  fastLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fastLoginBtnTextDisabled: {
    color: '#8E8E93',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
    backgroundColor: '#3A3A3C',
  },
  footerNote: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
});
