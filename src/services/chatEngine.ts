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
}

const CHAT_STORAGE_PREFIX = '@dreamdate_chat_history_v4_';
const ACTIVE_THREADS_KEY = '@dreamdate_active_chat_threads_v4';

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

  // Authentic, human-like initial openers per archetype
  let initialMsg1 = `Heyyy handsome! Main ${firstName} 😜`;
  let initialMsg2 = 'Aapki profile dekhi toh raha nahi gaya... waise itne cute real me ho ya photos me hi? 🙈';

  if (archetype === 'bold_alluring') {
    initialMsg1 = `Hey... ${firstName} here 🔥`;
    initialMsg2 = 'Finally found someone with an irresistible vibe tonight. What are you up to?';
  } else if (archetype === 'sweet_romantic') {
    initialMsg1 = `Namaste ji 🌸 Main ${firstName}.`;
    initialMsg2 = 'Kaise hain aap? Umeed hai aapka din bohot pyara guzra hoga! Aapse baat karke accha laga.';
  } else if (archetype === 'mysterious_sensual') {
    initialMsg1 = `Hi there... ${firstName} here ✨`;
    initialMsg2 = 'Raat ki khamoshi me aapki smile ne dhyan khich liya... Kuch khas dhoondh rahe ho ya sirf acchi baatein?';
  }

  const initialMessages: ChatMessage[] = [
    {
      id: `msg-init-1-${profileId}`,
      sender: 'profile',
      text: initialMsg1,
      timestamp: Date.now() - 1000 * 60 * 3,
      status: 'read',
    },
    {
      id: `msg-init-2-${profileId}`,
      sender: 'profile',
      text: initialMsg2,
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

    // Update active threads index
    const raw = await AsyncStorage.getItem(ACTIVE_THREADS_KEY);
    const existingIds: string[] = raw ? JSON.parse(raw) : [];
    if (!existingIds.includes(profileId)) {
      existingIds.push(profileId);
      await AsyncStorage.setItem(ACTIVE_THREADS_KEY, JSON.stringify(existingIds));
    }
  } catch (e) {}
}

/**
 * Returns real chat threads stored on this device (Zero fake mock seeding)
 */
export async function getActiveChatThreads(): Promise<ChatThreadItem[]> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_THREADS_KEY);
    const profileIds: string[] = raw ? JSON.parse(raw) : [];

    // Clean install returns an empty list without fake injection
    if (profileIds.length === 0) {
      return [];
    }

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

    // Sort by most recent interaction
    return threads.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    return [];
  }
}

/**
 * Super-Realistic, Context-Aware Multi-Bubble Conversational AI Engine (10/10 Realism)
 * Natural Hinglish + English banter, witty defenses, emotional warmth, photo attachments,
 * and realistic typing cadence.
 */
export function getSimulatedReply(
  userMessage: string,
  profile: Profile
): SimulatedReplyResult {
  const lower = userMessage.toLowerCase().trim();
  const firstName = profile.name.split(' ')[0];
  const archetype = profile.archetype || 'playful_tease';

  // Helper to package response
  const packageReply = (bubbles: string[], delayMs = 1200, photoUrl?: string): SimulatedReplyResult => ({
    text: bubbles[0],
    bubbles,
    delayMs,
    additionalDelayMs: 1400,
    photoUrl,
  });

  // 1. SKEPTICISM / BOT / FAKE ACCUSATION DEFENSE (Ultra-authentic Indian female human reaction)
  if (
    lower.includes('bot') ||
    lower.includes('fake') ||
    lower.includes('real ho') ||
    lower.includes('computer') ||
    lower.includes('robot') ||
    lower.includes('ai') ||
    lower.includes('script') ||
    lower.includes('asli ho')
  ) {
    if (archetype === 'playful_tease') {
      return packageReply([
        `Arre re bot kisko bola?! 😂 Kasam se bilkul real ladki hoon!`,
        `Aise pyare witty replies koi AI de sakta hai kya? Vishwas nahi hai toh abhi video call lagao, live camera pe smile dikhaati hoon! 😜`,
      ], 1100);
    }
    if (archetype === 'bold_alluring') {
      return packageReply([
        `Haha bot? Darling, robots don't have this kind of charm or fire 🔥`,
        `Don't just stare at the text. Tap that video call button and see for yourself live!`,
      ], 1100);
    }
    if (archetype === 'sweet_romantic') {
      return packageReply([
        `Haww! Itne acche se baat kar rahi hoon aur aap mujhe bot bol rahe ho? 🙈`,
        `Main sach me real hoon ji. Agar doubt hai toh chalo do minute video call pe baat kar lete hain!`,
      ], 1200);
    }
    return packageReply([
      `Bot nahi hoon main... Par aapka doubt karna bhi samajh aata hai ✨`,
      `Aao na video call pe, ek dusre ko dekh kar baat karenge toh pata chal jayega.`,
    ], 1200);
  }

  // 2. WHATSAPP / PHONE NUMBER / INSTAGRAM / MEET REQUEST
  if (
    lower.includes('number') ||
    lower.includes('whatsapp') ||
    lower.includes('phone') ||
    lower.includes('insta') ||
    lower.includes('contact') ||
    lower.includes('milna') ||
    lower.includes('meet') ||
    lower.includes('call karo')
  ) {
    if (archetype === 'bold_alluring') {
      return packageReply([
        `Direct number itni jaldi nahi milta handsome 😉`,
        `Pehle yahan private video call pe thodi chemistry banne do. If I like your vibe, tab WhatsApp pakka!`,
      ], 1300);
    }
    if (archetype === 'sweet_romantic') {
      return packageReply([
        `Aap bohot sweet ho, par pehle yahan video call pe thoda comfort ban jaaye? 🌸`,
        `Mujhe thoda sharam aati hai aise direct number share karne me... Pehle call pe thoda jaan lein ek doosre ko?`,
      ], 1400);
    }
    return packageReply([
      `Hehe number maangne me bohot fast ho aap! 🙈`,
      `Pehle video call pe apni cute smile dikhao na mujhe, fir dekhti hoon deal pakki karni hai ya nahi! 😜`,
    ], 1300);
  }

  // 3. PHOTO / PIC / SELFIE REQUESTS (Sends actual photo from her gallery!)
  if (
    lower.includes('photo') ||
    lower.includes('pic') ||
    lower.includes('selfie') ||
    lower.includes('dikhao') ||
    lower.includes('image') ||
    lower.includes('chehra')
  ) {
    const photoToSend = profile.photos?.[0] || profile.avatar;
    return packageReply(
      [
        `Hehe ruko... abhi thodi der pehle hi ek photo li thi 📸`,
        `Kaisi lagi? Par sach batau toh 2D photo se zyada maza video call pe real-time dekhne me aayega! 😉`,
      ],
      1400,
      photoToSend
    );
  }

  // 4. FOOD / DINNER / MEALS
  if (
    lower.includes('khana') ||
    lower.includes('dinner') ||
    lower.includes('lunch') ||
    lower.includes('breakfast') ||
    lower.includes('eat') ||
    lower.includes('khaya') ||
    lower.includes('food') ||
    lower.includes('bhookh')
  ) {
    if (archetype === 'sweet_romantic') {
      return packageReply([
        `Haanji, bas abhi dinner khatam kiya tha! 🌸`,
        `Aapne time se khana khaya ya kaam me busy the? Apna khayal rakha karo please!`,
      ], 1200);
    }
    if (archetype === 'bold_alluring') {
      return packageReply([
        `Light Italian and a glass of red wine 🍷`,
        `Waise late-night conversations with someone charming like you are far more interesting. Aapne kya khaya?`,
      ], 1300);
    }
    return packageReply([
      `Maine toh biryani mangwayi thi, bohot yummy thi! 😋`,
      `Aapne khaya? Sach sach bataana mere bina akele akele mast khana kha liya na? 😜`,
    ], 1200);
  }

  // 5. OUTFIT / DRESS / WHAT ARE YOU WEARING
  if (
    lower.includes('dress') ||
    lower.includes('pehna') ||
    lower.includes('wearing') ||
    lower.includes('outfit') ||
    lower.includes('saree') ||
    lower.includes('nighty') ||
    lower.includes('clothes') ||
    lower.includes('kapde')
  ) {
    if (archetype === 'bold_alluring') {
      return packageReply([
        `Black satin silk nightwear... bohot soft aur glamorous hai 🔥`,
        `Aise text me imagine karne se accha hai live video call pe aao aur khud dekh lo 😉`,
      ], 1300);
    }
    if (archetype === 'sweet_romantic') {
      return packageReply([
        `Ek simple pink floral kurti pehni hai, mujhe traditional outfits bohot pasand hain 🌸`,
        `Aapko ladkiyan Indian wear me zyada pasand aati hain ya western me?`,
      ], 1300);
    }
    return packageReply([
      `Cute comfy crop top and shorts pehna hai! Hehe bataungi nahi kaisa lag raha hai 😜`,
      `Upar video call button hai, tap karo toh hi live dekhne milega! Deal?`,
    ], 1200);
  }

  // 6. WHAT ARE YOU DOING / LOCATION / WORK
  if (
    lower.includes('kya kar') ||
    lower.includes('what are you doing') ||
    lower.includes('free ho') ||
    lower.includes('busy') ||
    lower.includes('kahan ho') ||
    lower.includes('where are you') ||
    lower.includes('bed') ||
    lower.includes('room')
  ) {
    if (archetype === 'playful_tease') {
      return packageReply([
        `Apne room me bed pe aaram se leti hoon, aapse chat kar rahi hoon 🛋️`,
        `Waise thoda bore ho rahi thi, accha hua aapne message kiya! Chalo video call pe thodi masti karein?`,
      ], 1200);
    }
    if (archetype === 'bold_alluring') {
      return packageReply([
        `Bas apartment me soft jazz sunte huye relax kar rahi hoon 🍸`,
        `Mind fresh karne ke liye ek sizzling video call chahiye... connect karo na!`,
      ], 1200);
    }
    if (archetype === 'sweet_romantic') {
      return packageReply([
        `Balcony me thandi hawa me baithi thi... tareef sunke din ka sara stress chala gaya 🌸`,
        `Aap batao, aapka din kaisa raha? Aap abhi kya kar rahe ho?`,
      ], 1300);
    }
    return packageReply([
      `Raat ke sannate me aapse baatein... Ye lamha bohot peaceful lagta hai ✨`,
      `Aao na video call pe, do pal akele me baat karte hain.`,
    ], 1300);
  }

  // 7. COMPLIMENTS (Beauty, cute, hot, sexy, beautiful, smile)
  if (
    lower.includes('beautiful') ||
    lower.includes('sundar') ||
    lower.includes('cute') ||
    lower.includes('hot') ||
    lower.includes('sexy') ||
    lower.includes('gorgeous') ||
    lower.includes('pretty') ||
    lower.includes('aankh') ||
    lower.includes('smile') ||
    lower.includes('lips') ||
    lower.includes('tareef')
  ) {
    if (archetype === 'sweet_romantic') {
      return packageReply([
        `Aww thank you so much! Itni pyari tareef sunke sach me blush kar rahi hoon... 🙈`,
        `Aap kitne kind-hearted ho! Aapki baatein sach me dil ko chhu leti hain ❤️`,
      ], 1200);
    }
    if (archetype === 'bold_alluring') {
      return packageReply([
        `Thank you handsome! Mujhe compliments pasand hain, especially from bold men 🔥`,
        `Video call pe aake ye sab direct bologe toh aur bhi maza aayega. Are you bold enough?`,
      ], 1200);
    }
    return packageReply([
      `Uff itna makkhan mat lagao! 😂 Par sach kahu toh sunke accha laga.`,
      `Ab itni tareef ki hai toh live video call pe meri smile dekh bhi lo na! 😉`,
    ], 1100);
  }

  // 8. LOVE / SINGLE / BOYFRIEND / DATING
  if (
    lower.includes('love') ||
    lower.includes('pyaar') ||
    lower.includes('single') ||
    lower.includes('boyfriend') ||
    lower.includes('girlfriend') ||
    lower.includes('like you') ||
    lower.includes('pasand') ||
    lower.includes('shaadi')
  ) {
    if (archetype === 'sweet_romantic') {
      return packageReply([
        `Main bilkul single hoon... kisi aise insaan ki talaash hai jo sach me dil se baat kare ❤️`,
        `Aap mujhe bohot genuine lagte ho. Promise karo roz aapse aise hi baat hogi?`,
      ], 1300);
    }
    if (archetype === 'bold_alluring') {
      return packageReply([
        `100% single and independent! Par har koi mera dil nahi jeet sakta 🔥`,
        `You definitely have an attractive charm. Let’s see how you vibe on live video call!`,
      ], 1300);
    }
    return packageReply([
      `Hehe itni jaldi propose kar rahe ho? 🙈`,
      `Pehle acche dost bante hain video call pe, fir aage ka dekhte hain! Deal manzoor hai? 😜`,
    ], 1200);
  }

  // 9. VIDEO CALL / CALL MENTIONS
  if (
    lower.includes('call') ||
    lower.includes('video') ||
    lower.includes('live') ||
    lower.includes('aao') ||
    lower.includes('connect')
  ) {
    return packageReply([
      `Haan bilkul! Main camera on karke ready hoon 💖`,
      `Upar jo Video Call button hai uspe tap karo, abhi connect karte hain face to face!`,
    ], 1000);
  }

  // 10. SHORT / CASUAL ONE-WORD REPLIES (Hmm, ok, acha, haan, theek hai)
  if (
    lower === 'hmm' ||
    lower === 'hmmm' ||
    lower === 'ok' ||
    lower === 'okay' ||
    lower === 'acha' ||
    lower === 'achha' ||
    lower === 'haan' ||
    lower === 'ha' ||
    lower === 'k' ||
    lower === 'nahi'
  ) {
    if (archetype === 'playful_tease') {
      return packageReply([
        `Sirf "${lower}"? Itne kanjoos kyu ho shabdon me! 😂`,
        `Mujhse baat karne me boring lag raha hai kya? Kuch mazedaar bolo na! 😜`,
      ], 1000);
    }
    return packageReply([
      `Itne chup-chap kyu ho gaye? 🙈`,
      `Chalo video call lagao, fir dekhti hoon aap kitne baatein kar sakte ho!`,
    ], 1100);
  }

  // 11. GREETINGS (Hi, Hello, Hey, Kaise ho)
  if (
    lower.includes('hi') ||
    lower.includes('hello') ||
    lower.includes('hey') ||
    lower.includes('kaise') ||
    lower.includes('kya hal') ||
    lower.includes('sup') ||
    lower === 'yo' ||
    lower.includes('namaste')
  ) {
    if (archetype === 'sweet_romantic') {
      return packageReply([
        `Hello ji! Main bilkul theek hoon 🌸`,
        `Aapka message aate hi screen dekhi. Aap bataiye, aapka din kaisa gaya?`,
      ], 1100);
    }
    if (archetype === 'bold_alluring') {
      return packageReply([
        `Hey handsome! All good here 🔥`,
        `Kahan gayab the itni der se? Aapse baat karne ka hi wait kar rahi thi.`,
      ], 1100);
    }
    if (archetype === 'mysterious_sensual') {
      return packageReply([
        `Hii... Accha laga aapka message dekh ke ✨`,
        `Kuch khaas soch rahe the ya bas meri yaad aayi?`,
      ], 1200);
    }
    return packageReply([
      `Hii handsome! Ekdum mast hoon 😜`,
      `Aap batao, aaj kiska dil tod ke aaye ho?`,
    ], 1100);
  }

  // 12. NATURAL FALLBACK (Context-rich banter, never robotic)
  const fallbacks: Record<CharacterArchetype, [string, string][]> = {
    playful_tease: [
      [
        `Aap bohot witty ho sach me! Typing me maza toh aa raha hai...`,
        `Par bol ke baat karne ka alag hi maza hai. Video call kab karoge handsome? 😉`,
      ],
      [
        `Hehe sach batao, aap sabhi ladkiyon se aise hi charming baatein karte ho ya sirf mere sath? 😜`,
        `Mujhe lagta hai aap bohot shaitaan ho!`,
      ],
      [
        `Aapki baaton se lagta hai aapke sath bore hona impossible hai! 😂`,
        `Aao na video call pe, do minute live gossip karte hain!`,
      ],
    ],
    sweet_romantic: [
      [
        `Aapse baat karke bohot sukoon milta hai ❤️`,
        `Aisa lagta hai jaise hum bohot purane dost hain. Ek baar video call pe milo na?`,
      ],
      [
        `Mujhe sach me bohot accha laga aapka ye kehna 🌸`,
        `Aap kitne acche se baat karte ho! Promise karo roz aise hi baat karoge?`,
      ],
    ],
    bold_alluring: [
      [
        `I like your confidence. You definitely don’t sound like ordinary guys 🔥`,
        `Chatting is fun, but real chemistry happens face to face. Tap that video call icon!`,
      ],
      [
        `Tell me one dirty secret about yourself... 😉`,
        `Ya fir direct video call pe bataoge?`,
      ],
    ],
    mysterious_sensual: [
      [
        `Kabhi kabhi shabdon se zyada khamoshi bolti hai... ✨`,
        `Aao na video call pe, ek dusre ki aankhon me dekh kar baat karte hain.`,
      ],
      [
        `Aapke har jawab me ek gehraai hai...`,
        `Mujhe aapse aur connect karna accha lagega 🌙`,
      ],
    ],
  };

  const pool = fallbacks[archetype] || fallbacks.playful_tease;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return packageReply(picked, 1300);
}
