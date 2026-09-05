import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { addCoins } from '../services/wallet';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PACKS = [
  { id: '1', coins: 150, price: '₹99', bonus: '' },
  { id: '2', coins: 400, price: '₹249', bonus: '+50 Bonus' },
  { id: '3', coins: 1000, price: '₹499', bonus: '🔥 POPULAR (+200)' },
  { id: '4', coins: 2500, price: '₹999', bonus: '👑 VIP (+600)' },
];

export default function RechargeModal({ visible, onClose }: Props) {
  const [selectedPack, setSelectedPack] = useState(PACKS[2].id);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    const pack = PACKS.find((p) => p.id === selectedPack) || PACKS[0];
    setLoading(true);
    setTimeout(async () => {
      setLoading(false);
      await addCoins(pack.coins);
      Alert.alert('Recharge Successful! 🎉', `${pack.coins} Coins added to your wallet.`);
      onClose();
    }, 600);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.cardWrap}>
          <BlurView intensity={85} tint="dark" style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Recharge Coins 🪙</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.sub}>
              Coins are used for 1-on-1 private video calls and sending sweet gifts to your favourite companions.
            </Text>

            <View style={styles.packList}>
              {PACKS.map((pack) => {
                const isSelected = pack.id === selectedPack;
                return (
                  <TouchableOpacity
                    key={pack.id}
                    style={[styles.packItem, isSelected && styles.packItemSelected]}
                    onPress={() => setSelectedPack(pack.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.packLeft}>
                      <Text style={styles.packCoins}>🪙 {pack.coins} Coins</Text>
                      {pack.bonus ? <Text style={styles.packBonus}>{pack.bonus}</Text> : null}
                    </View>
                    <View style={[styles.priceBadge, isSelected && styles.priceBadgeSelected]}>
                      <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>{pack.price}</Text>
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
    shadowColor: '#F65592',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  payText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
