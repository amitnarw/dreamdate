import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBlurView from './AppBlurView';
import BackButton from './BackButton';
import CoinIcon from './CoinIcon';
import RechargeModal from './RechargeModal';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../services/wallet';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showCoins?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

/**
 * Standardized AppHeader component following the female details page header aesthetic:
 * Centered bold typography, circular frosted glass back button, frosted coin pill.
 */
export default function AppHeader({
  title,
  showBack = false,
  onBack,
  showCoins = true,
  leftElement,
  rightElement,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { coins } = useWallet();
  const [rechargeVisible, setRechargeVisible] = useState(false);

  const headerPaddingTop = insets.top > 0 ? insets.top + 4 : 12;

  return (
    <>
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: headerPaddingTop,
          },
        ]}
      >
        {/* Left Slot: Back Button or Left Element or Spacer */}
        <View style={styles.slot}>
          {showBack ? (
            <BackButton onPress={onBack} />
          ) : leftElement ? (
            leftElement
          ) : (
            <View style={styles.spacer} />
          )}
        </View>

        {/* Center Slot: Title (strictly centered in the header div) */}
        <View
          style={[
            styles.centerSlot,
            {
              top: headerPaddingTop,
            },
          ]}
          pointerEvents="none"
        >
          {title ? (
            <Text
              style={[
                styles.title,
                { color: isDark ? '#FFFFFF' : '#191C1D' },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
        </View>

        {/* Right Slot: Coin Pill or Right Element or Spacer */}
        <View style={[styles.slot, styles.rightSlot]}>
          {showCoins ? (
            <TouchableOpacity
              style={[
                styles.coinPillWrap,
                {
                  backgroundColor: isDark
                    ? 'rgba(28, 18, 22, 0.70)'
                    : 'rgba(255, 255, 255, 0.85)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.14)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              onPress={() => setRechargeVisible(true)}
              activeOpacity={0.8}
            >
              <CoinIcon size={14} color="#FFD700" />
              <Text
                style={[
                  styles.coinText,
                  { color: isDark ? '#FFD700' : '#D97706' },
                ]}
              >
                {coins}
              </Text>
              <View style={styles.addMiniBadge}>
                <Ionicons name="add" size={11} color="#FFF" />
              </View>
            </TouchableOpacity>
          ) : rightElement ? (
            rightElement
          ) : (
            <View style={styles.spacer} />
          )}
        </View>
      </View>

      <RechargeModal
        visible={rechargeVisible}
        onClose={() => setRechargeVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    zIndex: 20,
    position: 'relative',
    minHeight: 54,
  },
  slot: {
    minWidth: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2,
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  centerSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  spacer: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  coinPillWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  coinText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addMiniBadge: {
    backgroundColor: '#F65592',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
