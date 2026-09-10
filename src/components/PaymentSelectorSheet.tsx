import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CoinIcon from './CoinIcon';
import GooglePlayBillingModal from './GooglePlayBillingModal';
import { useTheme } from '../context/ThemeContext';
import {
  PaymentPackage,
  launchUPIPayment,
} from '../services/paymentService';

interface PaymentSelectorSheetProps {
  visible: boolean;
  packageItem: PaymentPackage | null;
  onClose: () => void;
  onSuccess: (pkg: PaymentPackage) => void;
}

export default function PaymentSelectorSheet({
  visible,
  packageItem,
  onClose,
  onSuccess,
}: PaymentSelectorSheetProps) {
  const { isDark } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'google_play'>('upi');
  const [googlePlayModalVisible, setGooglePlayModalVisible] = useState(false);

  if (!packageItem) return null;

  const handlePay = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    if (selectedMethod === 'google_play') {
      setGooglePlayModalVisible(true);
      return;
    }

    // UPI Payment via Android Activity Intent
    setIsProcessing(true);
    const result = await launchUPIPayment(packageItem);
    setIsProcessing(false);

    if (result.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      Alert.alert(
        'Payment Successful',
        `₹${packageItem.amount} payment received! ${packageItem.coinsAwarded} Coins have been added to your balance.`
      );
      onSuccess(packageItem);
      onClose();
    } else {
      // User pressed back or cancelled in UPI app: ZERO COINS CREDITED
      Alert.alert(
        'Payment Incomplete',
        result.message || 'Transaction was cancelled. No amount was charged and no coins were added.'
      );
    }
  };

  const handleGooglePlaySuccess = (pkg: PaymentPackage) => {
    setGooglePlayModalVisible(false);
    onSuccess(pkg);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible && !googlePlayModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.dismissArea}
            activeOpacity={1}
            onPress={onClose}
          />

          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isDark ? '#141416' : '#FFFFFF',
              },
            ]}
          >
            {/* Grab Handle */}
            <View style={styles.handleWrap}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' },
                ]}
              />
            </View>

            {/* Header with Title & Close */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  Checkout
                </Text>
                <Text style={[styles.headerSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  Select your preferred payment method
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={isDark ? '#E5E7EB' : '#374151'} />
              </TouchableOpacity>
            </View>

            {/* Clean Order Summary Card */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? 'rgba(246, 85, 146, 0.10)' : 'rgba(246, 85, 146, 0.06)',
                },
              ]}
            >
              <View style={styles.summaryLeft}>
                <Text style={[styles.summaryTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {packageItem.title}
                </Text>
                <View style={styles.coinsRow}>
                  <CoinIcon size={16} />
                  <Text style={styles.coinsText}>
                    {packageItem.coinsAwarded.toLocaleString()} Coins
                    {packageItem.isVip ? ' + Weekly VIP' : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.priceTag}>
                {packageItem.originalAmount ? (
                  <View style={styles.discountRow}>
                    <Text style={styles.struckPrice}>₹{packageItem.originalAmount}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>
                        {packageItem.discountPercentage}% OFF
                      </Text>
                    </View>
                  </View>
                ) : null}
                <Text style={styles.priceTagText}>₹{packageItem.amount}</Text>
              </View>
            </View>

            {/* Payment Methods */}
            <View style={styles.methodsList}>
              {/* Option 1: UPI Fast Pay */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  {
                    backgroundColor:
                      selectedMethod === 'upi'
                        ? isDark
                          ? 'rgba(246, 85, 146, 0.18)'
                          : 'rgba(246, 85, 146, 0.10)'
                        : isDark
                        ? '#1C1E22'
                        : '#F9FAFB',
                  },
                ]}
                onPress={() => setSelectedMethod('upi')}
                activeOpacity={0.85}
              >
                <View style={styles.methodIconWrapUpi}>
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.methodInfo}>
                  <View style={styles.methodTitleRow}>
                    <Text style={[styles.methodTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      UPI Fast Pay
                    </Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedBadgeText}>INSTANT</Text>
                    </View>
                  </View>
                  <Text style={[styles.methodSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    Google Pay, PhonePe, Paytm, BHIM
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedMethod === 'upi'
                      ? styles.radioCircleSelected
                      : {
                          borderWidth: 2,
                          borderColor: isDark
                            ? 'rgba(255,255,255,0.20)'
                            : 'rgba(0,0,0,0.18)',
                        },
                  ]}
                >
                  {selectedMethod === 'upi' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              {/* Option 2: Google Play Billing */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  {
                    backgroundColor:
                      selectedMethod === 'google_play'
                        ? isDark
                          ? 'rgba(246, 85, 146, 0.18)'
                          : 'rgba(246, 85, 146, 0.10)'
                        : isDark
                        ? '#1C1E22'
                        : '#F9FAFB',
                  },
                ]}
                onPress={() => setSelectedMethod('google_play')}
                activeOpacity={0.85}
              >
                <View style={styles.methodIconWrapGoogle}>
                  <Ionicons name="logo-google-playstore" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    Google Play Billing
                  </Text>
                  <Text style={[styles.methodSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    Cards, Netbanking & Play Balance
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedMethod === 'google_play'
                      ? styles.radioCircleSelected
                      : {
                          borderWidth: 2,
                          borderColor: isDark
                            ? 'rgba(255,255,255,0.20)'
                            : 'rgba(0,0,0,0.18)',
                        },
                  ]}
                >
                  {selectedMethod === 'google_play' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </View>

            {/* Security Note */}
            <View style={styles.securityRow}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.securityText}>
                256-bit Encrypted · Verified payment required to receive coins
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.submitPayBtn,
                isProcessing && { opacity: 0.8 },
              ]}
              onPress={handlePay}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.payBtnInner}>
                  <Text style={styles.submitPayBtnText}>
                    {selectedMethod === 'google_play'
                      ? `Continue to Google Play (₹${packageItem.amount})`
                      : `Pay ₹${packageItem.amount} with UPI`}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Google Play Real In-App Purchase Modal */}
      <GooglePlayBillingModal
        visible={googlePlayModalVisible}
        packageItem={packageItem}
        onClose={() => setGooglePlayModalVisible(false)}
        onSuccess={handleGooglePlaySuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  summaryLeft: {
    gap: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  coinsText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 14,
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  struckPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  discountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  priceTagText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F65592',
    letterSpacing: -0.5,
  },
  methodsList: {
    gap: 10,
    marginBottom: 14,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    gap: 12,
  },
  methodCardSelected: {},
  methodIconWrapUpi: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconWrapGoogle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0F9D58',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
    gap: 2,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  recommendedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  methodSubtitle: {
    fontSize: 12,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleIdle: {},
  radioCircleSelected: {
    backgroundColor: '#F65592',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  securityText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  submitPayBtn: {
    backgroundColor: '#F65592',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitPayBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
