import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBlurView from '../../components/AppBlurView';
import BackButton from '../../components/BackButton';
import GiftModal from '../../components/GiftModal';
import RechargeModal from '../../components/RechargeModal';
import { StitchTheme } from '../../constants/theme';
import { MOCK_PROFILES, Profile } from '../../data/mockProfiles';
import {
    ChatMessage,
    getChatHistory,
    getSimulatedReply,
    saveChatHistory,
} from '../../services/chatEngine';
import { useWallet } from '../../services/wallet';

const QUICK_PROMPTS = [
  'Hey beauty! 👋',
  'You look amazing today ✨',
  'Can we talk? 💬',
  'I love your style 💃',
];

export default function PremiumChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile: Profile = MOCK_PROFILES.find((p) => p.id === id) || MOCK_PROFILES[0];

  const { coins } = useWallet();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);

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

  const handleGiftSent = (gift: { name: string; icon: string; coins: number }) => {
    const giftMsg: ChatMessage = {
      id: 'msg-gift-' + Date.now(),
      sender: 'user',
      text: `Sent ${gift.name}!`,
      timestamp: Date.now(),
      type: 'gift',
      giftIcon: gift.icon,
      giftName: gift.name,
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
          text: `Aww thank you so much for the ${gift.name} ${gift.icon}! You are so sweet ❤️ Let's do a video call now!`,
          timestamp: Date.now(),
          status: 'read',
        };
        setMessages((prev) => {
          const finalMsgs = [...prev, thanksMsg];
          saveChatHistory(profile.id, finalMsgs);
          return finalMsgs;
        });
        scrollToBottom();
      }, 2000);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header matching Stitch Premium Chat */}
      <AppBlurView style={styles.header}>
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
              <Text style={styles.name}>{profile.name}, {profile.age}</Text>
              <Text style={styles.locationText}>{profile.city}, {profile.country}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </AppBlurView>

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
            <Image source={{ uri: profile.avatar }} style={styles.galleryImage} />
            {MOCK_PROFILES.filter((p) => p.id !== profile.id).slice(0, 3).map((other, i) => (
              <Image key={i} source={{ uri: other.avatar }} style={styles.galleryImage} />
            ))}
          </ScrollView>

          {messages.map((item) => {
            const isMe = item.sender === 'user';
            const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            if (item.type === 'gift') {
              return (
                <View key={item.id} style={styles.giftMessageWrap}>
                  <View style={styles.giftCard}>
                    <Text style={styles.giftCardIcon}>{item.giftIcon}</Text>
                    <Text style={styles.giftCardText}>You sent {item.giftName}</Text>
                    <Text style={styles.giftCardTime}>{timeStr}</Text>
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
                  <View style={[styles.bubble, styles.bubbleMe]}>
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
                  <View style={[styles.bubble, styles.bubbleOther]}>
                    <BlurView intensity={50} tint="dark" style={styles.bubbleBlurContent}>
                      <Text style={[styles.msgText, styles.msgTextOther]}>
                        {item.text}
                      </Text>
                      <View style={styles.msgFooter}>
                        <Text style={styles.timeText}>{timeStr}</Text>
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
                <BlurView intensity={50} tint="dark" style={[styles.bubbleBlurContent, styles.typingBubble]}>
                  <Text style={styles.typingText}>typing</Text>
                  <Animated.Text style={[styles.typingDots, { opacity: typingDotsAnim }]}>
                    ...
                  </Animated.Text>
                </BlurView>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Chips */}
        <View style={styles.promptsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsContent}>
            {QUICK_PROMPTS.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.promptChip}
                onPress={() => handleSend(p)}
                activeOpacity={0.8}
              >
                <BlurView intensity={55} tint="dark" style={styles.promptChipBlur}>
                  <Text style={styles.promptText}>{p}</Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Input Area 100% exact to Stitch (Gift | Input + Send | Video Call) */}
        <BlurView
          intensity={80}
          tint="dark"
          style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          <TouchableOpacity
            style={styles.giftInputBtn}
            onPress={() => setGiftModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="gift" size={20} color={StitchTheme.colors.primaryContainer} />
          </TouchableOpacity>

          <View style={styles.inputFieldContainer}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="rgba(223, 190, 198, 0.5)"
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
                <Ionicons name="send" size={16} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.videoCallInputBtn}
            onPress={() => router.push(`/call/${profile.id}` as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="videocam" size={20} color="#FFF" />
          </TouchableOpacity>
        </BlurView>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0F10',
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
    paddingBottom: 24,
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
    shadowColor: '#F65592',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
    marginVertical: 4,
  },
  giftCard: {
    backgroundColor: 'rgba(246, 85, 146, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  giftCardIcon: {
    fontSize: 32,
  },
  giftCardText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 4,
  },
  giftCardTime: {
    color: 'rgba(255, 255, 255, 0.5)',
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: 'rgba(12, 15, 16, 0.85)',
    gap: 10,
  },
  giftInputBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(51, 53, 53, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputFieldContainer: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 32, 32, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: '#E2E2E2',
    fontSize: 14,
    paddingVertical: 0,
  },
  inlineSendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F65592',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  videoCallInputBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F65592',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F65592',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
});
