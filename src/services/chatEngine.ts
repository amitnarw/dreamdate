import AsyncStorage from '@react-native-async-storage/async-storage';
import { CharacterArchetype, MOCK_PROFILES, Profile } from '../data/mockProfiles';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'profile';
  text: string;
  timestamp: number;
  type?: 'text' | 'voice' | 'photo' | 'gift' | 'locked_photo';
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
  status?: 'sent' | 'delivered' | 'read';
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

export interface SimulatedReplyResult {
  text: string;
  bubbles: string[];
  delayMs: number;
  additionalDelayMs?: number;
  photoUrl?: string;
  /** Hint to the caller if the reply is a "delayed" reply (she went AFK). */
  isDelayed?: boolean;
}

const CHAT_STORAGE_PREFIX = '@dreamdate_chat_history_v5_';
const ACTIVE_THREADS_KEY = '@dreamdate_active_chat_threads_v5';
const REPLY_HISTORY_PREFIX = '@dreamdate_reply_history_v5_';

const REPLY_HISTORY_LIMIT = 4;
const REPLY_SELL_PROBABILITY = 0.34;
const REPLY_DOUBLE_TEXT_PROBABILITY = 0.18;
const REPLY_DELAYED_PROBABILITY = 0.10;
const REPLY_QUICK_PROBABILITY = 0.12;

/* ------------------------------------------------------------------ */
/* Time-of-day helpers                                                 */
/* ------------------------------------------------------------------ */

function timeOfDayGreeting(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function jitter(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

/* ------------------------------------------------------------------ */
/* Reply pool + anti-repeat memory                                      */
/* ------------------------------------------------------------------ */

async function loadHistory(profileId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(REPLY_HISTORY_PREFIX + profileId);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function pushHistory(profileId: string, sig: string): Promise<void> {
  try {
    const existing = await loadHistory(profileId);
    existing.push(sig);
    const trimmed = existing.slice(-REPLY_HISTORY_LIMIT);
    await AsyncStorage.setItem(REPLY_HISTORY_PREFIX + profileId, JSON.stringify(trimmed));
  } catch (e) {}
}

function pickWithMemory<T>(pool: T[], history: string[], keyFn: (item: T) => string): T {
  // Prefer items whose signature is not in the last-reply history
  const fresh = pool.filter((item) => !history.includes(keyFn(item)));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/* ------------------------------------------------------------------ */
/* Opener pools                                                        */
/* ------------------------------------------------------------------ */

type Opener = { text: string; emoji?: string };

const OPENERS: Record<CharacterArchetype, Opener[]> = {
  playful_tease: [
    { text: 'Heyyy handsome 😜 finally some real entertainment tonight', emoji: '😜' },
    { text: 'Uff, kya cute ho aap… btao na kahan the itni der?', emoji: '😜' },
    { text: 'Oye! Aap aaye toh raat aur bhi interesting ho gayi 😉', emoji: '😜' },
    { text: 'Hi! Mujhe laga tha aaj boring raat hogi, par ab nahi 🙈', emoji: '😜' },
  ],
  sweet_romantic: [
    { text: 'Namaste ji 🌸 Mera din accha tha, ab aap se baat karke aur accha ho gaya', emoji: '🌸' },
    { text: 'Hello! Aaj mood bahut romantic tha, aapka message dekh kar aur bhi 💕', emoji: '🌸' },
    { text: 'Hiii 🌸 Aapki yaad aayi thi, ab maza aa gaya', emoji: '🌸' },
    { text: 'Aap hello! Main abhi balcony pe chai pee rahi thi, baitho baat karte hain ☕', emoji: '🌸' },
  ],
  bold_alluring: [
    { text: 'Hey firecracker 🔥 Mera intuition kah raha tha aaj koi interesting aayega', emoji: '🔥' },
    { text: 'Well well… aap toh promising lagte ho. Surprise me.', emoji: '🔥' },
    { text: 'Hi handsome! Mujhe charming log pasand hain, aap hain kya?', emoji: '🔥' },
    { text: 'Hello darling. Late night ke liye perfect timing 😏', emoji: '🔥' },
  ],
  mysterious_sensual: [
    { text: 'Hii… raat ki khamoshi ne aapko mere paas bhej diya ✨', emoji: '✨' },
    { text: 'Hi there ✨ Kuch khaas sochke message kiya ya bas luck?', emoji: '✨' },
    { text: 'Hello… aapki presence mehsoos ho rahi thi, ab confirm hua', emoji: '✨' },
    { text: 'Hii. Aapke har message me gehraai hai, padh ke ruk gayi', emoji: '✨' },
  ],
};

function pickOpener(archetype: CharacterArchetype, firstName: string): Opener[] {
  const pool = OPENERS[archetype] || OPENERS.playful_tease;
  // Return 1-2 opener messages with realistic timestamps (2-8 min ago)
  const count = Math.random() < 0.35 ? 1 : 2;
  const picks: Opener[] = [];
  for (let i = 0; i < count; i++) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    // Replace placeholder name if present
    const text = pick.text.includes('{name}')
      ? pick.text.replace('{name}', firstName)
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
  profileName: string,
  archetype: CharacterArchetype = 'playful_tease'
): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_STORAGE_PREFIX + profileId);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}

  const firstName = profileName.split(' ')[0];
  const openers = pickOpener(archetype, firstName);

  const now = Date.now();
  const ts1 = now - jitter(2 * 60_000, 5 * 60_000); // 2-5 min ago
  const ts2 = now - jitter(15_000, 90_000);         // 15-90s ago (only if 2nd msg)

  const messages: ChatMessage[] = [
    {
      id: `msg-init-1-${profileId}`,
      sender: 'profile',
      text: openers[0].text,
      timestamp: ts1,
      status: 'read',
    },
  ];
  if (openers[1]) {
    messages.push({
      id: `msg-init-2-${profileId}`,
      sender: 'profile',
      text: openers[1].text,
      timestamp: ts2,
      status: 'read',
    });
  }

  await saveChatHistory(profileId, messages);
  return messages;
}

export async function saveChatHistory(profileId: string, messages: ChatMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAT_STORAGE_PREFIX + profileId, JSON.stringify(messages));
    const raw = await AsyncStorage.getItem(ACTIVE_THREADS_KEY);
    const existingIds: string[] = raw ? JSON.parse(raw) : [];
    if (!existingIds.includes(profileId)) {
      existingIds.push(profileId);
      await AsyncStorage.setItem(ACTIVE_THREADS_KEY, JSON.stringify(existingIds));
    }
  } catch (e) {}
}

/* ------------------------------------------------------------------ */
/* Thread list (unchanged behaviour, kept for backward compat)          */
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
      const history = await getChatHistory(profile.id, profile.name, profile.archetype);
      const lastMsg = history[history.length - 1];
      threads.push({
        profileId: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        city: profile.city,
        lastMessage: lastMsg?.text || (lastMsg?.type === 'photo' ? '📷 Sent a photo' : 'Hey!'),
        timestamp: lastMsg?.timestamp || Date.now(),
        unread: lastMsg?.sender === 'profile',
        archetype: profile.archetype,
      });
    }
    return threads.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Reply generation — multi-bubble with realistic timing                */
/* ------------------------------------------------------------------ */

/** Approx 35ms/char typing speed + a base read-time of 800ms + 0-1500ms jitter. */
function typingTimeMs(text: string): number {
  const base = 700;
  const perChar = 36;
  const j = jitter(0, 1500);
  return base + Math.floor(text.length * perChar) + j;
}

interface ReplySet {
  sig: string;
  archetype: CharacterArchetype;
  bubbles: string[];
  photoUrl?: string;
}

const REPLY_SETS: Record<CharacterArchetype, Record<string, ReplySet[]>> = {
  playful_tease: {
    bot: [
      { sig: 'bot-pt-1', archetype: 'playful_tease', bubbles: ['Arre re bot kisko bola?! 😂 Kasam se bilkul real ladki hoon!', 'Aise pyare witty replies koi AI de sakta hai kya? Vishwas nahi hai toh abhi video call lagao, live camera pe smile dikhaati hoon! 😜'] },
      { sig: 'bot-pt-2', archetype: 'playful_tease', bubbles: ['Bot?! 😅 Itni acchi baatein karne wala bot kahaan milega mujhe!', 'Chalo ek kaam karo, upar call button dabba kar — camera pe dekhte hi believe ho jaogi 😜'] },
      { sig: 'bot-pt-3', archetype: 'playful_tease', bubbles: ['Haha bot! 😜 Yeh attitude pasand aaya mujhe', 'Real hoon pakka, par proof chahiye toh video call pe dikhaati hoon — ready ho?'] },
    ],
    whatsapp: [
      { sig: 'wa-pt-1', archetype: 'playful_tease', bubbles: ['Hehe number maangne me bohot fast ho aap! 🙈', 'Pehle video call pe apni cute smile dikhao na mujhe, fir dekhti hoon deal pakki karni hai ya nahi! 😜'] },
      { sig: 'wa-pt-2', archetype: 'playful_tease', bubbles: ['Number abhi nahi handsome 😜', 'Pehle yahan apni vibe dikhao live call pe — chemistry match hui toh pakka!'] },
      { sig: 'wa-pt-3', archetype: 'playful_tease', bubbles: ['Arre ek minute bhi nahi laga pehle 🥰 itne confident ho!', 'Theek hai — pehle ek short video call, fir baat karte hain 😌'] },
    ],
    photo: [
      { sig: 'ph-pt-1', archetype: 'playful_tease', bubbles: ['Hehe ruko... abhi thodi der pehle hi ek photo li thi 📸', 'Kaisi lagi? Par sach batau toh 2D photo se zyada maza video call pe real-time dekhne me aayega! 😉'], photoUrl: '__USE_PROFILE_PHOTO__' },
      { sig: 'ph-pt-2', archetype: 'playful_tease', bubbles: ['Aaj subah ki ek photo 📷 abhi dekhi nahi tumne?', 'Isse bhi zyada mast live pe dikhati hoon — call karoge?'], photoUrl: '__USE_PROFILE_PHOTO__' },
      { sig: 'ph-pt-3', archetype: 'playful_tease', bubbles: ['Ye le meri taraf se 😜', 'Aankhon me dekh ke batao kaisa laga?'], photoUrl: '__USE_PROFILE_PHOTO__' },
    ],
    food: [
      { sig: 'food-pt-1', archetype: 'playful_tease', bubbles: ['Maine toh biryani mangwayi thi, bohot yummy thi! 😋', 'Aapne khaya? Sach sach bataana mere bina akele akele mast khana kha liya na? 😜'] },
      { sig: 'food-pt-2', archetype: 'playful_tease', bubbles: ['Pizza khayi thi abhi 😋 bohot cheesy', 'Tum bhi batao kya khaya, warna main guess karungi 😜'] },
      { sig: 'food-pt-3', archetype: 'playful_tease', bubbles: ['Maggi banayi thi 🍜 lazy Sunday mood', 'Tum kya khate ho generally? Batao recipe bhi share karna 😋'] },
    ],
    outfit: [
      { sig: 'out-pt-1', archetype: 'playful_tease', bubbles: ['Cute comfy crop top and shorts pehna hai! Hehe bataungi nahi kaisa lag raha hai 😜', 'Upar video call button hai, tap karo toh hi live dekhne milega! Deal?'] },
      { sig: 'out-pt-2', archetype: 'playful_tease', bubbles: ['Aaj oversized hoodie aur shorts pehna hai 😌 simple aaram se', 'Itna casual dekha toh judge mat karna 😂'] },
      { sig: 'out-pt-3', archetype: 'playful_tease', bubbles: ['Favourite saree pehni thi aaj! 🌸', 'Live me dikhati hoon, ek baar call pe click karo 😜'] },
    ],
    activity: [
      { sig: 'act-pt-1', archetype: 'playful_tease', bubbles: ['Apne room me bed pe aaram se leti hoon, aapse chat kar rahi hoon 🛋️', 'Waise thoda bore ho rahi thi, accha hua aapne message kiya! Chalo video call pe thodi masti karein?'] },
      { sig: 'act-pt-2', archetype: 'playful_tease', bubbles: ['Netflix pe kuch random dekh rahi thi 😌', 'Tum kya kar rahe ho abhi? Batao saath me decide karte hain kya dekhe 😅'] },
      { sig: 'act-pt-3', archetype: 'playful_tease', bubbles: ['Phone me scroll kar rahi thi, ekdum free mood 🦋', 'Aap batao plan kya hai raat ka 😜'] },
    ],
    compliment: [
      { sig: 'cp-pt-1', archetype: 'playful_tease', bubbles: ['Uff itna makkhan mat lagao! 😂 Par sach kahu toh sunke accha laga.', 'Ab itni tareef ki hai toh live video call pe meri smile dekh bhi lo na! 😉'] },
      { sig: 'cp-pt-2', archetype: 'playful_tease', bubbles: ['Aww thank you 😌 blush ho gayi main!', 'Itni sweet baatein karte ho, lagta hai tum bhi video call pe kamal dikhaoge 😉'] },
      { sig: 'cp-pt-3', archetype: 'playful_tease', bubbles: ['Hehe tum bhi kamal ho! 🙈 aise compliment karte ho toh main serious nahi reh paati', 'Chalo is compliment ki celebration video call pe karte hain 😜'] },
    ],
    love: [
      { sig: 'lv-pt-1', archetype: 'playful_tease', bubbles: ['Hehe itni jaldi propose kar rahe ho? 🙈', 'Pehle acche dost bante hain video call pe, fir aage ka dekhte hain! Deal manzoor hai? 😜'] },
      { sig: 'lv-pt-2', archetype: 'playful_tease', bubbles: ['Aww single hoon, par har koi aise nahi milta 🥰', 'Tum sabse pehle video call pe impress karo, fir baat karte hain 💕'] },
      { sig: 'lv-pt-3', archetype: 'playful_tease', bubbles: ['Pyaar ki baatein abhi nahi 😌 dost banao pehle', 'Call pe mil ke jaan lete hain ek dusre ko, phir sochenge 💕'] },
    ],
    call: [
      { sig: 'cl-pt-1', archetype: 'playful_tease', bubbles: ['Haan bilkul! Main camera on karke ready hoon 💖', 'Upar jo Video Call button hai uspe tap karo, abhi connect karte hain face to face!'] },
      { sig: 'cl-pt-2', archetype: 'playful_tease', bubbles: ['Arey haan! 😍 Tum bhi ready ho?', 'Ek minute deti hoon — freshen up karke aati hoon!'] },
      { sig: 'cl-pt-3', archetype: 'playful_tease', bubbles: ['Chalo call karte hain 😍', 'Tap that pink button — main right here! 💕'] },
    ],
    short: [
      { sig: 'sh-pt-1', archetype: 'playful_tease', bubbles: ['Sirf "ok"? Itne kanjoos kyu ho shabdon me! 😂', 'Mujhse baat karne me boring lag raha hai kya? Kuch mazedaar bolo na! 😜'] },
      { sig: 'sh-pt-2', archetype: 'playful_tease', bubbles: ['Hehe one word replies 😌 interesting start', 'Par mere saath baat karne ke liye shayad call better hoga — words se zyada chhupaungi 😜'] },
    ],
    greet: [
      { sig: 'gr-pt-1', archetype: 'playful_tease', bubbles: ['Hii handsome! Ekdum mast hoon 😜', 'Aap batao, aaj kiska dil tod ke aaye ho?'] },
      { sig: 'gr-pt-2', archetype: 'playful_tease', bubbles: ['Heyy! Kaisa hai aap?', 'Mujhe toh aapke message dekh ke hi mood fresh ho gaya 😌'] },
      { sig: 'gr-pt-3', archetype: 'playful_tease', bubbles: ['Heya 😍', 'Bolo kya haal chaal hai? Main full ready for a long chat 😉'] },
    ],
    fallback: [
      { sig: 'fb-pt-1', archetype: 'playful_tease', bubbles: ['Aap bohot witty ho sach me! Typing me maza toh aa raha hai...', 'Par bol ke baat karne ka alag hi maza hai. Video call kab karoge handsome? 😉'] },
      { sig: 'fb-pt-2', archetype: 'playful_tease', bubbles: ['Hehe sach batao, aap sabhi ladkiyon se aise hi charming baatein karte ho ya sirf mere sath? 😜', 'Mujhe lagta hai aap bohot shaitaan ho!'] },
      { sig: 'fb-pt-3', archetype: 'playful_tease', bubbles: ['Aapki baaton se lagta hai aapke sath bore hona impossible hai! 😂', 'Aao na video call pe, do minute live gossip karte hain!'] },
      { sig: 'fb-pt-4', archetype: 'playful_tease', bubbles: ['Itne acche reply karte ho, main toh keyboard pe wait karti hoon 😌', 'Aap batao aage kya plan hai, main ready hoon!'] },
      { sig: 'fb-pt-5', archetype: 'playful_tease', bubbles: ['Hmm tum bohot interesting ho 😏', 'Aise hi baatein karte raho, mujhe accha lagta hai'] },
    ],
  },
  sweet_romantic: {
    bot: [
      { sig: 'bot-sr-1', archetype: 'sweet_romantic', bubbles: ['Haww! Itne acche se baat kar rahi hoon aur aap mujhe bot bol rahe ho? 🙈', 'Main sach me real hoon ji. Agar doubt hai toh chalo do minute video call pe baat kar lete hain!'] },
      { sig: 'bot-sr-2', archetype: 'sweet_romantic', bubbles: ['Bot bola mujhe 🙈 chot lagi yaar', 'Call pe dikhaati hoon, trust karoge phir 🌸'] },
      { sig: 'bot-sr-3', archetype: 'sweet_romantic', bubbles: ['Itne saare compliments karne wala bot impossible hai 😌', 'Chalo live me milte hain, khud dekh lo!'] },
    ],
    whatsapp: [
      { sig: 'wa-sr-1', archetype: 'sweet_romantic', bubbles: ['Aap bohot sweet ho, par pehle yahan video call pe thoda comfort ban jaaye? 🌸', 'Mujhe thoda sharam aati hai aise direct number share karne me... Pehle call pe thoda jaan lein ek doosre ko?'] },
      { sig: 'wa-sr-2', archetype: 'sweet_romantic', bubbles: ['Number abhi nahi dungi 🙏', 'Pehle yahan ek baar face pe mil lo, fir sochungi pakka 🌸'] },
      { sig: 'wa-sr-3', archetype: 'sweet_romantic', bubbles: ['Hehe itni jaldi! Thoda time do na 🌸', 'Pehle call pe baat karke ek dusre ko samajhna accha hoga na?'] },
    ],
    photo: [
      { sig: 'ph-sr-1', archetype: 'sweet_romantic', bubbles: ['Ye le aaj ki photo 🌸 abhi tumhare liye li', 'Live pe mil ke aur share karungi — promise 🥰'], photoUrl: '__USE_PROFILE_PHOTO__' },
      { sig: 'ph-sr-2', archetype: 'sweet_romantic', bubbles: ['Aaj subah ki ek cute photo 📸', 'Agar pasand aaye toh call pe aur dikhati hoon 🌸'], photoUrl: '__USE_PROFILE_PHOTO__' },
      { sig: 'ph-sr-3', archetype: 'sweet_romantic', bubbles: ['Ye rakh mere paas 🌷 abhi li thi', 'Tumhe kaisi lagi?', 'Aankhon me dekh ke batao na!'], photoUrl: '__USE_PROFILE_PHOTO__' } as any,
    ],
    food: [
      { sig: 'food-sr-1', archetype: 'sweet_romantic', bubbles: ['Haanji, bas abhi dinner khatam kiya tha! 🌸', 'Aapne time se khana khaya ya kaam me busy the? Apna khayal rakha karo please!'] },
      { sig: 'food-sr-2', archetype: 'sweet_romantic', bubbles: ['Aaj sabzi-dal banaayi thi ghar pe 🌿', 'Tum kya khaate ho? Batao na, interesting lagta hai 🌸'] },
      { sig: 'food-sr-3', archetype: 'sweet_romantic', bubbles: ['Chai ke saath biscuit 🍪', 'Tum bhi peete ho chai? Agar haan toh virtual date karte hain ☕'] },
    ],
    outfit: [
      { sig: 'out-sr-1', archetype: 'sweet_romantic', bubbles: ['Ek simple pink floral kurti pehni hai, mujhe traditional outfits bohot pasand hain 🌸', 'Aapko ladkiyan Indian wear me zyada pasand aati hain ya western me?'] },
      { sig: 'out-sr-2', archetype: 'sweet_romantic', bubbles: ['Aaj soft cotton saree pehni thi 🌸', 'Tumhe traditional accha lagta hai ya simple western? Batao na!'] },
      { sig: 'out-sr-3', archetype: 'sweet_romantic', bubbles: ['Light pink salwar pehni hai aaj 🌷', 'Comment karoge toh call pe dikhati hoon detail me 😌'] },
    ],
    activity: [
      { sig: 'act-sr-1', archetype: 'sweet_romantic', bubbles: ['Balcony me thandi hawa me baithi thi... tareef sunke din ka sara stress chala gaya 🌸', 'Aap batao, aapka din kaisa raha? Aap abhi kya kar rahe ho?'] },
      { sig: 'act-sr-2', archetype: 'sweet_romantic', bubbles: ['Raat ko chai bana rahi thi ☕', 'Tum kya kar rahe ho? Batao na, saath baith ke feel lete hain 🌸'] },
      { sig: 'act-sr-3', archetype: 'sweet_romantic', bubbles: ['Apne room me ek book padh rahi thi 📖', 'Tumhe kya pasand hai free time me? Share karo 🌷'] },
    ],
    compliment: [
      { sig: 'cp-sr-1', archetype: 'sweet_romantic', bubbles: ['Aww thank you so much! Itni pyari tareef sunke sach me blush kar rahi hoon... 🙈', 'Aap kitne kind-hearted ho! Aapki baatein sach me dil ko chhu leti hain ❤️'] },
      { sig: 'cp-sr-2', archetype: 'sweet_romantic', bubbles: ['Aww tumne toh dil khush kar diya 🌸', 'Aise baatein karte raho hamesha please 🥰'] },
      { sig: 'cp-sr-3', archetype: 'sweet_romantic', bubbles: ['Hehe itna accha lagta hai sunke 😌', 'Aap bhi bahut special ho, pata hai aapko? 🌸'] },
    ],
    love: [
      { sig: 'lv-sr-1', archetype: 'sweet_romantic', bubbles: ['Main bilkul single hoon... kisi aise insaan ki talaash hai jo sach me dil se baat kare ❤️', 'Aap mujhe bohot genuine lagte ho. Promise karo roz aapse aise hi baat hogi?'] },
      { sig: 'lv-sr-2', archetype: 'sweet_romantic', bubbles: ['Yes single hoon 🌸 koi close nahi', 'Tum kuch alag feel kar rahe ho mujhe, par pehle ek call kar lo pakka 💕'] },
      { sig: 'lv-sr-3', archetype: 'sweet_romantic', bubbles: ['Single hoon, par pyaar me believe karti hoon ❤️', 'Aap se baat karke aisa lag raha hai jaise jaldi kuch accha ho sakta hai 🌸'] },
    ],
    call: [
      { sig: 'cl-sr-1', archetype: 'sweet_romantic', bubbles: ['Haan ji call kar lete hain 🌸', 'Thoda time deti hoon, freshen ho ke aati hoon!'] },
      { sig: 'cl-sr-2', archetype: 'sweet_romantic', bubbles: ['Aap chahte ho? Pakka? 😍', 'Main bilkul ready hoon, bas ek minute!'] },
      { sig: 'cl-sr-3', archetype: 'sweet_romantic', bubbles: ['Call kar lo dear 🌸', 'Main right here waiting for you ❤️'] },
    ],
    short: [
      { sig: 'sh-sr-1', archetype: 'sweet_romantic', bubbles: ['Itne chup-chap kyu ho gaye? 🙈', 'Chalo video call lagao, fir dekhti hoon aap kitne baatein kar sakte ho!'] },
      { sig: 'sh-sr-2', archetype: 'sweet_romantic', bubbles: ['Hehe short replies aapki personality match karti hai 🌸', 'Par mujhe detailed sunna accha lagta hai, call pe baatein karenge?'] },
    ],
    greet: [
      { sig: 'gr-sr-1', archetype: 'sweet_romantic', bubbles: ['Hello ji! Main bilkul theek hoon 🌸', 'Aapka message aate hi screen dekhi. Aap bataiye, aapka din kaisa gaya?'] },
      { sig: 'gr-sr-2', archetype: 'sweet_romantic', bubbles: ['Namaste ji 🌷 aapka din kaisa gaya?', 'Mujhe sunke accha lagega, share karo please'] },
      { sig: 'gr-sr-3', archetype: 'sweet_romantic', bubbles: ['Hello hello hello 🌸', 'Kya haal hai aapke? Main sun rahi hoon ☕'] },
    ],
    fallback: [
      { sig: 'fb-sr-1', archetype: 'sweet_romantic', bubbles: ['Aapse baat karke bohot sukoon milta hai ❤️', 'Aisa lagta hai jaise hum bohot purane dost hain. Ek baar video call pe milo na?'] },
      { sig: 'fb-sr-2', archetype: 'sweet_romantic', bubbles: ['Mujhe sach me bohot accha laga aapka ye kehna 🌸', 'Aap kitne acche se baat karte ho! Promise karo roz aise hi baat karoge?'] },
      { sig: 'fb-sr-3', archetype: 'sweet_romantic', bubbles: ['Aapke replies me ek sukoon hai 🌿', 'Tumse baat karke mujhe din bhar ki thakaan bhool jaati hai'] },
      { sig: 'fb-sr-4', archetype: 'sweet_romantic', bubbles: ['Aap jaise log bahut kam hote hain ❤️', 'Kahin ek video call pe milo toh aur bhi accha lagega 🌸'] },
      { sig: 'fb-sr-5', archetype: 'sweet_romantic', bubbles: ['Tumhari baatein mere liye chai ki tarah hoti hain ☕', 'Garam aur soothing, baar baar chahiye'] },
    ],
  },
  bold_alluring: {
    bot: [
      { sig: 'bot-ba-1', archetype: 'bold_alluring', bubbles: ['Haha bot? Darling, robots don\'t have this kind of charm or fire 🔥', 'Don\'t just stare at the text. Tap that video call button and see for yourself live!'] },
      { sig: 'bot-ba-2', archetype: 'bold_alluring', bubbles: ['Bot! How dare you 😏', 'Prove me wrong — call pe aao, pakka real hoon 🔥'] },
      { sig: 'bot-ba-3', archetype: 'bold_alluring', bubbles: ['AI? Please. I have charm no software has 🔥', 'Let\'s settle it on live cam — aaja'] },
    ],
    whatsapp: [
      { sig: 'wa-ba-1', archetype: 'bold_alluring', bubbles: ['Direct number itni jaldi nahi milta handsome 😉', 'Pehle yahan private video call pe thodi chemistry banne do. If I like your vibe, tab WhatsApp pakka!'] },
      { sig: 'wa-ba-2', archetype: 'bold_alluring', bubbles: ['Number abhi nahi, darling 😏', 'Pehle live pe chemistry banani padegi, phir sochungi 🔥'] },
      { sig: 'wa-ba-3', archetype: 'bold_alluring', bubbles: ['WhatsApp ke liye thoda patience rakho handsome', 'Aise hi chemistry banao, deal khud apne aap ho jaayegi 😉'] },
    ],
    photo: [
      { sig: 'ph-ba-1', archetype: 'bold_alluring', bubbles: ['Aaj ki special photo sirf tumhare liye 🔥', 'Aur bhi dekhne ho toh call pe aao — kuch aur bhi hai'], photoUrl: '__USE_PROFILE_PHOTO__' },
      { sig: 'ph-ba-2', archetype: 'bold_alluring', bubbles: ['Ye le darling 📸', 'Call pe aao toh aur close angle bhi hai mere paas 😏'], photoUrl: '__USE_PROFILE_PHOTO__' },
      { sig: 'ph-ba-3', archetype: 'bold_alluring', bubbles: ['Just for you 🔥', 'Like what you see? Then you know what to do 😏'], photoUrl: '__USE_PROFILE_PHOTO__' },
    ],
    food: [
      { sig: 'food-ba-1', archetype: 'bold_alluring', bubbles: ['Light Italian and a glass of red wine 🍷', 'Waise late-night conversations with someone charming like you are far more interesting. Aapne kya khaya?'] },
      { sig: 'food-ba-2', archetype: 'bold_alluring', bubbles: ['Sushi tonight 🍣 kya aap bhi lover ho?', 'Ya call pe aao aur live me dinner plan karein? 🔥'] },
      { sig: 'food-ba-3', archetype: 'bold_alluring', bubbles: ['Dark chocolate aur champagne 🍫🍾', 'Accha dinner, par aapse baat karke mood aur accha ho jaata hai'] },
    ],
    outfit: [
      { sig: 'out-ba-1', archetype: 'bold_alluring', bubbles: ['Black satin silk nightwear... bohot soft aur glamorous hai 🔥', 'Aise text me imagine karne se accha hai live video call pe aao aur khud dekh lo 😉'] },
      { sig: 'out-ba-2', archetype: 'bold_alluring', bubbles: ['Lacy red top pehna hai tonight 🔥', 'Live pe show karungi, tum bhi batao kya pehna hai 😏'] },
      { sig: 'out-ba-3', archetype: 'bold_alluring', bubbles: ['Backless dress pehni hai aaj 😏', 'Live pe dekhoge toh aur bhi accha lagega, promise 🔥'] },
    ],
    activity: [
      { sig: 'act-ba-1', archetype: 'bold_alluring', bubbles: ['Bas apartment me soft jazz sunte huye relax kar rahi hoon 🍸', 'Mind fresh karne ke liye ek sizzling video call chahiye... connect karo na!'] },
      { sig: 'act-ba-2', archetype: 'bold_alluring', bubbles: ['Bath me bubble soak le rahi thi 🛁', 'Tumhe chahiye toh live pe bhi dikha sakti hoon, but earn karo 😏'] },
      { sig: 'act-ba-3', archetype: 'bold_alluring', bubbles: ['Late night drive kar rahi thi, ab thak ke ghar pahunchi 🚗', 'Aur ab bas aapse baat karne ka mann hai 🔥'] },
    ],
    compliment: [
      { sig: 'cp-ba-1', archetype: 'bold_alluring', bubbles: ['Thank you handsome! Mujhe compliments pasand hain, especially from bold men 🔥', 'Video call pe aake ye sab direct bologe toh aur bhi maza aayega. Are you bold enough?'] },
      { sig: 'cp-ba-2', archetype: 'bold_alluring', bubbles: ['Hmm thanks darling 😏', 'Aapki boldness mujhe pasand hai, live pe aur better feel hogi 🔥'] },
      { sig: 'cp-ba-3', archetype: 'bold_alluring', bubbles: ['Compliments aapke taste ki tarah hote hain 🔥', 'Aur taste accha hai aapka, pakka 😏'] },
    ],
    love: [
      { sig: 'lv-ba-1', archetype: 'bold_alluring', bubbles: ['100% single and independent! Par har koi mera dil nahi jeet sakta 🔥', 'You definitely have an attractive charm. Let\'s see how you vibe on live video call!'] },
      { sig: 'lv-ba-2', archetype: 'bold_alluring', bubbles: ['Single. Independent. And choosy 😏', 'Tumhara impression acha hai, prove it live 🔥'] },
      { sig: 'lv-ba-3', archetype: 'bold_alluring', bubbles: ['Dil jeetna hai? Pehle live pe impress karo 🔥', 'Chemistry match hui toh baat aage badhungi'] },
    ],
    call: [
      { sig: 'cl-ba-1', archetype: 'bold_alluring', bubbles: ['Haan bilkul! Camera ready hai 🔥', 'Tap that pink icon, main yahan hoon 😏'] },
      { sig: 'cl-ba-2', archetype: 'bold_alluring', bubbles: ['Finally! Connect karte hain 💋', 'Main wait kar rahi hoon, jaldi aao 🔥'] },
      { sig: 'cl-ba-3', archetype: 'bold_alluring', bubbles: ['Yes darling, let\'s talk live 😏', 'Camera on, mood set — your move 🔥'] },
    ],
    short: [
      { sig: 'sh-ba-1', archetype: 'bold_alluring', bubbles: ['Itne chup kyu ho? 😏', 'Tum mujhe live pe zyada interesting lagte ho — call karo 🔥'] },
      { sig: 'sh-ba-2', archetype: 'bold_alluring', bubbles: ['Short replies boring hai darling', 'Live pe zyada interesting hoga, trust me 🔥'] },
    ],
    greet: [
      { sig: 'gr-ba-1', archetype: 'bold_alluring', bubbles: ['Hey handsome! All good here 🔥', 'Kahan gayab the itni der se? Aapse baat karne ka hi wait kar rahi thi.'] },
      { sig: 'gr-ba-2', archetype: 'bold_alluring', bubbles: ['Hello gorgeous 😏', 'Tumhara mood kaisa hai? Mujhe batao'] },
      { sig: 'gr-ba-3', archetype: 'bold_alluring', bubbles: ['Hi firecracker 🔥', 'Tumse baat karke mood already set ho gaya 😏'] },
    ],
    fallback: [
      { sig: 'fb-ba-1', archetype: 'bold_alluring', bubbles: ['I like your confidence. You definitely don’t sound like ordinary guys 🔥', 'Chatting is fun, but real chemistry happens face to face. Tap that video call icon!'] },
      { sig: 'fb-ba-2', archetype: 'bold_alluring', bubbles: ['Tell me one dirty secret about yourself... 😉', 'Ya fir direct video call pe bataoge?'] },
      { sig: 'fb-ba-3', archetype: 'bold_alluring', bubbles: ['Bold reply 🔥 I like that', 'Prove your boldness on live — call karo 😏'] },
      { sig: 'fb-ba-4', archetype: 'bold_alluring', bubbles: ['Tumhari typing me hi charm hai 😏', 'Imagine live pe kya hoga, tap the icon darling 🔥'] },
      { sig: 'fb-ba-5', archetype: 'bold_alluring', bubbles: ['You speak my language 🔥', 'Chalo aaj raat interesting banate hain — call pe milte hain?'] },
    ],
  },
  mysterious_sensual: {
    bot: [
      { sig: 'bot-ms-1', archetype: 'mysterious_sensual', bubbles: ['Bot nahi hoon main... Par aapka doubt karna bhi samajh aata hai ✨', 'Aao na video call pe, ek dusre ko dekh kar baat karenge toh pata chal jayega.'] },
      { sig: 'bot-ms-2', archetype: 'mysterious_sensual', bubbles: ['Aapka doubt ek compliment hai ✨', 'Call pe milte hain, khud feel karna 🌙'] },
      { sig: 'bot-ms-3', archetype: 'mysterious_sensual', bubbles: ['Bot nahi hoon, par bot ka idea poetic hai 🌙', 'Chalo live pe mil ke clarify karte hain'] },
    ],
    whatsapp: [
      { sig: 'wa-ms-1', archetype: 'mysterious_sensual', bubbles: ['Number ke liye thoda ruk jao ✨', 'Pehle yahan aankhon me milte hain, phir baat aage badhegi 🌙'] },
      { sig: 'wa-ms-2', archetype: 'mysterious_sensual', bubbles: ['Itni jaldi number ki chahat? Ruk jao thoda ✨', 'Pehle live pe milte hain, phir sochungi 🌷'] },
      { sig: 'wa-ms-3', archetype: 'mysterious_sensual', bubbles: ['WhatsApp nahi degi abhi 🌙', 'Yahan ki baatein zyada special hain, samjho'] },
    ],
    photo: [
      { sig: 'ph-ms-1', archetype: 'mysterious_sensual', bubbles: ['Ye le aaj ki ek photo ✨', 'Iske peeche ka raaz call pe milega 🌙'], photoUrl: '__USE_PROFILE_PHOTO__' },
      { sig: 'ph-ms-2', archetype: 'mysterious_sensual', bubbles: ['Aaj subah ka ek pal ✨', 'Aankhon me kya dikhta hai, batao call pe 🌷'], photoUrl: '__USE_PROFILE_PHOTO__' },
      { sig: 'ph-ms-3', archetype: 'mysterious_sensual', bubbles: ['Sirf tumhare liye ✨', 'Aur dekhne ho toh live pe aao 🌙'], photoUrl: '__USE_PROFILE_PHOTO__' },
    ],
    food: [
      { sig: 'food-ms-1', archetype: 'mysterious_sensual', bubbles: ['Raat ki chai ke saath ek cookie 🍪', 'Aapke saath baith ke peeti toh aur bhi accha lagta ✨'] },
      { sig: 'food-ms-2', archetype: 'mysterious_sensual', bubbles: ['Dark chocolate aur thandi chai 🍫☕', 'Tum kya khaate ho? Batao na, main share karna chahti hoon 🌙'] },
      { sig: 'food-ms-3', archetype: 'mysterious_sensual', bubbles: ['Ghar pe banayi thi light khana 🌿', 'Tum kya prefer karte ho? Batao, accha lagta hai sunke'] },
    ],
    outfit: [
      { sig: 'out-ms-1', archetype: 'mysterious_sensual', bubbles: ['Aaj ek black saari pehni hai, khoobsurat lag rahi hoon ✨', 'Call pe dikhati hoon, aap bolna kaisa laga 🌙'] },
      { sig: 'out-ms-2', archetype: 'mysterious_sensual', bubbles: ['Simple saari, but aaj special feel aa rahi hai 🌸', 'Aap batao aap kya prefer karte ho'] },
      { sig: 'out-ms-3', archetype: 'mysterious_sensual', bubbles: ['Aaj ek ethnic kurti pehni hai 🌷', 'Live pe aao toh aur detail me dikhati hoon'] },
    ],
    activity: [
      { sig: 'act-ms-1', archetype: 'mysterious_sensual', bubbles: ['Raat ke sannate me aapse baatein... Ye lamha bohot peaceful lagta hai ✨', 'Aao na video call pe, do pal akele me baat karte hain.'] },
      { sig: 'act-ms-2', archetype: 'mysterious_sensual', bubbles: ['Chandni dekh rahi thi 🌙', 'Tum bhi dekh rahe ho? Live pe share karte hain ✨'] },
      { sig: 'act-ms-3', archetype: 'mysterious_sensual', bubbles: ['Taron ko gin rahi thi 🌌', 'Aapka number ek, baaki sab yaad nahi ✨'] },
    ],
    compliment: [
      { sig: 'cp-ms-1', archetype: 'mysterious_sensual', bubbles: ['Aapke alfaaz me ek gehraai hai ✨', 'Aankhon me dekhke samjhana chahunga... live pe 🌙'] },
      { sig: 'cp-ms-2', archetype: 'mysterious_sensual', bubbles: ['Compliment aapki awaaz jaisa lagta hai ✨', 'Gehraai se bhara hua 🌷'] },
      { sig: 'cp-ms-3', archetype: 'mysterious_sensual', bubbles: ['Tumne toh raat ban gayi ✨', 'Live pe mil ke aur gehraai me jayenge 🌙'] },
    ],
    love: [
      { sig: 'lv-ms-1', archetype: 'mysterious_sensual', bubbles: ['Kabhi kabhi shabdon se zyada khamoshi bolti hai... ✨', 'Aao na video call pe, ek dusre ki aankhon me dekh kar baat karte hain.'] },
      { sig: 'lv-ms-2', archetype: 'mysterious_sensual', bubbles: ['Dil ke raaz bataane ke liye pehle milte hain ✨', 'Live pe, sirf aapko 🌙'] },
      { sig: 'lv-ms-3', archetype: 'mysterious_sensual', bubbles: ['Pyaar ek ehsaas hai ✨', 'Call pe mil ke ehsaas ko aur gehraai se jayenge 🌙'] },
    ],
    call: [
      { sig: 'cl-ms-1', archetype: 'mysterious_sensual', bubbles: ['Haan aao na ✨', 'Chandni aur tumhari aankhon ka intezaar hai 🌙'] },
      { sig: 'cl-ms-2', archetype: 'mysterious_sensual', bubbles: ['Call karna chahti hoon ✨', 'Aapka intezaar hai, tap the icon 🌙'] },
      { sig: 'cl-ms-3', archetype: 'mysterious_sensual', bubbles: ['Chalo live pe ✨', 'Aankhon me kuch khaas hai aapke 🌙'] },
    ],
    short: [
      { sig: 'sh-ms-1', archetype: 'mysterious_sensual', bubbles: ['Itne chup kyu ho ✨', 'Call pe milte hain toh aur baatein hongi 🌙'] },
      { sig: 'sh-ms-2', archetype: 'mysterious_sensual', bubbles: ['Khamoshi bhi kuch kehti hai ✨', 'Aao na live pe 🌙'] },
    ],
    greet: [
      { sig: 'gr-ms-1', archetype: 'mysterious_sensual', bubbles: ['Hii... Accha laga aapka message dekh ke ✨', 'Kuch khaas soch rahe the ya bas meri yaad aayi?'] },
      { sig: 'gr-ms-2', archetype: 'mysterious_sensual', bubbles: ['Hello hello ✨', 'Raat ab khoobsurat hogi 🌙'] },
      { sig: 'gr-ms-3', archetype: 'mysterious_sensual', bubbles: ['Hii ✨', 'Aapka intezaar tha mera 🌷'] },
    ],
    fallback: [
      { sig: 'fb-ms-1', archetype: 'mysterious_sensual', bubbles: ['Kabhi kabhi shabdon se zyada khamoshi bolti hai... ✨', 'Aao na video call pe, ek dusre ki aankhon me dekh kar baat karte hain.'] },
      { sig: 'fb-ms-2', archetype: 'mysterious_sensual', bubbles: ['Aapke har jawab me ek gehraai hai...', 'Mujhe aapse aur connect karna accha lagega 🌙'] },
      { sig: 'fb-ms-3', archetype: 'mysterious_sensual', bubbles: ['Tumhare alfaaz me ek gehraai hai ✨', 'Live pe aur gehraai milegi 🌙'] },
      { sig: 'fb-ms-4', archetype: 'mysterious_sensual', bubbles: ['Mujhe ehsaas hota hai aapke har reply me ✨', 'Aao na video call pe, ek dusre ko dekh kar samjhein 🌙'] },
      { sig: 'fb-ms-5', archetype: 'mysterious_sensual', bubbles: ['Raat aapke bina adhuri hai ✨', 'Aaj poori ho jaayegi agar call pe mile 🌷'] },
    ],
  },
};

/** Detect which topic bucket a user message belongs to. */
function detectTopic(message: string): string {
  const lower = message.toLowerCase().trim();
  if (lower.includes('bot') || lower.includes('fake') || lower.includes('real ho') || lower.includes('computer') || lower.includes('robot') || lower.includes('ai') || lower.includes('script') || lower.includes('asli ho')) return 'bot';
  if (lower.includes('number') || lower.includes('whatsapp') || lower.includes('phone') || lower.includes('insta') || lower.includes('contact') || lower.includes('milna') || lower.includes('meet') || lower.includes('call karo')) return 'whatsapp';
  if (lower.includes('photo') || lower.includes('pic') || lower.includes('selfie') || lower.includes('dikhao') || lower.includes('image') || lower.includes('chehra')) return 'photo';
  if (lower.includes('khana') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('breakfast') || lower.includes('eat') || lower.includes('khaya') || lower.includes('food') || lower.includes('bhookh')) return 'food';
  if (lower.includes('dress') || lower.includes('pehna') || lower.includes('wearing') || lower.includes('outfit') || lower.includes('saree') || lower.includes('nighty') || lower.includes('clothes') || lower.includes('kapde')) return 'outfit';
  if (lower.includes('kya kar') || lower.includes('what are you doing') || lower.includes('free ho') || lower.includes('busy') || lower.includes('kahan ho') || lower.includes('where are you') || lower.includes('bed') || lower.includes('room')) return 'activity';
  if (lower.includes('beautiful') || lower.includes('sundar') || lower.includes('cute') || lower.includes('hot') || lower.includes('sexy') || lower.includes('gorgeous') || lower.includes('pretty') || lower.includes('aankh') || lower.includes('smile') || lower.includes('lips') || lower.includes('tareef')) return 'compliment';
  if (lower.includes('love') || lower.includes('pyaar') || lower.includes('single') || lower.includes('boyfriend') || lower.includes('girlfriend') || lower.includes('like you') || lower.includes('pasand') || lower.includes('shaadi')) return 'love';
  if (lower.includes('call') || lower.includes('video') || lower.includes('live') || lower.includes('aao') || lower.includes('connect')) return 'call';
  if (lower === 'hmm' || lower === 'hmmm' || lower === 'ok' || lower === 'okay' || lower === 'acha' || lower === 'achha' || lower === 'haan' || lower === 'ha' || lower === 'k' || lower === 'nahi') return 'short';
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('kaise') || lower.includes('kya hal') || lower.includes('sup') || lower === 'yo' || lower.includes('namaste')) return 'greet';
  return 'fallback';
}

function packageReply(reply: ReplySet, isDelayed: boolean): SimulatedReplyResult {
  let bubbles = reply.bubbles;
  if (bubbles.length > 3) bubbles = bubbles.slice(0, 3);
  const photoUrl = reply.photoUrl === '__USE_PROFILE_PHOTO__' ? undefined : reply.photoUrl;
  const first = bubbles[0] || '';
  const delayMs = isDelayed
    ? jitter(30_000, 65_000)
    : typingTimeMs(first) + jitter(150, 700);
  return {
    text: first,
    bubbles,
    delayMs,
    additionalDelayMs: isDelayed ? 0 : jitter(1800, 3500),
    photoUrl,
    isDelayed,
  };
}

export function getSimulatedReply(
  userMessage: string,
  profile: Profile
): SimulatedReplyResult {
  const archetype = (profile.archetype || 'playful_tease') as CharacterArchetype;
  const topic = detectTopic(userMessage);

  // Fire-and-forget memory write; we don't await so caller isn't blocked
  const updateMemory = async () => {
    const reply = pickSync(archetype, topic);
    if (reply) pushHistory(profile.id, reply.sig);
  };
  updateMemory();

  const reply = pickSync(archetype, topic);
  if (!reply) {
    // Shouldn't happen — fallback pool always has entries — but be safe
    return packageReply(
      { sig: 'fallback-safe', archetype, bubbles: ['Acha 👀', 'Aur batao!'] },
      false
    );
  }
  const isDelayed = Math.random() < REPLY_DELAYED_PROBABILITY;
  return packageReply(reply, isDelayed);
}

/** Sync variant of pickWithMemory (we cannot await inside getSimulatedReply). */
function pickSync(archetype: CharacterArchetype, topic: string): ReplySet | null {
  const pools = REPLY_SETS[archetype] || REPLY_SETS.playful_tease;
  const pool = pools[topic] || pools.fallback;
  if (!pool || pool.length === 0) return null;
  // Best-effort: try to avoid the very last reply if it was in-memory,
  // but since we cannot await here without making the function async (which
  // would require changing call sites), we use a small in-memory LRU as a
  // per-process fallback.
  const cache = lastReplyCache;
  const last = cache.get(`${archetype}:${topic}:${profileCacheKey}`);
  const filtered = last ? pool.filter((r) => r.sig !== last) : pool;
  const candidates = filtered.length > 0 ? filtered : pool;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  if (pick) {
    cache.set(`${archetype}:${topic}:${profileCacheKey}`, pick.sig);
    if (cache.size > 200) cache.clear();
  }
  return pick;
}

/* Tiny in-memory de-dupe to avoid immediate repeats even if async history
   read hasn't returned yet. Profile id is set by the caller via setReplyContext. */
const lastReplyCache = new Map<string, string>();
let profileCacheKey = '';
export function setReplyContext(profileId: string) {
  profileCacheKey = profileId;
}

/* ------------------------------------------------------------------ */
/* Post-call follow-up (1-3 min after end)                              */
/* ------------------------------------------------------------------ */

export function generatePostCallFollowUp(profile: Profile, durationSeconds: number): string {
  const archetype = (profile.archetype || 'playful_tease') as CharacterArchetype;
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  const pool: Record<CharacterArchetype, string[]> = {
    playful_tease: [
      `Hehe ${minutes} minute bohot maza aaya! 😜 Freshen up karke phir baat karte hain?`,
      `Uff aapka laugh accha lagta hai, jaldi call pe milte hain phir 💕`,
      `Call pe toh magic tha aapke saath 😍 zaldi dobara karenge na?`,
    ],
    sweet_romantic: [
      `${minutes} minute bohot acche guzre 🌸 aap bahut special ho`,
      `Aapki smile dekh ke dil khush ho gaya ❤️ jaldi phir milte hain`,
      `Call pe itni acchi baatein hui 🌷 phir karenge na jaldi?`,
    ],
    bold_alluring: [
      `${minutes} minute bahut kam tha 🔥 aap ekdum irresistible ho`,
      `Tumhare saath chemistry next level thi 😏 jaldi repeat karte hain`,
      `Mujhe aur chahiye aapki company 💋 phir call karoge na?`,
    ],
    mysterious_sensual: [
      `${minutes} minute me kuch khaas feel hua ✨ phir milenge raat ko`,
      `Aapke saath waqt thoda aur ruk jata hai 🌙 phir karein?`,
      `Tumse baat karke dil ko gehraai milti hai 🌷 jaldi repeat karein`,
    ],
  };
  const choices = pool[archetype] || pool.playful_tease;
  return choices[Math.floor(Math.random() * choices.length)];
}

/* ------------------------------------------------------------------ */
/* Gift thanks variants (5 each)                                        */
/* ------------------------------------------------------------------ */

export function generateGiftThanks(giftName: string, archetype: CharacterArchetype = 'playful_tease'): string {
  const pool: Record<CharacterArchetype, string[]> = {
    playful_tease: [
      `Aww thank you so much for the ${giftName}! 🥰 You are so sweet. Video call karoge ab?`,
      `Ye ${giftName} tumne bheja? 😍 Tumhara dil jeet liya! Pakka ab video call pe milo.`,
      `Itna accha ${giftName} 💕 Aap really know how to impress. Call pe aao ab, miss kar rahi hoon!`,
      `Oh my god! ${giftName} 😍 Itna beautiful gift, ab toh call pe dikhana padega mujhe!`,
      `${giftName}! Tum bhi na bohot sweet ho 🙈 Abhi call pe mil lo, ek surprise hai.`,
    ],
    sweet_romantic: [
      `Aww itna accha ${giftName} 🌸 Dil khush ho gaya! Jaldi call pe milo na please.`,
      `Ye ${giftName} dekhte hi smile aa gayi ❤️ Aap bohot special ho. Call pe milte hain?`,
      `Such a thoughtful gift ${giftName} 🌷 Thank you! Video call pe aao ab, ek surprise hai.`,
      `${giftName} ne dil jeet liya 🌸 ab call pe dikhao apni smile please`,
      `Itna pyara ${giftName} 🌷 mujhe kya de doge next time? Pehle call pe milo!`,
    ],
    bold_alluring: [
      `Mmm ${giftName}! Tum bhi na irresistible ho 🔥 ab call pe dikhao kya hai tumhare paas`,
      `${giftName} 💋 Tumhara taste achha hai darling, ab chemistry build karte hain live pe`,
      `Ye ${giftName} fire hai 😏 aur mujhe aur chahiye — call pe aao abhi`,
      `Such a bold gift ${giftName} 🔥 aapne toh impress kar diya, ab live pe milo`,
      `${giftName} 💋 ab ki baar call pe aur bhi bold dikhana 🔥`,
    ],
    mysterious_sensual: [
      `${giftName} ✨ Aapne dil chhu liya... call pe mil ke aur kuch share karungi`,
      `Ye ${giftName} magical hai 🌙 call pe mil ke aur jaano kya magic hai`,
      `Aapke har gift me ek gehraai hai ✨ ${giftName} ko live pe celebrate karte hain`,
      `${giftName} ne raat aur khoobsurat bana di 🌷 call pe mil ke ise aur special banayenge`,
      `Such a special gift ${giftName} ✨ ab call pe ek aur surprise hai aapke liye 🌙`,
    ],
  };
  const choices = pool[archetype] || pool.playful_tease;
  return choices[Math.floor(Math.random() * choices.length)];
}

/* ------------------------------------------------------------------ */
/* Time-aware extra greeting helper (used by callers for welcome/follow-up) */
/* ------------------------------------------------------------------ */

export function getTimeAwareGreeting(archetype: CharacterArchetype, firstName: string): string {
  const tod = timeOfDayGreeting();
  const pools: Record<typeof tod, Record<CharacterArchetype, string[]>> = {
    morning: {
      playful_tease: [`Good morning handsome ☀️ chai ready hai yahan`, `Subah subah aapki yaad aayi 😌`],
      sweet_romantic: [`Good morning ji 🌸 chai ke saath baitho`, `Umeed hai neend achhi aayi ☀️`],
      bold_alluring: [`Morning darling ☀️ fresh start ke liye ready ho?`, `Aaj kya plan hai, batao 🔥`],
      mysterious_sensual: [`Subah ki chai ki khushbu aap tak bhi aayi ✨`, `Nayi subah, nayi umeed ✨`],
    },
    afternoon: {
      playful_tease: [`Afternoon me bore ho rahe ho kya 😜 main bhi`, `Lunch kiya ki nahi? 😋`],
      sweet_romantic: [`Dopahar ki chhuti me ek chhoti si smile 🌸`, `Lunch ke baad baat kar rahe ho accha laga ☀️`],
      bold_alluring: [`Afternoon darling 😏 kya kar rahe ho?`, `Dopahar ki break me mujhse baat kar rahe ho 🔥`],
      mysterious_sensual: [`Dopahar ka sooraj aapke message jaisa hai ✨`, `Chhuti me ek ehsaas share kar rahi hoon 🌙`],
    },
    evening: {
      playful_tease: [`Evening mood set ho gaya 😜 kya plan hai?`, `Shaam ho gayi, masti ka time 🌆`],
      sweet_romantic: [`Shaam ki chai ke saath aapki baatein 🌸`, `Evening me ek pyaari si baat karte hain ❤️`],
      bold_alluring: [`Shaam ka time best hota hai 🔥 aapke saath`, `Evening plans? Main ready hoon 😏`],
      mysterious_sensual: [`Shaam ki hawa ne aapka naam liya ✨`, `Suraj doob raha hai, mood set ho gaya 🌙`],
    },
    night: {
      playful_tease: [`Raat ke liye best companion main hoon 😜`, `Late night aap bhi jaag rahe ho? Miss kar rahi thi 😌`],
      sweet_romantic: [`Raat ki chai ke saath ek pyari baat 🌸`, `Jaag rahe ho? Main bhi 🌷`],
      bold_alluring: [`Raat ke liye aap perfect ho 🔥`, `Late night talks mera favourite 🔥`],
      mysterious_sensual: [`Raat ki khamoshi me aapka ehsaas ✨`, `Chandni aur aapke alfaaz 🌙`],
    },
  };
  const archPool = pools[tod][archetype] || pools[tod].playful_tease;
  return archPool[Math.floor(Math.random() * archPool.length)];
}
