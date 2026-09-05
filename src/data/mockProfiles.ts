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

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'emily-1',
    name: 'Emily',
    age: 24,
    city: 'California',
    country: 'USA',
    language: ['English'],
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5vA0UDg1dH_z7HvxnhzWLsgDjle0J94giuIB3kmQc6YzPtV3LiJ0STJTyiBrH-khWUYX1CMRDx3DUpK2hLlKv6T6m0GuZdZzy8qYBTQycshNXRBkcTs9u4Ov95mui_KyrfJQlioYRymyuzCm7gC0H00V-jOXEI8IYzLx4Ek-38T14-uDqVaSyUg_BR2Wy5DZyXUO3Bv_VT__xjwiKqwl4jvCihevY0H5XMAoBUVGWQebIGM2B7g8',
    rating: 4.9,
    callRate: 40,
    isOnline: true,
    tagline: 'Online now! Video call me anytime ❤️',
    interests: ['Swimming', 'Dancing', 'Reading'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
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
    tagline: 'Busy right now, leave a message or chat with me! ✨',
    interests: ['Fashion', 'Acting', 'Cocktails'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
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
    tagline: 'Warm vibes only. Call me for a midnight chat! 🌙',
    interests: ['Music', 'Nightlife', 'Travel', 'Art'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
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
    tagline: 'British charm, sweet talks & endless laughter ☕',
    interests: ['Art', 'Reading', 'Coffee', 'Architecture'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
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
    tagline: 'Sunny smile, ready to brighten your day 😊',
    interests: ['Photography', 'Yoga', 'Hiking', 'Film'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
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
    tagline: 'Direct 1-on-1 private call waiting for you 💋',
    interests: ['Swimming', 'Dancing', 'Reading'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
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
    tagline: 'Tropical warmth and island smiles 🌺',
    interests: ['Cat', 'Football', 'Fashion', 'Chinese'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
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
    tagline: 'High fashion & cozy conversations ✨',
    interests: ['Dining', 'Wine', 'Glamour', 'Art'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
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
    tagline: 'Parisian vibes, sweet dreams 🥐',
    interests: ['Modeling', 'Runway', 'French', 'Cinema'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
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
    tagline: 'Online now! Video call karo na baat karte hain ❤️',
    interests: ['Late Night Talks', 'Music', 'Bollywood'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
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
    tagline: 'Sweet and glamorous late night talks ✨',
    interests: ['Bhangra', 'Travel', 'Cocktails', 'Nightlife'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
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
    tagline: 'Direct 1-on-1 private video call available 💋',
    interests: ['Acting', 'Fitness', 'Nightlife', 'Cinema'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    bio: 'Goa influencer & model. Super warm, lively, and always ready to make your night special.',
    totalCalls: 3410,
  }
];

export interface VirtualGift {
  id: string;
  name: string;
  icon: string;
  coins: number;
  category: 'Popular' | 'Luxury' | 'Romance' | 'VIP';
  description: string;
}

export const VIRTUAL_GIFTS: VirtualGift[] = [
  // Popular
  { id: 'rose', name: 'Red Rose', icon: '🌹', coins: 10, category: 'Popular', description: 'Sweet gesture' },
  { id: 'lollipop', name: 'Sweet Candy', icon: '🍭', coins: 20, category: 'Popular', description: 'Sweet treat' },
  { id: 'coffee', name: 'Warm Latte', icon: '☕', coins: 30, category: 'Popular', description: 'Cozy vibes' },
  { id: 'sparkles', name: 'Magic Sparkles', icon: '✨', coins: 40, category: 'Popular', description: 'Brighten her day' },
  { id: 'heart', name: 'Heart Flame', icon: '💖', coins: 50, category: 'Popular', description: 'True affection' },
  { id: 'kiss', name: 'Sweet Kiss', icon: '💋', coins: 80, category: 'Popular', description: 'Sending love' },

  // Romance
  { id: 'bouquet', name: 'Rose Bouquet', icon: '💐', coins: 120, category: 'Romance', description: '100 Roses' },
  { id: 'love-letter', name: 'Secret Note', icon: '💌', coins: 150, category: 'Romance', description: 'Private confession' },
  { id: 'chocolate', name: 'Choco Box', icon: '🍫', coins: 180, category: 'Romance', description: 'Delicious treat' },
  { id: 'teddy', name: 'Giant Teddy', icon: '🧸', coins: 250, category: 'Romance', description: 'Warm hugs' },
  { id: 'fireworks', name: 'Fireworks', icon: '🎆', coins: 350, category: 'Romance', description: 'Sky celebration' },
  { id: 'heart-box', name: 'Velvet Gift', icon: '🎁', coins: 400, category: 'Romance', description: 'Special surprise' },

  // Luxury
  { id: 'cocktail', name: 'Pink Martini', icon: '🍸', coins: 100, category: 'Luxury', description: 'VIP toast' },
  { id: 'perfume', name: 'Chanel Scent', icon: '💄', coins: 300, category: 'Luxury', description: 'Luxury fragrance' },
  { id: 'champagne', name: 'Dom Pérignon', icon: '🍾', coins: 450, category: 'Luxury', description: 'Pop the bottle' },
  { id: 'handbag', name: 'Designer Bag', icon: '👜', coins: 600, category: 'Luxury', description: 'Haute couture' },
  { id: 'ring', name: 'Diamond Ring', icon: '💍', coins: 800, category: 'Luxury', description: 'Forever shine' },
  { id: 'crown', name: 'Queen Tiara', icon: '👑', coins: 1200, category: 'Luxury', description: 'Fit for royalty' },

  // VIP
  { id: 'supercar', name: 'Neon Supercar', icon: '🏎️', coins: 2000, category: 'VIP', description: 'V12 power' },
  { id: 'helicopter', name: 'VIP Heli Ride', icon: '🚁', coins: 3500, category: 'VIP', description: 'City lights tour' },
  { id: 'yacht', name: 'Sunset Yacht', icon: '🛥️', coins: 5000, category: 'VIP', description: 'Ocean cruise' },
  { id: 'castle', name: 'Royal Castle', icon: '🏰', coins: 7500, category: 'VIP', description: 'Fairytale romance' },
  { id: 'jet', name: 'Private Jet', icon: '✈️', coins: 10000, category: 'VIP', description: 'First class escape' },
  { id: 'rocket', name: 'To The Moon', icon: '🚀', coins: 15000, category: 'VIP', description: 'Galactic love' },
];
