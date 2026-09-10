import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRIVACY_POLICY_TEXT, USER_AGREEMENT_TEXT } from '../constants/legalDocuments';
import { useTheme } from '../context/ThemeContext';

interface LegalViewerModalProps {
  visible: boolean;
  initialTab?: 'terms' | 'privacy';
  onClose: () => void;
}

export default function LegalViewerModal({
  visible,
  initialTab = 'terms',
  onClose,
}: LegalViewerModalProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  // Sync tab when opening
  React.useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const handleTabSwitch = (tab: 'terms' | 'privacy') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setActiveTab(tab);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#09070C' : '#F9FAFB' }]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <View style={styles.shieldIconWrap}>
                <Ionicons name="shield-checkmark" size={18} color="#F65592" />
              </View>
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                Legal & Disclosures
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={isDark ? '#E2E2E2' : '#374151'} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Controls */}
          <View style={[styles.tabContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'terms' && [
                  styles.tabButtonActive,
                  { backgroundColor: isDark ? '#F65592' : '#F65592' },
                ],
              ]}
              onPress={() => handleTabSwitch('terms')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="document-text-outline"
                size={14}
                color={activeTab === 'terms' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#4B5563'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'terms'
                    ? styles.tabTextActive
                    : { color: isDark ? '#9CA3AF' : '#4B5563' },
                ]}
              >
                User Agreement
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'privacy' && [
                  styles.tabButtonActive,
                  { backgroundColor: isDark ? '#F65592' : '#F65592' },
                ],
              ]}
              onPress={() => handleTabSwitch('privacy')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="lock-closed-outline"
                size={14}
                color={activeTab === 'privacy' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#4B5563'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'privacy'
                    ? styles.tabTextActive
                    : { color: isDark ? '#9CA3AF' : '#4B5563' },
                ]}
              >
                Offline Privacy
              </Text>
            </TouchableOpacity>
          </View>

          {/* Key Notice Banner */}
          <View style={[styles.noticeBanner, { backgroundColor: isDark ? 'rgba(246, 85, 146, 0.12)' : 'rgba(246, 85, 146, 0.08)' }]}>
            <Ionicons name="information-circle" size={16} color="#F65592" />
            <Text style={[styles.noticeText, { color: isDark ? '#FCDDEC' : '#9D174D' }]}>
              {activeTab === 'terms'
                ? '18+ Adult Entertainment Simulation. All profiles, calls, and chats are simulated.'
                : 'Zero remote tracking. All app data is held locally on your device only.'}
            </Text>
          </View>

          {/* Scrollable Document Content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.documentBody, { color: isDark ? '#D1D5DB' : '#374151' }]}>
              {activeTab === 'terms' ? USER_AGREEMENT_TEXT : PRIVACY_POLICY_TEXT}
            </Text>
          </ScrollView>

          {/* Bottom Accept / Dismiss Button */}
          <View style={[styles.bottomBar, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <TouchableOpacity
              style={styles.acknowledgeButton}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.acknowledgeButtonText}>I Understand & Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shieldIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(246, 85, 146, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  tabButtonActive: {
    shadowColor: '#F65592',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 8,
    marginBottom: 10,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  documentBody: {
    fontSize: 13.5,
    lineHeight: 22,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  acknowledgeButton: {
    backgroundColor: '#F65592',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
