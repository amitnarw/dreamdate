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

export const FAKE_CALL_VIDEOS: string[] = [
  'https://www.shutterstock.com/shutterstock/videos/3570589437/preview/stock-footage-vertical-video-head-shot-portrait-of-young-pretty-woman-looking-at-camera-on-video-call-pov.mp4',
  'https://www.shutterstock.com/shutterstock/videos/4096491699/preview/stock-footage-face-video-call-and-woman-in-home-with-smile-greeting-and-communication-in-living-room.mp4',
  'https://www.shutterstock.com/shutterstock/videos/3726950727/preview/stock-footage-vertical-format-video-of-girl-vlogger-look-at-camera-talk-make-live-video-conference-call-online.mp4',
  'https://www.shutterstock.com/shutterstock/videos/3487071257/preview/stock-footage-girl-making-call-me-or-i-ll-call-you-concept-imitating-phone-with-her-hands.mp4',
  'https://www.shutterstock.com/shutterstock/videos/4011216959/preview/stock-footage-call-me-gesture-by-female-doctor-for-consulting-vertical.mp4',
  'https://www.shutterstock.com/shutterstock/videos/3676550169/preview/stock-footage-woman-video-conference-and-face-with-night-list-and-counting-as-online-english-teacher-in-steps.mp4',
  'https://media.gettyimages.com/id/1325103390/video/young-woman-video-chats.mp4',
  'https://media.gettyimages.com/id/1354225241/video/woman-having-video-call-with-her-friend.mp4',
  'https://media.gettyimages.com/id/2222590788/video/teenage-content-creator-making-social-media-video.mp4',
  'https://media.gettyimages.com/id/2174413133/video/the-young-vlogger-communicates-with-fans-via-video-calls.mp4',
  'https://media.gettyimages.com/id/1680197637/video/woman-talking-in-a-videocall-on-the-screen-of-a-smartphone.mp4',
  'https://media.gettyimages.com/id/2264379518/video/happy-gen-z-asian-woman-smiles-while-having-a-video-call-on-smart-phone-in-public-park.mp4',
];

// STRICT 100% Female Verified Profiles (Zero male images)
// 90% South Asian & Middle Eastern (India, Dubai/UAE, Bangladesh, Pakistan) & 10% International
export const MOCK_PROFILES: Profile[] = [
  {
    id: 'priya-1',
    name: 'Priya Sharma',
    age: 23,
    city: 'Mumbai',
    country: 'India',
    language: ['Hindi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.9,
    callRate: 40,
    isOnline: true,
    tagline: 'Online now! Video call me anytime handsome',
    interests: ['Bollywood', 'Dancing', 'Night drives', 'Coffee'],
    videoUrl: FAKE_CALL_VIDEOS[0],
    bio: 'Bandra girl with a playful smile. Love late-night chats, flirty jokes, and spontaneous video calls. Come say hi!',
    totalCalls: 3420,
    archetype: 'playful_tease',
    lockedPhotos: [
      {
        id: 'photo_priya_1',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        isBlurred: true,
        unlockCostCoins: 30,
        caption: 'My favorite evening glam look 💋',
      },
    ],
  },
  {
    id: 'aisha-2',
    name: 'Aisha Al-Hashmi',
    age: 24,
    city: 'Dubai',
    country: 'UAE',
    language: ['English', 'Hindi', 'Arabic'],
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
    coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    ],
    rating: 5.0,
    callRate: 50,
    isOnline: true,
    tagline: 'Luxury vibes & sweet talk. Connect on video!',
    interests: ['Dubai Marina', 'Fashion', 'Luxury Cars', 'Cocktails'],
    videoUrl: FAKE_CALL_VIDEOS[1],
    bio: 'Living the Dubai dream. Confident, bold, and love talking to ambitious men. Tap video call to see me live.',
    totalCalls: 4890,
    archetype: 'bold_alluring',
    lockedPhotos: [
      {
        id: 'photo_aisha_1',
        url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
        isBlurred: true,
        unlockCostCoins: 40,
        caption: 'Marina rooftop sundowner 🥂',
      },
    ],
  },
  {
    id: 'simran-3',
    name: 'Simran Kaur',
    age: 22,
    city: 'Chandigarh',
    country: 'India',
    language: ['Punjabi', 'Hindi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    coverImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80',
    photos: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    ],
    rating: 4.8,
    callRate: 35,
    isOnline: true,
    tagline: 'Sweet talk & pure vibes. Call karo ji!',
    interests: ['Music', 'Punjabi Songs', 'Cooking', 'Travel'],
    videoUrl: FAKE_CALL_VIDEOS[2],
    bio: 'Sweet, emotional, and always ready to make you smile. I love listening to your stories and sharing warm video calls.',
    totalCalls: 2190,
    archetype: 'sweet_romantic',
  },
  {
    id: 'ananya-4',
    name: 'Ananya Roy',
    age: 25,
    city: 'Kolkata',
    country: 'India',
    language: ['Bengali', 'Hindi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 45,
    isOnline: true,
    tagline: 'Deep conversations & mysterious glances',
    interests: ['Poetry', 'Art', 'Night walks', 'Classic Cinema'],
    videoUrl: FAKE_CALL_VIDEOS[3],
    bio: 'A passionate soul with artistic charm. Not your ordinary companion—let me enchant you on a private late-night call.',
    totalCalls: 2780,
    archetype: 'mysterious_sensual',
  },
  {
    id: 'zara-5',
    name: 'Zara Sheikh',
    age: 23,
    city: 'Lahore',
    country: 'Pakistan',
    language: ['Urdu', 'Hindi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 40,
    isOnline: true,
    tagline: 'Looking for someone special to talk to tonight',
    interests: ['Fashion Design', 'Chai', 'Singing', 'Romance'],
    videoUrl: FAKE_CALL_VIDEOS[4],
    bio: 'Soft spoken with a romantic heart. Let’s talk about life, secrets, and everything in between over a face-to-face video call.',
    totalCalls: 3100,
    archetype: 'sweet_romantic',
  },
  {
    id: 'tanya-6',
    name: 'Tanya Mehta',
    age: 26,
    city: 'South Delhi',
    country: 'India',
    language: ['Hindi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
    rating: 5.0,
    callRate: 50,
    isOnline: true,
    tagline: 'Bold, sassy, and always high energy! Call me',
    interests: ['Parties', 'Glamour', 'Fitness', 'Clubbing'],
    videoUrl: FAKE_CALL_VIDEOS[5],
    bio: 'Delhi girl with zero filter. I love teasing, flirting, and having wild laughs. Tap call to test your vibe with me!',
    totalCalls: 5420,
    archetype: 'bold_alluring',
  },
  {
    id: 'riya-7',
    name: 'Riya Patel',
    age: 24,
    city: 'Ahmedabad',
    country: 'India',
    language: ['Gujarati', 'Hindi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    callRate: 35,
    isOnline: false,
    tagline: 'Offline for a bit, leave a cute message!',
    interests: ['Garba', 'Foodie', 'Selfies', 'Shopping'],
    videoUrl: FAKE_CALL_VIDEOS[6],
    bio: 'Vibrant and full of giggles. Sweet talker who loves video calls whenever free. Send me a message or gift!',
    totalCalls: 1890,
    archetype: 'playful_tease',
  },
  {
    id: 'mehreen-8',
    name: 'Mehreen Noor',
    age: 22,
    city: 'Dhaka',
    country: 'Bangladesh',
    language: ['Bengali', 'English', 'Hindi'],
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    callRate: 35,
    isOnline: true,
    tagline: 'Shy at first, charming once we connect',
    interests: ['Literature', 'Photography', 'Music', 'Rainy Days'],
    videoUrl: FAKE_CALL_VIDEOS[7],
    bio: 'Dreamy eyes and a gentle voice. Call me for an intimate, peaceful chat where we can be completely ourselves.',
    totalCalls: 1940,
    archetype: 'sweet_romantic',
  },
  {
    id: 'natasha-9',
    name: 'Natasha Kapoor',
    age: 25,
    city: 'Bengaluru',
    country: 'India',
    language: ['English', 'Hindi', 'Kannada'],
    avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 45,
    isOnline: true,
    tagline: 'Tech savvy by day, glamour queen by night',
    interests: ['Startups', 'Electronic Music', 'Travel', 'Wine'],
    videoUrl: FAKE_CALL_VIDEOS[8],
    bio: 'Independent and classy. I know how to hold a fascinating conversation. Ready for a private video session?',
    totalCalls: 3650,
    archetype: 'mysterious_sensual',
  },
  {
    id: 'kavya-10',
    name: 'Kavya Reddy',
    age: 23,
    city: 'Hyderabad',
    country: 'India',
    language: ['Telugu', 'Hindi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 40,
    isOnline: true,
    tagline: 'Sweet smile, sweeter talks. Video call karo!',
    interests: ['Biryani', 'Dance', 'Cinema', 'Selfies'],
    videoUrl: FAKE_CALL_VIDEOS[9],
    bio: 'Hyderabad royal charm with modern warmth. Call me anytime to brighten up your mood!',
    totalCalls: 2840,
    archetype: 'sweet_romantic',
  },
  {
    id: 'pooja-11',
    name: 'Pooja Hegde',
    age: 24,
    city: 'Pune',
    country: 'India',
    language: ['Marathi', 'Hindi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    callRate: 35,
    isOnline: true,
    tagline: 'Chilled out girl next door. Free to video chat',
    interests: ['Trekking', 'Long Drives', 'Indie Rock', 'Coffee'],
    videoUrl: FAKE_CALL_VIDEOS[10],
    bio: 'College student & model. Love meeting interesting people on video calls. Say hello!',
    totalCalls: 2190,
    archetype: 'playful_tease',
  },
  {
    id: 'alizeh-12',
    name: 'Alizeh Khan',
    age: 23,
    city: 'Islamabad',
    country: 'Pakistan',
    language: ['Urdu', 'English'],
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    rating: 5.0,
    callRate: 45,
    isOnline: true,
    tagline: 'Elegance & warmth. Call me for deep talks',
    interests: ['Art', 'Classical Ghazals', 'Poetry', 'Travel'],
    videoUrl: FAKE_CALL_VIDEOS[11],
    bio: 'Looking for thoughtful, caring friends to share late-night reflections over private calls.',
    totalCalls: 3410,
    archetype: 'sweet_romantic',
  },
  {
    id: 'sonia-13',
    name: 'Sonia D’Souza',
    age: 22,
    city: 'Goa',
    country: 'India',
    language: ['English', 'Hindi', 'Konkani'],
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 40,
    isOnline: true,
    tagline: 'Beach sunsets & late-night parties! Call now',
    interests: ['Beaches', 'Electronic Music', 'Cocktails', 'Bikinis'],
    videoUrl: FAKE_CALL_VIDEOS[0],
    bio: 'Goan beach girl. Sun-kissed skin and wild laughs. Let me take you on a virtual beach date!',
    totalCalls: 4120,
    archetype: 'playful_tease',
  },
  {
    id: 'diya-14',
    name: 'Diya Sen',
    age: 25,
    city: 'Jaipur',
    country: 'India',
    language: ['Hindi', 'Rajasthani', 'English'],
    avatar: 'https://images.unsplash.com/photo-1562572159-4efc207f5aff?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 45,
    isOnline: true,
    tagline: 'Royal heritage with modern boldness',
    interests: ['Palaces', 'Traditional Fashion', 'Photography', 'Royalty'],
    videoUrl: FAKE_CALL_VIDEOS[1],
    bio: 'Pink city royal soul. Classy, respectful, and charming. Ready for an unforgettable conversation.',
    totalCalls: 2950,
    archetype: 'mysterious_sensual',
  },
  {
    id: 'shreya-15',
    name: 'Shreya Verma',
    age: 24,
    city: 'Lucknow',
    country: 'India',
    language: ['Hindi', 'Urdu', 'English'],
    avatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    callRate: 35,
    isOnline: true,
    tagline: 'Tehzeeb aur pyaar se baat karenge',
    interests: ['Kebabs', 'Chikankari', 'Shayari', 'Music'],
    videoUrl: FAKE_CALL_VIDEOS[2],
    bio: 'Nawabi charm with polite sweetness. Connect with me on video for an authentic smile.',
    totalCalls: 2280,
    archetype: 'sweet_romantic',
  },
  {
    id: 'nadia-16',
    name: 'Nadia Qureshi',
    age: 26,
    city: 'Karachi',
    country: 'Pakistan',
    language: ['Urdu', 'Sindhi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 50,
    isOnline: true,
    tagline: 'Bold style & magnetic energy. Pick up my call!',
    interests: ['Fashion Runways', 'Luxury Cafes', 'Driving', 'Perfumes'],
    videoUrl: FAKE_CALL_VIDEOS[3],
    bio: 'Independent stylist. I love high-energy, ambitious men who know how to keep a woman intrigued.',
    totalCalls: 4530,
    archetype: 'bold_alluring',
  },
  {
    id: 'fariha-17',
    name: 'Fariha Rahman',
    age: 23,
    city: 'Dhaka',
    country: 'Bangladesh',
    language: ['Bengali', 'English'],
    avatar: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    callRate: 35,
    isOnline: true,
    tagline: 'Simple, sweet and full of romance',
    interests: ['Rabindra Sangeet', 'Painting', 'Tea', 'Rain'],
    videoUrl: FAKE_CALL_VIDEOS[4],
    bio: 'Gentle Bengali girl with soulful eyes. Video call me whenever you need someone to listen.',
    totalCalls: 1870,
    archetype: 'sweet_romantic',
  },
  {
    id: 'zoya-18',
    name: 'Zoya Mirza',
    age: 24,
    city: 'Downtown Dubai',
    country: 'UAE',
    language: ['English', 'Hindi', 'Arabic'],
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    rating: 5.0,
    callRate: 50,
    isOnline: true,
    tagline: 'Burj Khalifa views & midnight glamour',
    interests: ['Fine Dining', 'Yachting', 'Champagne', 'Luxury'],
    videoUrl: FAKE_CALL_VIDEOS[5],
    bio: 'Living in the heart of Dubai. Gorgeous, outgoing, and ready for private late-night video chats.',
    totalCalls: 5120,
    archetype: 'bold_alluring',
  },
  // 10% International
  {
    id: 'emily-19',
    name: 'Emily Watson',
    age: 24,
    city: 'London',
    country: 'UK',
    language: ['English'],
    avatar: 'https://images.unsplash.com/photo-1524638431109-93d95c968f03?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 50,
    isOnline: true,
    tagline: 'British charm & cheeky smiles. Video call me!',
    interests: ['British Pop', 'Cocktails', 'Fashion', 'Art'],
    videoUrl: FAKE_CALL_VIDEOS[6],
    bio: 'Londoner with a cheeky sense of humor. Looking forward to meeting charming international friends on video!',
    totalCalls: 4120,
    archetype: 'playful_tease',
  },
  {
    id: 'camille-20',
    name: 'Camille Laurent',
    age: 23,
    city: 'Paris',
    country: 'France',
    language: ['French', 'English'],
    avatar: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 50,
    isOnline: true,
    tagline: 'Parisian romance & effortless chic',
    interests: ['Croissants', 'Art Museums', 'Wine', 'Romance'],
    videoUrl: FAKE_CALL_VIDEOS[7],
    bio: 'Charming Parisian with a heart for romance. Speak with me in English or French on video call!',
    totalCalls: 3890,
    archetype: 'mysterious_sensual',
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
  { id: 'rose', name: 'Red Rose', emoji: '🌹', icon: 'flower', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', coins: 10, category: 'Popular', description: 'Classic red rose', accentColor: '#FF2A6D', glowColor: 'rgba(255, 42, 109, 0.4)' },
  { id: 'candy', name: 'Sweet Candy', emoji: '🍭', icon: 'heart', image: 'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=600&q=80', coins: 20, category: 'Popular', description: 'Sweet treat', accentColor: '#FF69B4', glowColor: 'rgba(255, 105, 180, 0.4)' },
  { id: 'chocolate', name: 'Box of Chocolates', emoji: '🍫', icon: 'gift', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80', coins: 50, category: 'Popular', description: 'Rich cocoa truffles', accentColor: '#A855F7', glowColor: 'rgba(168, 85, 247, 0.4)' },
  { id: 'teddy', name: 'Cuddle Bear', emoji: '🧸', icon: 'happy', image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80', coins: 100, category: 'Popular', description: 'Soft plush teddy bear', accentColor: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.4)' },
  { id: 'perfume', name: 'Chanel Scent', emoji: '💎', icon: 'flask', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80', coins: 300, category: 'Luxury', description: 'Luxury fragrance', accentColor: '#38BDF8', glowColor: 'rgba(56, 189, 248, 0.4)' },
  { id: 'ring', name: 'Diamond Ring', emoji: '💍', icon: 'disc', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80', coins: 800, category: 'Luxury', description: 'Forever shine', accentColor: '#67E8F9', glowColor: 'rgba(103, 232, 249, 0.5)' },
  { id: 'supercar', name: 'Neon Supercar', emoji: '🏎️', icon: 'car-sport', image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80', coins: 2000, category: 'VIP', description: 'V12 power', accentColor: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.5)' },
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
