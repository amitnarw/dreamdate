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
import { useTheme } from '../context/ThemeContext';
import { addCoins } from '../services/wallet';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PACKS = [
  { id: '1', coins: 150, price: '₹99', bonus: '', badgeIcon: null },
  { id: '2', coins: 400, price: '₹249', bonus: '+50 Bonus', badgeIcon: null },
  { id: '3', coins: 1000, price: '₹499', bonus: 'POPULAR (+200)', badgeIcon: 'flame' as const },
  { id: '4', coins: 2500, price: '₹999', bonus: 'VIP (+600)', badgeIcon: 'ribbon' as const },
];

export default function RechargeModal({ visible, onClose }: Props) {
  const { theme, isDark } = useTheme();
  const [selectedPack, setSelectedPack] = useState(PACKS[2].id);
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [failedModalVisible, setFailedModalVisible] = useState(false);
  const [purchasedCoins, setPurchasedCoins] = useState(0);

  const handlePurchase = async () => {
    const pack = PACKS.find((p) => p.id === selectedPack) || PACKS[0];
    setLoading(true);
    setTimeout(async () => {
      setLoading(false);
      try {
        await addCoins(pack.coins);
        setPurchasedCoins(pack.coins);
        setSuccessModalVisible(true);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      } catch (e) {
        setFailedModalVisible(true);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (err) {}
      }
    }, 600);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.cardWrap,
            {
              backgroundColor: isDark
                ? 'rgba(18, 20, 20, 0.94)'
                : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.08)',
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
              Coins are used for 1-on-1 private video calls and sending sweet gifts to your favourite companions.
            </Text>

            <View style={styles.packList}>
              {PACKS.map((pack) => {
                const isSelected = pack.id === selectedPack;
                return (
                  <TouchableOpacity
                    key={pack.id}
                    style={[
                      styles.packItem,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(246, 85, 146, 0.25)'
                            : 'rgba(246, 85, 146, 0.14)'
                          : isDark
                          ? '#1E2020'
                          : '#F3F4F6',
                        borderColor: isSelected ? '#F65592' : 'transparent',
                      },
                    ]}
                    onPress={() => setSelectedPack(pack.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.packLeft}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <CoinIcon size={16} color={isDark ? '#FFD700' : '#D97706'} />
                        <Text
                          style={[
                            styles.packCoins,
                            { color: isDark ? '#E2E2E2' : '#191C1D' },
                          ]}
                        >
                          {pack.coins} Coins
                        </Text>
                      </View>
                      {pack.bonus ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          {pack.badgeIcon ? (
                            <Ionicons name={pack.badgeIcon} size={12} color="#10B981" />
                          ) : null}
                          <Text style={styles.packBonus}>{pack.bonus}</Text>
                        </View>
                      ) : null}
                    </View>
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
                        {pack.price}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.payBtn}
              onPress={handlePurchase}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.payText}>{loading ? 'Processing...' : 'Instant Recharge Now'}</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Recharge Success Modal */}
        <AppModal
          visible={successModalVisible}
          useModalHost={false}
          onClose={() => {
            setSuccessModalVisible(false);
            onClose();
          }}
          title="Recharge Successful!"
          description={`${purchasedCoins.toLocaleString()} Coins have been credited to your wallet balance. You're ready to start video calling and gifting!`}
          icon="checkmark-circle"
          iconColor="#10B981"
          primaryAction={{
            label: 'Great, Continue',
            onPress: () => {
              setSuccessModalVisible(false);
              onClose();
            },
          }}
        />

        {/* Recharge Failed Modal */}
        <AppModal
          visible={failedModalVisible}
          useModalHost={false}
          onClose={() => setFailedModalVisible(false)}
          title="Recharge Failed"
          description="We were unable to process your payment. Please check your payment method and try again."
          icon="alert-circle"
          iconColor="#EF4444"
          primaryAction={{
            label: 'Try Again',
            onPress: () => {
              setFailedModalVisible(false);
            },
          }}
          secondaryAction={{
            label: 'Cancel',
            variant: 'secondary',
            onPress: () => {
              setFailedModalVisible(false);
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
    borderRadius: 24,
    overflow: 'hidden',
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
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  packItemSelected: {
    backgroundColor: 'rgba(246, 85, 146, 0.25)',
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
  priceBadge: {
    backgroundColor: 'rgba(51, 53, 53, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  priceBadgeSelected: {
    backgroundColor: '#F65592',
  },
  priceText: {
    color: '#E2E2E2',
    fontWeight: '700',
    fontSize: 14,
  },
  priceTextSelected: {
    color: '#FFF',
  },
  payBtn: {
    backgroundColor: '#F65592',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
