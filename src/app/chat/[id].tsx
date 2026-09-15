import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AppBackground from "../../components/AppBackground";
import AppModal from "../../components/AppModal";
import SkeletonImage from "../../components/SkeletonImage";
import BackButton from "../../components/BackButton";
import GiftModal from "../../components/GiftModal";
import RechargeModal from "../../components/RechargeModal";
import { useTheme } from "../../context/ThemeContext";
import {
  MOCK_PROFILES,
  Profile,
  findGiftVisual,
} from "../../data/mockProfiles";
import {
  ChatMessage,
  getChatHistory,
  markChatAsRead,
  saveChatHistory,
  setActiveChatProfileId,
  subscribeNewMessages,
} from "../../services/chatEngine";
import {
  planReply,
  planUserPhotoReaction,
} from "../../services/personaEngine";
import { enrollProactiveGirl } from "../../services/proactiveService";
import {
  isTypingFor,
  notifyUserSent,
  runGiftThanks,
  runPlan,
  subscribeTyping,
} from "../../services/replyRunner";
import { deductCoins, useWallet } from "../../services/wallet";

const QUICK_PROMPTS = [
  "Aap bohot cute ho ✨",
  "Kya kar rahi ho abhi? 💭",
  "Photo dikhao na apni 📸",
  "Video call pe aao na! 🎥",
];

export default function PremiumChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile: Profile =
    MOCK_PROFILES.find((p) => p.id === id) || MOCK_PROFILES[0];

  const { theme, isDark } = useTheme();
  const { coins, isVip } = useWallet();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [callLowBalanceVisible, setCallLowBalanceVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // Locked-photo unlock: which message is pending confirmation
  const [unlockTarget, setUnlockTarget] = useState<ChatMessage | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);

  const handleUnlockConfirm = async () => {
    if (!unlockTarget || unlockBusy) return;
    if (isVip) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      const targetId = unlockTarget.id;
      setUnlockTarget(null);
      setMessages((prev) => {
        const next = prev.map((m) =>
          m.id === targetId ? { ...m, isUnlocked: true, isBlurred: false } : m,
        );
        saveChatHistory(profile.id, next);
        return next;
      });
      return;
    }
    const cost = unlockTarget.unlockCost ?? 30;
    setUnlockBusy(true);
    const ok = await deductCoins(cost);
    setUnlockBusy(false);
    if (!ok) {
      // Not enough coins ,  send them to recharge instead
      setUnlockTarget(null);
      setRechargeModalVisible(true);
      return;
    }
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    const targetId = unlockTarget.id;
    setUnlockTarget(null);
    setMessages((prev) => {
      const next = prev.map((m) =>
        m.id === targetId ? { ...m, isUnlocked: true, isBlurred: false } : m,
      );
      saveChatHistory(profile.id, next);
      return next;
    });
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const typingDotsAnim = useRef(new Animated.Value(0)).current;

  // Screen is a thin view now: her reply choreography runs screen-free
  // in replyRunner (survives leaving this chat). Local timers only guard
  // nothing; leaving never cancels her in-flight reply.
  useEffect(() => {
    setActiveChatProfileId(profile.id);
    markChatAsRead(profile.id);
    return () => {
      setActiveChatProfileId(null);
    };
  }, [profile.id]);

  // Load chat history
  useEffect(() => {
    getChatHistory(profile.id, profile.name, profile.archetype).then(
      (history) => {
        setMessages(history);
        markChatAsRead(profile.id);
        scrollToBottom();
      },
    );
  }, [profile.id]);

  // Live messages delivered while the app is running (e.g. the funnel
  // opener landing while you're inside her chat): append instantly.
  // Sound + vibration are already played by deliverLiveMessage ,  do NOT
  // play them again here (that doubles).
  useEffect(() => {
    const unsub = subscribeNewMessages((pid, msg) => {
      if (pid !== profile.id || msg.sender !== "profile") return;
      markChatAsRead(profile.id);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const next = [...prev, msg];
        saveChatHistory(profile.id, next);
        return next;
      });
      scrollToBottom();
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    });
    return unsub;
  }, [profile.id]);

  // Her typing dots for THIS chat (runner emits per-profile; re-entering
  // mid-typing still shows dots via the isTypingFor seed).
  useEffect(() => {
    setIsTyping(isTypingFor(profile.id));
    const unsub = subscribeTyping((pid, typing) => {
      if (pid !== profile.id) return;
      setIsTyping(typing);
      if (typing) scrollToBottom();
    });
    return unsub;
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
        ]),
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
      id: "msg-" + Date.now(),
      sender: "user",
      text,
      timestamp: Date.now(),
      status: "delivered",
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    saveChatHistory(profile.id, updated);
    setInputText("");
    scrollToBottom();
    notifyUserSent(profile.id);
    enrollProactiveGirl(profile.id).catch(() => {});

    // Persona planner (async ,  memory is really persisted now) + the
    // screen-free runner: her reply (first bubble ALWAYS ≤10s) lands even
    // if he leaves this chat mid-silence. The runner owns silence →
    // typing → bubbles → follow-up → nudge.
    planReply(profile, text)
      .then((plan) => runPlan(profile, plan))
      .catch(() => {});
  };

  const handleSendPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      const photoMsg: ChatMessage = {
        id: "msg-" + Date.now() + "-uphoto",
        sender: "user",
        text: "",
        timestamp: Date.now(),
        type: "photo",
        mediaUrl: res.assets[0].uri,
        status: "delivered",
      };
      const updated = [...messages, photoMsg];
      setMessages(updated);
      saveChatHistory(profile.id, updated);
      scrollToBottom();
      notifyUserSent(profile.id);
      enrollProactiveGirl(profile.id).catch(() => {});
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
      // She reacts to YOUR photo: compliment/tease, affection boost, and
      // if she owed you one ("you first"), she sends hers back free.
      // Runner-owned ,  survives leaving the chat.
      planUserPhotoReaction(profile)
        .then((plan) => runPlan(profile, plan))
        .catch(() => {});
    } catch (e) {}
  };

  const handleGiftSent = (gift: {
    name: string;
    icon: string;
    coins: number;
    emoji?: string;
    accentColor?: string;
  }) => {
    const visual = findGiftVisual(gift.emoji || gift.name || gift.icon);
    const giftMsg: ChatMessage = {
      id: "msg-gift-" + Date.now(),
      sender: "user",
      text: `Sent ${visual.name}!`,
      timestamp: Date.now(),
      type: "gift",
      giftIcon: visual.emoji,
      giftEmoji: visual.emoji,
      giftName: visual.name,
      giftCoins: visual.coins,
      giftAccent: visual.accentColor,
      status: "delivered",
    };

    const updated = [...messages, giftMsg];
    setMessages(updated);
    saveChatHistory(profile.id, updated);
    scrollToBottom();
    notifyUserSent(profile.id);
    enrollProactiveGirl(profile.id).catch(() => {});

    // Model thanks user for gift ,  runner-owned (notice → type → thanks),
    // survives leaving the chat.
    runGiftThanks(profile.id, gift.name, profile.archetype || "playful_tease");
  };

  return (
    <AppBackground>
      <SafeAreaView
        style={[styles.container, { backgroundColor: "transparent" }]}
        edges={["top"]}
      >
        {/* Top Header matching Stitch Premium Chat (seamless background with no divider) */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: "transparent",
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
                <SkeletonImage uri={profile.avatar} style={styles.avatar} recyclingKey={profile.avatar} />
                <View style={styles.onlineDot} />
              </View>
              <View>
                <Text
                  style={[
                    styles.name,
                    { color: isDark ? "#FFFFFF" : "#191C1D" },
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
          >
            {/* Top Image Gallery Scroll (Strictly isolated to this companion) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
            >
              {[profile.avatar, ...(profile.photos || [])]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((imgUri, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.85}
                    onPress={() => setPreviewImage(imgUri)}
                  >
                    <SkeletonImage
                      uri={imgUri}
                      style={styles.galleryImage}
                      recyclingKey={imgUri}
                    />
                  </TouchableOpacity>
                ))}
            </ScrollView>

            {messages.length === 0 && (
              <View style={styles.emptyConversationWrap}>
                <SkeletonImage
                  uri={profile.avatar}
                  style={styles.emptyConversationAvatar}
                  recyclingKey={profile.avatar}
                />
                <Text
                  style={[
                    styles.emptyConversationName,
                    { color: isDark ? "#FFFFFF" : "#191C1D" },
                  ]}
                >
                  {profile.name}
                </Text>
                <Text
                  style={[
                    styles.emptyConversationSub,
                    {
                      color: isDark
                        ? "rgba(241, 224, 228, 0.65)"
                        : "#6B7280",
                    },
                  ]}
                >
                  Say hello to {profile.name.split(" ")[0]} to start the conversation!
                </Text>
              </View>
            )}

            {messages.map((item) => {
              const isMe = item.sender === "user";
              const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              // Photo message (locked or unlocked photo)
              if (
                (item.type === "photo" || item.type === "locked_photo") &&
                item.mediaUrl
              ) {
                const isLocked = item.type === "locked_photo" && !item.isUnlocked;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.msgRow,
                      isMe ? styles.msgRowMe : styles.msgRowOther,
                    ]}
                  >
                    {!isMe && (
                      <SkeletonImage
                        uri={profile.avatar}
                        style={styles.msgAvatar}
                        recyclingKey={profile.avatar}
                      />
                    )}
                    <View style={[styles.mediaCol, isMe && styles.mediaColMe]}>
                      {/* Separate Card 1: Dedicated Image Card */}
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          if (isLocked) {
                            if (isVip) {
                              try {
                                Haptics.notificationAsync(
                                  Haptics.NotificationFeedbackType.Success,
                                );
                              } catch (e) {}
                              setMessages((prev) => {
                                const next = prev.map((m) =>
                                  m.id === item.id
                                    ? { ...m, isUnlocked: true, isBlurred: false }
                                    : m,
                                );
                                saveChatHistory(profile.id, next);
                                return next;
                              });
                              if (item.mediaUrl) {
                                setPreviewImage(item.mediaUrl);
                              }
                            } else {
                              setUnlockTarget(item);
                            }
                          } else {
                            setPreviewImage(item.mediaUrl!);
                          }
                        }}
                        style={styles.imageCardWrap}
                      >
                        <SkeletonImage
                          uri={item.mediaUrl}
                          style={styles.imageCard}
                          contentFit="cover"
                          blurRadius={isLocked ? 12 : 0}
                          recyclingKey={item.mediaUrl}
                        />

                        {isLocked && (
                          <View style={styles.lockedOverlay}>
                            <View
                              style={[
                                styles.lockedBadge,
                                isVip && {
                                  backgroundColor: "rgba(255, 215, 0, 0.28)",
                                },
                              ]}
                            >
                              <Ionicons
                                name={isVip ? "sparkles" : "eye-outline"}
                                size={26}
                                color={isVip ? "#FFD700" : "#FFFFFF"}
                              />
                            </View>
                            <View
                              style={[
                                styles.openPill,
                                isVip && {
                                  backgroundColor: "rgba(255, 215, 0, 0.95)",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.openPillText,
                                  isVip && {
                                    color: "#1A1A1A",
                                    fontWeight: "800",
                                  },
                                ]}
                              >
                                {isVip ? "VIP Free Unlock" : "Click to open"}
                              </Text>
                            </View>
                          </View>
                        )}

                        {!item.text && (
                          <View style={styles.mediaTimestampOverlay}>
                            <Text style={styles.mediaTimestampText}>
                              {timeStr}
                            </Text>
                            {isMe && (
                              <Ionicons
                                name="checkmark-done"
                                size={13}
                                color="#FFF"
                                style={{ marginLeft: 3 }}
                              />
                            )}
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Separate Card 2: Distinct Message Card for Text (if present) */}
                      {item.text ? (
                        isMe ? (
                          <View
                            style={[
                              styles.bubble,
                              styles.bubbleMe,
                              styles.mediaAttachedTextBubble,
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
                              styles.mediaAttachedTextBubble,
                            ]}
                          >
                            <BlurView
                              intensity={50}
                              tint={isDark ? "dark" : "light"}
                              style={[
                                styles.bubbleBlurContent,
                                {
                                  backgroundColor: isDark
                                    ? "rgba(30, 32, 32, 0.65)"
                                    : "rgba(255, 255, 255, 0.88)",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.msgText,
                                  styles.msgTextOther,
                                  { color: isDark ? "#FFFFFF" : "#191C1D" },
                                ]}
                              >
                                {item.text}
                              </Text>
                              <View style={styles.msgFooter}>
                                <Text
                                  style={[
                                    styles.timeText,
                                    {
                                      color: isDark
                                        ? "rgba(241, 224, 228, 0.6)"
                                        : "#8E8E93",
                                    },
                                  ]}
                                >
                                  {timeStr}
                                </Text>
                              </View>
                            </BlurView>
                          </View>
                        )
                      ) : null}
                    </View>
                  </View>
                );
              }

              if (item.type === "gift") {
                const visual = findGiftVisual(
                  item.giftEmoji || item.giftName || item.giftIcon,
                );
                return (
                  <View key={item.id} style={styles.giftMessageWrap}>
                    <View
                      style={[
                        styles.giftCard,
                        {
                          backgroundColor: isDark
                            ? visual.accentColor + "28"
                            : visual.accentColor + "18",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.giftBadgeTag,
                          { backgroundColor: visual.accentColor + "25" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.giftBadgeTagText,
                            { color: visual.accentColor },
                          ]}
                        >
                          EXCLUSIVE GIFT
                        </Text>
                      </View>

                      <Text style={styles.giftCardIcon}>{visual.emoji}</Text>

                      <Text
                        style={[
                          styles.giftCardText,
                          { color: isDark ? "#FFFFFF" : "#191C1D" },
                        ]}
                      >
                        You sent {visual.name}
                      </Text>

                      <Text
                        style={[
                          styles.giftCardTime,
                          {
                            color: isDark
                              ? "rgba(255, 255, 255, 0.55)"
                              : "#8E8E93",
                          },
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
                  style={[
                    styles.msgRow,
                    isMe ? styles.msgRowMe : styles.msgRowOther,
                  ]}
                >
                  {!isMe && (
                    <SkeletonImage
                      uri={profile.avatar}
                      style={styles.msgAvatar}
                      recyclingKey={profile.avatar}
                    />
                  )}
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
                        tint={isDark ? "dark" : "light"}
                        style={[
                          styles.bubbleBlurContent,
                          {
                            backgroundColor: isDark
                              ? "rgba(30, 32, 32, 0.55)"
                              : "rgba(255, 255, 255, 0.85)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.msgText,
                            { color: isDark ? "#E2E2E2" : "#191C1D" },
                          ]}
                        >
                          {item.text}
                        </Text>
                        <View style={styles.msgFooter}>
                          <Text
                            style={[
                              styles.timeText,
                              {
                                color: isDark
                                  ? "rgba(241, 224, 228, 0.6)"
                                  : "#8E8E93",
                              },
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
<SkeletonImage
                uri={profile.avatar}
                style={styles.msgAvatar}
                recyclingKey={profile.avatar}
              />
                <View style={[styles.bubble, styles.bubbleOther]}>
                  <BlurView
                    intensity={50}
                    tint={isDark ? "dark" : "light"}
                    style={[
                      styles.bubbleBlurContent,
                      styles.typingBubble,
                      {
                        backgroundColor: isDark
                          ? "rgba(30, 32, 32, 0.55)"
                          : "rgba(255, 255, 255, 0.85)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typingText,
                        { color: isDark ? "#E2E2E2" : "#191C1D" },
                      ]}
                    >
                      typing
                    </Text>
                    <Animated.Text
                      style={[
                        styles.typingDots,
                        {
                          opacity: typingDotsAnim,
                          color: isDark ? "#E2E2E2" : "#191C1D",
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
                    tint={isDark ? "dark" : "light"}
                    style={[
                      styles.promptChipBlur,
                      {
                        backgroundColor: isDark
                          ? "rgba(30, 32, 32, 0.55)"
                          : "rgba(255, 255, 255, 0.8)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.promptText,
                        { color: isDark ? "#E2E2E2" : "#191C1D" },
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
              tint={isDark ? "dark" : "light"}
              style={[
                styles.inputBar,
                {
                  backgroundColor: isDark
                    ? "rgba(18, 20, 20, 0.88)"
                    : "rgba(255, 255, 255, 0.94)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.06)",
                },
              ]}
            >
              {/* Video Call Button (Moved to the LEFT of the input) */}
              <TouchableOpacity
                style={styles.videoCallInputBtn}
                onPress={() => {
                  if (coins < profile.callRate) {
                    setCallLowBalanceVisible(true);
                    return;
                  }
                  router.push(`/call/${profile.id}` as any);
                }}
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
                      ? "rgba(51, 53, 53, 0.5)"
                      : "#F1F3F5",
                  },
                ]}
                onPress={() => setGiftModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="gift" size={19} color="#F65592" />
              </TouchableOpacity>

              {/* Photo Button ,  send her YOUR photo from gallery */}
              <TouchableOpacity
                style={[
                  styles.giftInputBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(51, 53, 53, 0.5)"
                      : "#F1F3F5",
                  },
                ]}
                onPress={handleSendPhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="image" size={19} color="#F65592" />
              </TouchableOpacity>

              {/* Input Field Container */}
              <View
                style={[
                  styles.inputFieldContainer,
                  {
                    backgroundColor: isDark
                      ? "rgba(30, 32, 32, 0.6)"
                      : "#F1F3F5",
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.input,
                    { color: isDark ? "#E2E2E2" : "#191C1D" },
                  ]}
                  placeholder="Message..."
                  placeholderTextColor={
                    isDark ? "rgba(223, 190, 198, 0.5)" : "#8E8E93"
                  }
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

        {/* Low Balance Video Call Notice */}
        <AppModal
          visible={callLowBalanceVisible}
          onClose={() => setCallLowBalanceVisible(false)}
          title="Insufficient Coins"
          description={`${profile.name}'s video call rate is ${profile.callRate} coins/min. You have ${coins} coins. Please recharge to start calling!`}
          icon="videocam-outline"
          primaryAction={{
            label: "Recharge Now",
            onPress: () => {
              setCallLowBalanceVisible(false);
              setRechargeModalVisible(true);
            },
          }}
          secondaryAction={{
            label: "Cancel",
            onPress: () => setCallLowBalanceVisible(false),
          }}
        />

        {/* Locked-photo unlock confirmation: explicit consent before deducting */}
        <AppModal
          visible={!!unlockTarget}
          onClose={() => {
            if (!unlockBusy) setUnlockTarget(null);
          }}
          title="Unlock this photo?"
          description={
            unlockTarget
              ? `${unlockTarget.unlockCost ?? 30} coins will be deducted from your balance (you have ${coins}).`
              : undefined
          }
          icon="lock-closed-outline"
          primaryAction={{
            label: unlockBusy
              ? "Unlocking..."
              : `Unlock · ${unlockTarget?.unlockCost ?? 30} coins`,
            onPress: handleUnlockConfirm,
          }}
          secondaryAction={{
            label: "Cancel",
            onPress: () => {
              if (!unlockBusy) setUnlockTarget(null);
            },
          }}
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
                  ? "rgba(0, 0, 0, 0.70)"
                  : "rgba(20, 20, 25, 0.45)",
              },
            ]}
          >
            <SafeAreaView style={styles.fullScreenModalHeader} edges={["top"]}>
              <TouchableOpacity
                style={[
                  styles.fullScreenCloseBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.20)"
                      : "rgba(0, 0, 0, 0.35)",
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
                <SkeletonImage
                  uri={previewImage}
                  style={styles.fullScreenModalImage}
                  contentFit="contain"
                  recyclingKey={previewImage}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: "rgba(18, 20, 20, 0.65)",
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(51, 53, 53, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileMeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 4,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4ADE80",
  },
  name: {
    color: "#E2E2E2",
    fontSize: 16,
    fontWeight: "700",
  },
  locationText: {
    color: "#DFBEC6",
    fontSize: 12,
    fontWeight: "400",
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
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  msgRowMe: {
    justifyContent: "flex-end",
  },
  msgRowOther: {
    justifyContent: "flex-start",
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
  },
  bubbleMe: {
    paddingVertical: 11,
    paddingHorizontal: 15,
    backgroundColor: "#F65592",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    overflow: "hidden",
  },
  bubbleBlurContent: {
    paddingVertical: 11,
    paddingHorizontal: 15,
    backgroundColor: "rgba(30, 32, 32, 0.55)",
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMe: {
    color: "#FFF",
  },
  msgTextOther: {
    color: "#E2E2E2",
  },
  msgFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
  },
  mediaCol: {
    alignItems: "flex-start",
  },
  mediaColMe: {
    alignItems: "flex-end",
  },
  imageCardWrap: {
    width: 224,
    height: 274,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(30, 32, 32, 0.45)",
    position: "relative",
  },
  imageCard: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  mediaAttachedTextBubble: {
    marginTop: 6,
    maxWidth: 224,
  },
  mediaTimestampOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  mediaTimestampText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "500",
  },
  lockedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  lockedBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F65592",
  },
  openPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.70)",
  },
  openPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  typingText: {
    color: "#F65592",
    fontSize: 13,
    fontWeight: "600",
  },
  typingDots: {
    color: "#F65592",
    fontSize: 16,
    fontWeight: "800",
  },
  giftMessageWrap: {
    alignItems: "center",
    marginVertical: 8,
  },
  giftCard: {
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignItems: "center",
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
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  giftCardIcon: {
    fontSize: 46,
    marginBottom: 4,
  },
  giftCardText: {
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },
  giftCoinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  giftCoinsVal: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "800",
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
    overflow: "hidden",
  },
  promptChipBlur: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(30, 32, 32, 0.5)",
  },
  promptText: {
    color: "#E2E2E2",
    fontSize: 12,
    fontWeight: "500",
  },
  inputOuterWrapper: {
    paddingHorizontal: 12,
    paddingTop: 6,
    backgroundColor: "transparent",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 26,
    overflow: "hidden",
    gap: 8,
  },
  giftInputBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(51, 53, 53, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputFieldContainer: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30, 32, 32, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: "#E2E2E2",
    fontSize: 14,
    paddingVertical: 0,
  },
  inlineSendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F65592",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  videoCallInputBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F65592",
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.94)",
  },
  fullScreenModalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 20,
  },
  fullScreenCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreenModalBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  fullScreenModalImage: {
    width: "100%",
    height: "100%",
  },
  chatTopFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    zIndex: 10,
  },
  chatBottomFade: {
    position: "absolute",
    bottom: 56,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 10,
  },
  emptyConversationWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyConversationAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 10,
  },
  emptyConversationName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  emptyConversationSub: {
    fontSize: 12.5,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 250,
  },
});
