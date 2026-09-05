import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'profile';
  text: string;
  timestamp: number;
  type?: 'text' | 'voice' | 'photo' | 'gift';
  voiceDuration?: string;
  giftIcon?: string;
  giftName?: string;
  status?: 'sent' | 'delivered' | 'read';
}

const CHAT_STORAGE_PREFIX = '@talkmate_chat_history_';

export async function getChatHistory(profileId: string, profileName: string): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_STORAGE_PREFIX + profileId);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}

  // Initial welcome message from the girl
  const initialMessages: ChatMessage[] = [
    {
      id: 'msg-init-1',
      sender: 'profile',
      text: `Hii dear ❤️ Main ${profileName}. Kaise ho aap?`,
      timestamp: Date.now() - 1000 * 60 * 3,
      status: 'read',
    },
    {
      id: 'msg-init-2',
      sender: 'profile',
      text: 'Free ho to direct video call karo na, akele bore ho rahi hoon! 😊📞',
      timestamp: Date.now() - 1000 * 60 * 1,
      status: 'read',
    },
  ];
  await saveChatHistory(profileId, initialMessages);
  return initialMessages;
}

export async function saveChatHistory(profileId: string, messages: ChatMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAT_STORAGE_PREFIX + profileId, JSON.stringify(messages));
  } catch (e) {}
}

export function getSimulatedReply(userMessage: string, profileName: string): { text: string; delayMs: number } {
  const lower = userMessage.toLowerCase();

  let replies: string[] = [];

  if (lower.includes('call') || lower.includes('video') || lower.includes('live')) {
    replies = [
      `Haan bilkul! Upar jo Video Call button hai uspe click karo, main wait kar rahi hoon! 💋`,
      `Abhi video call connect karo na dear, face-to-face baat karte hain ❤️`,
      `Yes ready hoon! Jaldi se video call lagao, aapse live baat karni hai! 📞`,
    ];
  } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('kya hal') || lower.includes('kaise')) {
    replies = [
      `Main mast hoon! Aap sunao, kya kar rahe ho abhi? 😊`,
      `Hello handsome! Aapse baat karke bohot accha laga ❤️ Kahan se ho aap?`,
      `Hii! Bas abhi free hui thi, socha aapse thodi baatein kar lu 🥰`,
    ];
  } else if (lower.includes('beautiful') || lower.includes('sundar') || lower.includes('cute') || lower.includes('hot') || lower.includes('sexy') || lower.includes('gorgeous') || lower.includes('love')) {
    replies = [
      `Aww thank you so much! Aap kitne sweet ho! Sach me blush kar rahi hoon 🥰`,
      `Taareef ke liye shukriya! Video call pe aur bhi sundar lagti hoon, aakar dekh lo 😉❤️`,
      `Uff itni taareef! Thank you dear! Aap bhi bohot charming lagte ho!`,
    ];
  } else if (lower.includes('kahan') || lower.includes('where') || lower.includes('city') || lower.includes('ghar')) {
    replies = [
      `Main abhi apne flat me hoon, akele chill kar rahi thi. Aap kahan rehte ho?`,
      `Apne room me aaram se baithi hoon. Mood accha hai, video call pe aao na!`,
    ];
  } else if (lower.includes('coin') || lower.includes('free') || lower.includes('rate') || lower.includes('paisa')) {
    replies = [
      `Thode se coins lagte hain bas, par trust me aapse baat karke bohot maza aayega! ❤️`,
      `Call rate bohot low hai dear, jaldi se recharge karke video call pe aao na!`,
    ];
  } else {
    replies = [
      `Sahi baat hai! Waise aapse typing se zyada bolke baat karna accha lagega. Ek baar call karo na? ❤️`,
      `Hehe, aap bohot interesting baatein karte ho! Aao na private video call pe 💋`,
      `Sach me? Mujhe aapse aur jaanna hai. Direct video call pe connect karte hain!`,
      `Aap bohot acche ho! Mujhse promise karo roz baat karoge? 🥰`,
    ];
  }

  const selectedReply = replies[Math.floor(Math.random() * replies.length)];
  // Realistic typing delay: between 1800ms and 3200ms
  const delayMs = 1800 + Math.floor(Math.random() * 1400);

  return { text: selectedReply, delayMs };
}
