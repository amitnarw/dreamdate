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
  'https://www.shutterstock.com/shutterstock/videos/3676550727/preview/stock-footage-woman-video-conference-and-face-with-night-list-and-counting-as-online-english-teacher-in-steps.mp4',
  'https://media.gettyimages.com/id/1325103390/video/young-woman-video-chats.mp4',
  'https://media.gettyimages.com/id/1354225241/video/woman-having-video-call-with-her-friend.mp4',
  'https://media.gettyimages.com/id/2222590788/video/teenage-content-creator-making-social-media-video.mp4',
  'https://media.gettyimages.com/id/2174413133/video/the-young-vlogger-communicates-with-fans-via-video-calls.mp4',
  'https://media.gettyimages.com/id/1680197637/video/woman-talking-in-a-videocall-on-the-screen-of-a-smartphone.mp4',
  'https://media.gettyimages.com/id/2264379518/video/happy-gen-z-asian-woman-smiles-while-having-a-video-call-on-smart-phone-in-public-park.mp4',
];

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
    avatar: PX(11555705),
    coverImage: PX(11555712),
    photos: [
      PX(11555705), PX(11555712), PX(20957551), PX(20957552),
      PX(20957554), PX(20957555), PX(17184872), PX(17184874),
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
      { id: 'photo_priya_1', url: PX(7480645), isBlurred: true, unlockCostCoins: 30, caption: 'bodysuit me bheegi 😏 sirf tumhare liye' },
      { id: 'photo_priya_2', url: PX(7480640), isBlurred: true, unlockCostCoins: 30, caption: 'jhook ke dekho na 🙈 sab dikhega' },
      { id: 'photo_priya_3', url: PX(7450353), isBlurred: true, unlockCostCoins: 40, caption: 'ek taang wali pose, poori nangi feel 💋' },
      { id: 'photo_priya_4', url: PX(19569381), isBlurred: true, unlockCostCoins: 40, caption: 'neele me neeli, kapde kahan? 😏' },
      { id: 'photo_priya_5', url: PX(11357458), isBlurred: true, unlockCostCoins: 50, caption: 'haath jahan hai, nazar wahin rakho 🔥' },
    ],
  },
  {
    id: 'aisha-2',
    name: 'Aisha Al-Hashmi',
    age: 24,
    city: 'Dubai',
    country: 'UAE',
    language: ['English', 'Hindi', 'Arabic'],
    avatar: PX(36770836),
    coverImage: PX(36770825),
    photos: [
      PX(36770836), PX(36770825), PX(36770826), PX(36770856),
      PX(36770874), PX(36770962), PX(36770963), PX(36435142),
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
      { id: 'photo_aisha_1', url: PX(36145328), isBlurred: true, unlockCostCoins: 40, caption: 'laal me behaal 🔥 bra kahan hai dhoondo' },
      { id: 'photo_aisha_2', url: PX(36111303), isBlurred: true, unlockCostCoins: 40, caption: 'parde ke peeche poori nangi 😏' },
      { id: 'photo_aisha_3', url: PX(38510589), isBlurred: true, unlockCostCoins: 50, caption: 'jungle me mangal, kapde gayab 💋' },
      { id: 'photo_aisha_4', url: PX(32555449), isBlurred: true, unlockCostCoins: 50, caption: 'kaale me gori, sab kuch dikh raha 🔥' },
      { id: 'photo_aisha_5', url: PX(32597620), isBlurred: true, unlockCostCoins: 50, caption: 'elegant bahar, nangi andar 💋 himmat hai to kholo' },
    ],
  },
  {
    id: 'simran-3',
    name: 'Simran Kaur',
    age: 22,
    city: 'Chandigarh',
    country: 'India',
    language: ['Punjabi', 'Hindi', 'English'],
    avatar: PX(16111401),
    coverImage: PX(17040889),
    photos: [
      PX(16111401), PX(17040889), PX(17040943), PX(17040947),
      PX(17261589), PX(17686515), PX(17755205), PX(18194539),
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
      { id: 'photo_simran_1', url: PX(10965109), isBlurred: true, unlockCostCoins: 30, caption: 'safed me lipti, andar kuch nahi 🌸' },
      { id: 'photo_simran_2', url: PX(10965114), isBlurred: true, unlockCostCoins: 30, caption: 'side se dekho, sab samjhoge 🙈' },
      { id: 'photo_simran_3', url: PX(10965118), isBlurred: true, unlockCostCoins: 40, caption: 'raat ki khidki, nangi main ❤️' },
      { id: 'photo_simran_4', url: PX(10965123), isBlurred: true, unlockCostCoins: 40, caption: 'ye angle sirf tumhare liye 😏' },
      { id: 'photo_simran_5', url: PX(4380156), isBlurred: true, unlockCostCoins: 50, caption: 'sirf curves, no kapde 🔥 dil tham ke' },
    ],
  },
  {
    id: 'ananya-4',
    name: 'Ananya Roy',
    age: 25,
    city: 'Kolkata',
    country: 'India',
    language: ['Bengali', 'Hindi', 'English'],
    avatar: PX(1999895),
    coverImage: PX(20161456),
    photos: [
      PX(1999895), PX(20161456), PX(20161457), PX(20442939),
      PX(20442943), PX(20442944), PX(20507025), PX(20736192),
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
      { id: 'photo_ananya_1', url: PX(8467523), isBlurred: true, unlockCostCoins: 30, caption: 'naram touch, garam raaz 🌙' },
      { id: 'photo_ananya_2', url: PX(11440691), isBlurred: true, unlockCostCoins: 40, caption: 'haathon me chhupa toofan ✨' },
      { id: 'photo_ananya_3', url: PX(8467547), isBlurred: true, unlockCostCoins: 40, caption: 'andhere me ujala, kapde kahan? 🌙' },
      { id: 'photo_ananya_4', url: PX(8467524), isBlurred: true, unlockCostCoins: 50, caption: 'saaye me lipti, poori nangi 💋' },
      { id: 'photo_ananya_5', url: PX(8467519), isBlurred: true, unlockCostCoins: 50, caption: 'sirf ehsaas, no libaas ✨' },
    ],
  },
  {
    id: 'zara-5',
    name: 'Zara Sheikh',
    age: 23,
    city: 'Lahore',
    country: 'Pakistan',
    language: ['Urdu', 'Hindi', 'English'],
    avatar: PX(35576577),
    coverImage: PX(1229414),
    photos: [
      PX(35576577), PX(1229414), PX(31150690), PX(35234681),
      PX(1185617), PX(36114636), PX(36114629), PX(36114637),
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
      { id: 'photo_zara_1', url: PX(8642554), isBlurred: true, unlockCostCoins: 30, caption: 'sheer me sharmeeli 🌸 andar jhaanko' },
      { id: 'photo_zara_2', url: PX(8642551), isBlurred: true, unlockCostCoins: 40, caption: 'paar-dar UX, sab dikh raha 🙈' },
      { id: 'photo_zara_3', url: PX(8643412), isBlurred: true, unlockCostCoins: 40, caption: 'jaali ke peeche jalwa ❤️' },
      { id: 'photo_zara_4', url: PX(8643413), isBlurred: true, unlockCostCoins: 50, caption: 'saaye me sargoshi, libaas me kami 😏' },
      { id: 'photo_zara_5', url: PX(1542850), isBlurred: true, unlockCostCoins: 50, caption: 'sirf saya, no kapde 💋 ghutno pe wali' },
    ],
  },
  {
    id: 'tanya-6',
    name: 'Tanya Mehta',
    age: 26,
    city: 'South Delhi',
    country: 'India',
    language: ['Hindi', 'English'],
    avatar: PX(2498430),
    coverImage: PX(25007909),
    photos: [
      PX(2498430), PX(25007909), PX(26731736), PX(26731805),
      PX(26208424), PX(26807718), PX(27564039), PX(27575104),
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
      { id: 'photo_tanya_1', url: PX(26100332), isBlurred: true, unlockCostCoins: 30, caption: 'safed me bheegi, bra gayab 🔥' },
      { id: 'photo_tanya_2', url: PX(21367288), isBlurred: true, unlockCostCoins: 40, caption: 'kaale lace me gori 😏' },
      { id: 'photo_tanya_3', url: PX(14037286), isBlurred: true, unlockCostCoins: 40, caption: 'shorts me short temper 🔥' },
      { id: 'photo_tanya_4', url: PX(11254314), isBlurred: true, unlockCostCoins: 50, caption: 'polka dots, no bra 💋' },
      { id: 'photo_tanya_5', url: PX(230986), isBlurred: true, unlockCostCoins: 50, caption: 'sirf roshni aur badan 🔥' },
    ],
  },
  {
    id: 'riya-7',
    name: 'Riya Patel',
    age: 24,
    city: 'Ahmedabad',
    country: 'India',
    language: ['Gujarati', 'Hindi', 'English'],
    avatar: PX(2784078),
    coverImage: PX(28316406),
    photos: [
      PX(2784078), PX(28316406), PX(28517477), PX(28943500),
      PX(29665809), PX(2987879), PX(29805052), PX(29805054),
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
      { id: 'photo_riya_1', url: PX(14559257), isBlurred: true, unlockCostCoins: 30, caption: 'phone ke saath bed pe, bina kapdon 😜' },
      { id: 'photo_riya_2', url: PX(14559260), isBlurred: true, unlockCostCoins: 30, caption: 'couch pe lete, sab khula 🙈' },
      { id: 'photo_riya_3', url: PX(17763587), isBlurred: true, unlockCostCoins: 40, caption: 'corset me kasi, khol doge? 😏' },
      { id: 'photo_riya_4', url: PX(17763579), isBlurred: true, unlockCostCoins: 40, caption: 'ghutno pe wali pose, socho kya hoga 😜' },
      { id: 'photo_riya_5', url: PX(1552520), isBlurred: true, unlockCostCoins: 50, caption: 'sirf saya aur curves 💋' },
    ],
  },
  {
    id: 'mehreen-8',
    name: 'Mehreen Noor',
    age: 22,
    city: 'Dhaka',
    country: 'Bangladesh',
    language: ['Bengali', 'English', 'Hindi'],
    avatar: PX(36226633),
    coverImage: PX(36226637),
    photos: [
      PX(36226633), PX(36226637), PX(32397052), PX(32413917),
      PX(37117918), PX(33306345), PX(36416526), PX(31914218),
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
      { id: 'photo_mehreen_1', url: PX(18605144), isBlurred: true, unlockCostCoins: 30, caption: 'safed me gulab jesi, bina kaante 🌸' },
      { id: 'photo_mehreen_2', url: PX(18605143), isBlurred: true, unlockCostCoins: 30, caption: 'gulab ke saath, kapde kam 🙈' },
      { id: 'photo_mehreen_3', url: PX(23368745), isBlurred: true, unlockCostCoins: 40, caption: 'farsh pe drama, badan pe kuch nahi 😏' },
      { id: 'photo_mehreen_4', url: PX(23368744), isBlurred: true, unlockCostCoins: 40, caption: 'ulti kursi, seedhi niyat ❤️' },
      { id: 'photo_mehreen_5', url: PX(11263814), isBlurred: true, unlockCostCoins: 50, caption: 'gudgudi wali pose, poori nangi 💋' },
    ],
  },
  {
    id: 'natasha-9',
    name: 'Natasha Kapoor',
    age: 25,
    city: 'Bengaluru',
    country: 'India',
    language: ['English', 'Hindi', 'Kannada'],
    avatar: PX(30889618),
    coverImage: PX(31081828),
    photos: [
      PX(30889618), PX(31081828), PX(33069909), PX(34211597),
      PX(34211602), PX(34324399), PX(34324424), PX(34324429),
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
      { id: 'photo_natasha_1', url: PX(15670327), isBlurred: true, unlockCostCoins: 30, caption: 'laal kapde me lipti, andar toofan 🌙' },
      { id: 'photo_natasha_2', url: PX(16803725), isBlurred: true, unlockCostCoins: 40, caption: 'aankhein band, badan khula ✨' },
      { id: 'photo_natasha_3', url: PX(24917295), isBlurred: true, unlockCostCoins: 40, caption: 'andhere me bethi, nangi 🌙' },
      { id: 'photo_natasha_4', url: PX(11229378), isBlurred: true, unlockCostCoins: 50, caption: 'laal parda, nanga badan 💋' },
      { id: 'photo_natasha_5', url: PX(12875180), isBlurred: true, unlockCostCoins: 50, caption: 'kaale me gori, kapde gayab ✨' },
    ],
  },
  {
    id: 'kavya-10',
    name: 'Kavya Reddy',
    age: 23,
    city: 'Hyderabad',
    country: 'India',
    language: ['Telugu', 'Hindi', 'English'],
    avatar: PX(35108817),
    coverImage: PX(36041210),
    photos: [
      PX(35108817), PX(36041210), PX(36041215), PX(36041222),
      PX(36041239), PX(36041253), PX(36364752), PX(36364753),
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
      { id: 'photo_kavya_1', url: PX(24701207), isBlurred: true, unlockCostCoins: 30, caption: 'dhoop me chamakti, kapde kam 🌸' },
      { id: 'photo_kavya_2', url: PX(24701211), isBlurred: true, unlockCostCoins: 30, caption: 'kursi pe bethi, sab dikh raha 🙈' },
      { id: 'photo_kavya_3', url: PX(24701234), isBlurred: true, unlockCostCoins: 40, caption: 'sheher ke upar, kapdon ke bina ❤️' },
      { id: 'photo_kavya_4', url: PX(16709988), isBlurred: true, unlockCostCoins: 40, caption: 'chadar me lipti, andar nangi 😏' },
      { id: 'photo_kavya_5', url: PX(5699881), isBlurred: true, unlockCostCoins: 50, caption: 'bw me bhi garam 💋' },
    ],
  },
  {
    id: 'pooja-11',
    name: 'Pooja Hegde',
    age: 24,
    city: 'Pune',
    country: 'India',
    language: ['Marathi', 'Hindi', 'English'],
    avatar: PX(36818407),
    coverImage: PX(36918310),
    photos: [
      PX(36818407), PX(36918310), PX(36951188), PX(36951400),
      PX(37163059), PX(37415219), PX(37597203), PX(37627047),
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
      { id: 'photo_pooja_1', url: PX(7264262), isBlurred: true, unlockCostCoins: 30, caption: 'bw me bhi bold 😜 kapde kahan?' },
      { id: 'photo_pooja_2', url: PX(8953405), isBlurred: true, unlockCostCoins: 30, caption: 'graceful pose, shameless mood 🙈' },
      { id: 'photo_pooja_3', url: PX(5454616), isBlurred: true, unlockCostCoins: 40, caption: 'neele aasmaan ke neeche, bina kapdon 😏' },
      { id: 'photo_pooja_4', url: PX(13515114), isBlurred: true, unlockCostCoins: 40, caption: 'safed studio, kaale iraade 💋' },
      { id: 'photo_pooja_5', url: PX(3521613), isBlurred: true, unlockCostCoins: 50, caption: 'artistic pose, poori nangi 💋' },
    ],
  },
  {
    id: 'alizeh-12',
    name: 'Alizeh Khan',
    age: 23,
    city: 'Islamabad',
    country: 'Pakistan',
    language: ['Urdu', 'English'],
    avatar: PX(27317239),
    coverImage: PX(20420563),
    photos: [
      PX(27317239), PX(20420563), PX(31874444), PX(13195217),
      PX(13085573), PX(36226629), PX(36226674), PX(36226632),
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
      { id: 'photo_alizeh_1', url: PX(9767174), isBlurred: true, unlockCostCoins: 30, caption: 'leti hui, jagati hui 🌸' },
      { id: 'photo_alizeh_2', url: PX(16973906), isBlurred: true, unlockCostCoins: 40, caption: 'andhere me adaa 🙈' },
      { id: 'photo_alizeh_3', url: PX(10850192), isBlurred: true, unlockCostCoins: 40, caption: 'ghutno pe ghazal ❤️' },
      { id: 'photo_alizeh_4', url: PX(10850193), isBlurred: true, unlockCostCoins: 50, caption: 'studio me sufi, bistar me tufaan 😏' },
      { id: 'photo_alizeh_5', url: PX(922437), isBlurred: true, unlockCostCoins: 50, caption: 'bw me bechain 💋' },
    ],
  },
  {
    id: 'sonia-13',
    name: 'Sonia D’Souza',
    age: 22,
    city: 'Goa',
    country: 'India',
    language: ['English', 'Hindi', 'Konkani'],
    avatar: PX(38532738),
    coverImage: PX(38619315),
    photos: [
      PX(38532738), PX(38619315), PX(38761334), PX(38850343),
      PX(38951469), PX(39280282), PX(39431826), PX(4048041),
    ],
    rating: 4.9,
    callRate: 250,
    isOnline: true,
    tagline: 'goa | bikini me beach, bed pe wild 😜',
    interests: ['Beaches', 'Electronic Music', 'Cocktails', 'Bikinis'],
    videoUrl: FAKE_CALL_VIDEOS[0],
    bio: 'goa se. beach, music, late night parties aur subah tak ki masti. life ko lightly, mujhe tightly 😜',
    totalCalls: 4120,
    archetype: 'playful_tease',
    lockedPhotos: [
      { id: 'photo_sonia_1', url: PX(36384635), isBlurred: true, unlockCostCoins: 30, caption: 'laal me goa wali garmi 😜' },
      { id: 'photo_sonia_2', url: PX(9662588), isBlurred: true, unlockCostCoins: 30, caption: 'lights me chamakti, kapde kam 🙈' },
      { id: 'photo_sonia_3', url: PX(26761372), isBlurred: true, unlockCostCoins: 40, caption: 'muskurahat ke saath nanganapan 😏' },
      { id: 'photo_sonia_4', url: PX(30219296), isBlurred: true, unlockCostCoins: 40, caption: 'elegant pose, shameless mood 💋' },
      { id: 'photo_sonia_5', url: PX(35054230), isBlurred: true, unlockCostCoins: 50, caption: 'stool pe style, sab khula 💋' },
    ],
  },
  {
    id: 'diya-14',
    name: 'Diya Sen',
    age: 25,
    city: 'Jaipur',
    country: 'India',
    language: ['Hindi', 'Rajasthani', 'English'],
    avatar: PX(7685497),
    coverImage: PX(7685509),
    photos: [
      PX(7685497), PX(7685509), PX(7686311), PX(7686312),
      PX(7686322), PX(8489648), PX(8489649), PX(8489763),
    ],
    rating: 4.9,
    callRate: 280,
    isOnline: true,
    tagline: 'jaipur | royal andaaz, naughty iraade ✨',
    interests: ['Palaces', 'Traditional Fashion', 'Photography', 'Royalty'],
    videoUrl: FAKE_CALL_VIDEOS[1],
    bio: 'jaipur se. photography, traditional fashion aur raat ke shahi shauk. tameez se tadpana aata hai ✨',
    totalCalls: 2950,
    archetype: 'mysterious_sensual',
    lockedPhotos: [
      { id: 'photo_diya_1', url: PX(20079525), isBlurred: true, unlockCostCoins: 30, caption: 'parde me lipti pari ✨ haath jahan hai dekho' },
      { id: 'photo_diya_2', url: PX(8024184), isBlurred: true, unlockCostCoins: 40, caption: 'chamakti body, bina kapdon 🌙' },
      { id: 'photo_diya_3', url: PX(10009027), isBlurred: true, unlockCostCoins: 40, caption: 'saaye ka khel, nange badan ✨' },
      { id: 'photo_diya_4', url: PX(30359547), isBlurred: true, unlockCostCoins: 50, caption: 'andhere me roshni, kapde gayab 🌙' },
      { id: 'photo_diya_5', url: PX(18032246), isBlurred: true, unlockCostCoins: 50, caption: 'bahein mod ke, sab dikha ke 💋' },
    ],
  },
  {
    id: 'shreya-15',
    name: 'Shreya Verma',
    age: 24,
    city: 'Lucknow',
    country: 'India',
    language: ['Hindi', 'Urdu', 'English'],
    avatar: PX(8856240),
    coverImage: PX(8856245),
    photos: [
      PX(8856240), PX(8856245), PX(8887117), PX(8887253),
      PX(8915238), PX(8979406), PX(9345708), PX(9419163),
    ],
    rating: 4.8,
    callRate: 300,
    isOnline: true,
    tagline: 'tehzeeb se tadpaungi 🌸',
    interests: ['Kebabs', 'Chikankari', 'Shayari', 'Music'],
    videoUrl: FAKE_CALL_VIDEOS[2],
    bio: 'lucknow se. kebabs, shayari, music aur adaa se bechain karna. tehzeeb se baat karo, neend uda dungi 🌸',
    totalCalls: 2280,
    archetype: 'sweet_romantic',
    lockedPhotos: [
      { id: 'photo_shreya_1', url: PX(31540814), isBlurred: true, unlockCostCoins: 30, caption: 'dulhan wali lace, suhagraat wali feel 🌸' },
      { id: 'photo_shreya_2', url: PX(31540815), isBlurred: true, unlockCostCoins: 30, caption: 'naram roshni, garam badan 🙈' },
      { id: 'photo_shreya_3', url: PX(8919905), isBlurred: true, unlockCostCoins: 40, caption: 'safed me lipti, andar toofan ❤️' },
      { id: 'photo_shreya_4', url: PX(8919716), isBlurred: true, unlockCostCoins: 40, caption: 'khidki pe jhuki, bra khuli 😏' },
      { id: 'photo_shreya_5', url: PX(16008685), isBlurred: true, unlockCostCoins: 50, caption: 'baahon me chhupa seena 💋 khud dekh lo' },
    ],
  },
  {
    id: 'nadia-16',
    name: 'Nadia Qureshi',
    age: 26,
    city: 'Karachi',
    country: 'Pakistan',
    language: ['Urdu', 'Sindhi', 'English'],
    avatar: PX(36226638),
    coverImage: PX(12121461),
    photos: [
      PX(36226638), PX(12121461), PX(17043208), PX(16503140),
      PX(12058504), PX(11938222), PX(9252918), PX(12484974),
    ],
    rating: 4.9,
    callRate: 350,
    isOnline: true,
    tagline: 'karachi | stylist hu, kapde utarna bhi aata hai 🔥',
    interests: ['Fashion Runways', 'Luxury Cafes', 'Driving', 'Perfumes'],
    videoUrl: FAKE_CALL_VIDEOS[3],
    bio: 'stylist hu. fashion, perfumes, long drives aur raat bhar ka high voltage. energy match karo 🔥',
    totalCalls: 4530,
    archetype: 'bold_alluring',
    lockedPhotos: [
      { id: 'photo_nadia_1', url: PX(9937528), isBlurred: true, unlockCostCoins: 30, caption: 'kaali deewar, gori body 🔥 kapde?' },
      { id: 'photo_nadia_2', url: PX(12512504), isBlurred: true, unlockCostCoins: 40, caption: 'lakdi pe tiki, sab khula 😏' },
      { id: 'photo_nadia_3', url: PX(13570265), isBlurred: true, unlockCostCoins: 40, caption: 'kamar pe haath, nazar neeche 🔥' },
      { id: 'photo_nadia_4', url: PX(13636983), isBlurred: true, unlockCostCoins: 50, caption: 'studio me confident, bistar me wild 💋' },
      { id: 'photo_nadia_5', url: PX(29909834), isBlurred: true, unlockCostCoins: 50, caption: 'laal deewar, laal iraade 💋' },
    ],
  },
  {
    id: 'fariha-17',
    name: 'Fariha Rahman',
    age: 23,
    city: 'Dhaka',
    country: 'Bangladesh',
    language: ['Bengali', 'English'],
    avatar: PX(37951152),
    coverImage: PX(18730647),
    photos: [
      PX(37951152), PX(18730647), PX(30229765), PX(39448902),
      PX(39299504), PX(19335606), PX(39299495), PX(39299445),
    ],
    rating: 4.8,
    callRate: 380,
    isOnline: true,
    tagline: 'sarson ke khet jesi, andar se aag 🌸',
    interests: ['Rabindra Sangeet', 'Painting', 'Tea', 'Rain'],
    videoUrl: FAKE_CALL_VIDEOS[4],
    bio: 'dhaka se. painting, chai, baarish aur bheegi raatein. sunne wale sabse zyada tadapte hain 🌸',
    totalCalls: 1870,
    archetype: 'sweet_romantic',
    lockedPhotos: [
      { id: 'photo_fariha_1', url: PX(3902086), isBlurred: true, unlockCostCoins: 30, caption: 'safed nighty, geele khayal 🌸' },
      { id: 'photo_fariha_2', url: PX(35022672), isBlurred: true, unlockCostCoins: 40, caption: 'beth ke socha, tumhare baare me 🙈' },
      { id: 'photo_fariha_3', url: PX(15262376), isBlurred: true, unlockCostCoins: 40, caption: 'safed jaali, kaale iraade 😏' },
      { id: 'photo_fariha_4', url: PX(10839145), isBlurred: true, unlockCostCoins: 50, caption: 'ghutno pe dua, badan pe kuch nahi ❤️' },
      { id: 'photo_fariha_5', url: PX(16455965), isBlurred: true, unlockCostCoins: 50, caption: 'kursi pe queen, kapde missing 💋' },
    ],
  },
  {
    id: 'zoya-18',
    name: 'Zoya Mirza',
    age: 24,
    city: 'Downtown Dubai',
    country: 'UAE',
    language: ['English', 'Hindi', 'Arabic'],
    avatar: PX(36770961),
    coverImage: PX(36770960),
    photos: [
      PX(36770961), PX(36770960), PX(36424206), PX(36435138),
      PX(36911224), PX(1108601), PX(8002579), PX(34817460),
    ],
    rating: 5.0,
    callRate: 420,
    isOnline: true,
    tagline: 'dubai | dinner ke baad dessert main 🔥',
    interests: ['Fine Dining', 'Yachting', 'Champagne', 'Luxury'],
    videoUrl: FAKE_CALL_VIDEOS[5],
    bio: 'dubai me rehti hu. good food, achhi company aur uske baad jo hota hai. boring mat hona bas 🔥',
    totalCalls: 5120,
    archetype: 'bold_alluring',
    lockedPhotos: [
      { id: 'photo_zoya_1', url: PX(16585363), isBlurred: true, unlockCostCoins: 40, caption: 'stylish pose, shameless mood 🔥' },
      { id: 'photo_zoya_2', url: PX(16585365), isBlurred: true, unlockCostCoins: 40, caption: 'scarf aur heels, beech me kuch nahi 😏' },
      { id: 'photo_zoya_3', url: PX(13750123), isBlurred: true, unlockCostCoins: 50, caption: 'safed me kali, poori khuli 💋' },
      { id: 'photo_zoya_4', url: PX(13636978), isBlurred: true, unlockCostCoins: 50, caption: 'bra aur stockings, bas itna hi 🔥' },
      { id: 'photo_zoya_5', url: PX(11780432), isBlurred: true, unlockCostCoins: 50, caption: 'seb ke saath, bina chilka 💋 kha loge?' },
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
    avatar: PX(219582),
    coverImage: PX(2068350),
    photos: [
      PX(219582), PX(2068350), PX(13807192), PX(17454556),
      PX(13793985), PX(19269056), PX(4450376), PX(15708130),
    ],
    rating: 4.9,
    callRate: 460,
    isOnline: true,
    tagline: 'london | sarcasm ke saath seduction 😜',
    interests: ['British Pop', 'Cocktails', 'Fashion', 'Art'],
    videoUrl: FAKE_CALL_VIDEOS[6],
    bio: 'london se. cheeky humour, achhi playlist aur raat ko thodi si naughtiness. desi boys sabse zyada mazedaar 😜',
    totalCalls: 4120,
    archetype: 'playful_tease',
    lockedPhotos: [
      { id: 'photo_emily_1', url: PX(15418747), isBlurred: true, unlockCostCoins: 40, caption: 'kaale me gori, poori khuli 😜' },
      { id: 'photo_emily_2', url: PX(17127676), isBlurred: true, unlockCostCoins: 40, caption: 'aaina jhooth nahi bolta, main nangi hu 🙈' },
      { id: 'photo_emily_3', url: PX(11254431), isBlurred: true, unlockCostCoins: 50, caption: 'fishnet me fish, pakad loge? 😏' },
      { id: 'photo_emily_4', url: PX(19061156), isBlurred: true, unlockCostCoins: 50, caption: 'tights ke andar mysteries 💋' },
      { id: 'photo_emily_5', url: PX(20813839), isBlurred: true, unlockCostCoins: 50, caption: 'subah ki dhoop, nange badan 💋 good morning?' },
    ],
  },
  {
    id: 'camille-20',
    name: 'Camille Laurent',
    age: 23,
    city: 'Paris',
    country: 'France',
    language: ['French', 'English'],
    avatar: PX(15932122),
    coverImage: PX(27587342),
    photos: [
      PX(15932122), PX(27587342), PX(27587343), PX(32744444),
      PX(32744442), PX(32750353), PX(32750354), PX(31359871),
    ],
    rating: 4.9,
    callRate: 500,
    isOnline: true,
    tagline: 'paris | l’amour, but make it naughty ✨',
    interests: ['Croissants', 'Art Museums', 'Wine', 'Romance'],
    videoUrl: FAKE_CALL_VIDEOS[7],
    bio: 'paris se. art, wine, romance aur aadhi raat ki shararatein. english me tadpati hu ✨',
    totalCalls: 3890,
    archetype: 'mysterious_sensual',
    lockedPhotos: [
      { id: 'photo_camille_1', url: PX(32286017), isBlurred: true, unlockCostCoins: 40, caption: 'laal baal, laal iraade ✨ bra gayab' },
      { id: 'photo_camille_2', url: PX(25663), isBlurred: true, unlockCostCoins: 40, caption: 'upar ki taraf, kapde neeche 🌙' },
      { id: 'photo_camille_3', url: PX(5586542), isBlurred: true, unlockCostCoins: 50, caption: 'heels ke saath, aur kuch nahi ✨' },
      { id: 'photo_camille_4', url: PX(4284548), isBlurred: true, unlockCostCoins: 50, caption: 'almari me chhupi, nangi 🌙 dhoondo mujhe' },
      { id: 'photo_camille_5', url: PX(35905284), isBlurred: true, unlockCostCoins: 50, caption: 'purple baal, purple mood 💋 french kiss jesa' },
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
