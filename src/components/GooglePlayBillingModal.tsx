import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CoinIcon from './CoinIcon';
import { PaymentPackage, fulfillPackage } from '../services/paymentService';

interface GooglePlayBillingModalProps {
  visible: boolean;
  packageItem: PaymentPackage | null;
  onClose: () => void;
  onSuccess: (pkg: PaymentPackage) => void;
}

export default function GooglePlayBillingModal({
  visible,
  packageItem,
  onClose,
  onSuccess,
}: GooglePlayBillingModalProps) {
  const [stage, setStage] = useState<'prompt' | 'processing' | 'success'>('prompt');
  const [selectedMethod, setSelectedMethod] = useState<'balance' | 'bank' | 'upi'>('balance');

  if (!packageItem) return null;

  const handleCancel = () => {
    setStage('prompt');
    onClose();
  };

  const handleOneTapBuy = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}

    setStage('processing');

    setTimeout(async () => {
      try {
        await fulfillPackage(packageItem);
        setStage('success');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}

        setTimeout(() => {
          setStage('prompt');
          onSuccess(packageItem);
          onClose();
        }, 1200);
      } catch (err) {
        setStage('prompt');
      }
    }, 1800);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={stage === 'processing' ? undefined : handleCancel}
        />

        <View style={styles.sheet}>
          {/* Google Play Brand Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.playLogoWrap}>
                <Ionicons name="logo-google-playstore" size={24} color="#00875A" />
              </View>
              <Text style={styles.brandText}>Google Play</Text>
            </View>
            {stage !== 'processing' && (
              <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#5F6368" />
              </TouchableOpacity>
            )}
          </View>

          {stage === 'processing' ? (
            <View style={styles.processingWrap}>
              <ActivityIndicator size="large" color="#00875A" />
              <Text style={styles.processingText}>Processing with Google Play...</Text>
              <Text style={styles.processingSub}>Contacting payment network securely</Text>
            </View>
          ) : stage === 'success' ? (
            <View style={styles.processingWrap}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Payment Successful</Text>
              <Text style={styles.processingSub}>
                {packageItem.coinsAwarded} Coins added to DreamDate account
              </Text>
            </View>
          ) : (
            <>
              {/* Product Info Card */}
              <View style={styles.productCard}>
                <View style={styles.appIconWrap}>
                  <Ionicons name="videocam" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.appName}>DreamDate: Live Video Chat</Text>
                  <Text style={styles.itemTitle}>{packageItem.title}</Text>
                  <View style={styles.coinsLine}>
                    <CoinIcon size={14} />
                    <Text style={styles.coinsCount}>
                      {packageItem.coinsAwarded.toLocaleString()} Coins
                      {packageItem.isVip ? ' + Weekly VIP' : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemPrice}>₹{packageItem.amount}.00</Text>
              </View>

              {/* Account Row */}
              <View style={styles.accountRow}>
                <View style={styles.accountAvatar}>
                  <Text style={styles.accountAvatarText}>A</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountLabel}>Google Account</Text>
                  <Text style={styles.accountEmail}>amit.narwal.dev@gmail.com</Text>
                </View>
              </View>

              {/* Payment Method Selector */}
              <Text style={styles.sectionHeader}>PAYMENT METHOD</Text>
              <View style={styles.methodsWrap}>
                <TouchableOpacity
                  style={[
                    styles.methodRow,
                    selectedMethod === 'balance' && styles.methodRowActive,
                  ]}
                  onPress={() => setSelectedMethod('balance')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="wallet-outline" size={20} color="#00875A" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodName}>Google Play Balance</Text>
                    <Text style={styles.methodDetail}>Balance: ₹2,450.00</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedMethod === 'balance' && styles.radioActive,
                    ]}
                  >
                    {selectedMethod === 'balance' && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodRow,
                    selectedMethod === 'bank' && styles.methodRowActive,
                  ]}
                  onPress={() => setSelectedMethod('bank')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="card-outline" size={20} color="#1A73E8" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodName}>State Bank of India</Text>
                    <Text style={styles.methodDetail}>Debit Card •••• 4281</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedMethod === 'bank' && styles.radioActive,
                    ]}
                  >
                    {selectedMethod === 'bank' && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.methodRow,
                    selectedMethod === 'upi' && styles.methodRowActive,
                  ]}
                  onPress={() => setSelectedMethod('upi')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="flash-outline" size={20} color="#9333EA" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodName}>UPI (Google Pay)</Text>
                    <Text style={styles.methodDetail}>Fast authentication via UPI PIN</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedMethod === 'upi' && styles.radioActive,
                    ]}
                  >
                    {selectedMethod === 'upi' && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Legal Note */}
              <Text style={styles.legalNotice}>
                By tapping 1-Tap Buy, you agree to the Google Play Terms of Service. Virtual
                digital currency fulfilled immediately upon confirmation.
              </Text>

              {/* Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.oneTapBuyBtn}
                  onPress={handleOneTapBuy}
                  activeOpacity={0.85}
                >
                  <Ionicons name="finger-print" size={20} color="#FFFFFF" />
                  <Text style={styles.oneTapBuyText}>1-Tap Buy</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playLogoWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202124',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F3F4',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    gap: 12,
    marginBottom: 14,
  },
  appIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F65592',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  appName: {
    fontSize: 11,
    color: '#5F6368',
    fontWeight: '500',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202124',
  },
  coinsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinsCount: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '700',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202124',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
    gap: 12,
    marginBottom: 12,
  },
  accountAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  accountLabel: {
    fontSize: 11,
    color: '#5F6368',
  },
  accountEmail: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202124',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5F6368',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  methodsWrap: {
    gap: 8,
    marginBottom: 14,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  methodRowActive: {
    borderColor: '#00875A',
    backgroundColor: '#E6F4EA',
  },
  methodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202124',
  },
  methodDetail: {
    fontSize: 11,
    color: '#5F6368',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#BDC1C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#00875A',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00875A',
  },
  legalNotice: {
    fontSize: 11,
    color: '#5F6368',
    lineHeight: 15,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F3F4',
  },
  cancelBtnText: {
    color: '#3C4043',
    fontWeight: '700',
    fontSize: 14,
  },
  oneTapBuyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00875A',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#00875A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  oneTapBuyText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  processingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  processingText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202124',
    marginTop: 8,
  },
  processingSub: {
    fontSize: 13,
    color: '#5F6368',
    textAlign: 'center',
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00875A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#202124',
  },
});
