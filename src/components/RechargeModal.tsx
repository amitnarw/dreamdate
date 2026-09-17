import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppModal from './AppModal';
import CoinIcon from './CoinIcon';
import PaymentSelectorSheet from './PaymentSelectorSheet';
import { useTheme } from '../context/ThemeContext';
import { PaymentPackage, RECHARGE_PACKAGES } from '../services/paymentService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onRechargeSuccess?: () => void;
}

export default function RechargeModal({ visible, onClose, onRechargeSuccess }: Props) {
  const { isDark } = useTheme();
  const [selectedPackId, setSelectedPackId] = useState(RECHARGE_PACKAGES[1].id);
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<PaymentPackage | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [purchasedCoins, setPurchasedCoins] = useState(0);

  const selectedPack =
    RECHARGE_PACKAGES.find((p) => p.id === selectedPackId) || RECHARGE_PACKAGES[1];

  const handleOpenPaymentSheet = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setPendingPackage(selectedPack);
    setPaymentSheetVisible(true);
  };

  const handlePaymentSuccess = (pkg: PaymentPackage) => {
    setPurchasedCoins(pkg.coinsAwarded);
    setSuccessModalVisible(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.cardWrap,
            {
              backgroundColor: isDark
                ? 'rgba(18, 20, 20, 0.94)'
                : 'rgba(255, 255, 255, 0.96)',
            },
          ]}
        >
          <BlurView
            intensity={85}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.card,
              {
                backgroundColor: isDark
                  ? 'rgba(18, 20, 20, 0.88)'
                  : 'rgba(255, 255, 255, 0.90)',
              },
            ]}
          >
            <View style={styles.header}>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#E2E2E2' : '#191C1D' },
                ]}
              >
                Recharge Coins
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? '#FFF' : '#191C1D'}
                />
              </TouchableOpacity>
            </View>
            <Text
              style={[
                styles.sub,
                { color: isDark ? '#DFBEC6' : '#6B7280' },
              ]}
            >
              Coins are used for 1-on-1 private video calls and unblurring exclusive photos with companions.
            </Text>

            <View style={styles.packList}>
              {RECHARGE_PACKAGES.map((pack) => {
                const isSelected = pack.id === selectedPackId;
                return (
                  <TouchableOpacity
                    key={pack.id}
                    style={[
                      styles.packItem,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(246, 85, 146, 0.22)'
                            : 'rgba(246, 85, 146, 0.12)'
                          : isDark
                          ? '#1E2020'
                          : '#F3F4F6',
                      },
                    ]}
                    onPress={() => setSelectedPackId(pack.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.packLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <CoinIcon size={16} color={isDark ? '#FFD700' : '#D97706'} />
                        <Text
                          style={[
                            styles.packCoins,
                            {
                              color: isSelected
                                ? '#F65592'
                                : isDark
                                ? '#E2E2E2'
                                : '#191C1D',
                            },
                          ]}
                        >
                          {pack.coinsAwarded} Coins
                        </Text>
                      </View>
                      <Text style={styles.packBonus}>{pack.title}</Text>
                    </View>
                    <View style={styles.packRight}>
                      {pack.originalAmount ? (
                        <View style={styles.packDiscountRow}>
                          <Text style={styles.packOriginalPrice}>₹{pack.originalAmount}</Text>
                          <View style={styles.packDiscountBadge}>
                            <Text style={styles.packDiscountText}>{pack.discountPercentage}% OFF</Text>
                          </View>
                        </View>
                      ) : null}
                      <View
                        style={[
                          styles.priceBadge,
                          {
                            backgroundColor: isSelected
                              ? '#F65592'
                              : isDark
                              ? 'rgba(51, 53, 53, 0.6)'
                              : 'rgba(0, 0, 0, 0.06)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priceText,
                            {
                              color: isSelected
                                ? '#FFF'
                                : isDark
                                ? '#E2E2E2'
                                : '#191C1D',
                            },
                          ]}
                        >
                          ₹{pack.amount}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.payBtn}
              onPress={handleOpenPaymentSheet}
              activeOpacity={0.85}
            >
              <Text style={styles.payText}>Continue to Payment (₹{selectedPack.amount})</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Dual Payment Selector Sheet */}
        <PaymentSelectorSheet
          visible={paymentSheetVisible}
          packageItem={pendingPackage}
          onClose={() => setPaymentSheetVisible(false)}
          onSuccess={handlePaymentSuccess}
        />

        {/* Recharge Success Modal */}
        <AppModal
          visible={successModalVisible}
          useModalHost={false}
          onClose={() => {
            setSuccessModalVisible(false);
            onClose();
          }}
          title="Recharge Successful!"
          description={`${purchasedCoins.toLocaleString()} Coins have been added to your offline wallet balance. You are ready to start video calling and unlocking media!`}
          icon="checkmark-circle"
          iconColor="#10B981"
          primaryAction={{
            label: 'Great, Continue',
            onPress: () => {
              setSuccessModalVisible(false);
              try {
                onRechargeSuccess?.();
              } catch (e) {}
              onClose();
            },
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    backgroundColor: 'rgba(18, 20, 20, 0.88)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E2E2E2',
  },
  closeBtn: {
    padding: 4,
  },
  sub: {
    fontSize: 13,
    color: '#DFBEC6',
    lineHeight: 18,
    marginBottom: 16,
  },
  packList: {
    gap: 10,
    marginBottom: 18,
  },
  packItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E2020',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  packLeft: {
    gap: 2,
  },
  packCoins: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E2E2',
  },
  packBonus: {
    fontSize: 11,
    color: '#4ADE80',
    fontWeight: '600',
  },
  packRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  packDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  packOriginalPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  packDiscountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  packDiscountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  priceBadge: {
    backgroundColor: 'rgba(51, 53, 53, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  priceText: {
    color: '#E2E2E2',
    fontWeight: '700',
    fontSize: 14,
  },
  payBtn: {
    backgroundColor: '#F65592',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
