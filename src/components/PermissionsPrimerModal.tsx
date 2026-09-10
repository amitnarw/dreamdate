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

interface Props {
  visible: boolean;
  onClose: () => void;
  onEnable: () => Promise<void> | void;
}

interface Item {
  icon: any;
  title: string;
  desc: string;
}

const ITEMS: Item[] = [
  {
    icon: 'videocam',
    title: 'Camera',
    desc: 'Show yourself during private video calls',
  },
  {
    icon: 'mic',
    title: 'Microphone',
    desc: 'Talk naturally with your companion',
  },
  {
    icon: 'notifications',
    title: 'Notifications',
    desc: 'Never miss a message, call or gift',
  },
];

export default function PermissionsPrimerModal({ visible, onClose, onEnable }: Props) {
  const [busy, setBusy] = useState(false);

  const handleEnable = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setBusy(true);
    try {
      await onEnable();
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top brand accent */}
          <View style={styles.brandDot}>
            <Ionicons name="shield-checkmark" size={26} color="#F65592" />
          </View>

          <Text style={styles.title}>Get the full experience</Text>
          <Text style={styles.sub}>
            Allow camera, microphone & notifications to enjoy private 1-on-1 video
            calls with your companions.
          </Text>

          <View style={styles.itemsWrap}>
            {ITEMS.map((item, i) => (
              <View key={i} style={styles.item}>
                <View style={styles.itemIcon}>
                  <Ionicons name={item.icon as any} size={20} color="#F65592" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.cta, busy && { opacity: 0.7 }]}
            onPress={handleEnable}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.ctaText}>Enable Everything</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={styles.skipText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 18,
    backgroundColor: '#1A1114',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 8,
  },
  brandDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(246, 85, 146, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  sub: {
    color: 'rgba(241, 224, 228, 0.75)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 4,
  },
  itemsWrap: {
    width: '100%',
    marginTop: 18,
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 14,
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(246, 85, 146, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  itemDesc: {
    color: 'rgba(241, 224, 228, 0.65)',
    fontSize: 12,
    marginTop: 2,
  },
  cta: {
    marginTop: 20,
    backgroundColor: '#F65592',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 24,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  skipBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: 'rgba(241, 224, 228, 0.55)',
    fontSize: 12,
    fontWeight: '500',
  },
});
