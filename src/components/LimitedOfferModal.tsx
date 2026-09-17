import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PaymentSelectorSheet from './PaymentSelectorSheet';
import { MOCK_PROFILES } from '../data/mockProfiles';
import {
  FLASH_OFFER_199,
  FLASH_OFFER_99,
  PaymentPackage,
} from '../services/paymentService';
import { MEDIA_HEADERS } from '../services/videoService';
import { useWallet } from '../services/wallet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMER_STORAGE_KEY = '@dreamdate_limited_offer_expiry_v1';
const DURATION_SECONDS = 5 * 60; // 5 minutes

interface Props {
  visible: boolean;
  onClose: () => void;
  onRechargeSuccess?: () => void;
}

export default function LimitedOfferModal({
  visible,
  onClose,
  onRechargeSuccess,
}: Props) {
  const { hasPurchased, isVip } = useWallet();
  const [selectedPack, setSelectedPack] = useState<PaymentPackage>(FLASH_OFFER_99);
  const [secondsRemaining, setSecondsRemaining] = useState(DURATION_SECONDS);
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);

  // Companion avatar
  const featuredGirl = MOCK_PROFILES[0] || {
    name: 'Riya',
    avatar: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg',
  };

  useEffect(() => {
    let interval: any = null;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
        let targetTime = stored ? parseInt(stored, 10) : 0;
        const now = Date.now();

        if (!targetTime || targetTime <= now) {
          targetTime = now + DURATION_SECONDS * 1000;
          await AsyncStorage.setItem(TIMER_STORAGE_KEY, targetTime.toString());
        }

        const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));
        setSecondsRemaining(remaining);

        interval = setInterval(() => {
          const rem = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
          setSecondsRemaining(rem);
          if (rem <= 0) {
            clearInterval(interval);
          }
        }, 1000);
      } catch (e) {}
    })();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible]);

  if (hasPurchased || isVip) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleClaim = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setPaymentSheetVisible(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentSheetVisible(false);
    onClose();
    if (onRechargeSuccess) onRechargeSuccess();
  };

  const is99 = selectedPack.id === FLASH_OFFER_99.id;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
          {/* Card with border color applied as the solid gradient background, NO border */}
          <LinearGradient
            colors={['#F59E0B', '#F65592', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardContainer}
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Header: Avatar + Title */}
            <View style={styles.headerRow}>
              <View style={styles.avatarWrap}>
                <ExpoImage
                  source={{
                    uri: featuredGirl.avatar,
                    headers: MEDIA_HEADERS,
                  }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <View style={styles.onlineBadge} />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.title}>Don't Miss Her Call</Text>
                <Text style={styles.subtitle}>
                  Exclusive welcome deal · Expires in {timeFormatted}
                </Text>
              </View>
            </View>

            {/* Minimalistic Options */}
            <View style={styles.optionsWrap}>
              {/* Option 1: ₹99 */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                  setSelectedPack(FLASH_OFFER_99);
                }}
                style={[
                  styles.optionPill,
                  is99 ? styles.optionSelected : styles.optionUnselected,
                ]}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={is99 ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <View style={styles.optionDetails}>
                    <Text style={styles.optionTitle}>350 Coins</Text>
                    <Text style={styles.optionSub}>+ Free Photo Unlock</Text>
                  </View>
                </View>
                <View style={styles.optionPriceWrap}>
                  <Text style={styles.optionStruck}>₹499</Text>
                  <Text style={styles.optionPrice}>₹99</Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: ₹199 */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                  setSelectedPack(FLASH_OFFER_199);
                }}
                style={[
                  styles.optionPill,
                  !is99 ? styles.optionSelected : styles.optionUnselected,
                ]}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={!is99 ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <View style={styles.optionDetails}>
                    <Text style={styles.optionTitle}>800 Coins + VIP</Text>
                    <Text style={styles.optionSub}>All VIP Perks Included</Text>
                  </View>
                </View>
                <View style={styles.optionPriceWrap}>
                  <Text style={styles.optionStruck}>₹999</Text>
                  <Text style={styles.optionPrice}>₹199</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Solid Minimalistic CTA Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleClaim}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>
                Unlock Now · ₹{selectedPack.amount}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#111827" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      <PaymentSelectorSheet
        visible={paymentSheetVisible}
        packageItem={selectedPack}
        onClose={() => setPaymentSheetVisible(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: Math.min(360, SCREEN_WIDTH - 44),
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
    paddingRight: 28,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  optionsWrap: {
    gap: 10,
    marginBottom: 18,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  optionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  optionUnselected: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionDetails: {
    justifyContent: 'center',
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  optionSub: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  optionPriceWrap: {
    alignItems: 'flex-end',
  },
  optionStruck: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  optionPrice: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  ctaButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  ctaText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
