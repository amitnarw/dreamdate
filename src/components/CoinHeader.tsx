import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useWallet } from '../services/wallet';
import BackButton from './BackButton';
import RechargeModal from './RechargeModal';

interface Props {
  title?: string;
  showBack?: boolean;
}

export default function CoinHeader({ title = 'TalkMate', showBack = false }: Props) {
  const router = useRouter();
  const { coins } = useWallet();
  const [rechargeVisible, setRechargeVisible] = useState(false);

  return (
    <>
      <View style={styles.header}>
        <View style={styles.left}>
          {showBack && <BackButton />}
          <Text style={styles.title}>{title}</Text>
        </View>

        <TouchableOpacity
          style={styles.coinPill}
          onPress={() => setRechargeVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{coins}</Text>
          <View style={styles.addBadge}>
            <Ionicons name="add" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      <RechargeModal visible={rechargeVisible} onClose={() => setRechargeVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0A0A14',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 180, 0, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  coinIcon: {
    fontSize: 15,
  },
  coinText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 14,
  },
  addBadge: {
    backgroundColor: '#EA4C89',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
