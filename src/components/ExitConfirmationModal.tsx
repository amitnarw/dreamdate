import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
  BackHandler,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ExitConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onExit?: () => void;
}

export default function ExitConfirmationModal({
  visible,
  onClose,
  onExit,
}: ExitConfirmationModalProps) {
  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      BackHandler.exitApp();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCardWrap}>
          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.cardContent}>
            {/* Exit Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name="log-out-outline" size={32} color="#FF69B4" />
            </View>

            <Text style={styles.title}>Exit DreamDate?</Text>
            <Text style={styles.message}>
              Are you sure you want to leave? Your virtual companions will be waiting for you!
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Stay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exitBtn}
                onPress={handleExit}
                activeOpacity={0.85}
              >
                <Text style={styles.exitText}>Exit App</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 24,
  },
  modalCardWrap: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 20, 24, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 105, 180, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F1E0E4',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    color: 'rgba(241, 224, 228, 0.75)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: '400',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: 'rgba(61, 50, 53, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#F1E0E4',
    fontSize: 15,
    fontWeight: '600',
  },
  exitBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: '#FF69B4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 5,
  },
  exitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
