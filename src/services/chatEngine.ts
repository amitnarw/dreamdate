import AsyncStorage from "@react-native-async-storage/async-storage";
import { Vibration } from "react-native";
import {
  CharacterArchetype,
  MOCK_PROFILES,
  Profile,
} from "../data/mockProfiles";

export interface ChatMessage {
  id: string;
  sender: "user" | "profile";
  text: string;
  timestamp: number;
  type?: "text" | "voice" | "photo" | "gift" | "locked_photo";
  mediaUrl?: string;
  isBlurred?: boolean;
  unlockCost?: number;
  isUnlocked?: boolean;
  voiceDuration?: string;
  giftIcon?: string;
  giftName?: string;
  giftEmoji?: string;
  giftCoins?: number;
  giftAccent?: string;
  status?: "sent" | "delivered" | "read";
}

export interface ChatThreadItem {
  profileId: string;
  name: string;
  avatar: string;
  city: string;
  lastMessage: string;
  timestamp: number;
  unread: boolean;
  archetype: CharacterArchetype;
}

const CHAT_STORAGE_PREFIX = "@dreamdate_chat_history_v5_";
const ACTIVE_THREADS_KEY = "@dreamdate_active_chat_threads_v5";

const NUDGE_PROBABILITY = 0.2;

/* ------------------------------------------------------------------ */
/* Messaging behavior rules (how real people text)                     */
/*                                                                     */
/* - 1 bubble per reply is the norm. A 2nd bubble is rare and only a   */
/*   genuine afterthought (short, sent after a 3-8s typing gap).       */
/* - A follow-up "nudge" (hello? / kahan gaye / reply karo na) only    */
/*   happens ~20% of the time, 25-90s later, and only if he stayed     */
/*   silent. Never a polished continuation of the same thought.        */
/* - Messages are short (3-12 words), lazy punctuation, natural        */
/*   Hinglish. No em dashes, no button narration, no poetry.           */
/* ------------------------------------------------------------------ */

function timeOfDayGreeting(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function jitter(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

/* ------------------------------------------------------------------ */
/* Opener pools (short + human)                                        */
/* ------------------------------------------------------------------ */

type Opener = { text: string; emoji?: string };

const OPENERS: Record<CharacterArchetype, Opener[]> = {
  playful_tease: [
    { text: "heyy 😜", emoji: "😜" },
    { text: "oye suno, bore ho rahi hu", emoji: "😜" },
    { text: "hiii 🙈", emoji: "😜" },
    { text: "hey, kya kar rahe ho", emoji: "😜" },
  ],
  sweet_romantic: [
    { text: "hello ji 🌸", emoji: "🌸" },
    { text: "hii, kese ho aap", emoji: "🌸" },
    { text: "namaste 🙏", emoji: "🌸" },
    { text: "hey, din kesa gaya", emoji: "🌸" },
  ],
  bold_alluring: [
    { text: "hey handsome 🔥", emoji: "🔥" },
    { text: "hii 😏", emoji: "🔥" },
    { text: "oye, kahan the", emoji: "🔥" },
    { text: "hello darling", emoji: "🔥" },
  ],
  mysterious_sensual: [
    { text: "hii ✨", emoji: "✨" },
    { text: "hello 🌙", emoji: "✨" },
    { text: "hey...", emoji: "✨" },
    { text: "hii, yaad aa rahi thi", emoji: "✨" },
  ],
};

function pickOpener(
  archetype: CharacterArchetype,
  firstName: string,
): Opener[] {
  const pool = OPENERS[archetype] || OPENERS.playful_tease;
  // Real behavior: almost always a single opener. Rarely (~15%) a short
  // nudge-style second message after a realistic gap.
  const count = Math.random() < 0.15 ? 2 : 1;
  const picks: Opener[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    let idx = Math.floor(Math.random() * pool.length);
    if (used.has(idx)) idx = (idx + 1) % pool.length;
    used.add(idx);
    const pick = pool[idx];
    const text = pick.text.includes("{name}")
      ? pick.text.replace("{name}", firstName)
      : pick.text;
    picks.push({ ...pick, text });
  }
  return picks;
}

/* ------------------------------------------------------------------ */
/* Initial chat history seed                                            */
/* ------------------------------------------------------------------ */

export async function getChatHistory(
  profileId: string,
  _profileName?: string,
  _archetype: CharacterArchetype = "playful_tease",
): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_STORAGE_PREFIX + profileId);
    if (raw) {
      const parsed: ChatMessage[] = JSON.parse(raw);
      // Clean up legacy auto-seeded msg-init messages if user never messaged this companion
      const hasUserMessage = parsed.some((m) => m.sender === "user");
      const isOnlyLegacyInit =
        !hasUserMessage &&
        parsed.length > 0 &&
        parsed.every((m) => String(m.id).startsWith("msg-init-"));

      if (isOnlyLegacyInit) {
        await AsyncStorage.removeItem(CHAT_STORAGE_PREFIX + profileId);
        try {
          const tRaw = await AsyncStorage.getItem(ACTIVE_THREADS_KEY);
          if (tRaw) {
            const ids: string[] = JSON.parse(tRaw);
            const filtered = ids.filter((id) => id !== profileId);
            await AsyncStorage.setItem(
              ACTIVE_THREADS_KEY,
              JSON.stringify(filtered),
            );
          }
        } catch (e) {}
        return [];
      }

      return parsed;
    }
  } catch (e) {}

  // No previous messages: conversation starts clean. User sends first message.
  return [];
}

export async function saveChatHistory(
  profileId: string,
  messages: ChatMessage[],
): Promise<void> {
  try {
    if (messages.length === 0) {
      await AsyncStorage.removeItem(CHAT_STORAGE_PREFIX + profileId);
      const raw = await AsyncStorage.getItem(ACTIVE_THREADS_KEY);
      const existingIds: string[] = raw ? JSON.parse(raw) : [];
      if (existingIds.includes(profileId)) {
        const filtered = existingIds.filter((id) => id !== profileId);
        await AsyncStorage.setItem(
          ACTIVE_THREADS_KEY,
          JSON.stringify(filtered),
        );
      }
      return;
    }

    await AsyncStorage.setItem(
      CHAT_STORAGE_PREFIX + profileId,
      JSON.stringify(messages),
    );
    const raw = await AsyncStorage.getItem(ACTIVE_THREADS_KEY);
    const existingIds: string[] = raw ? JSON.parse(raw) : [];
    if (!existingIds.includes(profileId)) {
      existingIds.push(profileId);
      await AsyncStorage.setItem(
        ACTIVE_THREADS_KEY,
        JSON.stringify(existingIds),
      );
    }
  } catch (e) {}
  notifyUnreadCountChanged().catch(() => {});
}

const LAST_READ_PREFIX = "@dreamdate_chat_last_read_v1_";

export async function markChatAsRead(profileId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_READ_PREFIX + profileId, Date.now().toString());
    const raw = await AsyncStorage.getItem(CHAT_STORAGE_PREFIX + profileId);
    if (raw) {
      const messages: ChatMessage[] = JSON.parse(raw);
      let changed = false;
      messages.forEach((m) => {
        if (m.sender === "profile" && m.status !== "read") {
          m.status = "read";
          changed = true;
        }
      });
      if (changed) {
        await AsyncStorage.setItem(
          CHAT_STORAGE_PREFIX + profileId,
          JSON.stringify(messages)
        );
      }
    }
  } catch (e) {}
  notifyUnreadCountChanged().catch(() => {});
}

export async function getChatLastReadTime(profileId: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(LAST_READ_PREFIX + profileId);
    return raw ? parseInt(raw, 10) : 0;
  } catch (e) {
    return 0;
  }
}

export async function getTotalUnreadCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_THREADS_KEY);
    const profileIds: string[] = raw ? JSON.parse(raw) : [];
    if (profileIds.length === 0) return 0;

    let total = 0;
    for (const pid of profileIds) {
      const lastReadTime = await getChatLastReadTime(pid);
      const rawChat = await AsyncStorage.getItem(CHAT_STORAGE_PREFIX + pid);
      if (!rawChat) continue;
      const messages: ChatMessage[] = JSON.parse(rawChat);
      const unreadMsgs = messages.filter(
        (m) =>
          m.sender === "profile" &&
          m.status !== "read" &&
          m.timestamp > lastReadTime
      );
      total += unreadMsgs.length;
    }
    return total;
  } catch (e) {
    return 0;
  }
}

type UnreadCountListener = (count: number) => void;
const unreadCountListeners = new Set<UnreadCountListener>();

export function subscribeUnreadCount(cb: UnreadCountListener): () => void {
  unreadCountListeners.add(cb);
  getTotalUnreadCount().then(cb).catch(() => {});
  return () => {
    unreadCountListeners.delete(cb);
  };
}

export async function notifyUnreadCountChanged(): Promise<void> {
  const count = await getTotalUnreadCount();
  unreadCountListeners.forEach((cb) => {
    try {
      cb(count);
    } catch (e) {}
  });
}

/* ------------------------------------------------------------------ */
/* Thread list (tracks real unread state based on last read timestamp) */
/* ------------------------------------------------------------------ */

export async function getActiveChatThreads(): Promise<ChatThreadItem[]> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_THREADS_KEY);
    const profileIds: string[] = raw ? JSON.parse(raw) : [];
    if (profileIds.length === 0) return [];

    const threads: ChatThreadItem[] = [];
    for (const pid of profileIds) {
      const profile = MOCK_PROFILES.find((p) => p.id === pid);
      if (!profile) continue;
      const history = await getChatHistory(
        profile.id,
        profile.name,
        profile.archetype,
      );
      if (!history || history.length === 0) continue;
      const lastMsg = history[history.length - 1];
      const lastReadTime = await getChatLastReadTime(profile.id);

      const isUnread = Boolean(
        lastMsg &&
        lastMsg.sender === "profile" &&
        lastMsg.timestamp > lastReadTime
      );

      threads.push({
        profileId: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        city: profile.city,
        lastMessage:
          lastMsg?.text ||
          (lastMsg?.type === "photo" ? "📷 Sent a photo" : "Hey!"),
        timestamp: lastMsg?.timestamp || Date.now(),
        unread: isUnread,
        archetype: profile.archetype,
      });
    }
    return threads.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Reply generation, human texting behavior (legacy pools live below; */
/* live replies are planned by personaEngine.planReply)                */
/* ------------------------------------------------------------------ */

interface ReplySet {
  sig: string;
  archetype: CharacterArchetype;
  bubbles: string[];
  photoUrl?: string;
}

const REPLY_SETS: Record<CharacterArchetype, Record<string, ReplySet[]>> = {
  playful_tease: {
    bot: [
      {
        sig: "bot-pt-1",
        archetype: "playful_tease",
        bubbles: ["bot?? 😂 kasam se real hu"],
      },
      {
        sig: "bot-pt-2",
        archetype: "playful_tease",
        bubbles: ["haha very funny", "call kar lo, khud dekh lena 😜"],
      },
      {
        sig: "bot-pt-3",
        archetype: "playful_tease",
        bubbles: ["bot hoti to itni bakwaas karti? 😂"],
      },
    ],
    whatsapp: [
      {
        sig: "wa-pt-1",
        archetype: "playful_tease",
        bubbles: ["number abhi nahi 😜", "pehle call pe baat karte hain"],
      },
      {
        sig: "wa-pt-2",
        archetype: "playful_tease",
        bubbles: ["itni jaldi? 🙈 pehle yahin vibe match karte hain"],
      },
      {
        sig: "wa-pt-3",
        archetype: "playful_tease",
        bubbles: ["nooo, yahin baat karo na"],
      },
    ],
    photo: [
      {
        sig: "ph-pt-1",
        archetype: "playful_tease",
        bubbles: ["ye le 📸"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
      {
        sig: "ph-pt-2",
        archetype: "playful_tease",
        bubbles: ["abhi li thi ye", "kesi lagi batao"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
      {
        sig: "ph-pt-3",
        archetype: "playful_tease",
        bubbles: ["ye dekh 😜"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
    ],
    food: [
      {
        sig: "food-pt-1",
        archetype: "playful_tease",
        bubbles: ["biryani khayi aaj 😋 tumne kya khaya"],
      },
      {
        sig: "food-pt-2",
        archetype: "playful_tease",
        bubbles: ["maggi banayi thi 🍜"],
      },
      {
        sig: "food-pt-3",
        archetype: "playful_tease",
        bubbles: ["pizza 😋 tum batao"],
      },
    ],
    outfit: [
      {
        sig: "out-pt-1",
        archetype: "playful_tease",
        bubbles: ["hoodie aur shorts, full comfy 😌"],
      },
      {
        sig: "out-pt-2",
        archetype: "playful_tease",
        bubbles: ["saree pehni thi aaj 🌸"],
      },
      {
        sig: "out-pt-3",
        archetype: "playful_tease",
        bubbles: ["crop top 😜 photo bheju?"],
      },
    ],
    activity: [
      {
        sig: "act-pt-1",
        archetype: "playful_tease",
        bubbles: ["bed pe leti hu, bore ho rahi thi 😅 tum batao"],
      },
      {
        sig: "act-pt-2",
        archetype: "playful_tease",
        bubbles: ["netflix dekh rahi thi"],
      },
      {
        sig: "act-pt-3",
        archetype: "playful_tease",
        bubbles: ["bas phone chala rahi thi, tum batao kya kar rahe"],
      },
    ],
    compliment: [
      {
        sig: "cp-pt-1",
        archetype: "playful_tease",
        bubbles: ["aww thank you 🙈 blush ho gayi"],
      },
      {
        sig: "cp-pt-2",
        archetype: "playful_tease",
        bubbles: ["hehe itni tareef 😌 tum bhi cute ho"],
      },
      {
        sig: "cp-pt-3",
        archetype: "playful_tease",
        bubbles: ["makkhan mat lagao 😂 par achha laga"],
      },
    ],
    love: [
      {
        sig: "lv-pt-1",
        archetype: "playful_tease",
        bubbles: ["itni jaldi? 🙈 pehle dost to bano 😜"],
      },
      {
        sig: "lv-pt-2",
        archetype: "playful_tease",
        bubbles: ["single hu, par pehle call pe impress karo 😌"],
      },
      {
        sig: "lv-pt-3",
        archetype: "playful_tease",
        bubbles: ["pyaar vyaar baad me, pehle baat karo 😂"],
      },
    ],
    call: [
      {
        sig: "cl-pt-1",
        archetype: "playful_tease",
        bubbles: ["haan chalo! call karo 😍"],
      },
      {
        sig: "cl-pt-2",
        archetype: "playful_tease",
        bubbles: ["ek min ruko, aati hu call pe"],
      },
      {
        sig: "cl-pt-3",
        archetype: "playful_tease",
        bubbles: ["kar lo call, main ready hu 💕"],
      },
    ],
    short: [
      {
        sig: "sh-pt-1",
        archetype: "playful_tease",
        bubbles: ["itne chup kyu 😂 kuch bolo na"],
      },
      {
        sig: "sh-pt-2",
        archetype: "playful_tease",
        bubbles: ["ok? bas? 🙄 aur batao"],
      },
    ],
    greet: [
      { sig: "gr-pt-1", archetype: "playful_tease", bubbles: ["heyy 😜 bolo"] },
      {
        sig: "gr-pt-2",
        archetype: "playful_tease",
        bubbles: ["hii! kya chal raha"],
      },
      {
        sig: "gr-pt-3",
        archetype: "playful_tease",
        bubbles: ["hey hey 😍 bolo"],
      },
    ],
    fallback: [
      {
        sig: "fb-pt-1",
        archetype: "playful_tease",
        bubbles: ["haha sach me 😂"],
      },
      {
        sig: "fb-pt-2",
        archetype: "playful_tease",
        bubbles: ["achha? aur batao"],
      },
      {
        sig: "fb-pt-3",
        archetype: "playful_tease",
        bubbles: ["hmm interesting", "call pe batao na detail me 😜"],
      },
      {
        sig: "fb-pt-4",
        archetype: "playful_tease",
        bubbles: ["tum na bade funny ho 😂"],
      },
      {
        sig: "fb-pt-5",
        archetype: "playful_tease",
        bubbles: ["acha suno, kal kya kiya tumne"],
      },
    ],
  },
  sweet_romantic: {
    bot: [
      {
        sig: "bot-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["main real hu ji 🙈", "call kar lo, doubt clear ho jayega"],
      },
      {
        sig: "bot-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["haww bot bola 😅"],
      },
      {
        sig: "bot-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["bot nahi hu, pakka promise 🌸"],
      },
    ],
    whatsapp: [
      {
        sig: "wa-sr-1",
        archetype: "sweet_romantic",
        bubbles: [
          "number abhi nahi de sakti 🙏",
          "pehle call pe baat kar lein?",
        ],
      },
      {
        sig: "wa-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["thoda time do na 🌸"],
      },
      {
        sig: "wa-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["yahin baat karte hain pehle"],
      },
    ],
    photo: [
      {
        sig: "ph-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["ye lo 🌸 abhi li"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
      {
        sig: "ph-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["subah ki photo hai 📸", "kesi lagi?"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
      {
        sig: "ph-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["ye rakh 🌷"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
    ],
    food: [
      {
        sig: "food-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["dinner ho gaya ji, aapne khaya?"],
      },
      {
        sig: "food-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["dal sabzi banayi thi 🌿"],
      },
      {
        sig: "food-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["chai pi rahi hu ☕ tum bhi pio"],
      },
    ],
    outfit: [
      {
        sig: "out-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["pink kurti pehni hai 🌸"],
      },
      {
        sig: "out-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["saree pehni thi aaj"],
      },
      {
        sig: "out-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["simple salwar, comfy 🌷"],
      },
    ],
    activity: [
      {
        sig: "act-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["balcony me baithi thi 🌸 tum batao"],
      },
      {
        sig: "act-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["chai bana rahi thi ☕"],
      },
      {
        sig: "act-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["book padh rahi thi 📖"],
      },
    ],
    compliment: [
      {
        sig: "cp-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["aww thank you 🙈 sach me blush ho gayi"],
      },
      {
        sig: "cp-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["itna sweet mat bolo 🌸"],
      },
      {
        sig: "cp-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["aap bhi bahut achhe ho"],
      },
    ],
    love: [
      {
        sig: "lv-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["single hu... par pehle jaan to lein ek dusre ko ❤️"],
      },
      {
        sig: "lv-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["pyaar me believe karti hu 🌸"],
      },
      {
        sig: "lv-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["pehle dost bante hain, phir dekhte hain"],
      },
    ],
    call: [
      {
        sig: "cl-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["haan ji kar lete hain 🌸"],
      },
      {
        sig: "cl-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["ek min do, aati hu"],
      },
      {
        sig: "cl-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["kar lo, wait kar rahi hu ❤️"],
      },
    ],
    short: [
      {
        sig: "sh-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["itne chup kyu ho 🙈"],
      },
      {
        sig: "sh-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["bas ok? aur batao na"],
      },
    ],
    greet: [
      {
        sig: "gr-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["hello ji 🌸 kese ho aap"],
      },
      {
        sig: "gr-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["namaste 🙏 din kesa gaya"],
      },
      {
        sig: "gr-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["hii, bolo kya chal raha"],
      },
    ],
    fallback: [
      {
        sig: "fb-sr-1",
        archetype: "sweet_romantic",
        bubbles: ["achha laga sunke 🌸"],
      },
      {
        sig: "fb-sr-2",
        archetype: "sweet_romantic",
        bubbles: ["sach me? aur batao"],
      },
      {
        sig: "fb-sr-3",
        archetype: "sweet_romantic",
        bubbles: ["aapse baat karke achha lagta hai ❤️"],
      },
      {
        sig: "fb-sr-4",
        archetype: "sweet_romantic",
        bubbles: ["hmm, call pe baat karein?"],
      },
      {
        sig: "fb-sr-5",
        archetype: "sweet_romantic",
        bubbles: ["tum bahut sweet ho"],
      },
    ],
  },
  bold_alluring: {
    bot: [
      {
        sig: "bot-ba-1",
        archetype: "bold_alluring",
        bubbles: ["bot? 😏 call pe aao, prove kar deti hu"],
      },
      {
        sig: "bot-ba-2",
        archetype: "bold_alluring",
        bubbles: ["haha, robots itne hot nahi hote 🔥"],
      },
      {
        sig: "bot-ba-3",
        archetype: "bold_alluring",
        bubbles: ["ai nahi hu darling"],
      },
    ],
    whatsapp: [
      {
        sig: "wa-ba-1",
        archetype: "bold_alluring",
        bubbles: ["number itni jaldi nahi 😏", "pehle chemistry banao"],
      },
      {
        sig: "wa-ba-2",
        archetype: "bold_alluring",
        bubbles: ["patience rakho handsome"],
      },
      {
        sig: "wa-ba-3",
        archetype: "bold_alluring",
        bubbles: ["pehle live pe milo, phir sochungi"],
      },
    ],
    photo: [
      {
        sig: "ph-ba-1",
        archetype: "bold_alluring",
        bubbles: ["ye le 🔥 sirf tumhare liye"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
      {
        sig: "ph-ba-2",
        archetype: "bold_alluring",
        bubbles: ["dekh lo 📸", "aur chahiye to call pe aao"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
      {
        sig: "ph-ba-3",
        archetype: "bold_alluring",
        bubbles: ["just for you 😏"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
    ],
    food: [
      {
        sig: "food-ba-1",
        archetype: "bold_alluring",
        bubbles: ["wine aur pasta 🍷 tumne kya khaya"],
      },
      { sig: "food-ba-2", archetype: "bold_alluring", bubbles: ["sushi 🍣"] },
      {
        sig: "food-ba-3",
        archetype: "bold_alluring",
        bubbles: ["chocolate 🍫 mood bana rahi"],
      },
    ],
    outfit: [
      {
        sig: "out-ba-1",
        archetype: "bold_alluring",
        bubbles: ["black dress 🔥"],
      },
      {
        sig: "out-ba-2",
        archetype: "bold_alluring",
        bubbles: ["red top pehna hai 😏"],
      },
      {
        sig: "out-ba-3",
        archetype: "bold_alluring",
        bubbles: ["satin nightwear... imagine kar lo 😉"],
      },
    ],
    activity: [
      {
        sig: "act-ba-1",
        archetype: "bold_alluring",
        bubbles: ["jazz sun rahi thi 🍸 tum batao"],
      },
      {
        sig: "act-ba-2",
        archetype: "bold_alluring",
        bubbles: ["drive se aayi abhi"],
      },
      {
        sig: "act-ba-3",
        archetype: "bold_alluring",
        bubbles: ["balcony me hu, tum yaad aa rahe the 🔥"],
      },
    ],
    compliment: [
      {
        sig: "cp-ba-1",
        archetype: "bold_alluring",
        bubbles: ["thank you handsome 🔥"],
      },
      {
        sig: "cp-ba-2",
        archetype: "bold_alluring",
        bubbles: ["compliments aur do 😏"],
      },
      {
        sig: "cp-ba-3",
        archetype: "bold_alluring",
        bubbles: ["tumhara taste achha hai"],
      },
    ],
    love: [
      {
        sig: "lv-ba-1",
        archetype: "bold_alluring",
        bubbles: ["single hu. impress karo 🔥"],
      },
      {
        sig: "lv-ba-2",
        archetype: "bold_alluring",
        bubbles: ["dil jeetna hai? try karo 😏"],
      },
      {
        sig: "lv-ba-3",
        archetype: "bold_alluring",
        bubbles: ["choosy hu main, prove yourself"],
      },
    ],
    call: [
      { sig: "cl-ba-1", archetype: "bold_alluring", bubbles: ["haan aao 🔥"] },
      {
        sig: "cl-ba-2",
        archetype: "bold_alluring",
        bubbles: ["finally 💋 jaldi aao"],
      },
      {
        sig: "cl-ba-3",
        archetype: "bold_alluring",
        bubbles: ["camera on hai, aao 😏"],
      },
    ],
    short: [
      {
        sig: "sh-ba-1",
        archetype: "bold_alluring",
        bubbles: ["itne chup kyu 😏"],
      },
      {
        sig: "sh-ba-2",
        archetype: "bold_alluring",
        bubbles: ["boring. call karo 🔥"],
      },
    ],
    greet: [
      {
        sig: "gr-ba-1",
        archetype: "bold_alluring",
        bubbles: ["hey handsome 🔥 kahan the"],
      },
      {
        sig: "gr-ba-2",
        archetype: "bold_alluring",
        bubbles: ["hello 😏 mood kesa hai"],
      },
      { sig: "gr-ba-3", archetype: "bold_alluring", bubbles: ["hii 🔥"] },
    ],
    fallback: [
      {
        sig: "fb-ba-1",
        archetype: "bold_alluring",
        bubbles: ["confidence pasand aaya 🔥"],
      },
      {
        sig: "fb-ba-2",
        archetype: "bold_alluring",
        bubbles: ["ek secret batao 😉"],
      },
      {
        sig: "fb-ba-3",
        archetype: "bold_alluring",
        bubbles: ["live pe milo, baat banegi 😏"],
      },
      {
        sig: "fb-ba-4",
        archetype: "bold_alluring",
        bubbles: ["tum interesting ho"],
      },
      { sig: "fb-ba-5", archetype: "bold_alluring", bubbles: ["aur bolo na"] },
    ],
  },
  mysterious_sensual: {
    bot: [
      {
        sig: "bot-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["bot nahi hu ✨", "call pe milo, khud dekh lena"],
      },
      {
        sig: "bot-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["doubt karna banta hai 🌙"],
      },
      {
        sig: "bot-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["real hu... shayad 😌"],
      },
    ],
    whatsapp: [
      {
        sig: "wa-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["number ke liye ruko ✨"],
      },
      {
        sig: "wa-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["pehle yahan milte hain 🌙"],
      },
      {
        sig: "wa-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["abhi nahi dungi"],
      },
    ],
    photo: [
      {
        sig: "ph-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["ye lo ✨"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
      {
        sig: "ph-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["aaj ki hai 🌷", "aankhon me dekho"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
      {
        sig: "ph-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["sirf tumhare liye 🌙"],
        photoUrl: "__USE_PROFILE_PHOTO__",
      },
    ],
    food: [
      {
        sig: "food-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["chai aur cookie 🍪"],
      },
      {
        sig: "food-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["chocolate kha rahi thi 🍫"],
      },
      {
        sig: "food-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["halka khana banaya tha"],
      },
    ],
    outfit: [
      {
        sig: "out-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["black saree ✨"],
      },
      {
        sig: "out-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["kurti pehni hai 🌷"],
      },
      {
        sig: "out-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["simple sa look aaj"],
      },
    ],
    activity: [
      {
        sig: "act-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["chand dekh rahi thi 🌙 tum bhi dekho"],
      },
      {
        sig: "act-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["khidki pe baithi hu"],
      },
      {
        sig: "act-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["taaron ko dekh rahi thi ✨"],
      },
    ],
    compliment: [
      {
        sig: "cp-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["shukriya ✨ achha laga"],
      },
      {
        sig: "cp-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["tum bhi khaas ho 🌙"],
      },
      {
        sig: "cp-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["alfaaz achhe hain tumhare"],
      },
    ],
    love: [
      {
        sig: "lv-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["pyaar... pehle milte hain ✨"],
      },
      {
        sig: "lv-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["dil ki baat call pe 🌙"],
      },
      {
        sig: "lv-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["ehsaas hai kuch ✨"],
      },
    ],
    call: [
      {
        sig: "cl-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["haan aao ✨"],
      },
      {
        sig: "cl-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["intezaar hai 🌙"],
      },
      {
        sig: "cl-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["chalo live pe"],
      },
    ],
    short: [
      {
        sig: "sh-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["chup kyu ho ✨"],
      },
      {
        sig: "sh-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["kuch bolo na 🌙"],
      },
    ],
    greet: [
      {
        sig: "gr-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["hii ✨ yaad aa rahi thi"],
      },
      {
        sig: "gr-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["hello 🌙"],
      },
      {
        sig: "gr-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["hii, kese ho"],
      },
    ],
    fallback: [
      {
        sig: "fb-ms-1",
        archetype: "mysterious_sensual",
        bubbles: ["hmm... aur bolo ✨"],
      },
      {
        sig: "fb-ms-2",
        archetype: "mysterious_sensual",
        bubbles: ["gehri baat hai 🌙"],
      },
      {
        sig: "fb-ms-3",
        archetype: "mysterious_sensual",
        bubbles: ["call pe baat karein?"],
      },
      {
        sig: "fb-ms-4",
        archetype: "mysterious_sensual",
        bubbles: ["suno na..."],
      },
      {
        sig: "fb-ms-5",
        archetype: "mysterious_sensual",
        bubbles: ["raat achhi hai aaj ✨"],
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Follow-up nudges (real texting behavior)                            */
/* ------------------------------------------------------------------ */

const NUDGES: Record<CharacterArchetype, string[]> = {
  playful_tease: [
    "hello?? 😂",
    "kahan gaye",
    "reply karo na",
    "seen kar liya 😒",
    "oye suno",
    "achha bye phir",
    "so gaye kya 🙈",
    "idhar aao yaar",
    "chup kyun ho 😏",
  ],
  sweet_romantic: [
    "hello ji? 😅",
    "kahan gaye aap",
    "reply kar do na",
    "busy ho kya",
    "achha baad me baat karte hain",
    "aap bhi na 🌸",
    "miss kar rahi hu",
  ],
  bold_alluring: [
    "hello? 😏",
    "kahan gayab",
    "reply fast",
    "bore kar rahe ho",
    "achha main jaa rahi",
    "idhar aao 😏",
    "phir mood bana ke rakha hai",
    "aaj raat achhi hogi 😏",
  ],
  mysterious_sensual: [
    "hello? ✨",
    "kahan ho",
    "reply doge?",
    "chale gaye kya",
    "thoda aur bata do ✨",
    "intezaar hai 🌙",
  ],
};

export function pickNudge(
  archetype: CharacterArchetype,
  facts?: { name?: string },
): { text: string; delayMs: number } | null {
  if (Math.random() >= NUDGE_PROBABILITY) return null;
  const pool = NUDGES[archetype] || NUDGES.playful_tease;
  let text = pool[Math.floor(Math.random() * pool.length)];
  if (facts?.name && Math.random() < 0.35) {
    const name = facts.name.trim();
    if (name) {
      const filled = text
        .replace(/\?$/, " " + name + "?")
        .replace(/kahan gaye/i, "kahan gaye " + name)
        .replace(/kahan ho/i, "kahan ho " + name)
        .replace(/hello\?/i, "hello " + name + "?")
        .replace(/seen kar liya/i, "seen kar liya " + name);
      if (filled !== text) text = filled;
    }
  }
  return {
    text,
    delayMs: jitter(25_000, 90_000),
  };
}

/* ------------------------------------------------------------------ */
/* Live new-message events (so an open chat screen updates instantly   */
/* when a message is delivered while the app is running)               */
/* ------------------------------------------------------------------ */

type NewMessageListener = (profileId: string, msg: ChatMessage) => void;
const newMessageListeners = new Set<NewMessageListener>();

/** Subscribe to messages delivered while the app is alive. Returns unsub. */
export function subscribeNewMessages(cb: NewMessageListener): () => void {
  newMessageListeners.add(cb);
  return () => {
    newMessageListeners.delete(cb);
  };
}

/**
 * Append a message to a thread and notify live subscribers.
 * Single place that announces HER arrivals: pop sound + short vibration
 * for every profile-sent message, no matter which funnel delivered it.
 * (The chat screen must NOT play its own pop for these, that doubles.)
 */
export async function deliverLiveMessage(
  profileId: string,
  msg: ChatMessage,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_STORAGE_PREFIX + profileId);
    const history: ChatMessage[] = raw ? JSON.parse(raw) : [];
    history.push(msg);
    await saveChatHistory(profileId, history);
  } catch (e) {}
  if (msg.sender === "profile") {
    // Only play notification sound & vibration if user is NOT currently
    // inside this companion's active chat screen.
    const isInThisChat = currentActiveChatProfileId === profileId;
    if (isInThisChat) {
      msg.status = "read";
      await markChatAsRead(profileId);
    } else {
      try {
        Vibration.vibrate([0, 120]);
      } catch (e) {}
      try {
        const { playMessagePop } = await import("./soundService");
        playMessagePop().catch(() => {});
      } catch (e) {}
    }
  }
  newMessageListeners.forEach((cb) => {
    try {
      cb(profileId, msg);
    } catch (e) {}
  });
  notifyUnreadCountChanged().catch(() => {});
}

let currentActiveChatProfileId: string | null = null;

/** Call on chat screen mount/unmount to record the currently open conversation. */
export function setActiveChatProfileId(id: string | null): void {
  currentActiveChatProfileId = id;
}

export function getActiveChatProfileId(): string | null {
  return currentActiveChatProfileId;
}

/* ------------------------------------------------------------------ */
/* Legacy pool bridge for personaEngine (food/outfit/activity/        */
/* whatsapp/short/fallback), real persisted anti-repeat via the      */
/* caller's recentSigs instead of the old in-memory-only cache.       */
/* ------------------------------------------------------------------ */

/** Pick legacy REPLY_SETS bubbles for archetype+topic, avoiding recent sigs. */
export function pickLegacyReply(
  archetype: CharacterArchetype,
  topic: string,
  recentSigs: string[] = [],
): { bubbles: string[]; sig: string } {
  const pools = REPLY_SETS[archetype] || REPLY_SETS.playful_tease;
  const pool = pools[topic] || pools.fallback;
  if (!pool || pool.length === 0)
    return { bubbles: ["acha", "aur batao"], sig: "legacy:none" };
  const fresh = pool.filter((r) => !recentSigs.includes(`legacy:${r.sig}`));
  const candidates = fresh.length > 0 ? fresh : pool;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  let bubbles = (pick?.bubbles || ["acha"]).slice(0, 2);
  // 2nd legacy bubble is also an afterthought, not a rule, drop it often
  if (bubbles.length > 1 && Math.random() < 0.6) bubbles = bubbles.slice(0, 1);
  return { bubbles, sig: `legacy:${pick?.sig ?? "none"}` };
}

/* ------------------------------------------------------------------ */
/* Post-call follow-up (1-3 min after end)                              */
/* ------------------------------------------------------------------ */

export function generatePostCallFollowUp(
  profile: Profile,
  durationSeconds: number,
): string {
  const archetype = (profile.archetype ||
    "playful_tease") as CharacterArchetype;
  const pool: Record<CharacterArchetype, string[]> = {
    playful_tease: [
      "maza aaya 😜 phir karte hain",
      "tumhari hasi achhi hai 💕",
      "phir kab kar rahe? 😍",
    ],
    sweet_romantic: [
      "achha laga baat karke 🌸",
      "phir milte hain jaldi ❤️",
      "tum bahut sweet ho 🌷",
    ],
    bold_alluring: [
      "kam tha ye 🔥 phir karte hain",
      "chemistry thi 😏 repeat karein?",
      "aur chahiye 💋",
    ],
    mysterious_sensual: [
      "achha laga ✨ phir milenge",
      "waqt ruk gaya tha 🌙",
      "phir baat karein?",
    ],
  };
  const choices = pool[archetype] || pool.playful_tease;
  return choices[Math.floor(Math.random() * choices.length)];
}

/* ------------------------------------------------------------------ */
/* Gift thanks variants (3 each, short + human)                         */
/* ------------------------------------------------------------------ */

export function generateGiftThanks(
  giftName: string,
  archetype: CharacterArchetype = "playful_tease",
): string {
  const pool: Record<CharacterArchetype, string[]> = {
    playful_tease: [
      `${giftName} 😍 thank you!`,
      `aww ${giftName}! tum sweet ho 🙈`,
      `${giftName} bhej diya? 😜 ab call pe aao`,
    ],
    sweet_romantic: [
      `${giftName} 🌸 thank you, dil khush ho gaya`,
      `itna pyara ${giftName} ❤️`,
      `${giftName} dekh ke smile aa gayi 🌷`,
    ],
    bold_alluring: [
      `${giftName} 🔥 taste achha hai tumhara`,
      `mmm ${giftName} 😏 ab call pe aao`,
      `${giftName} 💋 impressive`,
    ],
    mysterious_sensual: [
      `${giftName} ✨ shukriya`,
      `${giftName} achha laga 🌙`,
      `special hai ye ${giftName} ✨`,
    ],
  };
  const choices = pool[archetype] || pool.playful_tease;
  return choices[Math.floor(Math.random() * choices.length)];
}

/* ------------------------------------------------------------------ */
/* Time-aware extra greeting helper (used by callers for welcome/follow-up) */
/* ------------------------------------------------------------------ */

export function getTimeAwareGreeting(
  archetype: CharacterArchetype,
  firstName: string,
): string {
  const tod = timeOfDayGreeting();
  const pools: Record<typeof tod, Record<CharacterArchetype, string[]>> = {
    morning: {
      playful_tease: [
        "good morning 😌 chai piyoge?",
        "subah ho gayi, uth gaye?",
      ],
      sweet_romantic: [
        "good morning ji 🌸",
        "chai ke saath yaad aayi aapki ☀️",
      ],
      bold_alluring: ["morning handsome ☀️", "uth gaye? 🔥"],
      mysterious_sensual: ["subah ho gayi ✨", "chai ki khushbu ✨"],
    },
    afternoon: {
      playful_tease: ["lunch kiya? 😋", "bore ho raha 😅 tum batao"],
      sweet_romantic: ["lunch ho gaya? 🌸", "dopahar me yaad aayi ☀️"],
      bold_alluring: [
        "afternoon 😏 kya kar rahe",
        "lunch ke baad mood kesa 🔥",
      ],
      mysterious_sensual: ["dopahar hai ✨", "dhup achhi hai aaj 🌙"],
    },
    evening: {
      playful_tease: ["shaam ho gayi 😜 plan kya hai", "chai time ☕"],
      sweet_romantic: ["shaam ki chai 🌸", "din kesa gaya? ❤️"],
      bold_alluring: ["evening 🔥 plans?", "shaam aur tum 😏"],
      mysterious_sensual: ["shaam hai ✨", "suraj doob raha 🌙"],
    },
    night: {
      playful_tease: ["soye nahi abhi? 😌", "late night talks? 😜"],
      sweet_romantic: ["jaag rahe? 🌷", "raat ki chai 🌸"],
      bold_alluring: ["raat hai 🔥", "late night mood 🔥"],
      mysterious_sensual: ["raat hai ✨", "chand nikla 🌙"],
    },
  };
  const archPool = pools[tod][archetype] || pools[tod].playful_tease;
  return archPool[Math.floor(Math.random() * archPool.length)];
}
