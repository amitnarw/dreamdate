export interface SocialProofEvent {
  id: string;
  userName: string;
  city: string;
  phone?: string;
  type: 'vip' | 'recharge';
  packageName: string;
  coins: number;
  timeAgo: string;
  displayText: string;
}

const INDIAN_NAMES = [
  'Rahul S.', 'Deepak K.', 'Vikram P.', 'Aakash M.', 'Karan G.',
  'Suresh R.', 'Naveen T.', 'Arjun V.', 'Manish B.', 'Rohan J.',
  'Ankit D.', 'Harish C.', 'Gaurav N.', 'Sachin T.', 'Pradeep M.',
  'Amit R.', 'Vishal B.', 'Nikhil S.', 'Rishi P.', 'Varun K.',
  'Aditya C.', 'Siddharth M.', 'Mayank J.', 'Kunal B.', 'Aarav G.',
  'Vihaan S.', 'Kabir L.', 'Dev P.', 'Ishaan K.', 'Abhishek T.',
  'Kartik N.', 'Yash V.', 'Sameer R.', 'Pankaj S.', 'Tarun M.',
  'Alok B.', 'Suraj K.', 'Bhavin P.', 'Chirag D.', 'Dinesh N.',
  'Hemant S.', 'Jatin R.', 'Lalit K.', 'Mohit G.', 'Neeraj V.',
  'Praveen M.', 'Rajesh T.', 'Ravi B.', 'Sanjay P.', 'Sunil D.',
  'Umesh K.', 'Vijay S.', 'Vivek R.', 'Ajay M.', 'Anand P.',
  'Chetan B.', 'Girish T.', 'Kamal S.', 'Mukesh N.', 'Prashant K.',
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore',
  'Surat', 'Kolkata', 'Noida', 'Gurugram', 'Bhopal',
  'Nagpur', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
  'Agra', 'Nashik', 'Varanasi', 'Thane', 'Rajkot',
];

const PHONE_PREFIXES = ['98', '99', '97', '96', '91', '88', '70', '95', '81', '79', '84', '93'];

function generateMaskedPhone(): string {
  const prefix = PHONE_PREFIXES[Math.floor(Math.random() * PHONE_PREFIXES.length)];
  const suffix = Math.floor(100 + Math.random() * 900);
  return `9${prefix.slice(1)}xxxx${suffix}`;
}

const PACKS = [
  { name: '₹199 Value Pack', coins: 400, type: 'recharge' as const, weight: 40 },
  { name: 'Weekly VIP All-Access', coins: 1500, type: 'vip' as const, weight: 30 },
  { name: '₹99 Flash Starter Deal', coins: 350, type: 'recharge' as const, weight: 15 },
  { name: '₹299 Mega Saver', coins: 1000, type: 'recharge' as const, weight: 10 },
  { name: 'VIP Elite Pass', coins: 1500, type: 'vip' as const, weight: 5 },
];

const TIME_STRINGS = [
  'Just now', '12s ago', '24s ago', '38s ago', '50s ago', '1m ago', '2m ago', '3m ago',
];

// Anti-repeat ring buffer (stores last 35 chosen keys so it NEVER shows the same person/event)
const recentKeys: string[] = [];
const MAX_RECENT = 35;

function pickWeightedPack() {
  const totalWeight = PACKS.reduce((sum, p) => sum + p.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const pack of PACKS) {
    if (rand < pack.weight) return pack;
    rand -= pack.weight;
  }
  return PACKS[0];
}

export function generateSocialProofEvent(): SocialProofEvent {
  // Find a combination that hasn't been shown in recent history
  let attempts = 0;
  let name = INDIAN_NAMES[0];
  let city = CITIES[0];
  let pack = PACKS[0];

  while (attempts < 20) {
    name = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
    city = CITIES[Math.floor(Math.random() * CITIES.length)];
    pack = pickWeightedPack();
    const key = `${name}-${pack.name}`;

    if (!recentKeys.includes(key)) {
      recentKeys.push(key);
      if (recentKeys.length > MAX_RECENT) {
        recentKeys.shift();
      }
      break;
    }
    attempts++;
  }

  // Show phone number in ~50% of the events with digits masked
  const hasPhone = Math.random() < 0.50;
  const phone = hasPhone ? generateMaskedPhone() : undefined;

  const timeAgo = TIME_STRINGS[Math.floor(Math.random() * TIME_STRINGS.length)];
  const isVip = pack.type === 'vip';
  const displayText = isVip
    ? `${name} ${phone ? `(${phone})` : `(${city})`} unlocked ${pack.name} 👑`
    : `${name} ${phone ? `(${phone})` : `(${city})`} recharged ${pack.name} ⚡`;

  return {
    id: `${Date.now()}-${Math.random()}`,
    userName: name,
    city,
    phone,
    type: pack.type,
    packageName: pack.name,
    coins: pack.coins,
    timeAgo,
    displayText,
  };
}

type Listener = (event: SocialProofEvent) => void;

class SocialProofManager {
  private listeners = new Set<Listener>();
  private timer: any = null;

  start() {
    if (this.timer) return;
    this.scheduleNext(2500); // 1st event arrives quickly at 2.5s
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.start();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  private scheduleNext(customDelay?: number) {
    // Random gap: Min 5 seconds (5000ms), Max 40 seconds (40000ms)
    const delay =
      customDelay !== undefined
        ? customDelay
        : Math.floor(5000 + Math.random() * (40000 - 5000));

    this.timer = setTimeout(() => {
      const event = generateSocialProofEvent();
      this.listeners.forEach((l) => {
        try {
          l(event);
        } catch (e) {}
      });
      this.scheduleNext();
    }, delay);
  }
}

export const socialProofManager = new SocialProofManager();
