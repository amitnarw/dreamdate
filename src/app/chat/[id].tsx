import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';
import AppBlurView from '../../components/AppBlurView';
import BackButton from '../../components/BackButton';
import CoinIcon from '../../components/CoinIcon';
import GiftModal from '../../components/GiftModal';
import RechargeModal from '../../components/RechargeModal';
import { useTheme } from '../../context/ThemeContext';
import { MOCK_PROFILES, Profile, findGiftVisual } from '../../data/mockProfiles';
import {
    ChatMessage,
    getChatHistory,
    getSimulatedReply,
    saveChatHistory,
} from '../../services/chatEngine';
import { useWallet } from '../../services/wallet';

const QUICK_PROMPTS = [
  'Hey beauty!',
  'You look amazing today',
  'Can we talk?',
  'I love your style',
];

export default function PremiumChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile: Profile = MOCK_PROFILES.find((p) => p.id === id) || MOCK_PROFILES[0];

  const { theme, isDark } = useTheme();
  const { coins } = useWallet();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const typingDotsAnim = useRef(new Animated.Value(0)).current;

  // Load chat history
  useEffect(() => {
    getChatHistory(profile.id, profile.name).then((history) => {
      setMessages(history);
      scrollToBottom();
    });
  }, [profile.id]);

  // Typing animation
  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDotsAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(typingDotsAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: Date.now(),
      status: 'delivered',
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    saveChatHistory(profile.id, updated);
    setInputText('');
    scrollToBottom();

    // Trigger simulated companion response
    setTimeout(() => {
      setIsTyping(true);
      scrollToBottom();

      const { text: replyText, delayMs } = getSimulatedReply(text, profile.name);

      setTimeout(() => {
        setIsTyping(false);
        const companionMsg: ChatMessage = {
          id: 'msg-' + Date.now(),
          sender: 'profile',
          text: replyText,
          timestamp: Date.now(),
          status: 'read',
        };

        setMessages((prev) => {
          const finalMessages = [...prev, companionMsg];
          saveChatHistory(profile.id, finalMessages);
          return finalMessages;
        });
        scrollToBottom();

        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      }, delayMs);
    }, 600);
  };

  const handleGiftSent = (gift: { name: string; icon: string; coins: number; emoji?: string; accentColor?: string }) => {
    const visual = findGiftVisual(gift.emoji || gift.name || gift.icon);
    const giftMsg: ChatMessage = {
      id: 'msg-gift-' + Date.now(),
      sender: 'user',
      text: `Sent ${visual.name}!`,
      timestamp: Date.now(),
      type: 'gift',
      giftIcon: visual.emoji,
      giftEmoji: visual.emoji,
      giftName: visual.name,
      giftCoins: visual.coins,
      giftAccent: visual.accentColor,
      status: 'delivered',
    };

    const updated = [...messages, giftMsg];
    setMessages(updated);
    saveChatHistory(profile.id, updated);
    scrollToBottom();

    // Model thanks user for gift
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const thanksMsg: ChatMessage = {
          id: 'msg-thanks-' + Date.now(),
          sender: 'profile',
          text: `Aww thank you so much for the ${gift.name}! You are so sweet. Let's do a video call now!`,
          timestamp: Date.now(),
          status: 'read',
        };
        setMessages((prev) => {
          const finalMessages = [...prev, thanksMsg];
          saveChatHistory(profile.id, finalMessages);
          return finalMessages;
        });
        scrollToBottom();

        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      }, 1500);
    }, 800);
  };

  return (
    <AppBackground>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: 'transparent' },
        ]}
        edges={['top']}
      >
      {/* Top Header matching Stitch Premium Chat (seamless background with no divider) */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: 'transparent',
            borderBottomWidth: 0,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <BackButton />

          <TouchableOpacity
            style={styles.profileMeta}
            onPress={() => router.push(`/profile/${profile.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarWrap}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text
                style={[
                  styles.name,
                  { color: isDark ? '#FFFFFF' : '#191C1D' },
                ]}
              >
                {profile.name}, {profile.age}
              </Text>
              <Text
                style={[
                  styles.locationText,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {profile.city}, {profile.country}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages & Input with Keyboard Avoidance */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
        >
          {/* Top Image Gallery Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryScroll}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPreviewImage(profile.avatar)}
            >
              <Image source={{ uri: profile.avatar }} style={styles.galleryImage} />
            </TouchableOpacity>
            {MOCK_PROFILES.filter((p) => p.id !== profile.id).slice(0, 3).map((other, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPress={() => setPreviewImage(other.avatar)}
              >
                <Image source={{ uri: other.avatar }} style={styles.galleryImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {messages.map((item) => {
            const isMe = item.sender === 'user';
            const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            if (item.type === 'gift') {
              const visual = findGiftVisual(item.giftEmoji || item.giftName || item.giftIcon);
              return (
                <View key={item.id} style={styles.giftMessageWrap}>
                  <View
                    style={[
                      styles.giftCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(28, 24, 30, 0.85)'
                          : 'rgba(255, 255, 255, 0.95)',
                        borderWidth: 1.5,
                        borderColor: visual.accentColor + (isDark ? '80' : '60'),
                      },
                    ]}
                  >
                    <View style={[styles.giftBadgeTag, { backgroundColor: visual.accentColor + '25' }]}>
                      <Text style={[styles.giftBadgeTagText, { color: visual.accentColor }]}>
                        EXCLUSIVE GIFT
                      </Text>
                    </View>

                    <Text style={styles.giftCardIcon}>{visual.emoji}</Text>

                    <Text
                      style={[
                        styles.giftCardText,
                        { color: isDark ? '#FFFFFF' : '#191C1D' },
                      ]}
                    >
                      You sent {visual.name}
                    </Text>

                    <Text
                      style={[
                        styles.giftCardTime,
                        { color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#8E8E93' },
                      ]}
                    >
                      {timeStr}
                    </Text>
                  </View>
                </View>
              );
            }

            return (
              <View
                key={item.id}
                style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}
              >
                {!isMe && <Image source={{ uri: profile.avatar }} style={styles.msgAvatar} />}
                {isMe ? (
                  <View
                    style={[
                      styles.bubble,
                      styles.bubbleMe,
                      {
                        borderWidth: 0,
                      },
                    ]}
                  >
                    <Text style={[styles.msgText, styles.msgTextMe]}>
                      {item.text}
                    </Text>
                    <View style={styles.msgFooter}>
                      <Text style={styles.timeText}>{timeStr}</Text>
                      <Ionicons
                        name="checkmark-done"
                        size={14}
                        color="#FFF"
                        style={{ marginLeft: 4 }}
                      />
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.bubble,
                      styles.bubbleOther,
                      {
                        borderWidth: 0,
                      },
                    ]}
                  >
                    <BlurView
                      intensity={50}
                      tint={isDark ? 'dark' : 'light'}
                      style={[
                        styles.bubbleBlurContent,
                        {
                          backgroundColor: isDark
                            ? 'rgba(30, 32, 32, 0.55)'
                            : 'rgba(255, 255, 255, 0.85)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.msgText,
                          { color: isDark ? '#E2E2E2' : '#191C1D' },
                        ]}
                      >
                        {item.text}
                      </Text>
                      <View style={styles.msgFooter}>
                        <Text
                          style={[
                            styles.timeText,
                            { color: isDark ? 'rgba(241, 224, 228, 0.6)' : '#8E8E93' },
                          ]}
                        >
                          {timeStr}
                        </Text>
                      </View>
                    </BlurView>
                  </View>
                )}
              </View>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={[styles.msgRow, styles.msgRowOther]}>
              <Image source={{ uri: profile.avatar }} style={styles.msgAvatar} />
              <View style={[styles.bubble, styles.bubbleOther]}>
                <BlurView
                  intensity={50}
                  tint={isDark ? 'dark' : 'light'}
                  style={[
                    styles.bubbleBlurContent,
                    styles.typingBubble,
                    {
                      backgroundColor: isDark
                        ? 'rgba(30, 32, 32, 0.55)'
                        : 'rgba(255, 255, 255, 0.85)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typingText,
                      { color: isDark ? '#E2E2E2' : '#191C1D' },
                    ]}
                  >
                    typing
                  </Text>
                  <Animated.Text
                    style={[
                      styles.typingDots,
                      {
                        opacity: typingDotsAnim,
                        color: isDark ? '#E2E2E2' : '#191C1D',
                      },
                    ]}
                  >
                    ...
                  </Animated.Text>
                </BlurView>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <View style={styles.promptsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promptsContent}
          >
            {QUICK_PROMPTS.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.promptChip}
                onPress={() => handleSend(p)}
                activeOpacity={0.8}
              >
                <BlurView
                  intensity={55}
                  tint={isDark ? 'dark' : 'light'}
                  style={[
                    styles.promptChipBlur,
                    {
                      backgroundColor: isDark
                        ? 'rgba(30, 32, 32, 0.55)'
                        : 'rgba(255, 255, 255, 0.8)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.promptText,
                      { color: isDark ? '#E2E2E2' : '#191C1D' },
                    ]}
                  >
                    {p}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Input Area Floating Container with Bottom Gap */}
        <View
          style={[
            styles.inputOuterWrapper,
            {
              paddingBottom: Math.max(insets.bottom, 12) + 8,
            },
          ]}
        >
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.inputBar,
              {
                backgroundColor: isDark
                  ? 'rgba(18, 20, 20, 0.88)'
                  : 'rgba(255, 255, 255, 0.94)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            {/* Video Call Button (Moved to the LEFT of the input) */}
            <TouchableOpacity
              style={styles.videoCallInputBtn}
              onPress={() => router.push(`/call/${profile.id}` as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="videocam" size={19} color="#FFF" />
            </TouchableOpacity>

            {/* Gift Button (To the LEFT of the input) */}
            <TouchableOpacity
              style={[
                styles.giftInputBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(51, 53, 53, 0.5)'
                    : '#F1F3F5',
                },
              ]}
              onPress={() => setGiftModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="gift" size={19} color="#F65592" />
            </TouchableOpacity>

            {/* Input Field Container */}
            <View
              style={[
                styles.inputFieldContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(30, 32, 32, 0.6)'
                    : '#F1F3F5',
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#E2E2E2' : '#191C1D' },
                ]}
                placeholder="Message..."
                placeholderTextColor={isDark ? 'rgba(223, 190, 198, 0.5)' : '#8E8E93'}
                value={inputText}
                onChangeText={setInputText}
                onFocus={scrollToBottom}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
              {inputText.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.inlineSendBtn}
                  onPress={() => handleSend()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="send" size={15} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>

      <GiftModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        onGiftSent={handleGiftSent}
        onNeedRecharge={() => setRechargeModalVisible(true)}
      />

      <RechargeModal
        visible={rechargeModalVisible}
        onClose={() => setRechargeModalVisible(false)}
      />

      {/* Full-Screen Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setPreviewImage(null)}
      >
        <View
          style={[
            styles.fullScreenModalOverlay,
            {
              backgroundColor: isDark
                ? 'rgba(0, 0, 0, 0.70)'
                : 'rgba(20, 20, 25, 0.45)',
            },
          ]}
        >
          <SafeAreaView style={styles.fullScreenModalHeader} edges={['top']}>
            <TouchableOpacity
              style={[
                styles.fullScreenCloseBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.20)'
                    : 'rgba(0, 0, 0, 0.35)',
                },
              ]}
              onPress={() => setPreviewImage(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          <TouchableOpacity
            style={styles.fullScreenModalBody}
            activeOpacity={1}
            onPress={() => setPreviewImage(null)}
          >
            {previewImage && (
              <Image
                source={{ uri: previewImage }}
                style={styles.fullScreenModalImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: 'rgba(18, 20, 20, 0.65)',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(51, 53, 53, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 4,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ADE80',
  },
  name: {
    color: '#E2E2E2',
    fontSize: 16,
    fontWeight: '700',
  },
  locationText: {
    color: '#DFBEC6',
    fontSize: 12,
    fontWeight: '400',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 4,
  },
  galleryScroll: {
    gap: 8,
    paddingBottom: 6,
    marginBottom: 4,
  },
  galleryImage: {
    width: 52,
    height: 68,
    borderRadius: 12,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
  },
  bubbleMe: {
    paddingVertical: 11,
    paddingHorizontal: 15,
    backgroundColor: '#F65592',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
  },
  bubbleBlurContent: {
    paddingVertical: 11,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(30, 32, 32, 0.55)',
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMe: {
    color: '#FFF',
  },
  msgTextOther: {
    color: '#E2E2E2',
  },
  msgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  typingText: {
    color: '#F65592',
    fontSize: 13,
    fontWeight: '600',
  },
  typingDots: {
    color: '#F65592',
    fontSize: 16,
    fontWeight: '800',
  },
  giftMessageWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  giftCard: {
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignItems: 'center',
    minWidth: 210,
  },
  giftBadgeTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  giftBadgeTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  giftCardIcon: {
    fontSize: 46,
    marginBottom: 4,
  },
  giftCardText: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  giftCoinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  giftCoinsVal: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '800',
  },
  giftCardTime: {
    fontSize: 10,
    marginTop: 2,
  },
  promptsRow: {
    paddingVertical: 8,
  },
  promptsContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  promptChip: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  promptChipBlur: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(30, 32, 32, 0.5)',
  },
  promptText: {
    color: '#E2E2E2',
    fontSize: 12,
    fontWeight: '500',
  },
  inputOuterWrapper: {
    paddingHorizontal: 12,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 8,
  },
  giftInputBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 53, 53, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputFieldContainer: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 32, 32, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: '#E2E2E2',
    fontSize: 14,
    paddingVertical: 0,
  },
  inlineSendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F65592',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  videoCallInputBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F65592',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  fullScreenModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 20,
  },
  fullScreenCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenModalBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  fullScreenModalImage: {
    width: '100%',
    height: '100%',
  },
  chatTopFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    zIndex: 10,
  },
  chatBottomFade: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 10,
  },
});
