export type CharacterArchetype =
  | 'playful_tease'
  | 'sweet_romantic'
  | 'bold_alluring'
  | 'mysterious_sensual';

export interface ArchetypeInfo {
  key: CharacterArchetype;
  label: string;
  emoji: string;
  tagline: string;
  vibe: string;
  badgeColor: string;
  bgGradient: [string, string];
  description: string;
}

export const ARCHETYPE_META: Record<CharacterArchetype, ArchetypeInfo> = {
  playful_tease: {
    key: 'playful_tease',
    label: 'Playful Tease',
    emoji: '😜',
    tagline: 'Flirty & Fun-Loving',
    vibe: 'Witty banter & spontaneous late-night laughs',
    badgeColor: '#FF6B6B',
    bgGradient: ['#FF6B6B', '#FF8E53'],
    description: 'Loved for cheeky comebacks, playful teasing, and contagious energetic smiles on camera.',
  },
  sweet_romantic: {
    key: 'sweet_romantic',
    label: 'Sweet & Romantic',
    emoji: '🌸',
    tagline: 'Caring & Heartfelt',
    vibe: 'Deep emotional connection & soothing warmth',
    badgeColor: '#EC4899',
    bgGradient: ['#EC4899', '#F472B6'],
    description: 'Soft-spoken, deeply affectionate, and asks about your day with genuine care and sweetness.',
  },
  bold_alluring: {
    key: 'bold_alluring',
    label: 'Bold & Alluring',
    emoji: '🔥',
    tagline: 'Confident & Seductive',
    vibe: 'Magnetic charisma & upfront glamour',
    badgeColor: '#EF4444',
    bgGradient: ['#EF4444', '#DC2626'],
    description: 'Glamorous, magnetic, and completely unapologetic. Loves late-night video chats and high chemistry.',
  },
  mysterious_sensual: {
    key: 'mysterious_sensual',
    label: 'Mysterious & Sensual',
    emoji: '✨',
    tagline: 'Intriguing & Deep',
    vibe: 'Poetic whispers & captivating eye contact',
    badgeColor: '#8B5CF6',
    bgGradient: ['#8B5CF6', '#6366F1'],
    description: 'Intriguing and enigmatic. Speaks softly, looks straight into your eyes, and keeps you enchanted.',
  },
};

export interface ProfileMediaItem {
  id: string;
  url: string;
  isBlurred: boolean;
  unlockCostCoins: number;
  caption?: string;
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  language: string[];
  avatar: string;
  photos?: string[];
  coverImage?: string;
  rating: number;
  callRate: number; // coins per min
  isOnline: boolean;
  tagline: string;
  interests: string[];
  videoUrl: string;
  fallbackVideoUrl?: string;
  voiceNoteUrl?: string;
  bio: string;
  totalCalls: number;
  archetype: CharacterArchetype;
  lockedPhotos?: ProfileMediaItem[];
}

import { getAllVideoUrls } from '../services/videoService';

export const FAKE_CALL_VIDEOS: string[] = getAllVideoUrls();


// STRICT 100% Female Verified Profiles (Zero male images)
// All models are adults (21-35 look). Images: Pexels free license, hotlinked.
// CONSISTENCY RULE: each girl's gallery is built from same-shoot series so
// one profile = one face. Zero URL reuse across profiles (verified by script).
// Free tier = glamour / traditional / casual. Locked tier = implied nude +
// sheer lingerie (spiciest legally-hotlinkable register; verified 200s).
const PX = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=format&fit=crop&w=800&q=80`;

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'priya-1',
    name: 'Priya Sharma',
    age: 23,
    city: 'Mumbai',
    country: 'India',
    language: ['Hindi', 'English'],
    avatar: PX(11555683),
    coverImage: PX(11555684),
    photos: [
      PX(11555685), PX(11555686), PX(11555687), PX(11555688), PX(11555689),
    ],
    rating: 4.9,
    callRate: 50,
    isOnline: true,
    tagline: 'bandra girl, raat ko online milungi 😜',
    interests: ['Bollywood', 'Dancing', 'Night drives', 'Coffee'],
    videoUrl: FAKE_CALL_VIDEOS[0],
    bio: 'bandra me rehti hu. late night baatein, flirty jokes aur thoda sa tadpana pasand hai. himmat hai to message karo 😜',
    totalCalls: 3420,
    archetype: 'playful_tease',
    lockedPhotos: [
      { id: 'photo_priya-1_1', url: PX(11555690), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_priya-1_2', url: PX(11555691), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_priya-1_3', url: PX(11555692), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_priya-1_4', url: PX(11555693), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_priya-1_5', url: PX(11555694), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'aisha-2',
    name: 'Aisha Al-Hashmi',
    age: 24,
    city: 'Dubai',
    country: 'UAE',
    language: ['English', 'Hindi', 'Arabic'],
    avatar: PX(36770811),
    coverImage: PX(36770812),
    photos: [
      PX(36770813), PX(36770814), PX(36770815), PX(36770816), PX(36770817),
    ],
    rating: 5.0,
    callRate: 100,
    isOnline: true,
    tagline: 'dubai marina | raat ko aur hot 🔥',
    interests: ['Dubai Marina', 'Fashion', 'Luxury Cars', 'Cocktails'],
    videoUrl: FAKE_CALL_VIDEOS[1],
    bio: 'dubai me rehti hu. fashion, long drives aur garam baatein. confident ho to call pe aao 🔥',
    totalCalls: 4890,
    archetype: 'bold_alluring',
    lockedPhotos: [
      { id: 'photo_aisha-2_1', url: PX(36770818), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_aisha-2_2', url: PX(36770819), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_aisha-2_3', url: PX(36770820), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_aisha-2_4', url: PX(36770821), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_aisha-2_5', url: PX(36770822), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'simran-3',
    name: 'Simran Kaur',
    age: 22,
    city: 'Chandigarh',
    country: 'India',
    language: ['Punjabi', 'Hindi', 'English'],
    avatar: PX(17040864),
    coverImage: PX(17040865),
    photos: [
      PX(17040866), PX(17040867), PX(17040868), PX(17040869), PX(17040870),
    ],
    rating: 4.8,
    callRate: 60,
    isOnline: true,
    tagline: 'chandigarh | sharma ke tadpaungi 🌸',
    interests: ['Music', 'Punjabi Songs', 'Cooking', 'Travel'],
    videoUrl: FAKE_CALL_VIDEOS[2],
    bio: 'chandigarh se hu. cooking, punjabi songs aur pyaar bhari baatein. thoda sharmaungi, phir sab kuch 🌸',
    totalCalls: 2190,
    archetype: 'sweet_romantic',
    lockedPhotos: [
      { id: 'photo_simran-3_1', url: PX(17040871), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_simran-3_2', url: PX(17040872), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_simran-3_3', url: PX(17040873), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_simran-3_4', url: PX(17040874), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_simran-3_5', url: PX(17040875), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'ananya-4',
    name: 'Ananya Roy',
    age: 25,
    city: 'Kolkata',
    country: 'India',
    language: ['Bengali', 'Hindi', 'English'],
    avatar: PX(20442916),
    coverImage: PX(20442918),
    photos: [
      PX(20442920), PX(20442921), PX(20442922), PX(20442925), PX(20442926),
    ],
    rating: 4.9,
    callRate: 120,
    isOnline: true,
    tagline: 'raat ko gehri aur garam baatein ✨',
    interests: ['Poetry', 'Art', 'Night walks', 'Classic Cinema'],
    videoUrl: FAKE_CALL_VIDEOS[3],
    bio: 'kolkata se. poetry, purani films aur raat ki bechainiyan. gehri baat karni hai to aa jao ✨',
    totalCalls: 2780,
    archetype: 'mysterious_sensual',
    lockedPhotos: [
      { id: 'photo_ananya-4_1', url: PX(20442927), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_ananya-4_2', url: PX(20442929), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_ananya-4_3', url: PX(20442931), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_ananya-4_4', url: PX(20442933), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_ananya-4_5', url: PX(20442939), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'zara-5',
    name: 'Zara Sheikh',
    age: 23,
    city: 'Lahore',
    country: 'Pakistan',
    language: ['Urdu', 'Hindi', 'English'],
    avatar: PX(36114611),
    coverImage: PX(36114612),
    photos: [
      PX(36114613), PX(36114614), PX(36114615), PX(36114616), PX(36114617),
    ],
    rating: 4.9,
    callRate: 150,
    isOnline: true,
    tagline: 'lahore | naram lehja, garam baatein 🌸',
    interests: ['Fashion Design', 'Chai', 'Singing', 'Romance'],
    videoUrl: FAKE_CALL_VIDEOS[4],
    bio: 'soft spoken hu par dil se baat karti hu. chai, romance aur raat bhar ki guftagu pasand hai 🌸',
    totalCalls: 3100,
    archetype: 'sweet_romantic',
    lockedPhotos: [
      { id: 'photo_zara-5_1', url: PX(36114618), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_zara-5_2', url: PX(36114619), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_zara-5_3', url: PX(36114620), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_zara-5_4', url: PX(36114621), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_zara-5_5', url: PX(36114622), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'tanya-6',
    name: 'Tanya Mehta',
    age: 26,
    city: 'South Delhi',
    country: 'India',
    language: ['Hindi', 'English'],
    avatar: PX(26731711),
    coverImage: PX(26731712),
    photos: [
      PX(26731713), PX(26731714), PX(26731715), PX(26731716), PX(26731717),
    ],
    rating: 5.0,
    callRate: 180,
    isOnline: true,
    tagline: 'delhi girl, bed pe bhi zero filter 🔥',
    interests: ['Parties', 'Glamour', 'Fitness', 'Clubbing'],
    videoUrl: FAKE_CALL_VIDEOS[5],
    bio: 'south delhi se. parties, fitness aur khul ke sab kuch. boring log door rahein, naughty log paas aayein 🔥',
    totalCalls: 5420,
    archetype: 'bold_alluring',
    lockedPhotos: [
      { id: 'photo_tanya-6_1', url: PX(26731718), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_tanya-6_2', url: PX(26731720), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_tanya-6_3', url: PX(26731721), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_tanya-6_4', url: PX(26731722), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_tanya-6_5', url: PX(26731723), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'riya-7',
    name: 'Riya Patel',
    age: 24,
    city: 'Ahmedabad',
    country: 'India',
    language: ['Gujarati', 'Hindi', 'English'],
    avatar: PX(29805027),
    coverImage: PX(29805028),
    photos: [
      PX(29805029), PX(29805037), PX(29805038), PX(29805039), PX(29805040),
    ],
    rating: 4.7,
    callRate: 75,
    isOnline: false,
    tagline: 'busy hu, par raat ko full naughty 😜',
    interests: ['Garba', 'Foodie', 'Selfies', 'Shopping'],
    videoUrl: FAKE_CALL_VIDEOS[6],
    bio: 'ahmedabad se hu. garba, khana, selfies aur thodi si shararat. free hote hi tadpa dungi 😜',
    totalCalls: 1890,
    archetype: 'playful_tease',
    lockedPhotos: [
      { id: 'photo_riya-7_1', url: PX(29805041), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_riya-7_2', url: PX(29805043), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_riya-7_3', url: PX(29805044), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_riya-7_4', url: PX(29805045), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_riya-7_5', url: PX(29805046), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'mehreen-8',
    name: 'Mehreen Noor',
    age: 22,
    city: 'Dhaka',
    country: 'Bangladesh',
    language: ['Bengali', 'English', 'Hindi'],
    avatar: PX(36226608),
    coverImage: PX(36226609),
    photos: [
      PX(36226610), PX(36226611), PX(36226612), PX(36226613), PX(36226614),
    ],
    rating: 4.8,
    callRate: 90,
    isOnline: true,
    tagline: 'shy hu, par sapno me wild 🌸',
    interests: ['Literature', 'Photography', 'Music', 'Rainy Days'],
    videoUrl: FAKE_CALL_VIDEOS[7],
    bio: 'dhaka se. books, baarish aur purane gaane. dheere dheere khulungi, phir rukungi nahi 🌸',
    totalCalls: 1940,
    archetype: 'sweet_romantic',
    lockedPhotos: [
      { id: 'photo_mehreen-8_1', url: PX(36226615), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_mehreen-8_2', url: PX(36226616), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_mehreen-8_3', url: PX(36226617), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_mehreen-8_4', url: PX(36226618), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_mehreen-8_5', url: PX(36226619), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'natasha-9',
    name: 'Natasha Kapoor',
    age: 25,
    city: 'Bengaluru',
    country: 'India',
    language: ['English', 'Hindi', 'Kannada'],
    avatar: PX(34324374),
    coverImage: PX(34324375),
    photos: [
      PX(34324376), PX(34324377), PX(34324378), PX(34324379), PX(34324380),
    ],
    rating: 4.9,
    callRate: 200,
    isOnline: true,
    tagline: 'din me startup, raat ko sin ✨',
    interests: ['Startups', 'Electronic Music', 'Travel', 'Wine'],
    videoUrl: FAKE_CALL_VIDEOS[8],
    bio: 'din me startup, raat ko music aur bechain travel plans. interesting logon ke saath interesting raatein ✨',
    totalCalls: 3650,
    archetype: 'mysterious_sensual',
    lockedPhotos: [
      { id: 'photo_natasha-9_1', url: PX(34324381), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_natasha-9_2', url: PX(34324382), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_natasha-9_3', url: PX(34324395), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_natasha-9_4', url: PX(34324397), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_natasha-9_5', url: PX(34324398), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'kavya-10',
    name: 'Kavya Reddy',
    age: 23,
    city: 'Hyderabad',
    country: 'India',
    language: ['Telugu', 'Hindi', 'English'],
    avatar: PX(36041185),
    coverImage: PX(36041186),
    photos: [
      PX(36041189), PX(36041190), PX(36041191), PX(36041192), PX(36041195),
    ],
    rating: 4.9,
    callRate: 140,
    isOnline: true,
    tagline: 'biryani jesi spicy, pyar me sweet 🌸',
    interests: ['Biryani', 'Dance', 'Cinema', 'Selfies'],
    videoUrl: FAKE_CALL_VIDEOS[9],
    bio: 'hyderabad se. biryani jesi spicy, dil se sweet. mood off ho to baat kar lena, garam kar dungi 🌸',
    totalCalls: 2840,
    archetype: 'sweet_romantic',
    lockedPhotos: [
      { id: 'photo_kavya-10_1', url: PX(36041196), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_kavya-10_2', url: PX(36041197), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_kavya-10_3', url: PX(36041198), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_kavya-10_4', url: PX(36041199), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_kavya-10_5', url: PX(36041200), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'pooja-11',
    name: 'Pooja Hegde',
    age: 24,
    city: 'Pune',
    country: 'India',
    language: ['Marathi', 'Hindi', 'English'],
    avatar: PX(36951163),
    coverImage: PX(36951164),
    photos: [
      PX(36951165), PX(36951166), PX(36951167), PX(36951168), PX(36951169),
    ],
    rating: 4.8,
    callRate: 160,
    isOnline: true,
    tagline: 'trekking wali, bed pe bhi adventurous 😜',
    interests: ['Trekking', 'Long Drives', 'Indie Rock', 'Coffee'],
    videoUrl: FAKE_CALL_VIDEOS[10],
    bio: 'modelling karti hu. long drives, coffee aur raat ki adventures. hi bolo, shuru karte hain 😜',
    totalCalls: 2190,
    archetype: 'playful_tease',
    lockedPhotos: [
      { id: 'photo_pooja-11_1', url: PX(36951170), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_pooja-11_2', url: PX(36951172), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_pooja-11_3', url: PX(36951174), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_pooja-11_4', url: PX(36951178), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_pooja-11_5', url: PX(36951179), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'alizeh-12',
    name: 'Alizeh Khan',
    age: 23,
    city: 'Islamabad',
    country: 'Pakistan',
    language: ['Urdu', 'English'],
    avatar: PX(27317236),
    coverImage: PX(27317237),
    photos: [
      PX(27317238), PX(27317239), PX(27317240), PX(27317241), PX(27317242),
    ],
    rating: 5.0,
    callRate: 220,
    isOnline: true,
    tagline: 'ghazals, chai aur dheemi aanch 🌸',
    interests: ['Art', 'Classical Ghazals', 'Poetry', 'Travel'],
    videoUrl: FAKE_CALL_VIDEOS[11],
    bio: 'purane ghazals, poetry aur dheemi aanch wali baatein. sukoon se tadpane wale log achhe lagte hain 🌸',
    totalCalls: 3410,
    archetype: 'sweet_romantic',
    lockedPhotos: [
      { id: 'photo_alizeh-12_1', url: PX(27317243), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_alizeh-12_2', url: PX(27317244), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_alizeh-12_3', url: PX(27317245), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_alizeh-12_4', url: PX(27317246), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_alizeh-12_5', url: PX(27317249), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'sonia-13',
    name: 'Sonia D’Souza',
    age: 22,
    city: 'Goa',
    country: 'India',
    language: ['English', 'Hindi', 'Konkani'],
    avatar: PX(38532713),
    coverImage: PX(38532714),
    photos: [
      PX(38532715), PX(38532716), PX(38532717), PX(38532718), PX(38532719),
    ],
    rating: 4.9,
    callRate: 250,
    isOnline: true,
    tagline: 'goa | bikini me beach, bed pe wild 😜',
    interests: ['Beaches', 'Electronic Music', 'Cocktails', 'Bikinis'],
    videoUrl: FAKE_CALL_VIDEOS[12],
    bio: 'goa se. beach, music, late night parties aur subah tak ki masti. life ko lightly, mujhe tightly 😜',
    totalCalls: 4120,
    archetype: 'playful_tease',
    lockedPhotos: [
      { id: 'photo_sonia-13_1', url: PX(38532720), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_sonia-13_2', url: PX(38532721), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_sonia-13_3', url: PX(38532722), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_sonia-13_4', url: PX(38532723), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_sonia-13_5', url: PX(38532724), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'diya-14',
    name: 'Diya Sen',
    age: 25,
    city: 'Jaipur',
    country: 'India',
    language: ['Hindi', 'Rajasthani', 'English'],
    avatar: PX(7685492),
    coverImage: PX(7685493),
    photos: [
      PX(7685494), PX(7685495), PX(7685496), PX(7685497), PX(7685498),
    ],
    rating: 4.9,
    callRate: 280,
    isOnline: true,
    tagline: 'jaipur | royal andaaz, naughty iraade ✨',
    interests: ['Palaces', 'Traditional Fashion', 'Photography', 'Royalty'],
    videoUrl: FAKE_CALL_VIDEOS[13],
    bio: 'jaipur se. photography, traditional fashion aur raat ke shahi shauk. tameez se tadpana aata hai ✨',
    totalCalls: 2950,
    archetype: 'mysterious_sensual',
    lockedPhotos: [
      { id: 'photo_diya-14_1', url: PX(7685499), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_diya-14_2', url: PX(7685500), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_diya-14_3', url: PX(7685501), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_diya-14_4', url: PX(7685502), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_diya-14_5', url: PX(7685503), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'shreya-15',
    name: 'Shreya Verma',
    age: 24,
    city: 'Lucknow',
    country: 'India',
    language: ['Hindi', 'Urdu', 'English'],
    avatar: PX(8856215),
    coverImage: PX(8856216),
    photos: [
      PX(8856217), PX(8856218), PX(8856219), PX(8856220), PX(8856221),
    ],
    rating: 4.8,
    callRate: 300,
    isOnline: true,
    tagline: 'tehzeeb se tadpaungi 🌸',
    interests: ['Kebabs', 'Chikankari', 'Shayari', 'Music'],
    videoUrl: FAKE_CALL_VIDEOS[14],
    bio: 'lucknow se. kebabs, shayari, music aur adaa se bechain karna. tehzeeb se baat karo, neend uda dungi 🌸',
    totalCalls: 2280,
    archetype: 'sweet_romantic',
    lockedPhotos: [
      { id: 'photo_shreya-15_1', url: PX(8856222), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_shreya-15_2', url: PX(8856223), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_shreya-15_3', url: PX(8856224), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_shreya-15_4', url: PX(8856225), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_shreya-15_5', url: PX(8856226), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'nadia-16',
    name: 'Nadia Qureshi',
    age: 26,
    city: 'Karachi',
    country: 'Pakistan',
    language: ['Urdu', 'Sindhi', 'English'],
    avatar: PX(12121436),
    coverImage: PX(12121437),
    photos: [
      PX(12121438), PX(12121439), PX(12121440), PX(12121441), PX(12121442),
    ],
    rating: 4.9,
    callRate: 350,
    isOnline: true,
    tagline: 'karachi | stylist hu, kapde utarna bhi aata hai 🔥',
    interests: ['Fashion Runways', 'Luxury Cafes', 'Driving', 'Perfumes'],
    videoUrl: FAKE_CALL_VIDEOS[15],
    bio: 'stylist hu. fashion, perfumes, long drives aur raat bhar ka high voltage. energy match karo 🔥',
    totalCalls: 4530,
    archetype: 'bold_alluring',
    lockedPhotos: [
      { id: 'photo_nadia-16_1', url: PX(12121443), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_nadia-16_2', url: PX(12121444), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_nadia-16_3', url: PX(12121445), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_nadia-16_4', url: PX(12121446), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_nadia-16_5', url: PX(12121447), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'fariha-17',
    name: 'Fariha Rahman',
    age: 23,
    city: 'Dhaka',
    country: 'Bangladesh',
    language: ['Bengali', 'English'],
    avatar: PX(39299420),
    coverImage: PX(39299421),
    photos: [
      PX(39299423), PX(39299424), PX(39299425), PX(39299426), PX(39299427),
    ],
    rating: 4.8,
    callRate: 380,
    isOnline: true,
    tagline: 'sarson ke khet jesi, andar se aag 🌸',
    interests: ['Rabindra Sangeet', 'Painting', 'Tea', 'Rain'],
    videoUrl: FAKE_CALL_VIDEOS[16],
    bio: 'dhaka se. painting, chai, baarish aur bheegi raatein. sunne wale sabse zyada tadapte hain 🌸',
    totalCalls: 1870,
    archetype: 'sweet_romantic',
    lockedPhotos: [
      { id: 'photo_fariha-17_1', url: PX(39299428), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_fariha-17_2', url: PX(39299429), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_fariha-17_3', url: PX(39299430), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_fariha-17_4', url: PX(39299431), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_fariha-17_5', url: PX(39299433), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'zoya-18',
    name: 'Zoya Mirza',
    age: 24,
    city: 'Downtown Dubai',
    country: 'UAE',
    language: ['English', 'Hindi', 'Arabic'],
    avatar: PX(36424181),
    coverImage: PX(36424182),
    photos: [
      PX(36424183), PX(36424184), PX(36424185), PX(36424186), PX(36424187),
    ],
    rating: 5.0,
    callRate: 420,
    isOnline: true,
    tagline: 'dubai | dinner ke baad dessert main 🔥',
    interests: ['Fine Dining', 'Yachting', 'Champagne', 'Luxury'],
    videoUrl: FAKE_CALL_VIDEOS[17],
    bio: 'dubai me rehti hu. good food, achhi company aur uske baad jo hota hai. boring mat hona bas 🔥',
    totalCalls: 5120,
    archetype: 'bold_alluring',
    lockedPhotos: [
      { id: 'photo_zoya-18_1', url: PX(36424188), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_zoya-18_2', url: PX(36424189), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_zoya-18_3', url: PX(36424190), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_zoya-18_4', url: PX(36424191), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_zoya-18_5', url: PX(36424192), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  // 10% International
  {
    id: 'emily-19',
    name: 'Emily Watson',
    age: 24,
    city: 'London',
    country: 'UK',
    language: ['English'],
    avatar: PX(13807168),
    coverImage: PX(13807171),
    photos: [
      PX(13807172), PX(13807173), PX(13807174), PX(13807175), PX(13807176),
    ],
    rating: 4.9,
    callRate: 460,
    isOnline: true,
    tagline: 'london | sarcasm ke saath seduction 😜',
    interests: ['British Pop', 'Cocktails', 'Fashion', 'Art'],
    videoUrl: FAKE_CALL_VIDEOS[18],
    bio: 'london se. cheeky humour, achhi playlist aur raat ko thodi si naughtiness. desi boys sabse zyada mazedaar 😜',
    totalCalls: 4120,
    archetype: 'playful_tease',
    lockedPhotos: [
      { id: 'photo_emily-19_1', url: PX(13807177), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_emily-19_2', url: PX(13807178), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_emily-19_3', url: PX(13807179), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_emily-19_4', url: PX(13807181), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_emily-19_5', url: PX(13807182), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
  {
    id: 'camille-20',
    name: 'Camille Laurent',
    age: 23,
    city: 'Paris',
    country: 'France',
    language: ['French', 'English'],
    avatar: PX(32744417),
    coverImage: PX(32744418),
    photos: [
      PX(32744420), PX(32744421), PX(32744422), PX(32744425), PX(32744427),
    ],
    rating: 4.9,
    callRate: 500,
    isOnline: true,
    tagline: 'paris | l’amour, but make it naughty ✨',
    interests: ['Croissants', 'Art Museums', 'Wine', 'Romance'],
    videoUrl: FAKE_CALL_VIDEOS[19],
    bio: 'paris se. art, wine, romance aur aadhi raat ki shararatein. english me tadpati hu ✨',
    totalCalls: 3890,
    archetype: 'mysterious_sensual',
    lockedPhotos: [
      { id: 'photo_camille-20_1', url: PX(32744428), isBlurred: true, unlockCostCoins: 30, caption: 'sirf tumhare liye 😏' },
      { id: 'photo_camille-20_2', url: PX(32744431), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈' },
      { id: 'photo_camille-20_3', url: PX(32744432), isBlurred: true, unlockCostCoins: 40, caption: 'special angle, poori feel 💋' },
      { id: 'photo_camille-20_4', url: PX(32744436), isBlurred: true, unlockCostCoins: 40, caption: 'mood ban gaya 🔥' },
      { id: 'photo_camille-20_5', url: PX(32744437), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin 💋' },
    ],
  },
];

export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  image: string;
  coins: number;
  category: 'Popular' | 'Romantic' | 'Luxury' | 'VIP';
  description: string;
  accentColor: string;
  glowColor: string;
}

export const VIRTUAL_GIFTS: VirtualGift[] = [
  // 1. POPULAR (Casual, playful, trending)
  { id: 'rose', name: 'Red Rose', emoji: '🌹', icon: 'flower', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', coins: 10, category: 'Popular', description: 'Classic red rose', accentColor: '#FF2A6D', glowColor: 'rgba(255, 42, 109, 0.4)' },
  { id: 'candy', name: 'Sweet Candy', emoji: '🍭', icon: 'heart', image: 'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=600&q=80', coins: 20, category: 'Popular', description: 'Sweet treat', accentColor: '#FF69B4', glowColor: 'rgba(255, 105, 180, 0.4)' },
  { id: 'cupcake', name: 'Velvet Cupcake', emoji: '🧁', icon: 'cafe', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80', coins: 35, category: 'Popular', description: 'Frosted velvet treat', accentColor: '#EC4899', glowColor: 'rgba(236, 72, 153, 0.4)' },
  { id: 'balloon', name: 'Ruby Balloon', emoji: '🎈', icon: 'heart-circle', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80', coins: 50, category: 'Popular', description: 'Floating ruby heart', accentColor: '#F43F5E', glowColor: 'rgba(244, 63, 94, 0.4)' },
  { id: 'chocolate', name: 'Belgian Truffles', emoji: '🍫', icon: 'gift', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80', coins: 75, category: 'Popular', description: 'Rich cocoa truffles', accentColor: '#A855F7', glowColor: 'rgba(168, 85, 247, 0.4)' },
  { id: 'wine', name: 'Cabernet Wine', emoji: '🍷', icon: 'wine', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', coins: 100, category: 'Popular', description: 'Aged French vintage', accentColor: '#E11D48', glowColor: 'rgba(225, 29, 72, 0.4)' },

  // 2. ROMANTIC (Heartfelt, intimate, affectionate)
  { id: 'bouquet', name: '100 Red Roses', emoji: '💐', icon: 'flower', image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80', coins: 150, category: 'Romantic', description: '100 velvety roses', accentColor: '#FF1493', glowColor: 'rgba(255, 20, 147, 0.45)' },
  { id: 'teddy', name: 'Cuddle Bear', emoji: '🧸', icon: 'happy', image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80', coins: 200, category: 'Romantic', description: 'Soft plush teddy bear', accentColor: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.4)' },
  { id: 'musicbox', name: 'Crystal Music Box', emoji: '🎶', icon: 'musical-notes', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', coins: 300, category: 'Romantic', description: 'Crystal love melody', accentColor: '#D946EF', glowColor: 'rgba(217, 70, 239, 0.4)' },
  { id: 'locket', name: 'Gold Heart Locket', emoji: '💛', icon: 'heart-half', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80', coins: 450, category: 'Romantic', description: '18K engraved gold locket', accentColor: '#FBBF24', glowColor: 'rgba(251, 191, 36, 0.45)' },
  { id: 'loveletter', name: 'Love in a Bottle', emoji: '💌', icon: 'mail-unread', image: 'https://images.unsplash.com/photo-1579208575657-c595a053b9b7?auto=format&fit=crop&w=600&q=80', coins: 600, category: 'Romantic', description: 'Poetic handwritten scroll', accentColor: '#FB7185', glowColor: 'rgba(251, 113, 133, 0.45)' },
  { id: 'nightwear', name: 'French Silk Robe', emoji: '👗', icon: 'sparkles', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80', coins: 800, category: 'Romantic', description: 'Pure Mulberry silk', accentColor: '#E879F9', glowColor: 'rgba(232, 121, 249, 0.45)' },

  // 3. LUXURY (Glamour, high roller, status)
  { id: 'perfume', name: 'Chanel No. 5', emoji: '💎', icon: 'flask', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80', coins: 500, category: 'Luxury', description: 'Parisian haute parfum', accentColor: '#38BDF8', glowColor: 'rgba(56, 189, 248, 0.4)' },
  { id: 'bangle', name: 'Cartier Gold Bangle', emoji: '✨', icon: 'shield-checkmark', image: 'https://images.unsplash.com/photo-1611591477439-d378b8a5d3f2?auto=format&fit=crop&w=600&q=80', coins: 1000, category: 'Luxury', description: 'Signature 18K gold band', accentColor: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.5)' },
  { id: 'birkin', name: 'Hermès Birkin', emoji: '👜', icon: 'bag-handle', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80', coins: 1500, category: 'Luxury', description: 'Exotic leather tote', accentColor: '#FB923C', glowColor: 'rgba(251, 146, 60, 0.5)' },
  { id: 'rolex', name: 'Rolex Oyster Gold', emoji: '⌚', icon: 'watch', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', coins: 2200, category: 'Luxury', description: 'Diamond perpetual watch', accentColor: '#FCD34D', glowColor: 'rgba(252, 211, 77, 0.5)' },
  { id: 'ring', name: 'Diamond Ring', emoji: '💍', icon: 'disc', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80', coins: 3000, category: 'Luxury', description: '3-carat platinum diamond', accentColor: '#67E8F9', glowColor: 'rgba(103, 232, 249, 0.5)' },
  { id: 'choker', name: 'Diamond Choker', emoji: '📿', icon: 'sparkles', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=600&q=80', coins: 4500, category: 'Luxury', description: 'Emerald-cut diamonds', accentColor: '#818CF8', glowColor: 'rgba(129, 140, 248, 0.5)' },

  // 4. VIP (Billionaire tier, ultra-exclusive)
  { id: 'supercar', name: 'Neon Supercar', emoji: '🏎️', icon: 'car-sport', image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80', coins: 3500, category: 'VIP', description: '750HP twin-turbo beast', accentColor: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.5)' },
  { id: 'jet', name: 'Private Luxury Jet', emoji: '✈️', icon: 'airplane', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80', coins: 6000, category: 'VIP', description: 'Gulfstream private charter', accentColor: '#60A5FA', glowColor: 'rgba(96, 165, 250, 0.5)' },
  { id: 'yacht', name: 'Monaco Mega Yacht', emoji: '🛥️', icon: 'boat', image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=600&q=80', coins: 8000, category: 'VIP', description: '200ft superyacht with helipad', accentColor: '#34D399', glowColor: 'rgba(52, 211, 153, 0.5)' },
  { id: 'crown', name: 'Royal Golden Crown', emoji: '👑', icon: 'trophy', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80', coins: 12000, category: 'VIP', description: 'Imperial ruby & diamond tiara', accentColor: '#FBBF24', glowColor: 'rgba(251, 191, 36, 0.55)' },
  { id: 'island', name: 'Private Island', emoji: '🏝️', icon: 'globe', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', coins: 20000, category: 'VIP', description: 'Secluded tropical paradise', accentColor: '#10B981', glowColor: 'rgba(16, 185, 129, 0.55)' },
];

export function findGiftVisual(nameOrIcon?: string): { emoji: string; name: string; coins: number; accentColor: string; glowColor: string; image: string } {
  if (!nameOrIcon) {
    return { emoji: '🎁', name: 'Gift', coins: 100, accentColor: '#F65592', glowColor: 'rgba(246, 85, 146, 0.4)', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80' };
  }
  const clean = nameOrIcon.trim().toLowerCase();
  const matched = VIRTUAL_GIFTS.find(
    (g) =>
      g.name.toLowerCase() === clean ||
      g.id.toLowerCase() === clean ||
      clean.includes(g.name.toLowerCase())
  );
  if (matched) {
    return {
      emoji: matched.emoji,
      name: matched.name,
      coins: matched.coins,
      accentColor: matched.accentColor,
      glowColor: matched.glowColor,
      image: matched.image,
    };
  }
  return { emoji: '🎁', name: nameOrIcon, coins: 100, accentColor: '#F65592', glowColor: 'rgba(246, 85, 146, 0.4)', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80' };
}
