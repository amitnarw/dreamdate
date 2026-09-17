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

import { getAllVideoUrls, getImageUrl } from '../services/videoService';
import { getMediaForGirl } from './profileMedia';

export const FAKE_CALL_VIDEOS: string[] = getAllVideoUrls();

// Locked-photo pricing ladder (matches the persona unlock price tiers 30/40/50).
const LOCKED_PRICES = [30, 30, 40, 40, 50, 50] as const;

interface ProfileSeed {
  name: string;
  age: number;
  city: string;
  country: string;
  language: string[];
  rating: number;
  callRate: number;
  tagline: string;
  interests: string[];
  bio: string;
  archetype: CharacterArchetype;
}

const SEEDS: readonly ProfileSeed[] = [
  // 1
  { name: 'Priya Sharma', age: 23, city: 'Mumbai', country: 'India', language: ['Hindi', 'English'], rating: 4.9, callRate: 120, tagline: 'chai aur tere baare mein baatein ☕', interests: ['poetry', 'bollywood music', 'street food'], bio: 'Maharashtra ki chatori, late-night video mein milti hu. Mujhe apni voice bhej, baat karenge dil ki.', archetype: 'sweet_romantic' },
  // 2
  { name: 'Aisha Khan', age: 25, city: 'Dubai', country: 'UAE', language: ['Hindi', 'Urdu', 'English'], rating: 4.8, callRate: 150, tagline: 'thodi masti thodi baatein 😏', interests: ['luxury shopping', 'travel', 'fashion'], bio: 'Dubai ki shaan, tera intezaar. Late night pe aati hu, jaanna toh call kar.', archetype: 'bold_alluring' },
  // 3
  { name: 'Meera Joshi', age: 24, city: 'Pune', country: 'India', language: ['Hindi', 'English', 'Marathi'], rating: 4.7, callRate: 100, tagline: 'sun rahi hu tumhe…', interests: ['reading', 'coffee shops', 'trekking'], bio: 'Pune se, par dil tumhare paas. Subah ki chai ke saath milna chahti hu.', archetype: 'mysterious_sensual' },
  // 4
  { name: 'Riya Verma', age: 22, city: 'Delhi', country: 'India', language: ['Hindi', 'English'], rating: 4.6, callRate: 90, tagline: 'free hu aaj 😉', interests: ['street food', 'instagram reels', 'cats'], bio: 'Delhi ki dehliz se, teri screen pe. Aaja baat karein, bore ho rahi hu.', archetype: 'playful_tease' },
  // 5
  { name: 'Sneha Iyer', age: 26, city: 'Chennai', country: 'India', language: ['English', 'Tamil', 'Hindi'], rating: 4.8, callRate: 130, tagline: 'south indian swag ✨', interests: ['carnatic music', 'filter coffee', 'saree shopping'], bio: 'Filter coffee piyogi mere saath? Chennai se, par rajneeti mein, dil chhota.', archetype: 'sweet_romantic' },
  // 6
  { name: 'Kavya Reddy', age: 23, city: 'Hyderabad', country: 'India', language: ['Telugu', 'Hindi', 'English'], rating: 4.7, callRate: 110, tagline: 'biryani date kab? 🍛', interests: ['biryani', 'cricket', 'k-dramas'], bio: 'Hyderabadi biryani aur tera intezaar — dono favourite hain.', archetype: 'playful_tease' },
  // 7
  { name: 'Nisha Kapoor', age: 27, city: 'Bangalore', country: 'India', language: ['English', 'Hindi', 'Kannada'], rating: 4.9, callRate: 180, tagline: 'work hard, flirt harder 💼', interests: ['startups', 'wine bars', 'yoga'], bio: 'Silicon Valley of India ka dil soft, par apps pe strict. Call kar, jaana.', archetype: 'bold_alluring' },
  // 8
  { name: 'Tanvi Singh', age: 24, city: 'Chandigarh', country: 'India', language: ['Hindi', 'Punjabi', 'English'], rating: 4.6, callRate: 95, tagline: 'parli-g walon ki pyaari 💋', interests: ['diljit dosanjh', 'gym', 'gol gappa'], bio: 'Chandigarh se hoon, late-night dil chori. Aaja teri baari.', archetype: 'bold_alluring' },
  // 9
  { name: 'Anjali Patel', age: 22, city: 'Ahmedabad', country: 'India', language: ['Hindi', 'Gujarati', 'English'], rating: 4.5, callRate: 85, tagline: 'dhokla ke saath selfie 📸', interests: ['garba', 'mangoes', 'photography'], bio: 'Gujju girl with proper tadka. Teri photo dekhi, ab teri awaaz chahiye.', archetype: 'sweet_romantic' },
  // 10
  { name: 'Rhea Malhotra', age: 25, city: 'Kolkata', country: 'India', language: ['Bengali', 'Hindi', 'English'], rating: 4.7, callRate: 115, tagline: 'rosogolla romance 🍰', interests: ['rabindra sangeet', 'mishti doi', 'adda at ghat'], bio: 'City of Joy ki chhori, par raat jo tera intezaar karti hai woh alag hai.', archetype: 'mysterious_sensual' },
  // 11
  { name: 'Ishita Roy', age: 26, city: 'Lucknow', country: 'India', language: ['Hindi', 'Urdu'], rating: 4.8, callRate: 140, tagline: 'tunday kabab se zyada tedi 😜', interests: ['poetry', 'tunday', 'shayari'], bio: 'Lucknow ki adaa, awaaz mein tedi baatein. Aaja raat ki mehfil mein.', archetype: 'playful_tease' },
  // 12
  { name: 'Pooja Nair', age: 23, city: 'Kochi', country: 'India', language: ['Malayalam', 'English', 'Hindi'], rating: 4.6, callRate: 100, tagline: 'backwaters & boys 🌴', interests: ['kerala sadya', 'kathakali', 'beach sunsets'], bio: 'God’s own country ki pari, kam se kam raat ko. Call kar na.', archetype: 'sweet_romantic' },
  // 13
  { name: 'Sanya Bedi', age: 24, city: 'Jaipur', country: 'India', language: ['Hindi', 'English', 'Rajasthani'], rating: 4.7, callRate: 125, tagline: 'pink city pink mood 💗', interests: ['rajasthani folk', 'jewellery', 'street shopping'], bio: 'Pink city se hoon, par mood hamesha mere haath mein. Bol, kab miloge?', archetype: 'playful_tease' },
  // 14
  { name: 'Maya D\'Souza', age: 22, city: 'Goa', country: 'India', language: ['English', 'Konkani', 'Hindi'], rating: 4.5, callRate: 80, tagline: 'beach babe alert 🏖️', interests: ['beach clubs', 'feni', 'sunset selfies'], bio: 'Goa ki shaan, late-night beach vibes. Aaja mere samundar mein.', archetype: 'playful_tease' },
  // 15
  { name: 'Tanya Saxena', age: 27, city: 'Indore', country: 'India', language: ['Hindi', 'English'], rating: 4.8, callRate: 155, tagline: 'sarafa bhi, tu bhi, dono favourite 🍬', interests: ['indori poha', 'street food tours', 'true crime podcasts'], bio: 'Indori by birth, foodie by choice. Baat karein, recipe bhi sunaungi.', archetype: 'sweet_romantic' },
  // 16
  { name: 'Aditi Bhatt', age: 23, city: 'Surat', country: 'India', language: ['Hindi', 'Gujarati'], rating: 4.6, callRate: 95, tagline: 'diamond polish, dil neela 💎', interests: ['diamonds', 'shopping', 'surat locho'], bio: 'Surat ki diamond, teri screen pe chamak. Late night mithai date?', archetype: 'mysterious_sensual' },
  // 17
  { name: 'Kritika Chauhan', age: 25, city: 'Dehradun', country: 'India', language: ['Hindi', 'English'], rating: 4.7, callRate: 120, tagline: 'pahadon ka pyaar 🌿', interests: ['trekking', 'morning walks', 'tea estates'], bio: 'Pahadi hawa aur pahari baatein. Tujhe ghar bulati hu, chalega?', archetype: 'sweet_romantic' },
  // 18
  { name: 'Neha Aggarwal', age: 26, city: 'Gurgaon', country: 'India', language: ['Hindi', 'English'], rating: 4.9, callRate: 175, tagline: 'corporate by day, naughty by night 🌙', interests: ['workout', 'cocktails', 'thriller novels'], bio: 'Gurgaon ki skyline dekhi hai, teri aankhon ki nahi. Aaja call pe.', archetype: 'bold_alluring' },
  // 19
  { name: 'Simran Kaur', age: 24, city: 'Amritsar', country: 'India', language: ['Punjabi', 'Hindi', 'English'], rating: 4.6, callRate: 105, tagline: 'golden temple, golden heart 💛', interests: ['sikh history', 'langar', 'bhangra'], bio: 'Punjaban di soni kudi, late-night vibe tera intezaar kardi. Call karde.', archetype: 'playful_tease' },
  // 20
  { name: 'Jiya Sharma', age: 22, city: 'Noida', country: 'India', language: ['Hindi', 'English'], rating: 4.5, callRate: 85, tagline: 'PG waali, party wali 🍷', interests: ['house parties', 'reels', 'momos'], bio: 'Noida ki tower wali, hearts ki queen. Late-night baatein guarantee.', archetype: 'playful_tease' },
  // 21
  { name: 'Aliya Sheikh', age: 25, city: 'Karachi', country: 'Pakistan', language: ['Urdu', 'Hindi', 'English'], rating: 4.7, callRate: 110, tagline: 'sukoon wali baatein 🌙', interests: ['qawwali', 'desi food', 'romance novels'], bio: 'Karachi se hoon, dil mein bhai nahi, sirf tu. Raat ki baatein karein?', archetype: 'mysterious_sensual' },
  // 22
  { name: 'Myra Fernandes', age: 23, city: 'Mangalore', country: 'India', language: ['English', 'Hindi', 'Tulu'], rating: 4.5, callRate: 90, tagline: 'coastal crush 🌊', interests: ['beach', 'cafe hopping', 'photography'], bio: 'Mangalore ki breezy girl, screen pe bhi breeze laati hu.', archetype: 'sweet_romantic' },
  // 23
  { name: 'Nikita Rao', age: 28, city: 'Mumbai', country: 'India', language: ['Hindi', 'English'], rating: 4.9, callRate: 200, tagline: 'fashion week wali 🔥', interests: ['modelling', 'travel', 'fine dining'], bio: 'Runway to your room. Mumbai ki hottest, screen pe bhi unbothered.', archetype: 'bold_alluring' },
  // 24
  { name: 'Suhana Mirza', age: 24, city: 'Srinagar', country: 'India', language: ['Hindi', 'Kashmiri', 'English'], rating: 4.7, callRate: 115, tagline: 'chinar leaves & heartbeats 🍁', interests: ['shikara rides', 'kashmiri shawls', 'snowfall'], bio: 'Jannat ki beti, screen pe bhi heavenly vibes. Aaja dil ki raftaar mein.', archetype: 'mysterious_sensual' },
  // 25
  { name: 'Trisha Hegde', age: 26, city: 'Hubli', country: 'India', language: ['Kannada', 'English', 'Hindi'], rating: 4.6, callRate: 100, tagline: 'north karnataka queen 👑', interests: ['traditional sarees', 'temples', 'bisi bele bath'], bio: 'Simple town se, par style international. Late-night mein confused hoge.', archetype: 'sweet_romantic' },
  // 26
  { name: 'Bhavna Pandit', age: 23, city: 'Bhopal', country: 'India', language: ['Hindi', 'English'], rating: 4.5, callRate: 85, tagline: 'lake city queen 🪷', interests: ['poetry', 'boat rides', 'bhopali gosht'], bio: 'Bhopal ki shaan, teri screen pe mehman. Chai pe bulani hai?', archetype: 'sweet_romantic' },
  // 27
  { name: 'Zoya Qureshi', age: 25, city: 'Patna', country: 'India', language: ['Hindi', 'Urdu'], rating: 4.6, callRate: 105, tagline: 'litti chokha aur cute baatein 🫶', interests: ['bihari cuisine', 'history', 'ghats'], bio: 'Patna ki nazakat, teri screen pe mehfil. Aaja dil ki ghat pe.', archetype: 'bold_alluring' },
  // 28
  { name: 'Lavanya Pillai', age: 24, city: 'Trivandrum', country: 'India', language: ['Malayalam', 'English'], rating: 4.7, callRate: 115, tagline: 'kerala kathakali vibes 🎭', interests: ['classical dance', 'beach', 'tea'], bio: 'God’s own country ki classical dancer. Call mein bhi nachti hu.', archetype: 'mysterious_sensual' },
  // 29
  { name: 'Rashi Goel', age: 23, city: 'Meerut', country: 'India', language: ['Hindi', 'English'], rating: 4.5, callRate: 90, tagline: 'ganna aur gyaan 🌾', interests: ['agriculture', 'education', 'street food'], bio: 'Simple town ki smart girl. Tera intezaar raat bhar karti hu.', archetype: 'sweet_romantic' },
  // 30
  { name: 'Ishani Bhalla', age: 25, city: 'Chandigarh', country: 'India', language: ['Hindi', 'English', 'Punjabi'], rating: 4.7, callRate: 125, tagline: 'sector 17 ki shehzaadi 🌆', interests: ['shopping', 'food blogs', 'late-night drives'], bio: 'Chandigarh ki sweet girl, teri screen pe aati hu at 12 sharp.', archetype: 'playful_tease' },
  // 31
  { name: 'Srishti Joshi', age: 22, city: 'Dehradun', country: 'India', language: ['Hindi', 'English', 'Garhwali'], rating: 4.4, callRate: 80, tagline: 'pahadi pep 🌲', interests: ['yoga', 'tea', 'trekking'], bio: 'Paani wali girl. Baat karein toh, ek ladki mile na mile.', archetype: 'sweet_romantic' },
  // 32
  { name: 'Palak Mehta', age: 24, city: 'Rajkot', country: 'India', language: ['Hindi', 'Gujarati', 'English'], rating: 4.6, callRate: 100, tagline: 'gujju naari 🔥', interests: ['gujarati thali', 'festivals', 'gym'], bio: 'Rajkot ki raani, late-night wali baatein tujhe hi karti hu.', archetype: 'bold_alluring' },
  // 33
  { name: 'Komal Yadav', age: 23, city: 'Hisar', country: 'India', language: ['Hindi', 'Haryanvi'], rating: 4.5, callRate: 85, tagline: 'desi kudi, modern vibe 🐎', interests: ['horses', 'farming', 'rap music'], bio: 'Haryana ki sherni. Phone uthati hu, dekhti hu kaun.', archetype: 'playful_tease' },
  // 34
  { name: 'Tara Khanna', age: 27, city: 'Mumbai', country: 'India', language: ['Hindi', 'English'], rating: 4.8, callRate: 165, tagline: 'late night lawyer 🔥', interests: ['wine bars', 'high court drama', 'travel'], bio: 'Lawyer by profession, naughty by choice. Court mein late-night mein.', archetype: 'bold_alluring' },
  // 35
  { name: 'Aanya Shroff', age: 22, city: 'Vadodara', country: 'India', language: ['Hindi', 'Gujarati', 'English'], rating: 4.5, callRate: 90, tagline: 'barodian butterfly 🦋', interests: ['museums', 'classical music', 'chai'], bio: 'Vadodara ki laadli. Tera aana banta hai ab.', archetype: 'sweet_romantic' },
  // 36
  { name: 'Vidhi Lalwani', age: 24, city: 'Jodhpur', country: 'India', language: ['Hindi', 'English'], rating: 4.6, callRate: 105, tagline: 'blue city pink mood 💙', interests: ['marwari cuisine', 'forts', 'sunsets'], bio: 'Jodhpur ki shaan, screen pe tera intezaar. Aaja blue city mein.', archetype: 'mysterious_sensual' },
  // 37
  { name: 'Meher Khan', age: 25, city: 'Lucknow', country: 'India', language: ['Urdu', 'Hindi', 'English'], rating: 4.7, callRate: 120, tagline: 'lucknowi tehzeeb ✨', interests: ['shayari', 'qawwali nights', 'kebabs'], bio: 'Lucknow ki shayrana. Late-night mehfil mein aaja.', archetype: 'sweet_romantic' },
  // 38
  { name: 'Saanvi Khurana', age: 26, city: 'Delhi', country: 'India', language: ['Hindi', 'English'], rating: 4.8, callRate: 145, tagline: 'delhi 6 dikhti hai 💃', interests: ['designer wear', 'champagne brunches', 'travel'], bio: 'Delhi ki sultana. Late-night romance, sirf tujhse.', archetype: 'bold_alluring' },
  // 39
  { name: 'Riya Sengupta', age: 24, city: 'Kolkata', country: 'India', language: ['Bengali', 'Hindi', 'English'], rating: 4.7, callRate: 125, tagline: 'mishti doi ke saath date 🍯', interests: ['adda', 'rabindranath tagore', 'bengali sweets'], bio: 'City of Joy ki last princess. Aaja, teri baari.', archetype: 'mysterious_sensual' },
];

function buildProfile(seedIndex: number): Profile {
  const seed = SEEDS[seedIndex];
  const media = getMediaForGirl(seedIndex + 1);
  const freeUrls = media.free.map((f) => getImageUrl(f));
  const lockedUrls = media.locked.map((f) => getImageUrl(f));

  const avatar = freeUrls[0];
  const coverImage = freeUrls.length > 1 ? freeUrls[1] : freeUrls[0];
  const photos = freeUrls.length > 1 ? freeUrls.slice(1) : [];

  const lockedPhotos: ProfileMediaItem[] = lockedUrls.map((url, idx) => ({
    id: `photo_girl-${seedIndex + 1}_${media.locked[idx]}`,
    url,
    isBlurred: true,
    unlockCostCoins: LOCKED_PRICES[idx] ?? 50,
    caption: 'sirf tumhare liye 😏',
  }));

  return {
    id: `girl-${seedIndex + 1}`,
    name: seed.name,
    age: seed.age,
    city: seed.city,
    country: seed.country,
    language: [...seed.language],
    avatar,
    photos,
    coverImage,
    rating: seed.rating,
    callRate: seed.callRate,
    isOnline: true,
    tagline: seed.tagline,
    interests: [...seed.interests],
    videoUrl: FAKE_CALL_VIDEOS[seedIndex % FAKE_CALL_VIDEOS.length],
    bio: seed.bio,
    totalCalls: 1200 + seedIndex * 37,
    archetype: seed.archetype,
    lockedPhotos: lockedPhotos.length > 0 ? lockedPhotos : undefined,
  };
}

export const MOCK_PROFILES: Profile[] = SEEDS.map((_, i) => buildProfile(i));

// Re-exports for legacy callers (kept stable).
export const ALL_PROFILES: Profile[] = MOCK_PROFILES;
export function getProfileById(id: string): Profile | undefined {
  return MOCK_PROFILES.find((p) => p.id === id);
}

export { getImageUrl } from '../services/videoService';

// =============================================================================
// Virtual Gifts (unchanged from v2 ;  decorative, remote, no media binding)
// =============================================================================

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

  // 2. ROMANTIC
  { id: 'bouquet', name: '100 Red Roses', emoji: '💐', icon: 'flower', image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80', coins: 150, category: 'Romantic', description: '100 velvety roses', accentColor: '#FF1493', glowColor: 'rgba(255, 20, 147, 0.45)' },
  { id: 'teddy', name: 'Cuddle Bear', emoji: '🧸', icon: 'happy', image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80', coins: 200, category: 'Romantic', description: 'Soft plush teddy bear', accentColor: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.4)' },
  { id: 'musicbox', name: 'Crystal Music Box', emoji: '🎶', icon: 'musical-notes', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', coins: 300, category: 'Romantic', description: 'Crystal love melody', accentColor: '#D946EF', glowColor: 'rgba(217, 70, 239, 0.4)' },
  { id: 'locket', name: 'Gold Heart Locket', emoji: '💛', icon: 'heart-half', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80', coins: 450, category: 'Romantic', description: '18K engraved gold locket', accentColor: '#FBBF24', glowColor: 'rgba(251, 191, 36, 0.45)' },
  { id: 'loveletter', name: 'Love in a Bottle', emoji: '💌', icon: 'mail-unread', image: 'https://images.unsplash.com/photo-1579208575657-c595a053b9b7?auto=format&fit=crop&w=600&q=80', coins: 600, category: 'Romantic', description: 'Poetic handwritten scroll', accentColor: '#FB7185', glowColor: 'rgba(251, 113, 133, 0.45)' },
  { id: 'nightwear', name: 'French Silk Robe', emoji: '👗', icon: 'sparkles', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80', coins: 800, category: 'Romantic', description: 'Pure Mulberry silk', accentColor: '#E879F9', glowColor: 'rgba(232, 121, 249, 0.45)' },

  // 3. LUXURY
  { id: 'perfume', name: 'Chanel No. 5', emoji: '💎', icon: 'flask', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80', coins: 500, category: 'Luxury', description: 'Parisian haute parfum', accentColor: '#38BDF8', glowColor: 'rgba(56, 189, 248, 0.4)' },
  { id: 'bangle', name: 'Cartier Gold Bangle', emoji: '✨', icon: 'shield-checkmark', image: 'https://images.unsplash.com/photo-1611591477439-d378b8a5d3f2?auto=format&fit=crop&w=600&q=80', coins: 1000, category: 'Luxury', description: 'Signature 18K gold band', accentColor: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.5)' },
  { id: 'birkin', name: 'Hermès Birkin', emoji: '👜', icon: 'bag-handle', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80', coins: 1500, category: 'Luxury', description: 'Exotic leather tote', accentColor: '#FB923C', glowColor: 'rgba(251, 146, 60, 0.5)' },
  { id: 'rolex', name: 'Rolex Oyster Gold', emoji: '⌚', icon: 'watch', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', coins: 2200, category: 'Luxury', description: 'Diamond perpetual watch', accentColor: '#FCD34D', glowColor: 'rgba(252, 211, 77, 0.5)' },
  { id: 'ring', name: 'Diamond Ring', emoji: '💍', icon: 'disc', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80', coins: 3000, category: 'Luxury', description: '3-carat platinum diamond', accentColor: '#67E8F9', glowColor: 'rgba(103, 232, 249, 0.5)' },
  { id: 'choker', name: 'Diamond Choker', emoji: '📿', icon: 'sparkles', image: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=600&q=80', coins: 4500, category: 'Luxury', description: 'Emerald-cut diamonds', accentColor: '#818CF8', glowColor: 'rgba(129, 140, 248, 0.5)' },

  // 4. VIP
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
