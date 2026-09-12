import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEventListener } from "expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
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
import AppBlurView from "../../components/AppBlurView";
import AppModal from "../../components/AppModal";
import CoinIcon from "../../components/CoinIcon";
import GiftModal from "../../components/GiftModal";
import RechargeModal from "../../components/RechargeModal";
import { useTheme } from "../../context/ThemeContext";
import {
  FAKE_CALL_VIDEOS,
  MOCK_PROFILES,
  Profile,
  VIRTUAL_GIFTS
} from "../../data/mockProfiles";
import { saveCallLog } from "../../services/callHistoryService";
import {
  ChatMessage,
  generatePostCallFollowUp,
  saveChatHistory,
} from "../../services/chatEngine";
import {
  markCallFunnelFired,
  schedulePostDepletionReminder,
} from "../../services/engagementService";
import { deductCoins, getCoins, useWallet } from "../../services/wallet";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CallState = "ringing" | "connecting" | "connected" | "ended";
type CallDirection = "outgoing" | "incoming";

interface FloatingItem {
  id: string;
  icon: string;
  anim: Animated.Value;
  startX: number;
  swayAmount: number;
  scale: number;
}

interface CenterChatMessage {
  id: string;
  text: string;
  anim: Animated.Value;
}

interface ActiveGiftCelebration {
  id: string;
  name: string;
  emoji: string;
  image: string;
  coins: number;
  category: string;
  accentColor: string;
  glowColor: string;
  comboCount: number;
}

const CELEBRATION_PARTICLES = [
  { id: 1, char: "✨", angle: 0, distance: 165 },
  { id: 2, char: "💖", angle: 30, distance: 195 },
  { id: 3, char: "⭐", angle: 60, distance: 175 },
  { id: 4, char: "💎", angle: 90, distance: 190 },
  { id: 5, char: "🌟", angle: 120, distance: 170 },
  { id: 6, char: "✨", angle: 150, distance: 205 },
  { id: 7, char: "🔥", angle: 180, distance: 175 },
  { id: 8, char: "💖", angle: 210, distance: 195 },
  { id: 9, char: "⭐", angle: 240, distance: 170 },
  { id: 10, char: "💎", angle: 270, distance: 205 },
  { id: 11, char: "🌟", angle: 300, distance: 175 },
  { id: 12, char: "✨", angle: 330, distance: 190 },
];

const EMOJI_REACTIONS = [
  "❤️",
  "🔥",
  "👏",
  "😍",
  "🎉",
  "🌹",
  "✨",
  "😘",
  "🥰",
  "💖",
];

export default function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, dir } = useLocalSearchParams<{ id: string; dir?: string }>();
  const profile: Profile =
    MOCK_PROFILES.find((p) => p.id === id) || MOCK_PROFILES[0];
  const { theme, isDark } = useTheme();

  // Incoming = she called you (accepted from the overlay). Outgoing = you
  // dialed her. The two flows look and behave differently below.
  const direction: CallDirection = dir === "incoming" ? "incoming" : "outgoing";

  const { coins } = useWallet();
  // Incoming calls skip the dial-out ringing phase entirely: you already
  // picked up, so we go straight to a brief "connecting" beat.
  const [callState, setCallState] = useState<CallState>(
    direction === "incoming" ? "connecting" : "ringing",
  );
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [coinsDepletedModalVisible, setCoinsDepletedModalVisible] =
    useState(false);
  const [inCallRechargeAlertVisible, setInCallRechargeAlertVisible] =
    useState(false);
  const [inCallGraceSeconds, setInCallGraceSeconds] = useState(20);
  const [disconnectReason, setDisconnectReason] = useState<
    "user_ended" | "coins_depleted" | "insufficient_coins" | null
  >(null);
  const initialMinuteDeductedRef = useRef(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedModalPhoto, setSelectedModalPhoto] = useState<string | null>(
    null,
  );
  const [floatingGifts, setFloatingGifts] = useState<FloatingItem[]>([]);
  const [chatText, setChatText] = useState("");
  const [centerMessages, setCenterMessages] = useState<CenterChatMessage[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      },
    );
    // Mark missed-call funnel as fired once user enters a call screen
    markCallFunnelFired().catch(() => {});

    // Guard: Outgoing calls require at least 1 minute of coins
    if (direction === "outgoing" && coins < profile.callRate) {
      setDisconnectReason("insufficient_coins");
      setCallState("ended");
      setCoinsDepletedModalVisible(true);
    }

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [reconnecting, setReconnecting] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sonar1 = useRef(new Animated.Value(0)).current;
  const sonar2 = useRef(new Animated.Value(0)).current;
  const sonar3 = useRef(new Animated.Value(0)).current;

  // Gift Unboxing & Travel Animations (Goes from bottom to center, opens to reveal gift)
  const [activeCelebration, setActiveCelebration] =
    useState<ActiveGiftCelebration | null>(null);
  const giftTravelAnim = useRef(new Animated.Value(0)).current; // 0 (bottom) -> 1 (center)
  const boxOpenAnim = useRef(new Animated.Value(0)).current; // 0 (closed) -> 1 (bursts open)
  const giftRevealAnim = useRef(new Animated.Value(0)).current; // 0 (hidden) -> 1 (revealed & scaled)
  const giftExitAnim = useRef(new Animated.Value(1)).current; // 1 (visible) -> 0 (fade exit)
  const comboCountRef = useRef(1);
  const celebrationTimerRef = useRef<any>(null);
  const glitchTimerRef = useRef<any>(null);
  const followUpTimerRef = useRef<any>(null);

  // Video player setup (loops indefinitely for fake video call)
  const selectedVideoUrl = profile.videoUrl || FAKE_CALL_VIDEOS[0];
  const player = useVideoPlayer(selectedVideoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  // Guarantee endless looping across all devices & ExoPlayer states
  useEventListener(player, "playToEnd", () => {
    try {
      player.replay();
    } catch (e) {}
  });

  // Camera + microphone permissions
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    if (!micPermission?.granted) {
      requestMicPermission();
    }
  }, [permission, micPermission]);

  // Incoming path: she already rang and you accepted, so there is no
  // dial-out phase. Just a brief "connecting" beat, then live.
  useEffect(() => {
    if (callState !== "connecting") return;
    const ms = 1500 + Math.floor(Math.random() * 1000);
    const timer = setTimeout(() => {
      setCallState("connected");
      try {
        player.play();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      // One random brief "reconnecting" glitch ~45–75s into the call
      const glitchAt = 45_000 + Math.floor(Math.random() * 30_000);
      glitchTimerRef.current = setTimeout(() => {
        try {
          player.pause();
        } catch (e) {}
        setReconnecting(true);
        setTimeout(() => {
          try {
            player.play();
          } catch (e) {}
          setReconnecting(false);
        }, 850);
      }, glitchAt);
    }, ms);
    return () => clearTimeout(timer);
  }, [callState]);

  // Ringing phase logic with Radar Sonar Waves & Encrypted Stream setup
  // (outgoing only ,  incoming starts at 'connecting' above)
  useEffect(() => {
    let timer: any;
    let s1Anim: Animated.CompositeAnimation;
    let s2Anim: Animated.CompositeAnimation;
    let s3Anim: Animated.CompositeAnimation;

    if (callState === "ringing") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      const createSonar = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 2200,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        );
      };

      s1Anim = createSonar(sonar1, 0);
      s2Anim = createSonar(sonar2, 700);
      s3Anim = createSonar(sonar3, 1400);
      s1Anim.start();
      s2Anim.start();
      s3Anim.start();

      // Variable ring duration 1.8–4.0s ,  feels less robotic than fixed 2.6s
      const ringMs = 1800 + Math.floor(Math.random() * 2200);
      timer = setTimeout(() => {
        setCallState("connected");
        try {
          player.play();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}

        // One random brief "reconnecting" glitch ~45–75s into the call
        const glitchAt = 45_000 + Math.floor(Math.random() * 30_000);
        glitchTimerRef.current = setTimeout(() => {
          try {
            player.pause();
          } catch (e) {}
          setReconnecting(true);
          setTimeout(() => {
            try {
              player.play();
            } catch (e) {}
            setReconnecting(false);
          }, 850);
        }, glitchAt);
      }, ringMs);
    }
    return () => {
      clearTimeout(timer);
      if (s1Anim) s1Anim.stop();
      if (s2Anim) s2Anim.stop();
      if (s3Anim) s3Anim.stop();
    };
  }, [callState]);

  // Timer & Coin deduction
  useEffect(() => {
    let interval: any;
    if (callState === "connected" && !inCallRechargeAlertVisible) {
      // Deduct 1st minute immediately upon connection for all calls
      if (!initialMinuteDeductedRef.current) {
        initialMinuteDeductedRef.current = true;
        deductCoins(profile.callRate).then((success) => {
          if (!success) {
            handleEndCall("insufficient_coins");
            setCoinsDepletedModalVisible(true);
            schedulePostDepletionReminder(profile.name).catch(() => {});
          }
        });
      }

      interval = setInterval(async () => {
        setCallSeconds((prev) => {
          const next = prev + 1;

          // Deduct next minute at each 60s boundary
          const isCheckPoint = next > 0 && next % 60 === 0;

          if (isCheckPoint) {
            const currentBal = getCoins();
            if (currentBal < profile.callRate) {
              // Not enough coins for upcoming minute!
              try {
                player.pause();
              } catch (e) {}
              setInCallRechargeAlertVisible(true);
              setInCallGraceSeconds(20);
            } else {
              deductCoins(profile.callRate);
            }
          }

          return next;
        });
      }, 1000);

      // Cleanup glitch + follow-up timers when leaving connected
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    }
    return () => {
      clearInterval(interval);
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    };
  }, [
    callState,
    direction,
    profile.callRate,
    profile.name,
    inCallRechargeAlertVisible,
  ]);

  // In-call recharge prompt grace countdown (paused if user is actively in recharge sheet)
  useEffect(() => {
    let graceTimer: any;
    if (
      inCallRechargeAlertVisible &&
      callState === "connected" &&
      !rechargeModalVisible
    ) {
      graceTimer = setInterval(() => {
        setInCallGraceSeconds((prev) => {
          if (prev <= 1) {
            setInCallRechargeAlertVisible(false);
            handleEndCall("coins_depleted");
            schedulePostDepletionReminder(profile.name).catch(() => {});
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (graceTimer) clearInterval(graceTimer);
    };
  }, [inCallRechargeAlertVisible, callState, profile.name, rechargeModalVisible]);

  const handleEndCall = (
    reason:
      | "user_ended"
      | "coins_depleted"
      | "insufficient_coins" = "user_ended",
  ) => {
    setDisconnectReason(reason);
    try {
      player.pause();
    } catch (e) {}
    setCallState("ended");

    const durationMins = callSeconds > 0 ? Math.ceil(callSeconds / 60) : 0;
    const coinsSpent = durationMins * profile.callRate;
    saveCallLog({
      profileId: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      city: profile.city,
      type: direction,
      durationSeconds: callSeconds,
      coinsSpent: coinsSpent,
    });

    // Schedule post-call follow-up message (1–3 min after end)
    if (callSeconds >= 30) {
      const followUpDelay = (60 + Math.floor(Math.random() * 120)) * 1000;
      followUpTimerRef.current = setTimeout(async () => {
        try {
          const text = generatePostCallFollowUp(profile, callSeconds);
          const newMsg: ChatMessage = {
            id: "msg-followup-" + Date.now(),
            sender: "profile",
            text,
            timestamp: Date.now(),
            status: "delivered",
          };
          // Read existing history (or empty)
          const AsyncStorage = (
            await import("@react-native-async-storage/async-storage")
          ).default;
          const key = "@dreamdate_chat_history_v5_" + profile.id;
          const raw = await AsyncStorage.getItem(key);
          const history: ChatMessage[] = raw ? JSON.parse(raw) : [];
          history.push(newMsg);
          await saveChatHistory(profile.id, history);
        } catch (e) {}
      }, followUpDelay);
    }
  };

  const handleGiftSent = (gift: any) => {
    // Exact matching guarantee so the exact gift sent is displayed
    const matched =
      VIRTUAL_GIFTS.find(
        (g) =>
          g.name === gift.name ||
          g.id === (gift as any).id ||
          (gift.emoji && g.emoji === gift.emoji),
      ) || (gift.name ? gift : VIRTUAL_GIFTS[0]);

    const giftName = matched.name || gift.name || "Gift";
    const giftEmoji = matched.emoji || gift.emoji || "🎁";
    const giftImage = matched.image || gift.image || VIRTUAL_GIFTS[0].image;
    const giftCoins = matched.coins || gift.coins || 10;
    const giftColor = matched.accentColor || gift.accentColor || "#F65592";
    const giftGlow =
      matched.glowColor || gift.glowColor || "rgba(246, 85, 146, 0.4)";

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}

    // Check consecutive combo for the same gift
    if (activeCelebration && activeCelebration.name === giftName) {
      comboCountRef.current += 1;
    } else {
      comboCountRef.current = 1;
    }

    const currentCombo = comboCountRef.current;

    setActiveCelebration({
      id: Math.random().toString(),
      name: giftName,
      emoji: giftEmoji,
      image: giftImage,
      coins: giftCoins,
      category: matched.category || "Popular",
      accentColor: giftColor,
      glowColor: giftGlow,
      comboCount: currentCombo,
    });

    // Reset unboxing animations
    giftTravelAnim.setValue(0);
    boxOpenAnim.setValue(0);
    giftRevealAnim.setValue(0);
    giftExitAnim.setValue(1);

    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);

    // Stage 1: Gift box flies smoothly up from bottom to center
    Animated.timing(giftTravelAnim, {
      toValue: 1,
      duration: 460,
      useNativeDriver: true,
    }).start(() => {
      // Stage 2: Box pops open & inner gift reveals with energetic spring
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      Animated.parallel([
        Animated.timing(boxOpenAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(giftRevealAnim, {
          toValue: 1,
          friction: 4.5,
          tension: 48,
          useNativeDriver: true,
        }),
      ]).start();

      // Stage 3: Hold in center for 2.8s, then graceful fade out
      celebrationTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(giftRevealAnim, {
            toValue: 1.18,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(giftExitAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setActiveCelebration(null);
          comboCountRef.current = 1;
        });
      }, 2800);
    });
  };

  const handleSendReaction = (emoji: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    const anim = new Animated.Value(0);
    // Spawns randomly across the entire width of the screen at the bottom
    const startX = Math.floor(Math.random() * (SCREEN_WIDTH - 80)) + 20;
    const swayAmount = (Math.random() - 0.5) * 60;
    const scale = 0.9 + Math.random() * 0.35;

    const newGift: FloatingItem = {
      id: Math.random().toString(),
      icon: emoji,
      anim,
      startX,
      swayAmount,
      scale,
    };
    setFloatingGifts((prev) => [...prev.slice(-15), newGift]);

    Animated.timing(anim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: true,
    }).start(() => {
      setFloatingGifts((prev) => prev.filter((g) => g.id !== newGift.id));
    });
  };

  const handleSendMessage = () => {
    const trimmed = chatText.trim();
    if (!trimmed) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    const anim = new Animated.Value(0);
    const newMsg: CenterChatMessage = {
      id: Date.now().toString(),
      text: trimmed,
      anim,
    };

    setCenterMessages((prev) => [...prev.slice(-2), newMsg]);
    setChatText("");

    Animated.timing(anim, {
      toValue: 1,
      duration: 5800,
      useNativeDriver: true,
    }).start(() => {
      setCenterMessages((prev) => prev.filter((m) => m.id !== newMsg.id));
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  // -------------------------------------------------------------
  // RINGING SCREEN
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // RINGING SCREEN (ADVANCED VIP PRIVATE CONNECTION SCREEN)
  // -------------------------------------------------------------
  // Incoming only: brief beat between Accept and live. Deliberately NOT
  // the dial-out sonar screen ,  you picked up, she is already there.
  if (callState === "connecting") {
    return (
      <View style={styles.ringingContainer}>
        <Image
          source={{ uri: profile.avatar }}
          style={StyleSheet.absoluteFill}
          blurRadius={38}
        />
        <LinearGradient
          colors={[
            "rgba(8, 10, 12, 0.84)",
            "rgba(8, 10, 12, 0.72)",
            "rgba(8, 10, 12, 0.94)",
          ]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView
          style={styles.connectingContent}
          edges={["top", "bottom"]}
        >
          <Text style={styles.connectingDirLabel}>Incoming video call</Text>
          <Image
            source={{ uri: profile.avatar }}
            style={styles.connectingAvatar}
          />
          <Text style={styles.connectingName}>{profile.name}</Text>
          <Text style={styles.connectingStatus}>Connecting...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (callState === "ringing") {
    return (
      <View style={styles.ringingContainer}>
        <Image
          source={{ uri: profile.avatar }}
          style={StyleSheet.absoluteFill}
          blurRadius={38}
        />
        <LinearGradient
          colors={[
            "rgba(8, 10, 12, 0.84)",
            "rgba(8, 10, 12, 0.72)",
            "rgba(8, 10, 12, 0.94)",
          ]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.ringingContent} edges={["top", "bottom"]}>
          {/* Top Security & Status Ticker */}
          <View style={styles.ringingHeaderSection}>
            <BlurView intensity={70} tint="dark" style={styles.encryptedPill}>
              <View style={styles.greenLiveDot} />
              <Text style={styles.encryptedPillText}>
                256-BIT ENCRYPTED HD LINE
              </Text>
            </BlurView>
            <Text style={styles.connectingTitle}>CALLING VIP STREAM...</Text>
          </View>

          {/* Center Radar Sonar Avatar Section */}
          <View style={styles.radarSonarContainer}>
            {/* Sonar Ring 1 */}
            <Animated.View
              style={[
                styles.sonarRing,
                {
                  transform: [
                    {
                      scale: sonar1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.5],
                      }),
                    },
                  ],
                  opacity: sonar1.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.8, 0.4, 0],
                  }),
                },
              ]}
            />
            {/* Sonar Ring 2 */}
            <Animated.View
              style={[
                styles.sonarRing,
                {
                  transform: [
                    {
                      scale: sonar2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.5],
                      }),
                    },
                  ],
                  opacity: sonar2.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.8, 0.4, 0],
                  }),
                },
              ]}
            />
            {/* Sonar Ring 3 */}
            <Animated.View
              style={[
                styles.sonarRing,
                {
                  transform: [
                    {
                      scale: sonar3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.5],
                      }),
                    },
                  ],
                  opacity: sonar3.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.8, 0.4, 0],
                  }),
                },
              ]}
            />

            {/* Glowing Avatar Frame with Gradient Border */}
            <Animated.View
              style={[
                styles.avatarPulseRing,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <LinearGradient
                colors={["#f65592", "#FFD700", "#f65592"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientBorder}
              >
                <Image
                  source={{ uri: profile.avatar }}
                  style={styles.ringingAvatar}
                />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Caller Identity Card */}
          <View style={styles.ringingMetaCard}>
            <View style={styles.ringingNameRow}>
              <Text style={styles.ringingName}>{profile.name}</Text>
              <Ionicons name="checkmark-circle" size={22} color="#f65592" />
            </View>
            <View style={styles.ringingLocationRow}>
              <Ionicons name="location-sharp" size={14} color="#dfbec6" />
              <Text style={styles.ringingLocation}>
                {profile.city}, {profile.country}
              </Text>
            </View>
          </View>

          {/* Bottom Cancel & Status */}
          <View style={styles.ringingBottom}>
            <Text style={styles.handshakeText}>
              Connecting secure audio & video stream...
            </Text>
            <TouchableOpacity
              style={styles.hangupButtonLarge}
              onPress={() => {
                saveCallLog({
                  profileId: profile.id,
                  name: profile.name,
                  avatar: profile.avatar,
                  city: profile.city,
                  type: "missed",
                  durationSeconds: 0,
                  coinsSpent: 0,
                });
                router.back();
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="call"
                size={32}
                color="#FFF"
                style={{ transform: [{ rotate: "135deg" }] }}
              />
            </TouchableOpacity>
            <Text style={styles.cancelCallText}>Decline Call</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // CALL ENDED SUMMARY
  // -------------------------------------------------------------
  if (callState === "ended") {
    const totalSpent =
      Math.max(1, Math.ceil(callSeconds / 60)) * profile.callRate;
    const isDepleted =
      disconnectReason === "coins_depleted" ||
      disconnectReason === "insufficient_coins" ||
      coins < profile.callRate;

    return (
      <AppBackground>
        <View
          style={[styles.endedContainer, { backgroundColor: "transparent" }]}
        >
          <SafeAreaView style={styles.endedContent} edges={["top", "bottom"]}>
            <Image
              source={{ uri: profile.avatar }}
              style={styles.endedAvatar}
            />
            <Text
              style={[
                styles.endedTitle,
                { color: isDark ? "#FFFFFF" : "#191C1D" },
              ]}
            >
              Call Ended
            </Text>
            <Text
              style={[
                styles.endedName,
                { color: isDark ? "#dfbec6" : "#6B7280" },
              ]}
            >
              with {profile.name}
            </Text>
            <Text
              style={[
                styles.endedDir,
                { color: isDark ? "#F65592" : "#F65592" },
              ]}
            >
              {direction === "incoming" ? "Incoming call" : "Outgoing call"}
            </Text>

            {/* Disconnection Reason Banner */}
            {isDepleted ? (
              <View
                style={[
                  styles.disconnectCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(235, 87, 87, 0.14)"
                      : "rgba(244, 63, 94, 0.08)",
                  },
                ]}
              >
                <View style={styles.disconnectBadgeRow}>
                  <View
                    style={[
                      styles.disconnectIconWrap,
                      {
                        backgroundColor: isDark
                          ? "rgba(235, 87, 87, 0.22)"
                          : "rgba(244, 63, 94, 0.14)",
                      },
                    ]}
                  >
                    <Ionicons
                      name="wallet"
                      size={14}
                      color={isDark ? "#FF6B8B" : "#E11D48"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.disconnectBadgeText,
                      { color: isDark ? "#FF6B8B" : "#E11D48" },
                    ]}
                  >
                    Call Disconnected · Low Balance
                  </Text>
                </View>
                <Text
                  style={[
                    styles.disconnectExplanation,
                    {
                      color: isDark
                        ? "rgba(241, 224, 228, 0.82)"
                        : "#5A5F66",
                    },
                  ]}
                >
                  Your video call ended because coins ran out. {profile.name}'s rate is {profile.callRate} coins/min.
                </Text>
                <TouchableOpacity
                  style={styles.endedRechargeBtn}
                  onPress={() => setRechargeModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <CoinIcon size={14} />
                  <Text style={styles.endedRechargeBtnText}>
                    Recharge to Call Again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={[
                  styles.normalEndedBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={14}
                  color={isDark ? "#10B981" : "#059669"}
                />
                <Text
                  style={[
                    styles.normalEndedText,
                    {
                      color: isDark
                        ? "rgba(255, 255, 255, 0.7)"
                        : "#4B5563",
                    },
                  ]}
                >
                  Call Ended Normally
                </Text>
              </View>
            )}

            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark
                    ? "rgba(30, 32, 32, 0.85)"
                    : "#FFFFFF",
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: isDark ? "#A68990" : "#6B7280" },
                  ]}
                >
                  Duration
                </Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: isDark ? "#FFFFFF" : "#191C1D" },
                  ]}
                >
                  {formatTime(callSeconds)}
                </Text>
              </View>
              <View
                style={[
                  styles.summaryDivider,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.06)",
                  },
                ]}
              />
              <View style={styles.summaryRow}>
                <Text
                  style={[
                    styles.summaryLabel,
                    { color: isDark ? "#A68990" : "#6B7280" },
                  ]}
                >
                  Coins Spent
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <CoinIcon size={14} color={isDark ? "#FFD700" : "#D97706"} />
                  <Text
                    style={[
                      styles.summaryValueCoins,
                      { color: isDark ? "#FFD700" : "#D97706" },
                    ]}
                  >
                    {callSeconds > 0 ? totalSpent : 0}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.endedBtnCol}>
              <TouchableOpacity
                style={styles.chatCTA}
                onPress={() => {
                  router.replace(`/chat/${profile.id}` as any);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
                <Text style={styles.chatCTAText}>Message {profile.name}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.doneBtn,
                  {
                    backgroundColor: isDark ? "#2D3030" : "#F1F3F5",
                  },
                ]}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.doneBtnText,
                    { color: isDark ? "#FFFFFF" : "#191C1D" },
                  ]}
                >
                  Back to Discover
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Coins Depleted / Low Balance Modal */}
          <AppModal
            visible={coinsDepletedModalVisible}
            onClose={() => {
              setCoinsDepletedModalVisible(false);
            }}
            title={
              coins < profile.callRate ? "Insufficient Coins" : "Coins Depleted"
            }
            description={
              coins < profile.callRate
                ? `${profile.name}'s video call rate is ${profile.callRate} coins/min. You have ${coins} coins. Please recharge to start calling!`
                : "Your coin balance ran out during the call. Recharge now to continue your private video connections!"
            }
            icon="wallet-outline"
            iconColor="#FFD700"
            primaryAction={{
              label: "Recharge Now",
              onPress: () => {
                setCoinsDepletedModalVisible(false);
                setRechargeModalVisible(true);
              },
            }}
            secondaryAction={{
              label: "Dismiss",
              onPress: () => {
                setCoinsDepletedModalVisible(false);
              },
            }}
          />

          <RechargeModal
            visible={rechargeModalVisible}
            onClose={() => {
              setRechargeModalVisible(false);
            }}
          />
        </View>
      </AppBackground>
    );
  }

  // -------------------------------------------------------------
  // LIVE VIDEO CALL (STITCH PREMIUM SCREEN WITH CELEBRATION)
  // -------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Full Screen Video Canvas */}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        allowsPictureInPicture={false}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Blurred Video Canvas Overlay on Low Balance */}
      {inCallRechargeAlertVisible && (
        <BlurView
          intensity={Platform.OS === "android" ? 95 : 85}
          tint="dark"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0, 0, 0, 0.65)" },
          ]}
        />
      )}

      {/* Top and Bottom Linear Gradients (Enhanced Depth & Richness) */}
      <LinearGradient
        colors={[
          "rgba(0, 0, 0, 0.88)",
          "rgba(0, 0, 0, 0.55)",
          "rgba(0, 0, 0, 0.20)",
          "transparent",
        ]}
        style={styles.stitchTopGradient}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[
          "transparent",
          "rgba(0, 0, 0, 0.25)",
          "rgba(0, 0, 0, 0.65)",
          "rgba(0, 0, 0, 0.94)",
        ]}
        style={styles.stitchBottomGradient}
        pointerEvents="none"
      />

      {/* Floating Reactions Rising from Random Points across the Bottom */}
      <View style={styles.floatingContainer} pointerEvents="none">
        {floatingGifts.map((gift) => {
          const translateY = gift.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -620],
          });
          const translateX = gift.anim.interpolate({
            inputRange: [0, 0.3, 0.6, 1],
            outputRange: [
              gift.startX,
              gift.startX + gift.swayAmount,
              gift.startX - gift.swayAmount * 0.6,
              gift.startX + gift.swayAmount * 0.8,
            ],
          });
          const opacity = gift.anim.interpolate({
            inputRange: [0, 0.1, 0.75, 1],
            outputRange: [0, 1, 0.95, 0],
          });
          const scale = gift.anim.interpolate({
            inputRange: [0, 0.15, 1],
            outputRange: [0.3, gift.scale, gift.scale * 1.15],
          });

          return (
            <Animated.View
              key={gift.id}
              style={[
                styles.floatingGift,
                {
                  transform: [{ translateY }, { translateX }, { scale }],
                  opacity,
                },
              ]}
            >
              <Text style={styles.floatingGiftIcon}>{gift.icon}</Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Live Stream In-Call Chat Messages (Animates Upward Directly from Top of Input) */}
      <View
        style={[
          styles.liveChatContainer,
          {
            bottom:
              (keyboardHeight > 0
                ? keyboardHeight + 28
                : Math.max(insets.bottom, 16) + 12) + 60,
          },
        ]}
        pointerEvents="none"
      >
        {centerMessages.map((msg) => {
          const translateY = msg.anim.interpolate({
            inputRange: [0, 0.12, 0.45, 0.8, 1],
            outputRange: [0, -35, -110, -220, -320],
          });
          const opacity = msg.anim.interpolate({
            inputRange: [0, 0.08, 0.85, 1],
            outputRange: [0, 1, 1, 0],
          });
          const scale = msg.anim.interpolate({
            inputRange: [0, 0.1, 0.85, 1],
            outputRange: [0.85, 1, 0.98, 0.92],
          });

          return (
            <Animated.View
              key={msg.id}
              style={[
                styles.liveChatPill,
                {
                  transform: [{ translateY }, { scale }],
                  opacity,
                },
              ]}
            >
              <Text style={styles.liveChatContent}>{msg.text}</Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Top Header: Full-Width Info Card & Floating Camera Below on Right */}
      <SafeAreaView style={styles.topSafeArea} edges={["top"]}>
        {/* Full-Width Female Info Card with Real Frosted Blur & No Border */}
        <BlurView
          intensity={Platform.OS === "android" ? 85 : 65}
          tint="dark"
          style={styles.fullWidthInfoCard}
        >
          <TouchableOpacity
            style={styles.infoCardAvatarWrap}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
              setProfileModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: profile.avatar }}
              style={styles.infoCardAvatar}
            />
          </TouchableOpacity>

          <View style={styles.infoCardTextCol}>
            <Text style={styles.infoCardName} numberOfLines={1}>
              {profile.name}, {profile.age}
            </Text>
            <View style={styles.infoCardLocationRow}>
              <Ionicons name="location-sharp" size={13} color="#dfbec6" />
              <Text style={styles.infoCardLocationText} numberOfLines={1}>
                {profile.city}, {profile.country}
              </Text>
            </View>
          </View>

          {/* Profile Details Button (Opens In-Call Modal to preserve active call) */}
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
              setProfileModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="person-circle-outline" size={16} color="#FFF" />
            <Text style={styles.viewProfileBtnText}>Profile</Text>
          </TouchableOpacity>
        </BlurView>

        {/* Floating Self Camera Preview (Below Info Card on the Right) */}
        <View style={styles.cameraPreviewContainer}>
          <View style={styles.stitchSelfPreviewCard}>
            {permission?.granted ? (
              <CameraView
                style={styles.stitchSelfCamera}
                facing={cameraFacing}
              />
            ) : (
              <View style={styles.stitchSelfFallback}>
                <Ionicons name="person" size={26} color="#dfbec6" />
                <Text style={styles.stitchSelfFallbackText}>You</Text>
              </View>
            )}
          </View>
        </View>

        {/* Brief "Reconnecting" glitch overlay */}
        {reconnecting && (
          <View style={styles.reconnectingOverlay} pointerEvents="none">
            <Ionicons name="cloud-offline" size={22} color="#FFD700" />
            <Text style={styles.reconnectingText}>Reconnecting…</Text>
          </View>
        )}


      </SafeAreaView>

      {/* Bottom Controls & Chat Bar with Safe Keyboard Avoidance Gap */}
      <View
        style={[
          styles.bottomControlsWrap,
          {
            bottom:
              keyboardHeight > 0
                ? keyboardHeight + 28
                : Math.max(insets.bottom, 16) + 12,
          },
        ]}
      >
        {/* Row of 4 Stitch Action Buttons */}
        <View style={styles.stitchActionRow}>
          {/* Flip Camera Button with Frosted Blur */}
          <TouchableOpacity
            style={styles.stitchCircleGlassBtn}
            onPress={() =>
              setCameraFacing(cameraFacing === "front" ? "back" : "front")
            }
            activeOpacity={0.8}
          >
            <BlurView
              intensity={Platform.OS === "android" ? 80 : 60}
              tint="dark"
              style={styles.stitchCircleBlurInner}
            >
              <Ionicons
                name="camera-reverse-outline"
                size={24}
                color="#e2e2e2"
              />
            </BlurView>
          </TouchableOpacity>

          {/* Send Gift Button with Frosted Blur */}
          <TouchableOpacity
            style={styles.stitchCircleGlassBtn}
            onPress={() => setGiftModalVisible(true)}
            activeOpacity={0.85}
          >
            <BlurView
              intensity={Platform.OS === "android" ? 80 : 60}
              tint="dark"
              style={styles.stitchCircleBlurInner}
            >
              <Ionicons name="gift" size={26} color="#f65592" />
            </BlurView>
          </TouchableOpacity>

          {/* End Call Red Button */}
          <TouchableOpacity
            style={styles.stitchEndCallBtn}
            onPress={() => handleEndCall("user_ended")}
            activeOpacity={0.85}
          >
            <Ionicons
              name="call"
              size={36}
              color="#FFFFFF"
              style={{ transform: [{ rotate: "135deg" }] }}
            />
          </TouchableOpacity>

          {/* Mic Toggle with Frosted Blur */}
          <TouchableOpacity
            style={styles.stitchCircleGlassBtn}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
              setIsMuted((prev) => !prev);
            }}
            activeOpacity={0.8}
          >
            <BlurView
              intensity={Platform.OS === "android" ? 80 : 60}
              tint="dark"
              style={styles.stitchCircleBlurInner}
            >
              <Ionicons
                name={isMuted ? "mic-off" : "mic"}
                size={24}
                color={isMuted ? "#f65592" : "#e2e2e2"}
              />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Floating Emoji Picker Bar with Dedicated Close Button */}
        {showEmojiPicker && (
          <AppBlurView style={styles.emojiPickerBar} tint="dark">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiPickerScroll}
            >
              {EMOJI_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleSendReaction(emoji)}
                  style={styles.emojiBtnItem}
                  activeOpacity={0.75}
                >
                  <Text style={styles.emojiChar}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.emojiPickerCloseBtn}
              onPress={() => setShowEmojiPicker(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={24} color="#dfbec6" />
            </TouchableOpacity>
          </AppBlurView>
        )}

        {/* Bottom Chat Input Bar with Frosted Blur & Safe Keyboard Gap */}
        <BlurView
          intensity={Platform.OS === "android" ? 85 : 70}
          tint="dark"
          style={styles.stitchChatInputBar}
        >
          <TouchableOpacity
            style={styles.stitchEmojiBtn}
            onPress={() => {
              setShowEmojiPicker((prev) => !prev);
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="happy-outline"
              size={22}
              color={showEmojiPicker ? "#f65592" : "#dfbec6"}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.stitchChatTextInput}
            placeholder="Say something nice..."
            placeholderTextColor="rgba(223, 190, 198, 0.55)"
            value={chatText}
            onChangeText={setChatText}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />

          <TouchableOpacity
            style={styles.stitchSendBtn}
            onPress={handleSendMessage}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={17} color="#FFF" />
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* Gift Celebration Overlay: Travel from Bottom, Box Opens & Reveals Gift */}
      {activeCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          {/* Animated Container Traveling from Bottom to Center */}
          <Animated.View
            style={[
              styles.justTheGiftWrap,
              {
                transform: [
                  {
                    translateY: giftTravelAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [420, 0],
                    }),
                  },
                ],
                opacity: giftExitAnim,
              },
            ]}
          >
            {/* STAGE 1: The Gift Box (travels up small -> 50% at center with gentle tilt) */}
            <Animated.View
              style={[
                styles.giftBoxLayer,
                {
                  transform: [
                    {
                      scale: giftTravelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.22, 0.5],
                      }),
                    },
                    {
                      rotate: giftTravelAnim.interpolate({
                        inputRange: [0, 0.4, 0.8, 1],
                        outputRange: ["-12deg", "10deg", "-4deg", "0deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* STAGE 2: Gift box bursts open & fades out when opening */}
              <Animated.View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [
                    {
                      scale: boxOpenAnim.interpolate({
                        inputRange: [0, 0.6, 1],
                        outputRange: [1, 1.25, 1.5],
                      }),
                    },
                  ],
                  opacity: boxOpenAnim.interpolate({
                    inputRange: [0, 0.45, 1],
                    outputRange: [1, 0.85, 0],
                  }),
                }}
              >
                <Text style={styles.giftBoxEmoji}>🎁</Text>
              </Animated.View>
            </Animated.View>

            {/* STAGE 2: The Inner Revealed Gift (springs from 50% to full 100% size upon opening) */}
            <Animated.View
              style={[
                styles.revealedGiftLayer,
                {
                  transform: [
                    {
                      scale: giftRevealAnim.interpolate({
                        inputRange: [0, 0.7, 1, 1.15],
                        outputRange: [0.5, 1.15, 1.0, 1.12],
                      }),
                    },
                    {
                      translateY: giftRevealAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [14, 0],
                      }),
                    },
                  ],
                  opacity: boxOpenAnim.interpolate({
                    inputRange: [0, 0.25, 1],
                    outputRange: [0, 0.9, 1],
                  }),
                },
              ]}
            >
              {/* Back ambient colored glow */}
              <View
                style={[
                  styles.giftGlowCircle,
                  {
                    backgroundColor: activeCelebration.accentColor
                      ? `${activeCelebration.accentColor}40`
                      : "rgba(246, 85, 146, 0.40)",
                  },
                ]}
              />
              <Text style={styles.justTheGiftEmoji}>
                {activeCelebration.emoji}
              </Text>
            </Animated.View>
          </Animated.View>
        </View>
      )}

      <GiftModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        onGiftSent={handleGiftSent}
        onNeedRecharge={() => setRechargeModalVisible(true)}
      />

      <RechargeModal
        visible={rechargeModalVisible}
        onClose={async () => {
          setRechargeModalVisible(false);
          // If this recharge was triggered while the call was paused waiting for coins
          if (inCallRechargeAlertVisible) {
            const current = getCoins();
            if (current >= profile.callRate) {
              const success = await deductCoins(profile.callRate);
              if (success) {
                setInCallRechargeAlertVisible(false);
                try {
                  player.play();
                } catch (e) {}
                try {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                } catch (e) {}
              }
            } else {
              setInCallRechargeAlertVisible(false);
              handleEndCall("coins_depleted");
            }
          }
        }}
      />

      {/* In-Call Low Balance / Recharge Warning Alert (2 Options: Recharge or End Call) */}
      <AppModal
        visible={inCallRechargeAlertVisible}
        onClose={() => {
          setInCallRechargeAlertVisible(false);
          handleEndCall("coins_depleted");
        }}
        title="Recharge to Continue Call"
        description={`Your coins are depleted (${getCoins()} coins left). You need ${profile.callRate} coins/min to continue your private video call with ${profile.name}.\n\nRecharge now to continue the call! (Auto-disconnect in ${inCallGraceSeconds}s)`}
        icon="wallet-outline"
        iconColor="#FFD700"
        primaryAction={{
          label: "Recharge to Continue",
          onPress: () => {
            setRechargeModalVisible(true);
          },
        }}
        secondaryAction={{
          label: "End Call",
          onPress: () => {
            setInCallRechargeAlertVisible(false);
            handleEndCall("coins_depleted");
          },
        }}
      />

      {/* Compact In-Call Profile Modal (Exactly what is shown on profile details screen) */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.compactProfileBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setProfileModalVisible(false)}
          />

          <View style={styles.compactProfileContent}>
            {/* The Compact Profile Card */}
            <View style={styles.compactProfileCard}>
              <Image
                source={{ uri: selectedModalPhoto || profile.avatar }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />

              {/* Top Row: Close button on left, Status badge on right */}
              <View style={styles.compactTopRow}>
                <TouchableOpacity
                  style={styles.compactCloseBtn}
                  onPress={() => setProfileModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <View
                  style={[
                    styles.compactStatusBadge,
                    {
                      backgroundColor: profile.isOnline ? "#10B981" : "#E11D48",
                    },
                  ]}
                >
                  <Text style={styles.compactStatusText}>
                    {profile.isOnline ? "Online" : "Busy"}
                  </Text>
                </View>
              </View>

              {/* Bottom Glassmorphic Overlay: Name, Age, Location, Bio */}
              <View style={styles.compactGlassOverlay}>
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(234, 76, 137, 0.5)",
                    "rgba(234, 76, 137, 0.95)",
                  ]}
                  locations={[0, 0.45, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.compactInfoContent}>
                  <Text style={styles.compactNameHeading}>
                    {profile.name}, {profile.age}
                  </Text>

                  <View style={styles.compactLocationLine}>
                    <Ionicons name="location-sharp" size={14} color="#FFF" />
                    <Text style={styles.compactLocationText}>
                      {profile.city}, {profile.country}
                    </Text>
                  </View>

                  {profile.bio ? (
                    <Text style={styles.compactBioText} numberOfLines={2}>
                      {profile.bio}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Horizontal Thumbnail Gallery below the card */}
            <View style={styles.compactThumbWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.compactThumbScroll}
              >
                {[profile.avatar, ...(profile.photos || [])].map((uri, idx) => {
                  const isSelected =
                    (selectedModalPhoto || profile.avatar) === uri;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.compactThumbBtn,
                        isSelected
                          ? styles.compactThumbActive
                          : styles.compactThumbInactive,
                      ]}
                      onPress={() => {
                        try {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                        } catch (e) {}
                        setSelectedModalPhoto(uri);
                      }}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={{ uri }}
                        style={styles.compactThumbImg}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121414",
  },
  stitchTopGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 230,
  },
  stitchBottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 350,
  },

  // Top Area
  topSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  fullWidthInfoCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18, 20, 24, 0.50)",
    borderWidth: 0,
    overflow: "hidden",
    gap: 12,
  },
  infoCardAvatarWrap: {
    borderRadius: 20,
    overflow: "hidden",
  },
  infoCardAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  infoCardTextCol: {
    flex: 1,
    gap: 2,
  },
  infoCardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  infoCardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  infoCardLocationText: {
    fontSize: 12,
    color: "#dfbec6",
    fontWeight: "500",
  },
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f65592",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  viewProfileBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  cameraPreviewContainer: {
    alignSelf: "flex-end",
    marginRight: 16,
    marginTop: 14,
  },

  // Self Preview
  stitchSelfPreviewCard: {
    width: 96,
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(30, 32, 32, 0.65)",
  },
  stitchSelfCamera: {
    width: "100%",
    height: "100%",
  },
  stitchSelfFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E2020",
  },
  stitchSelfFallbackText: {
    color: "#dfbec6",
    fontSize: 11,
    marginTop: 4,
  },
  reconnectingOverlay: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    marginHorizontal: "auto",
    width: 180,
  },
  reconnectingText: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },


  // Live Gift Celebration Showcase Overlay
  celebrationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  // Just The Gift Animation
  justTheGiftWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 240,
    height: 240,
  },
  giftBoxLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 170,
    height: 170,
  },
  giftBoxEmoji: {
    fontSize: 112,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 10 },
    textShadowRadius: 26,
  },
  revealedGiftLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 230,
    height: 230,
  },
  giftGlowCircle: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  justTheGiftEmoji: {
    fontSize: 130,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 10 },
    textShadowRadius: 28,
  },

  // Floating Reactions from Random Bottom Points
  floatingContainer: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    height: 650,
    zIndex: 15,
  },
  floatingGift: {
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  floatingGiftIcon: {
    fontSize: 44,
  },

  // Live Stream In-Call Chat Messages (Starts from top of input and floats upward)
  liveChatContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 30,
    gap: 8,
  },
  liveChatPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(18, 16, 22, 0.85)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    maxWidth: "85%",
  },
  liveChatContent: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // Bottom Controls & Input
  bottomControlsWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    gap: 16,
    zIndex: 25,
  },
  stitchActionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
  },
  stitchCircleGlassBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  stitchCircleBlurInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 32, 32, 0.5)",
  },
  stitchEndCallBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#93000a",
    alignItems: "center",
    justifyContent: "center",
  },

  // Stitch Chat Input Bar
  stitchChatInputBar: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(20, 22, 26, 0.65)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    overflow: "hidden",
    borderWidth: 0,
  },
  stitchEmojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  stitchChatTextInput: {
    flex: 1,
    color: "#e2e2e2",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  stitchSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f65592",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPickerBar: {
    borderRadius: 26,
    backgroundColor: "rgba(28, 18, 22, 0.88)",
    overflow: "hidden",
    paddingVertical: 8,
    paddingLeft: 6,
    paddingRight: 10,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  emojiPickerScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 6,
  },
  emojiPickerCloseBtn: {
    marginLeft: 6,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnItem: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  emojiChar: {
    fontSize: 20,
  },
  floatingGiftEmoji: {
    fontSize: 40,
  },

  // Ringing State Styles (Advanced VIP Connection Screen)
  ringingContainer: {
    flex: 1,
    backgroundColor: "#080A0C",
  },
  ringingContent: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 36,
  },
  connectingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  connectingAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  connectingName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  connectingStatus: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "500",
  },
  connectingDirLabel: {
    color: "#F65592",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  ringingHeaderSection: {
    alignItems: "center",
    marginTop: 14,
    gap: 12,
  },
  encryptedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  greenLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  encryptedPillText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  connectingTitle: {
    color: "#f65592",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
  },
  radarSonarContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 280,
    height: 280,
    marginVertical: 10,
  },
  sonarRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "rgba(246, 85, 146, 0.7)",
  },
  avatarPulseRing: {
    width: 156,
    height: 156,
    borderRadius: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGradientBorder: {
    padding: 4,
    borderRadius: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  ringingAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  ringingMetaCard: {
    alignItems: "center",
    gap: 6,
  },
  ringingNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ringingName: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  ringingLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ringingLocation: {
    fontSize: 14,
    color: "#dfbec6",
    fontWeight: "500",
  },
  ringingBottom: {
    alignItems: "center",
    marginBottom: 16,
  },
  handshakeText: {
    color: "rgba(223, 190, 198, 0.75)",
    fontSize: 12,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  hangupButtonLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#93000a",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelCallText: {
    color: "#dfbec6",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
  },

  // Ended State Styles
  endedContainer: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  endedContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  endedAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginBottom: 10,
  },
  endedTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  endedName: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: "500",
  },
  endedDir: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: 14,
  },
  summaryCard: {
    width: "100%",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  summaryDivider: {
    height: 1,
    marginVertical: 8,
  },
  summaryValueCoins: {
    fontSize: 15,
    fontWeight: "800",
  },
  endedBtnCol: {
    width: "100%",
    gap: 8,
  },
  chatCTA: {
    backgroundColor: "#F65592",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 22,
  },
  chatCTAText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  doneBtn: {
    paddingVertical: 11,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  disconnectCard: {
    width: "100%",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 0,
    gap: 6,
  },
  disconnectBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  disconnectIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disconnectBadgeText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  disconnectExplanation: {
    fontSize: 12,
    lineHeight: 16,
  },
  endedRechargeBtn: {
    marginTop: 4,
    backgroundColor: "#F65592",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  endedRechargeBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  normalEndedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 14,
  },
  normalEndedText: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  // Compact In-Call Profile Modal (Matching profile details screen)
  compactProfileBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  compactProfileContent: {
    width: "100%",
    maxWidth: 380,
    gap: 12,
  },
  compactProfileCard: {
    width: "100%",
    height: 380,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1E1822",
  },
  compactTopRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  compactCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  compactStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  compactStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  compactGlassOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    justifyContent: "flex-end",
  },
  compactInfoContent: {
    padding: 16,
    gap: 4,
  },
  compactNameHeading: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  compactLocationLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  compactLocationText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  compactBioText: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  compactThumbWrap: {
    width: "100%",
  },
  compactThumbScroll: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  compactThumbBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    overflow: "hidden",
  },
  compactThumbActive: {},
  compactThumbInactive: {
    opacity: 0.5,
  },
  compactThumbImg: {
    width: "100%",
    height: "100%",
  },
});
