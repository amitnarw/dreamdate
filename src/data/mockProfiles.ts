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
  'https://media.gettyimages.com/id/1298691168/video/transgender-woman-on-a-video-chat-at-home-webcam-personal-perspective.mp4',
  'https://media.gettyimages.com/id/1386939789/video/beautiful-black-woman-vlogging.mp4',
  'https://media.gettyimages.com/id/2264379518/video/happy-gen-z-asian-woman-smiles-while-having-a-video-call-on-smart-phone-in-public-park.mp4',
  'https://media.gettyimages.com/id/2196158992/video/teenager-friendly-greeting-on-a-video-call.mp4',
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'emily-1',
    name: 'Emily',
    age: 24,
    city: 'California',
    country: 'USA',
    language: ['English'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 40,
    isOnline: true,
    tagline: 'Online now! Video call me anytime',
    interests: ['Swimming', 'Dancing', 'Reading'],
    videoUrl: FAKE_CALL_VIDEOS[0],
    bio: "Looking for someone who's passionate about life, enjoys deep conversations, and isn't afraid to try new things.",
    totalCalls: 1840,
  },
  {
    id: 'mia-2',
    name: 'Mia',
    age: 26,
    city: 'New York',
    country: 'USA',
    language: ['English'],
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkCQ7z2InAJz7RAU0cA1-g9d-lWQB64MvrL_VhECt4Erk39_gc4Bkhj3UzKR6lA34AvLBDW083V-RpIRFkxYuHcN6TKAj1S7a9FCgggqc4hVBwqwMVfg9D54EKTtpg14pZiq69opynPL2kAyO_0rwuax_mKfGMzP3O5MX7uaLcOfgnuU9Cer1E9-WrHkylZ-nn5ZwwVdVHU988hjDGqmARpxMb9-PS1ARtxa4Rj-iOBb0U6mKmvMAz',
    rating: 4.8,
    callRate: 50,
    isOnline: false,
    tagline: 'Busy right now, leave a message or chat with me',
    interests: ['Fashion', 'Acting', 'Cocktails'],
    videoUrl: FAKE_CALL_VIDEOS[1],
    bio: 'New York model with a spark for adventure. Always down for late-night laughs and real connections.',
    totalCalls: 2190,
  },
  {
    id: 'sophia-3',
    name: 'Sophia',
    age: 22,
    city: 'Miami',
    country: 'USA',
    language: ['English', 'Spanish'],
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxRFhcdyTDzRLiVin26wwgvpsNmvbAytn_KKgT1DhNYJSH-lwTqj4caDEfnUCbDvZfLjKGCDNKYsK5KGe_JXWSBHbq0R6NZcpFTstGOJFMz2ltvQNOCRvn2i380WpLYD0jeJQ0CEk4iFAZ8XSghgq4FGqS9lLy0Xwgczy-qWoHBRhHCtilC9Vmro8V2sPq00SuJIvSIcwrRJRWSs0BEOIPsg7DfwvsdC66D7SMhQiPTErxfzma90MW',
    rating: 5.0,
    callRate: 45,
    isOnline: true,
    tagline: 'Warm vibes only. Call me for a midnight chat',
    interests: ['Music', 'Nightlife', 'Travel', 'Art'],
    videoUrl: FAKE_CALL_VIDEOS[2],
    bio: 'Miami local, love beach sunsets, good music, and authentic conversations. Tap video call to connect!',
    totalCalls: 3410,
  },
  {
    id: 'olivia-4',
    name: 'Olivia',
    age: 25,
    city: 'London',
    country: 'UK',
    language: ['English'],
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBS7NRwe6CBit7VgzYcPM_WTxF_-zW3FvH9u7hfiyDQ20T6tylItyYSeAj5pDdp__LkiFrBKczPPmomslhId5v6s7rAn9Dd35YXGAFxaqw3dVWFkLHqwjkWCWm77vkBRMGIGUdYkOxlGSjL6WBOzJdICaEYLC8hgXVP-0pGHNsJE2rRD8lJKneNntxP3wQkz3ebZ9gNeJ0z5QdtzlD9iYSs6s6mwwFYynNWbiGTxVt2amdRCUw8wYtn',
    rating: 4.9,
    callRate: 40,
    isOnline: true,
    tagline: 'British charm, sweet talks and endless laughter',
    interests: ['Art', 'Reading', 'Coffee', 'Architecture'],
    videoUrl: FAKE_CALL_VIDEOS[3],
    bio: 'Living in Central London. Passionate about literature, cozy cafe talks, and genuine friendships.',
    totalCalls: 1680,
  },
  {
    id: 'amelia-5',
    name: 'Amelia',
    age: 23,
    city: 'Los Angeles',
    country: 'USA',
    language: ['English'],
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA68e3Sw8fgo0mmrroDbtLVUwpLQC1JhDnUQGloC-DcqKStgnQkt0SYT0hBbKBFAr5sFKWDxW7njBfOHXydqzrDnMvzbEGVqBQvYOgEPxQqw57jqebOsHWLidyBPUm5oGTt1jWZydmTWUq4OUJ8HCipD3jjPGmA64ldseEb9nttp4CXnSsbkUEr54-A1YDqcUqjYIr0lMOOYCRUfkOYOOztf9vAz7iEw9vJ4guajxwTV0NgJTVddgjm',
    rating: 4.8,
    callRate: 35,
    isOnline: true,
    tagline: 'Sunny smile, ready to brighten your day',
    interests: ['Photography', 'Yoga', 'Hiking', 'Film'],
    videoUrl: FAKE_CALL_VIDEOS[4],
    bio: 'LA native working in film. Love creative minds and late-night spontaneous face-to-face calls.',
    totalCalls: 1250,
  },
  {
    id: 'isabella-6',
    name: 'Isabella Lewis',
    age: 24,
    city: 'California',
    country: 'USA',
    language: ['English', 'Italian'],
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEirk9-10PX-w05dwkLArSN9RNQWbnaJlZmUNdflobPWdj0WJfB5v4v5g_U0xERc8vHXXSfsvCJpnjZVr2IOQC6DtPIECTNilShMqzw-0Gyvvh2q-JD-Sx9rdrUI4pE5LJNxmxlHujuGE9s3nPijpS4sbl3A_ooBhR3sd1U5r-y6IOS9U8s95rNoHa9sXwIOA278dP6QequYsbV0iNkAFnrHs78mb8zgdPcVlfYim4mb9DyYDr9xZB',
    rating: 5.0,
    callRate: 60,
    isOnline: true,
    tagline: 'Direct 1-on-1 private call waiting for you',
    interests: ['Swimming', 'Dancing', 'Reading'],
    videoUrl: FAKE_CALL_VIDEOS[5],
    bio: "Looking for someone who's passionate about life, enjoys deep conversations, and isn't afraid to try new things.",
    totalCalls: 4500,
  },
  {
    id: 'julia-7',
    name: 'Julia Siti',
    age: 24,
    city: 'Bali',
    country: 'Indonesia',
    language: ['English', 'Indonesian'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 50,
    isOnline: true,
    tagline: 'Tropical warmth and island smiles',
    interests: ['Cat', 'Football', 'Fashion', 'Chinese'],
    videoUrl: FAKE_CALL_VIDEOS[6],
    bio: 'Island resident, model and fitness enthusiast. Love connecting with people from all around.',
    totalCalls: 3100,
  },
  {
    id: 'elena-8',
    name: 'Elena',
    age: 23,
    city: 'Milan',
    country: 'Italy',
    language: ['Italian', 'English'],
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 45,
    isOnline: true,
    tagline: 'High fashion and cozy conversations',
    interests: ['Dining', 'Wine', 'Glamour', 'Art'],
    videoUrl: FAKE_CALL_VIDEOS[7],
    bio: 'Milan fashion designer and wine lover. Connect with me for a sophisticated private chat.',
    totalCalls: 1980,
  },
  {
    id: 'chloe-9',
    name: 'Chloe',
    age: 21,
    city: 'Paris',
    country: 'France',
    language: ['French', 'English'],
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxEgk-EOYOWmIxUHaTYKP4d0w9cpZw6l4LDy_47iA4nMXbH-dvDNNibaOfzI_VxLKxJnqKLW8hJA7QEFbyM7dbAv-o2cMkY4ahjWrmkjwLryX39Gi-y1Fl6BW9yNJBjmLVcgL1BJ6qyS1eIbg_CJ16O6iMBYj7_jNCWgg7XCgBEIVo4ATCS0qovkcLy4QO2Ee9uD-sNDDKFhHsiuQZBeD16cGXe1Aq5XoGsePfeqDrBrv9eJG1PMqe',
    rating: 4.7,
    callRate: 35,
    isOnline: true,
    tagline: 'Parisian vibes, sweet dreams',
    interests: ['Modeling', 'Runway', 'French', 'Cinema'],
    videoUrl: FAKE_CALL_VIDEOS[8],
    bio: 'Living near Montmartre. Passionate about romantic conversations and meeting sweet souls.',
    totalCalls: 890,
  },
  {
    id: 'priya-10',
    name: 'Priya',
    age: 23,
    city: 'Mumbai',
    country: 'India',
    language: ['Hindi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    callRate: 40,
    isOnline: true,
    tagline: 'Online now! Video call and chat with me',
    interests: ['Late Night Talks', 'Music', 'Bollywood'],
    videoUrl: FAKE_CALL_VIDEOS[9],
    bio: 'Mumbai glam model, loves deep conversations, laughing, and meeting sweet people. Call me anytime!',
    totalCalls: 1420,
  },
  {
    id: 'simran-11',
    name: 'Simran',
    age: 24,
    city: 'Delhi',
    country: 'India',
    language: ['Punjabi', 'Hindi'],
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    callRate: 50,
    isOnline: true,
    tagline: 'Sweet and glamorous late night talks',
    interests: ['Bhangra', 'Travel', 'Cocktails', 'Nightlife'],
    videoUrl: FAKE_CALL_VIDEOS[10],
    bio: 'Bubbly girl looking for genuine friends. Let’s connect on a private video call!',
    totalCalls: 2190,
  },
  {
    id: 'pooja-12',
    name: 'Pooja',
    age: 25,
    city: 'Goa',
    country: 'India',
    language: ['Hindi', 'English'],
    avatar: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
    rating: 5.0,
    callRate: 60,
    isOnline: true,
    tagline: 'Direct 1-on-1 private video call available',
    interests: ['Acting', 'Fitness', 'Nightlife', 'Cinema'],
    videoUrl: FAKE_CALL_VIDEOS[11],
    bio: 'Goa influencer & model. Super warm, lively, and always ready to make your night special.',
    totalCalls: 3410,
  }
];

export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  icon: any;
  image: string;
  coins: number;
  category: 'Popular' | 'Luxury' | 'Romance' | 'VIP';
  description: string;
  accentColor: string;
  glowColor: string;
}

export const VIRTUAL_GIFTS: VirtualGift[] = [
  // Popular
  { id: 'rose', name: 'Red Rose', emoji: '🌹', icon: 'flower', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', coins: 10, category: 'Popular', description: 'Sweet gesture', accentColor: '#FF2A6D', glowColor: 'rgba(255, 42, 109, 0.4)' },
  { id: 'lollipop', name: 'Sweet Candy', emoji: '🍭', icon: 'ice-cream', image: 'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=600&q=80', coins: 20, category: 'Popular', description: 'Sweet treat', accentColor: '#FF69B4', glowColor: 'rgba(255, 105, 180, 0.4)' },
  { id: 'coffee', name: 'Warm Latte', emoji: '☕', icon: 'cafe', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80', coins: 30, category: 'Popular', description: 'Cozy vibes', accentColor: '#C48A57', glowColor: 'rgba(196, 138, 87, 0.4)' },
  { id: 'sparkles', name: 'Magic Sparkles', emoji: '✨', icon: 'sparkles', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80', coins: 40, category: 'Popular', description: 'Brighten her day', accentColor: '#FFD700', glowColor: 'rgba(255, 215, 0, 0.4)' },
  { id: 'heart', name: 'Heart Flame', emoji: '❤️‍🔥', icon: 'heart', image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80', coins: 50, category: 'Popular', description: 'True affection', accentColor: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.4)' },
  { id: 'kiss', name: 'Sweet Kiss', emoji: '💋', icon: 'heart-circle', image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80', coins: 80, category: 'Popular', description: 'Sending love', accentColor: '#F43F5E', glowColor: 'rgba(244, 63, 94, 0.4)' },

  // Romance
  { id: 'bouquet', name: 'Rose Bouquet', emoji: '💐', icon: 'flower-outline', image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80', coins: 120, category: 'Romance', description: '100 Roses', accentColor: '#F472B6', glowColor: 'rgba(244, 114, 182, 0.4)' },
  { id: 'love-letter', name: 'Secret Note', emoji: '💌', icon: 'mail', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80', coins: 150, category: 'Romance', description: 'Private confession', accentColor: '#FB7185', glowColor: 'rgba(251, 113, 133, 0.4)' },
  { id: 'chocolate', name: 'Choco Box', emoji: '🍫', icon: 'cube', image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80', coins: 180, category: 'Romance', description: 'Delicious treat', accentColor: '#92400E', glowColor: 'rgba(146, 64, 14, 0.4)' },
  { id: 'teddy', name: 'Giant Teddy', emoji: '🧸', icon: 'happy', image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80', coins: 250, category: 'Romance', description: 'Warm hugs', accentColor: '#D97706', glowColor: 'rgba(217, 119, 6, 0.4)' },
  { id: 'fireworks', name: 'Fireworks', emoji: '🎆', icon: 'color-wand', image: 'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?auto=format&fit=crop&w=600&q=80', coins: 350, category: 'Romance', description: 'Sky celebration', accentColor: '#A855F7', glowColor: 'rgba(168, 85, 247, 0.4)' },
  { id: 'heart-box', name: 'Velvet Gift', emoji: '🎁', icon: 'gift', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80', coins: 400, category: 'Romance', description: 'Special surprise', accentColor: '#EC4899', glowColor: 'rgba(236, 72, 153, 0.4)' },

  // Luxury
  { id: 'cocktail', name: 'Pink Martini', emoji: '🍸', icon: 'wine', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80', coins: 100, category: 'Luxury', description: 'VIP toast', accentColor: '#06B6D4', glowColor: 'rgba(6, 182, 212, 0.4)' },
  { id: 'perfume', name: 'Chanel Scent', emoji: '💎', icon: 'flask', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80', coins: 300, category: 'Luxury', description: 'Luxury fragrance', accentColor: '#38BDF8', glowColor: 'rgba(56, 189, 248, 0.4)' },
  { id: 'champagne', name: 'Dom Pérignon', emoji: '🍾', icon: 'beer', image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=600&q=80', coins: 450, category: 'Luxury', description: 'Pop the bottle', accentColor: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.4)' },
  { id: 'handbag', name: 'Designer Bag', emoji: '👜', icon: 'briefcase', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80', coins: 600, category: 'Luxury', description: 'Haute couture', accentColor: '#E11D48', glowColor: 'rgba(225, 29, 72, 0.4)' },
  { id: 'ring', name: 'Diamond Ring', emoji: '💍', icon: 'disc', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80', coins: 800, category: 'Luxury', description: 'Forever shine', accentColor: '#67E8F9', glowColor: 'rgba(103, 232, 249, 0.5)' },
  { id: 'crown', name: 'Queen Tiara', emoji: '👑', icon: 'ribbon', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80', coins: 1200, category: 'Luxury', description: 'Fit for royalty', accentColor: '#FBBF24', glowColor: 'rgba(251, 191, 36, 0.5)' },

  // VIP
  { id: 'supercar', name: 'Neon Supercar', emoji: '🏎️', icon: 'car-sport', image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80', coins: 2000, category: 'VIP', description: 'V12 power', accentColor: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.5)' },
  { id: 'helicopter', name: 'VIP Heli Ride', emoji: '🚁', icon: 'airplane', image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80', coins: 3500, category: 'VIP', description: 'City lights tour', accentColor: '#3B82F6', glowColor: 'rgba(59, 130, 246, 0.5)' },
  { id: 'yacht', name: 'Sunset Yacht', emoji: '🛥️', icon: 'boat', image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=600&q=80', coins: 5000, category: 'VIP', description: 'Ocean cruise', accentColor: '#0284C7', glowColor: 'rgba(2, 132, 199, 0.5)' },
  { id: 'castle', name: 'Royal Castle', emoji: '🏰', icon: 'business', image: 'https://images.unsplash.com/photo-1533158307587-828f0a76ef96?auto=format&fit=crop&w=600&q=80', coins: 7500, category: 'VIP', description: 'Fairytale romance', accentColor: '#8B5CF6', glowColor: 'rgba(139, 92, 246, 0.5)' },
  { id: 'jet', name: 'Private Jet', emoji: '🛩️', icon: 'airplane', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80', coins: 10000, category: 'VIP', description: 'First class escape', accentColor: '#6366F1', glowColor: 'rgba(99, 102, 241, 0.5)' },
  { id: 'rocket', name: 'To The Moon', emoji: '🚀', icon: 'rocket', image: 'https://images.unsplash.com/photo-1517976487502-575020411a78?auto=format&fit=crop&w=600&q=80', coins: 15000, category: 'VIP', description: 'Galactic love', accentColor: '#F97316', glowColor: 'rgba(249, 115, 22, 0.5)' },
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
      g.icon.toLowerCase() === clean ||
      g.emoji === clean ||
      clean.includes(g.name.toLowerCase()) ||
      clean.includes(g.id.toLowerCase()) ||
      clean.includes(g.emoji)
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
  // Fallbacks for common legacy names
  if (clean.includes('plane') || clean.includes('airplace') || clean.includes('jet')) {
    return { emoji: '🛩️', name: 'Private Jet', coins: 10000, accentColor: '#6366F1', glowColor: 'rgba(99, 102, 241, 0.5)', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80' };
  }
  if (clean.includes('cream') || clean.includes('candy') || clean.includes('ice')) {
    return { emoji: '🍭', name: 'Sweet Candy', coins: 20, accentColor: '#FF69B4', glowColor: 'rgba(255, 105, 180, 0.4)', image: 'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=600&q=80' };
  }
  if (clean.includes('rose') || clean.includes('flower')) {
    return { emoji: '🌹', name: 'Red Rose', coins: 10, accentColor: '#FF2A6D', glowColor: 'rgba(255, 42, 109, 0.4)', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80' };
  }
  if (clean.includes('car')) {
    return { emoji: '🏎️', name: 'Neon Supercar', coins: 2000, accentColor: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.5)', image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80' };
  }
  if (clean.includes('ring') || clean.includes('diamond')) {
    return { emoji: '💍', name: 'Diamond Ring', coins: 800, accentColor: '#67E8F9', glowColor: 'rgba(103, 232, 249, 0.5)', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80' };
  }
  if (clean.includes('crown') || clean.includes('tiara')) {
    return { emoji: '👑', name: 'Queen Tiara', coins: 1200, accentColor: '#FBBF24', glowColor: 'rgba(251, 191, 36, 0.5)', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80' };
  }
  if (clean.includes('yacht') || clean.includes('boat')) {
    return { emoji: '🛥️', name: 'Sunset Yacht', coins: 5000, accentColor: '#0284C7', glowColor: 'rgba(2, 132, 199, 0.5)', image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=600&q=80' };
  }
  if (clean.includes('heli')) {
    return { emoji: '🚁', name: 'VIP Heli Ride', coins: 3500, accentColor: '#3B82F6', glowColor: 'rgba(59, 130, 246, 0.5)', image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80' };
  }
  return { emoji: '🎁', name: nameOrIcon, coins: 100, accentColor: '#F65592', glowColor: 'rgba(246, 85, 146, 0.4)', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80' };
}

