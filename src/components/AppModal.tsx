import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export interface AppModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  children?: React.ReactNode;
  primaryAction?: AppModalAction;
  secondaryAction?: AppModalAction;
  useModalHost?: boolean;
  stackedActions?: boolean;
}

export default function AppModal({
  visible,
  onClose,
  title,
  description,
  icon,
  iconColor,
  children,
  primaryAction,
  secondaryAction,
  useModalHost = true,
  stackedActions = false,
}: AppModalProps) {
  const { theme, isDark } = useTheme();
  const [isMounted, setIsMounted] = useState(visible);
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      scaleAnim.setValue(0.92);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isMounted) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsMounted(false);
      });
    }
  }, [visible]);

  if (!isMounted) return null;

  const content = (
    <TouchableWithoutFeedback onPress={onClose}>
      <Animated.View
        style={[
          styles.overlay,
          !useModalHost && StyleSheet.absoluteFill,
          !useModalHost && { zIndex: 99999, elevation: 9999 },
          {
            opacity: fadeAnim,
            backgroundColor: isDark
              ? 'rgba(0, 0, 0, 0.82)'
              : 'rgba(20, 20, 25, 0.60)',
          },
        ]}
      >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surface,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
              {/* Close Button */}
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>

              {/* Header Icon */}
              {icon && (
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(246, 85, 146, 0.14)'
                        : 'rgba(246, 85, 146, 0.1)',
                    },
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={28}
                    color={iconColor || '#F65592'}
                  />
                </View>
              )}

              {/* Title & Description */}
              <Text
                style={[
                  styles.title,
                  { color: theme.colors.onSurface },
                ]}
              >
                {title}
              </Text>

              {description ? (
                <Text
                  style={[
                    styles.description,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {description}
                </Text>
              ) : null}

              {/* Optional Custom Body Content */}
              {children && <View style={styles.bodyWrap}>{children}</View>}

              {/* Action Buttons */}
              {(primaryAction || secondaryAction) && (
                <View style={stackedActions ? styles.actionsColumn : styles.actionsRow}>
                  {primaryAction && (
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        stackedActions && styles.actionBtnStacked,
                        primaryAction.variant === 'destructive'
                          ? styles.destructiveBtn
                          : styles.primaryBtn,
                      ]}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        } catch (e) {}
                        primaryAction.onPress();
                      }}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          styles.primaryBtnText,
                          stackedActions && styles.actionBtnTextStacked,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {primaryAction.label}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {secondaryAction && (
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        stackedActions && styles.actionBtnStacked,
                        styles.secondaryBtn,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch (e) {}
                        secondaryAction.onPress();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: theme.colors.onSurfaceVariant },
                          stackedActions && styles.secondaryBtnTextStacked,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {secondaryAction.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    );

  if (!useModalHost) {
    return content;
  }

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  bodyWrap: {
    width: '100%',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: '#F65592',
  },
  destructiveBtn: {
    backgroundColor: '#E11D48',
  },
  secondaryBtn: {},
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionsColumn: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  actionBtnStacked: {
    width: '100%',
    flex: 0,
    height: 48,
    borderRadius: 24,
  },
  actionBtnTextStacked: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtnTextStacked: {
    fontSize: 14,
    fontWeight: '600',
  },
});
