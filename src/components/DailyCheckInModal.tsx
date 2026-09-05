import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addCoins } from '../services/wallet';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface DayReward {
  day: number;
  coins: number;
  label: string;
  icon: string;
}

const CHECKIN_REWARDS: DayReward[] = [
  { day: 1, coins: 50, label: 'Day 1', icon: '🪙' },
  { day: 2, coins: 75, label: 'Day 2', icon: '🪙' },
  { day: 3, coins: 100, label: 'Day 3', icon: '🪙' },
  { day: 4, coins: 150, label: 'Day 4', icon: '🪙' },
  { day: 5, coins: 200, label: 'Day 5', icon: '💎' },
  { day: 6, coins: 300, label: 'Day 6', icon: '💎' },
  { day: 7, coins: 500, label: 'Day 7', icon: '🎁' },
];

const STORAGE_DAY_KEY = '@dreamdate_checkin_current_day';
const STORAGE_DATE_KEY = '@dreamdate_last_checkin_timestamp';

export default function DailyCheckInModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [alreadyClaimedToday, setAlreadyClaimedToday] = useState(false);
  const [justClaimedAmount, setJustClaimedAmount] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      loadCheckInState();
    }
  }, [visible]);

  const loadCheckInState = async () => {
    try {
      const storedDay = await AsyncStorage.getItem(STORAGE_DAY_KEY);
      const storedDate = await AsyncStorage.getItem(STORAGE_DATE_KEY);

      const todayStr = new Date().toDateString();
      let dayIdx = storedDay ? parseInt(storedDay, 10) : 0;

      if (storedDate === todayStr) {
        setAlreadyClaimedToday(true);
      } else {
        setAlreadyClaimedToday(false);
        // If yesterday was missed (more than 1 day difference), reset streak
        if (storedDate) {
          const lastDate = new Date(storedDate);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays > 1) {
            dayIdx = 0; // Reset streak if missed a day
            await AsyncStorage.setItem(STORAGE_DAY_KEY, '0');
          }
        }
      }

      setCurrentDayIndex(Math.min(dayIdx, 6));
    } catch (e) {
      setCurrentDayIndex(0);
    }
  };

  const handleClaim = async () => {
    if (alreadyClaimedToday) return;

    const reward = CHECKIN_REWARDS[currentDayIndex];
    await addCoins(reward.coins);

    const todayStr = new Date().toDateString();
    const nextDay = (currentDayIndex + 1) % 7;

    await AsyncStorage.setItem(STORAGE_DAY_KEY, nextDay.toString());
    await AsyncStorage.setItem(STORAGE_DATE_KEY, todayStr);

    setAlreadyClaimedToday(true);
    setJustClaimedAmount(reward.coins);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    Alert.alert(
      '🎉 Daily Bonus Claimed!',
      `You received ${reward.coins} Coins!\n\nConsistency Streak: Day ${reward.day} Completed! Keep checking in daily for bigger rewards.`,
      [{ text: 'Great!', onPress: () => {} }]
    );
  };

  const todayReward = CHECKIN_REWARDS[currentDayIndex];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetWrap}>
          <BlurView
            intensity={90}
            tint="dark"
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}
          >
            {/* Header: Title + Streak Pill + Close Button */}
            <View style={styles.header}>
              <View style={styles.headerTitleCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>Daily Check-In</Text>
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakBadgeText}>
                      🔥 Day {currentDayIndex + 1} of 7
                    </Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>
                  Check in daily to increase your rewards. Missing a day resets the streak!
                </Text>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color="#F1E0E4" />
              </TouchableOpacity>
            </View>

            {/* 7 Days Rewards Grid */}
            <View style={styles.daysGrid}>
              {CHECKIN_REWARDS.slice(0, 6).map((reward, index) => {
                const isClaimed = alreadyClaimedToday
                  ? index <= currentDayIndex
                  : index < currentDayIndex;
                const isToday = index === currentDayIndex && !alreadyClaimedToday;

                return (
                  <View
                    key={reward.day}
                    style={[
                      styles.dayCard,
                      isToday && styles.dayCardToday,
                      isClaimed && styles.dayCardClaimed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isToday && { color: '#FFF', fontWeight: '800' },
                      ]}
                    >
                      {reward.label}
                    </Text>

                    <View style={styles.dayIconBox}>
                      <Text style={{ fontSize: 24 }}>{reward.icon}</Text>
                    </View>

                    <Text style={styles.dayCoinsText}>+{reward.coins}</Text>

                    {isClaimed ? (
                      <View style={styles.claimedBadge}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      </View>
                    ) : isToday ? (
                      <View style={styles.todayIndicatorPill}>
                        <Text style={styles.todayIndicatorText}>TODAY</Text>
                      </View>
                    ) : (
                      <View style={styles.lockedBadge}>
                        <Ionicons name="lock-closed" size={10} color="rgba(241, 224, 228, 0.4)" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Day 7 Highlight Card (Treasure Box) */}
            {(() => {
              const day7 = CHECKIN_REWARDS[6];
              const isClaimed7 = currentDayIndex === 6 && alreadyClaimedToday;
              const isToday7 = currentDayIndex === 6 && !alreadyClaimedToday;

              return (
                <LinearGradient
                  colors={
                    isToday7
                      ? ['#4A2131', '#7A2244', '#3E1524']
                      : ['rgba(39, 29, 32, 0.85)', 'rgba(30, 20, 24, 0.95)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.day7Card, isToday7 && styles.day7CardToday]}
                >
                  <View style={styles.day7Left}>
                    <Text style={styles.day7Title}>Day 7 • Mystery Chest</Text>
                    <Text style={styles.day7Sub}>Consecutive check-in grand prize</Text>
                    <View style={styles.day7CoinsPill}>
                      <Text style={styles.day7CoinsText}>+{day7.coins} Free Coins 🪙</Text>
                    </View>
                  </View>
                  <View style={styles.day7Right}>
                    <Text style={{ fontSize: 44 }}>🎁</Text>
                    {isClaimed7 ? (
                      <View style={styles.claimedBadge}>
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      </View>
                    ) : null}
                  </View>
                </LinearGradient>
              );
            })()}

            {/* Claim Action Button */}
            <TouchableOpacity
              style={[
                styles.claimBtn,
                alreadyClaimedToday && styles.claimBtnDisabled,
              ]}
              onPress={handleClaim}
              disabled={alreadyClaimedToday}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={
                  alreadyClaimedToday
                    ? ['#3D3538', '#2D282A']
                    : ['#FF2A7A', '#FF69B4', '#FF416C']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.claimBtnGradient}
              >
                <Ionicons
                  name={alreadyClaimedToday ? 'checkmark-circle' : 'gift'}
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.claimBtnText}>
                  {alreadyClaimedToday
                    ? 'Checked In Today • Come Back Tomorrow'
                    : `Claim Day ${todayReward.day} Bonus (+${todayReward.coins} 🪙)`}
                </Text>
              </LinearGradient>
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
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 17, 20, 0.98)',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleCol: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F1E0E4',
    letterSpacing: -0.3,
  },
  streakBadge: {
    backgroundColor: 'rgba(246, 85, 146, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  streakBadgeText: {
    color: '#F65592',
    fontSize: 11,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(241, 224, 228, 0.65)',
    lineHeight: 16,
    paddingRight: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(61, 50, 53, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayCard: {
    width: '31%',
    backgroundColor: 'rgba(39, 29, 32, 0.75)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  dayCardToday: {
    backgroundColor: 'rgba(246, 85, 146, 0.22)',
    shadowColor: '#F65592',
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 4,
  },
  dayCardClaimed: {
    opacity: 0.6,
  },
  dayNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(241, 224, 228, 0.6)',
  },
  dayIconBox: {
    marginVertical: 2,
  },
  dayCoinsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
  },
  claimedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  todayIndicatorPill: {
    backgroundColor: '#F65592',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  todayIndicatorText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lockedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  day7Card: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  day7CardToday: {
    shadowColor: '#F65592',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  day7Left: {
    gap: 4,
  },
  day7Title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  day7Sub: {
    color: 'rgba(241, 224, 228, 0.7)',
    fontSize: 11,
  },
  day7CoinsPill: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  day7CoinsText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
  },
  day7Right: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtn: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  claimBtnDisabled: {
    opacity: 0.7,
  },
  claimBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
