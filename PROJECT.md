# BoloNa - Live Video calling & Chat , Project Context for AI Assistants

> **Read this file first** when starting a new chat about this repo. It captures the
> app's purpose, architecture, design system, engagement funnel, storage layout,
> and the explicit user preferences established across our recent work.

---

## 1. What this app is

**BoloNa - Live Video calling & Chat** , an Expo SDK 57 (React Native 0.86, React 19) **live companion & video calling simulation app**, Android-first.

- **Short description**: _Naye logon se Live Video Chat aur one-to-one Video Call par connect karein._
- **UPI Payments**: `upi://pay?pa=dararaj842-1@okhdfcbank&pn=Darasingh%20Rajput&am=...&cu=INR&aid=uGICAgMD1x9exUA` (dynamic `am` based on pack/VIP).
- **Pricing tiers**:
  - ₹100 = 100 Coins (Starter Pack)
  - ₹199 = 400 Coins (Popular Value Pack)
  - ₹299 = 1,000 Coins (Mega Saver Pack)
  - ₹499 = Weekly VIP All-Access (renewable weekly)
- **100% offline** , no backend, no remote DB, no analytics, no identity tracking.
  All data lives in AsyncStorage on the user's device.
- **Monetized** via in-app **Coins** (consumable, for video calls & gifts) and a
  **Weekly VIP** pack (consumable, manual weekly re-buy , NOT auto-renew).
- **18+ gated** , login screen requires explicit consent checkbox before entry.
- **AI character simulation** , profiles are pre-seeded; chat replies are
  generated locally; "video calls" are pre-recorded looping videos with the
  user's camera shown only as a local self-preview overlay.
- **Disclosed** as a simulation at login + throughout legal docs ("100% Offline
  Simulation", "all profiles… entirely fictitious, pre-recorded, automated").

The app deliberately feels alive while remaining offline , all "she texted you"
and "she called you" events are scheduled locally with `expo-notifications`
or in-app timers. This is the engagement/psychology funnel (see §5).

---

## 2. Tech stack & commands

|               |                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Framework     | Expo SDK 57 (`expo`, `expo-router`)                                                                                    |
| React         | 19.2.3                                                                                                                 |
| React Native  | 0.86.3                                                                                                                 |
| Animations    | `react-native-reanimated` 4.5 + `Animated` API                                                                         |
| Native blur   | `expo-blur`                                                                                                            |
| Notifications | `expo-notifications` (local scheduled only)                                                                            |
| Camera + Mic  | `expo-camera` (self-preview only)                                                                                      |
| Video         | `expo-video` (looped pre-recorded clips)                                                                              |
| Screen capture| `expo-screen-capture` (window-level `FLAG_SECURE` → every screen is fully black for screenshots/recordings/recents)  |
| Payment       | UPI intent (`expo-intent-launcher`, strict response verification) + REAL Google Play Billing (`expo-iap`, consumables) |
| Storage       | `@react-native-async-storage/async-storage`                                                                            |
| Icons         | `@expo/vector-icons` (Ionicons)                                                                                        |
| Linking       | `expo-linking` (for Play Store open)                                                                                    |
| TypeScript    | 6.0.3, strict                                                                                                          |
| Conversation  | v3 corpus (`conversationCorpus.ts`, slot-grammar + anti-repeat) + `antiRepeat.ts` (sync 7-day ledger, 30-slot recent ring, 100-slot cross-girl ring) + `nluService.ts` (pre-trained `node-nlp-rn` model imported from `assets/nlu-model.json`) + `realism.ts` (time-of-day + imperfection layer) + `stressHarness.ts` (200-pick no-repeat verifier) + `devTools.ts` (passcode-gated) |

**Commands**

```bash
npm install                  # install deps
npx tsc --noEmit            # typecheck ,  MUST pass before shipping any change
npx expo start               # dev (Expo Go ,  note: notifications won't work here)
npx expo run:android --variant release   # release APK (required for notifications)
npx expo export --no-bytecode            # bundle for prod
```

**Typecheck is the source of truth.** We do not have an automated test suite.

---

## 3. File map

```
src/
├── app/                          # expo-router file-based routes
│   ├── _layout.tsx               # root: splash + auth gate + PermissionsPrimer + notification deep-link handler
│   ├── login.tsx                 # 18+ gate + Fast Login (awards 100 coins, starts engagement funnel)
│   ├── vip.tsx                   # VIP weekly plan purchase screen
│   ├── (tabs)/
│   │   ├── _layout.tsx           # floating glass tab bar (ONLY shadow in app)
│   │   ├── index.tsx             # Discover ,  profile grid + skeleton loaders + VIP teaser strip + IncomingCallOverlay
│   │   ├── history.tsx           # Chats & Calls tabs (swipeable)
│   │   └── profile.tsx           # Hero card (gradient) + wallet (gradient) + VIP/coins/settings/check-in/nudge
│   ├── chat/[id].tsx             # Chat screen with realistic replies + gift card
│   ├── call/[id].tsx             # Video call: ring → connected (FREE first 120s) → ended; reconnect glitch; follow-up
│   └── profile/[id].tsx          # Companion detail w/ photo gallery
│
├── components/
│   ├── AppBackground.tsx         # Themed canvas + subtle pink gradient
│   ├── AppHeader.tsx             # Back btn | title | coin pill (BORDERED pink)
│   ├── AppModal.tsx              # Generic themed modal
│   ├── AppBlurView.tsx           # Blur wrapper; auto-falls back when no blurTarget
│   ├── BackButton.tsx            # Frosted circle w/ mild shadow (outer wrap)
│   ├── CoinIcon.tsx              # Animated gold coin SVG
│   ├── CoinHeader.tsx
│   ├── DailyCheckInModal.tsx     # 7-day streak with day-7 mystery chest
│   ├── ExitConfirmationModal.tsx
│   ├── GiftModal.tsx             # Gift picker with celebration on send
│   ├── IncomingCallOverlay.tsx   # Full-screen ring for in-app simulated call
│   ├── LegalViewerModal.tsx      # Tabs: Terms / Privacy
│   ├── OfflineNotice.tsx         # Connectivity ping overlay
│   ├── PaymentSelectorSheet.tsx  # UPI vs Google Play bottom sheet (subtle shadow)
│   ├── PaymentStatusModal.tsx    # THE status surface for every payment outcome
│   ├── PermissionsPrimerModal.tsx # One-tap pre-permission modal (camera/mic/notifs)
│   ├── ProfileCard.tsx           # Card variant
│   ├── RechargeModal.tsx         # Coin pack picker (tint-fill selection)
│   ├── SplashScreenView.tsx
│   ├── animated-icon.{tsx,web.tsx}
│   ├── external-link.tsx, hint-row.tsx, themed-{text,view}.tsx, ui/collapsible.tsx, web-badge.tsx
│
├── constants/
│   ├── blurConfig.ts
│   ├── legalDocuments.ts         # User Agreement + Privacy Policy (see §10)
│   └── theme.ts                  # MidnightElegance + DaylightElegance themes + borderless card presets
│
├── context/
│   ├── AuthContext.tsx           # Fast Login; calls initFirstRunEngagement() after login
│   ├── TabBlurContext.tsx        # Tracks tab screen refs for glass-tab-bar blur targets
│   └── ThemeContext.tsx
│
├── data/
│   └── mockProfiles.ts           # 20 profiles (Pexels: 8 free + 5 locked implied-nude/sheer per girl, same-shoot consistency, zero reuse) + ARCHETYPE_META + VIRTUAL_GIFTS + FAKE_CALL_VIDEOS
│                                 # NOTE: archetype field exists for chat-engine personality only;
│                                 #       archetype badges/tags/filter chips are deliberately NOT in the UI.
│
├── hooks/
│   └── use-{color-scheme,theme}.ts
│
└── services/
    ├── chatEngine.ts             # Realistic reply engine (see §6) ,  variant pools + anti-repeat + timing
    ├── callHistoryService.ts     # local call log (type: incoming/outgoing/missed)
    ├── engagementService.ts      # First-run funnel: notifications, channel, deep links (see §5)
    ├── incomingCallService.ts    # In-app ringing orchestrator (singleton; 2 min after first install)
    ├── replyRunner.ts            # Screen-free reply choreography (timers, typing bus, nudge guard, gift thanks, typing-restart)
    ├── proactiveService.ts       # 10-15min flirty ping scheduler (enrollment, caps, boot re-arm)
    ├── devTools.ts               # Dev sheet (passcode 2760, lockout, coin/VIP/ledger grants)
    ├── antiRepeat.ts             # Sync 7-day ledger + 30-slot recent + 100-slot cross-girl guard (no-repeat invariant)
    ├── nluService.ts             # Pre-trained intent brain (manager.import of bundled JSON, no on-device training)
    ├── realism.ts                # Time-of-day flavor + imperfection layer (drop-punct, lowercase, typing-restart, lazy "k" replies)
    ├── stressHarness.ts          # 200-pick verifier (asserts zero exact-dupes in window + cross-girl)
    └── conversationCorpus.ts     # 30 intents x 4 arch base + slot atoms (opener/mid/closer/particle/emoji)
    ├── paymentService.ts         # RECHARGE_PACKAGES + VIP_WEEKLY_PACKAGE + launchUPIPayment (strict UPI verification + txn log)
    ├── billingService.ts         # REAL Google Play Billing via expo-iap (consumables, token anti-replay, boot recovery)
    ├── wallet.ts                 # addCoins / deductCoins / activateWeeklyVip / useWallet hook
    └── chatHistoryService.ts
```

---

## 4. Design System , "Borderless Tonal"

The cardinal rule (user feedback): **no decorative borders; no decorative
shadows**. Depth comes from **tonal fill layering** of surfaces, not strokes
or elevation.

### Allowed shadows

Only on **floating layers that lift off the canvas**:

| Layer                                                                        | Shadow                                                                |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Bottom navbar                                                                | `offset 0,6 / opacity 0.25 / radius 12 / elevation 6` (THE small one) |
| Floating modals/sheets (`AppModal`, `RechargeModal`, `PaymentSelectorSheet`) | `opacity ~0.12–0.32 / radius 6–20 / elevation 3–8` (subtle)           |
| Back button & detail-screen chat/gift circles                                | `opacity 0.18 / radius 6 / elevation 2` (mild)                        |
| `IncomingCallOverlay` zIndex 9999                                            | Required for stacking, not visual                                     |

Everything else is flat: hero cards, wallet, perk cards, list rows, profile
detail thumbnails, call screen info card, etc.

### Selection states

- **Small controls** (chips, tabs, radio active): solid primary `#F65592` fill
- **Large cards** (coin packs, payment methods, gift cards, plan card): soft
  pink-tinted fill `rgba(246,85,146,0.12–0.22)` with primary text + checkmark
- **Radio idle** = `borderWidth: 2` with subtle stroke (this is one allowed
  outline , it's a real interactive control affordance, not decorative)

### Radii

Cards 18–28, pills 18–22, circles = `size/2`. Large rounded forms everywhere.

### Key tokens (`src/constants/theme.ts`)

- Primary: `#F65592` (magenta-pink)
- Gradient pink: `#F65592 → #E11D48 → #BE185D`
- VIP gold gradient: `#8C5A12 → #C28A1E → #5C3A0A` (with 2–3 decorative light orbs)
- Surfaces: dark `#0C0F10 / #121414 / #1E2020 / #2A2C2D`; light `#F6F7F9 / #FFFFFF / #F3F4F6`

### Established user preferences (do NOT violate)

1. **No borders on cards / rows / buttons** (only the coin pill in header,
   the radio idle ring, the checkbox idle ring, and animated sonar rings)
2. **No shadows except navbar + modals + back-button class** (see table)
3. **No archetype badges or filter chips in UI** (data kept for chat
   personality; removed from cards, history rows, chat header, profile detail)
4. **No "4 types of females" labeling** anywhere visible to user
5. **Skeleton cards instead of ActivityIndicator** for infinite-scroll
   loading (avoids the height-jump jerk)
6. **Frosted glass circles for chat/gift actions** on detail screen ,
   same visual treatment as the back button (frosted glass + mild shadow +
   `blurTarget` pointing at the photo so the frost is real on Android)
7. **VIP hero profile card** = golden gradient + 3 decorative light orbs +
   gold-tinted dividers + white/gold text + solid gold `VIP ELITE` badge
8. **Wallet card** = primary pink gradient going to light shade (`#F65592 → #FF7EAB → #FFAECB`)
   with 2 white light orbs, white text, white "Recharge" pill
9. **Coin pill in header** is the ONLY bordered UI element we keep
   (subtle hairline `rgba(255,255,255,0.14)` dark / `rgba(0,0,0,0.08)` light)

---

## 5. Engagement & Psychology Funnel

This is the system's heart , all timed locally, no server.

### First-run sequence (after Fast Login)

**Rule: nothing is fabricated up front.** No thread, no call log, no message
exists until the moment it is actually delivered. (The old funnel pre-wrote
a thread + a missed-call log at t=0 and double-ran via login+layout , both
removed.)

```
t=0       Fast Login → +100 coins, persist user, jump to Discover
          (History tabs are EMPTY ,  like any real fresh app)
          ↓
          _layout.tsx mounts → PermissionsPrimerModal shows once
          (`@dreamdate_permissions_primed_v1` flag) → requests camera+mic+notif
          ↓
          initFirstRunEngagement() ,  race-guarded (concurrent login/layout/
          online triggers collapse into one run). Writes NOTHING yet. It
          creates up to 10 delivery slots across up to 10 distinct females
          and, per slot:
          • T+1min female 1: text opener ("heyy, kya kar rahe ho")
          • T+2min female 2: text + BLURRED photo (`locked_photo`, HER price
            30/40/50 to unlock ,  tap → confirm dialog → deduct → unblur,
            persisted)
          • T+3min female 3: text opener ("oye suno na, bore ho rahi hu")
          • Girls 4–10: each 10–20 min (randomized) after the previous slot,
            alternating text / blurred photo (slots 5 & 8 are photos). Hard
            cap: 10 threads total.
          Each slot is delivered by an IN-APP timer with pop sound/haptic;
          open chat screens update live via chatEngine pub-sub. A backup
          local notification is scheduled at the same delay for the
          killed-app case (release builds only ,  Expo Go cannot notify).
          Reopening the app after closed-app time runs catch-up: overdue
          slots deliver immediately with correct backdated timestamps
          ↓
          Login anchors incomingCallService.scheduleFirstIfEligible() →
          full-screen IncomingCallOverlay fires at RANDOM T+90s–5min after
          install (Discover focus re-arms as fallback; a pending timer is
          never reset by tab-hopping). Accept →
          router.push('/call/{id}?dir=incoming'). Decline → retry after
          random 2–6 min (max 2 retries) → ONE missed call log (the ONLY way
          a missed-call entry is ever created). Girls can also promise calls
          in chat (`requestCallFrom`, random 20s–6min) ,  promises are kept.
```

### Engagement service (key functions in `src/services/engagementService.ts`)

- `setupNotificationHandler()` , call once at app boot
- `initFirstRunEngagement()` , call after Fast Login; creates up to 10 slots,
  catch-up + timers + backup notifications, writes nothing up front
  (state `@dreamdate_engagement_state_v2`, `FunnelSlot[]`)
- `deliverFunnelMessage()` / per-slot `deliverSlot(i)` , in-app timer path:
  appends via `deliverLiveMessage()` (skips if she already has organic
  messages), cancels the backup notification, marks slot done. Photo slots
  arm a "she's waiting" in-chat ping 20–40 min later if still locked.
- `deliverSeededMessage(profileId, slotIndex?)` , killed-app
  notification-tap path: writes the message first (it was never written),
  then the chat opens; re-arms remaining timers
- `PHOTO_UNLOCK_COST = 30` , FALLBACK locked-photo price. Real prices are
  per-girl (30/40/50 via `getPersonaConfig`) and live on each funnel slot,
  each `locked_photo` message's `unlockCost`, each `lockedPhotos` item's
  `unlockCostCoins`, and each detail-gallery locked tile. Chat screen confirms
  via `AppModal` before `deductCoins`; insufficient balance → RechargeModal.
  Detail gallery has its own identical unlock modal (per-session unblur).
- `markMessageFunnelFired()` , cancels the backup notif when the chat is
  opened organically; `markCallFunnelFired()` , legacy guard, cancels any
  leftover v1 schedules (real missed calls come from incomingCallService)
- `markEngagementDone()` , cancel timers + schedules
- `cancelEngagementTimers()` , called on logout
- `schedulePostDepletionReminder(profileName)` , 30 min after coin depletion
- `maybeScheduleReengagement(profileName)` , max 1×/24h

### Notification contract

- Channel: `private-messages-v2` (Android), `Notifications.AndroidImportance.HIGH`,
  pink light color, default sound
- `data: { url: '/chat/{id}' | '/call/{id}' | '/(tabs)', type: 'incoming_message' | 'missed_call' | 'recharge_reminder' | 're_engagement', profileId? }`
- Response listener in `_layout.tsx` routes via `router.push(url)`; for
  `incoming_message` it first calls `deliverSeededMessage(profileId)` so the
  chat is never empty behind the notification
- **Expo Go reality**: system notifications cannot fire there at all (removed
  from Expo Go in SDK 53). In-app delivery + sounds still work; real
  notifications require a release APK / dev build

### Always-on nudges (max 1×/day each)

- **Auto-open Daily Check-In** , `profile.tsx` `useFocusEffect` opens the modal
  once per calendar day (`@dreamdate_checkin_auto_v1` flag)
- **Low-balance nudge** , fires AppModal `Only X coins left` when `coins < 25`,
  routes to Recharge. Capped at 1×/24h (`@dreamdate_last_nudge_v1`)

### Monetization pressure (what nudges users to buy)

1. **Coin depletion during call** (rate 35–50/min; 100 coins ≈ 2 min call) →
   mid-call `inCallRechargeAlertVisible` (20s grace with Recharge / End Call).
   Pre-call / first-minute failure opens `RechargeModal` directly.
2. **Gift failure / any insufficient-coins path** → opens `RechargeModal`
   directly (no intermediate "Insufficient Coins" prompt). If a gift was the
   trigger (`onInsufficientCoins`), the parent stores the pending gift and
   `RechargeModal.onRechargeSuccess` deducts + auto-sends it.
3. **VIP teaser strip** on Discover from session 2+ (`@dreamdate_launch_count_v1`)
4. **Weekly VIP** page accessible from profile menu; success unlocks golden
   gradient profile card + 1,500 weekly coin grant

### No-call-while-in-call (incoming-call gate)

`incomingCallService.setInCall(active)` is called by `call/[id].tsx` on mount
(true) and unmount (false). All entry points — `fireIncoming()` (recurring
1-min), `scheduleFirstIfEligible()` timer callback, and `requestCallFrom()`
timer callback (chat promises) — early-return when `inCall` is true. The
full-screen `IncomingCallOverlay` therefore never rings over an active
call screen; the recurring call cycle resumes 1 minute after the call
screen unmounts via the existing `onCallEnded()` arm.

### Permissions primer (`src/components/PermissionsPrimerModal.tsx`)

- Shows once after login (flag `@dreamdate_permissions_primed_v1`)
- Single CTA "Enable Everything" fires `requestCameraPermissionsAsync` →
  `requestMicrophonePermissionsAsync` → channel create + `requestPermissionsAsync`
  in sequence (OS shows dialogs back-to-back)
- Has subtle "Not now" escape
- Channel must be created before requesting notification permission on
  Android 13+ (handled in `PermissionsPrimerModal` and in `_layout`'s cold-start
  notification listener)

---

## 6. Chat engine realism (`src/services/personaEngine.ts` + `chatEngine.ts` + `antiRepeat.ts` + `conversationCorpus.ts`)

Replies are planned by `planReply(profile, userText)` (async , per-girl
memory is REALLY persisted in `@dreamdate_girl_memory_v1_{id}`). It returns
a `ReplyPlan`: `{ bubbles, preTypingMs, typingMs[], gapMs, readSilence,
flicker?, photo?, followUp?, callRequest?, affectionDelta, nudgeText?,
nudgeDelayMs? }`. The plan is EXECUTED by `replyRunner.runPlan` (module-level
timers keyed by profileId , screen-free: leaving her chat never drops her
in-flight reply; deliveries go through `deliverLiveMessage`). The chat screen
is a thin view (history + subscriptions + send). Typing dots are a per-profile
bus (`subscribeTyping` / `isTypingFor`); the nudge guard is a service-level
per-profile user-send clock (`notifyUserSent`). Gift thanks also run in the
runner (`runGiftThanks`).

### v3 corpus + slot grammar + anti-repeat (HARD INVARIANT)

> **A girl NEVER uses the same words in the same sequence.** Same meaning
> is re-rendered as a different surface string every time.

- **`src/data/conversationCorpus.ts`** holds ~30 base intents x 4 archetypes
  (greeting, compliment, love, miss_you, jealousy, ignore, photo_request,
  call_request, whatsapp, dirty_request, dirty_question, sexual_compliment,
  dirty_yes, dirty_deflect, dirty_tease, abuse, abuse_hard, anger,
  question_her, thanks, bye, food, outfit, activity, sleep, mood, recharge,
  joke, fallback + greeting_return). 10-16 base variants per (intent, arch).
- **`composeBase(base, arch)`** wraps each picked variant through a slot
  grammar: per-arch pools of openers, mid-clauses, closers, particles, and
  trail emoji. Combinatorially tens of thousands of unique composites from
  the same base line.
- **`src/services/antiRepeat.ts`** enforces the invariant synchronously on
  the chat reply path:
  1. **In-memory recent ring** (cap 30 per girl) — hard exclude for the
     current session. Zero exact-duplicate strings in any 30-message window.
  2. **7-day ledger** (`@dreamdate_repeat_ledger_v1_{profileId}`) — exact
     strings forbidden for 7 days, capped 500 entries per girl, pruned
     on read. Fire-and-forget persistence so the reply path stays sync.
  3. **Cross-girl guard** (`@dreamdate_repeat_ledger_v1__cross`) — last 100
     strings spoken by ANY girl. Two girls never say the identical line
     back-to-back across the app.
- `pickCorpus(intent, arch, profileId, mem, sig)` is the new text selector.
  Old `pickPool` retained only for photo/call outcome lines (short
  outcome-specific). `recentSigs` cap in `mem` is now 30 (was 8).
- Dev sheet has a "Clear Repeat Ledger" button for reset.

### NLU brain — pre-trained intent classifier (`src/services/nluService.ts`)

The regex `INTENT_RULES` matcher still exists as a **fast-path override**
for monetization-critical intents (photo_request / video_call / recharge /
bot) — these must never misfire on slang/abuse. For everything else, the
chat reply path now uses a neural classifier:

- Trained corpus: `scripts/nluCorpus.ts` — 29 intents × ~50 Hinglish/English
  utterances each (~1,500 total). Built to fuzzy-match unseen variations
  (`kapde nahi pehni aaj` → outfit, `thoda sexy photo bhej do na` →
  dirty_request, etc.). Train at dev-time on PC.
- Trainer: `scripts/train-nlu.js` (Node). Uses `node-nlp-rn` to train +
  `export()` the model. Writes `assets/nlu-model.json` (~2.2MB) — bundled
  into the APK.
- Runtime: `nluService.matchIntentNLU(text)` calls
  `manager.import(MODEL_JSON)` once at first use (warmed at app boot via
  `warmNLU()` in `_layout.tsx`). All inference on-device, offline.
- Smoke tests in trainer currently 7/7 on unseen phrasing.
- Fallback path: any model-load failure or low confidence → regex intent.

### Time, context, reactions, imperfection (phase 3, `src/services/realism.ts`)

- **Time-of-day flavour**: ~35% chance the reply gets a `good morning` /
  `subah ho gayi` / `late night me` prefix or `chai ke saath socho` /
  `so jana phir` suffix. Skipped if the corpus variant already mentions
  a tod word. Source: `maybeTimeFlavor(text)`.
- **Context callbacks**: occasional echo of a long word from his last
  message, plus promised-call / awaiting-user-photo callbacks when
  `mem.promisedCall` / `mem.awaitingUserPhoto` are set (4 archetype-
  specific variants each).
- **Imperfection layer** (`applyImperfection`):
  - 8% drop trailing punctuation
  - 5% lowercase the entire reply
  - 12% typing-restart (dots show → vanish → show again → deliver) via
    `replyRunner.runPlan` — adds real humanness without affecting the
    10s cap
- **Lazy "k/ok" replies**: tiny user inputs ("hii", "ok", "k") get a
    50%-chance low-effort reply from `maybeLazyAck`.

### 4-archetype reaction families (option (a) ,  never leaves)

- `abuse` intent ,  `playful_tease` = sassy counter-tease, `sweet_romantic` =
  hurt-then-recover, `bold_alluring` = matches register, `mysterious_sensual`
  = calm deflect+tension. Each pool has 12-14 variants.
- `abuse_hard` (gaali) ,  same per-archetype tone-shift, but never leaves.
- `dirty_request` and `sexual_compliment` ,  per-archetype escalate or
  deflect. Affection ladder (0-100) drives escalation: <30 deflect,
  30-60 tease-but-hold, 60+ match+counter (gated in pickCorpus).

### Stress harness (`src/services/stressHarness.ts`)

"Run 200-msg stress" button in the dev sheet. Asserts:
- 0 exact-string duplicates within any 30-msg window per girl
- 0 cross-girl exact duplicates
- Reports Jaccard>0.7 near-duplicates for awareness
Verified locally: 500 picks → 500 unique strings, 0 within-30 dupes,
0 cross-girl dupes, ~2 near-dupes out of 500 picks. The "full day to
detect" bar is met — every reply is structurally distinct.

`chatEngine.ts` keeps storage/threads/live-bus + legacy REPLY_SETS pools
(used via `pickLegacyReply` for food/outfit/activity/whatsapp/short/fallback
when `planReply` falls through the intent arm).
The old sync `getSimulatedReply` path is DELETED , do not reintroduce it.
Never put reply timers back inside the chat screen.

### Messaging behavior rules (how real people text , do not regress)

- **HARD 10s reply cap (any girl, any length).** Silence is
  jitter(0.9–5s) + warmth shift + 0–2s jitter, then typing starts; silence is
  clamped so first bubble + its typing ALWAYS land ≤10s after his send
  (bold girls ~2–6s, shy/mysterious ~3–9s). Typing NEVER starts instantly.
- **"Busy" is theater, never delay**: per-girl `busyP` (~8–14%) shows a brief
  typing flicker mid-silence (read-but-distracted), then the normal reply
  lands on time inside the 10s cap. The old 20–60s late-reply path is gone.
- **1 bubble per reply is the norm.** A 2nd bubble is a genuine afterthought
  (3–8s gap + typing again). Legacy pools drop their 2nd bubble 60%.
- **Same small-talk twice in a row → gambit redirect** ("ye to pehle bhi
  bole 😂 kuch naya batao"), not another pool pick (last-4 topic ring).
- **Follow-up nudge (mixed model)**: ~20% of replies attach
  `nudgeText`/`nudgeDelayMs` (25–90s). The runner delivers it only if
  he stayed silent (service-level per-profile send clock); any reply from him
  cancels it. Nudges fire CROSS-CHAT (notification + sound + unread when he's
  elsewhere) — they are re-engagement pressure. Nudges are short human pokes
  (`hello??`, `kahan gaye`, `reply karo na`), max 1 per reply.
- **Copy rules for every bubble**: short (3–12 words), lazy punctuation,
  natural Hinglish, horny + excited. NEVER em dashes, NEVER button narration
  ("tap the pink button" / "tap the icon" , she says "call kar lo" like a
  real girl), NEVER poetic monologues, NEVER answering questions he didn't ask.
- **Funnel seed is 1 message**: `engagementService.initFirstRunEngagement`
  seeds a single opener (`heyy, kya kar rahe ho`); notification body matches.

### Persona model (per girl , behavior differs, not just wording)

- `getPersonaConfig(profile)`: deterministic per-id seed modulated by
  archetype , pre-typing range, sendPhotoP, demandFirstP, shyP, greed,
  callAcceptP, chattiness, busyP, and HER unlock price (30/40/50).
- Hidden **affection 0–100** (starts random 15–50): gates photo/call
  outcomes; warm girls reply faster; love-talk afterthoughts unlock >55.
- Memory: seen-counts per response node (Ink-style seq/cycle/shuffle),
  last-8 reply sigs, last-4 topics, askedPhoto count, awaitingUserPhoto,
  promisedCall, hisName slot.
- **Intent matcher**: ordered concept-set regexes (~19 intents). `video_call`
  MUST stay before `whatsapp` so "call karo" doesn't hit number-refusal.

### Photo-request outcomes (weighted by persona + affection + wallet)

send_locked (her price) / send_free (cute) / demand_first ("pehle tum
bhejo" → sets awaitingUserPhoto; his next msg/photo resolves it, she sends
hers back FREE if she owed it) / dont_know_how (claims she can't → funnels
to video call 30–90s later) / recharge_first (when broke or greedy) /
hesitant (text now + locked photo 20–60s later) / refuse_tease (3rd+ ask).
**User CAN send his photo** (gallery picker button in chat input,
`expo-image-picker`): `planUserPhotoReaction` , compliment/tease, +7–10
affection, possible send-back.
**Sourcing rule**: locked sends (chat, follow-ups, funnel slots) ALWAYS come
from her `lockedPhotos` (boudoir exclusives, never gallery-visible); free
sends come from `photos`. Detail gallery renders locked tiles blurred with
price + unlock modal. Chat header strip stays free-photos-only.

### Video-call request outcomes (wallet-gated on callRate×2)

will_call (she REALLY calls in random 20s–6min via
`incomingCallService.requestCallFrom` , fires even if chat closed) /
you_call_me / excuse_later (promise + excuse 5–15min later) /
recharge_first (broke) / shy_deflect (low affection). Side effects fire
even if he left the chat.

### Realism mechanics

- **Variable typing**: `max(1200, len*45 + 0–2500 jitter)` per bubble
- **Anti-repeat memory**: persisted seen-counts + sig ring (no more
  fire-and-forget history writes)
- **Message pop sound**: chat screen plays `playMessagePop()` (see §7 audio)
  on every her-bubble (reply, afterthought, nudge, gift thanks)
- **Gift thanks**: 3 short variants per archetype, references actual gift
  name, uses `generateGiftThanks(name, archetype)` with REAL computed delay
  (`1200 + len*36 + jitter`), delivered via `runGiftThanks` in replyRunner
- **Post-call follow-up**: `generatePostCallFollowUp(profile, durationSec)`
  writes 1 short message 1–3 min after call ends (timer in `handleEndCall`)
- **Time-of-day awareness**: `getTimeAwareGreeting(archetype, name)` , morning/
  afternoon/evening/night variants (all short, human)

### Openers

- 4 short variants per archetype
- Almost always 1 message (~15% chance of a short 2nd nudge 30–90s later)
- Timestamps randomized 2–5 min ago / 30–90s ago

### Proactive flirty initiations (`src/services/proactiveService.ts`)

After first contact (funnel opener OR organic first message), enrolled girls
proactively text HIM to pull him back into the app. Hard register (user-approved:
dirty/flirty), drives engagement + locked-photo spend.

- **Cadence**: every **10–15 min per girl** (jittered phase per-girl, staggered
  so arrivals never collide; never two at once).
- **Eligibility**: girl must already have a thread (active threads registry;
  nothing fabricated before first contact). Skipped if her thread had ANY
  message in the last 30 min (no spam mid-conversation).
- **Global caps**: max 3 pings per rolling 60-min window, min 4 min between
  any two pings app-wide.
- **Mix**: ~60% pure text flirt (4 pools per archetype, ~10 lines each), ~25%
  locked-photo tease (blurred exclusive from her `lockedPhotos` → coin-spend
  driver), ~15% call-tease (text now + real `incomingCallService.requestCallFrom`
  1–3 min later).
- **Delivery**: `deliverLiveMessage` → notification + sound + unread dot when
  he's elsewhere; silent in-thread arrival when he's inside her open chat
  (marked read automatically, no double pop).
- **Persistence + boot re-arm**: next-ping timestamps + rolling ping log in
  `@dreamdate_proactive_state_v1`. App-kill safe; on launch overdue pings fire
  staggered (30–120s) instead of bursting. Enrolls new girls via
  `enrollProactiveGirl(profileId)` (called from the chat screen on first
  mount, and funnel openers add her to the active threads registry which the
  loop re-scans).

### Reply runner (`src/services/replyRunner.ts`)

Owns ALL reply choreography at the service layer so leaving a chat never
kills her in-flight reply. Module-level timers keyed by profileId;
deliveries via `deliverLiveMessage`; typing bus is per-profile
(`subscribeTyping` + `isTypingFor`); nudge guard is a per-profile
user-send clock (`notifyUserSent`). The chat screen must NOT re-implement
silence/typing/bubble choreography — never put reply timers back in the
screen.

---

## 7. Call realism (`src/app/call/[id].tsx`)

| Behavior            | Implementation                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ring duration       | `1800 + random*2200` ms (1.8–4s) , was fixed 2.6s                                                                                                  |
| FREE first 120s     | Skip coin deduction; green `FREE` badge on screen                                                                                                  |
| Reconnect glitch    | One random 850ms pause at T+45–75s, video pauses + "Reconnecting…" overlay                                                                         |
| Mic permission      | Requested alongside camera at entry                                                                                                                |
| Coin deduction      | `callRate` per minute after 120s; if insufficient → end + `coinsDepletedModal` + `schedulePostDepletionReminder`                                   |
| Post-call follow-up | `generatePostCallFollowUp(profile, durationSec)` written 1–3 min after end                                                                         |
| Save log            | `saveCallLog({type: direction, ...})` , `incoming` when she called you                                                                             |
| Direction           | `dir` route param: `incoming` (accepted from overlay) vs `outgoing` (default, you dialed)                                                          |
| Incoming entry      | Skips dial-out ringing entirely → brief `connecting` state (1.5–2.5s, avatar + "Connecting...") → live. Ended screen shows "Incoming call" caption |
| Outgoing entry      | Existing sonar ringing phase (1.8–4s, "CALLING VIP STREAM...")                                                                                     |

### In-app simulated incoming call (`src/components/IncomingCallOverlay.tsx`)

- Triggered by `incomingCallService` singleton 2 min after first install (anchored to login; Discover focus is fallback)
- **Mounted at app root** (`_layout.tsx`) inside a native RN `Modal`
  (transparent) → covers everything incl. the bottom tab bar; no touch
  leaks behind. Never mount inside a tab screen again
- Full-screen BlurView with sonar pulses + avatar pulse animation
- **Looping ringtone** (`assets/sounds/ring.wav` via `soundService.startRinging`)
  - **repeating vibration** (`Vibration.vibrate([0, 700, 800], true)`) from
    ring start; both stopped on accept/decline/timeout. Heavy haptic on trigger
- **2-minute auto-cut**: ring timer → stop audio/vibration → `dismissed()`
  (normal retry/missed-log path below). Android back = decline
- Accept → `incomingCallService.accepted(id)` + `router.push('/call/{id}?dir=incoming')`
- Decline → `incomingCallService.declined(id)` → retries after 2 min (max 2)
- After max retries → `saveCallLog({type: 'incoming', durationSeconds: 0})`

### Audio (`expo-audio`, `src/services/soundService.ts`, `assets/sounds/`)

- Library: `expo-audio` (SDK 57, Expo Go-safe via lazy dynamic import ,
  every call no-ops on failure). App config pins the plugin to
  `recordAudioAndroid: false, enableBackgroundPlayback: false` (we only play
  short UI sounds; no recording, no background service). Playback needs no
  permission , `RECORD_AUDIO` is recording-only.
- `assets/sounds/ring.wav` (~4s two-tone chime loop) + `message.wav`
  (1.0s total: 0.45s pop + silence tail , sub-1s sounds never play on first
  press on Android, expo/expo#42814), both synthesized by
  `scripts/generate-sounds.js` (pure PCM math, regenerate with node)
- **Playback rules (learned the hard way, do not regress)**:
  - Assets resolve via `expo-asset` (`Asset.fromModule().localUri`) on
    Android release , bare `require()` ids can fail to resolve in production
    (expo/expo#34555)
  - NEVER `seekTo`/`play()` an unloaded player , `play()` before `isLoaded`
    is silently dead on Android. `waitLoaded()` gates every play on the
    `playbackStatusUpdate` event (2.5s timeout fallback)
  - `setAudioModeAsync({playsInSilentMode: true, interruptionMode: 'mixWithOthers'})`
    once, so rings/pops are always heard without killing background music
- `startRinging()` / `stopRinging()` (loop) + `playMessagePop()` (one-shot),
  all fire-and-forget with `.catch(() => {})` at call sites
- **Her-message announce (single place: `deliverLiveMessage` in chatEngine)**:
  pop sound + `Vibration.vibrate([0, 120])` for every profile-sent message.
  The chat screen must NOT play its own pop for these (doubles) , it only
  announces its own reply path + gift thanks

---

## 8. Storage keys registry (`@dreamdate_*`)

All AsyncStorage keys are versioned for safe rollouts.

### Auth & users

- `@dreamdate_auth_user_v1` , local guest session
- `@dreamdate_welcome_bonus_v1` , has 100-coin bonus been awarded?
- `@dreamdate_launch_count_v1` , incremented on every app boot (for VIP teaser gate)

### Permissions & engagement gates

- `@dreamdate_permissions_primed_v1` , PermissionsPrimerModal shown?
- `@dreamdate_checkin_auto_v1` , last day Daily Check-In auto-opened
- `@dreamdate_last_nudge_v1` , last low-balance nudge timestamp
- `@dreamdate_vip_teaser_seen_v1` , VIP teaser strip dismissed/seen
- `@dreamdate_engagement_state_v2` , funnel state (msg notif id, profile, delivery/completion). v1 removed (it pre-seeded threads + pre-wrote call logs; a one-time cleanup strips legacy `msg-engage-*` messages)
- `@dreamdate_last_engagement_notif_v1` , last re-engagement notif timestamp
- `@dreamdate_post_depletion_notif_v1` , active post-depletion notif id
- `@dreamdate_incoming_call_fired_v1` , incoming call fired already?

### Wallet

- `@dreamdate_user_coins_v2` , coin balance
- `@dreamdate_user_vip_v2` , VIP expiration timestamp
- `@dreamdate_has_purchased_v1` , has any purchase occurred (drives locked
  content in `DailyCheckInModal` and `VIP`)
- `@dreamdate_play_tokens_v1` , processed Play purchase tokens (anti-replay;
  cap 200). A token here is credited at most once, ever
- `@dreamdate_upi_txn_log_v1` , UPI attempt log, last 50 (manual reconciliation)

### Chat (v5 , current)

- `@dreamdate_chat_history_v5_{profileId}` , message array
- `@dreamdate_active_chat_threads_v5` , list of profileIds with history
- `@dreamdate_girl_memory_v1_{profileId}` , persona memory: affection 0–100,
  seen-counts, recent sigs, topic ring, askedPhoto, awaitingUserPhoto,
  promisedCall. (The old `@dreamdate_reply_history_v5_*` keys are dead ,
  nothing reads them; harmless leftovers.)
- `@dreamdate_proactive_state_v1` , proactive ping scheduler: per-girl
  next-ping timestamps + rolling-hour ping log (boot re-arm, no bursts)
- `@dreamdate_repeat_ledger_v1_{profileId}` , v3 anti-repeat ledger:
  `{text → lastUsedTs}`. Capped 500/girl, pruned to 7-day window on every
  read. Fire-and-forget persistence from the sync reply path
- `@dreamdate_repeat_ledger_v1__cross` , cross-girl guard: last 30 strings
  spoken by ANY girl in the app. In-memory + persisted

### Dev tools

- `@dreamdate_dev_passcode_v1` , numeric passcode (default `2760`,
  4-digit, changeable in-sheet). Lives in EVERY build (no dev flags)

### Calls

- `@dreamdate_call_logs_v2` , call log entries. v1 wiped because the old
  funnel pre-wrote fake missed-call entries at login. Entries are now only
  ever created by real events: call ends, or the incoming overlay declined
  past max retries

### Daily check-in (v2 , current)

- `@dreamdate_checkin_current_day_v2` , next-day index (0–6)
- `@dreamdate_last_checkin_timestamp_v2` , last claimed date string

> **Versioning note**: the `_v2` on check-in keys + `_v5` on chat keys
> are deliberate , earlier versions had bugs (e.g. check-in marking 2 days
> completed at once). Bumping the key resets polluted state for all users.

---

## 9. Notifications architecture

- Library: `expo-notifications` (local scheduled only , no remote push, no Firebase)
- Channel: `private-messages-v2` (Android) with HIGH importance + pink light.
  No `sound` key is set , omitting it is the documented way to get the
  system default sound. NEVER pass `sound: 'default'` on Android channels:
  the native module treats it as a custom bundled filename and throws
  "Custom sound 'default' not found" in builds. (The original
  `private-messages` channel had this bug; `ensureChannel()` deletes it and
  Android locks channel audio after creation, hence the `-v2` ID.)
- Handler in `_layout.tsx` via `safeSetNotificationHandler()`:
  ```js
  shouldShowBanner: true, shouldShowList: true,
  shouldPlaySound: true, shouldSetBadge: true
  ```
- Deep-link contract: `data: { url, type }` → `router.push(url)` on tap
- **Expo Go safe**: all usage goes through `src/services/safeNotifications.ts`,
  which NEVER evaluates the `expo-notifications` module inside Expo Go.
  Detection is via `expo-constants` (`appOwnership === 'expo'` or
  `executionEnvironment === 'storeClient'`); when true, every `safe*` call
  returns `null`/no-ops without ever calling `import('expo-notifications')`.
  This matters because the throw (`warnOfExpoGoPushUsage` via the
  `DevicePushTokenAutoRegistration` side effect) fires during MODULE
  EVALUATION on Android SDK 53+, not when calling an API , so even a lazy
  dynamic import with try/catch still logs the error. Never-evaluating is
  the only clean fix. NO file outside `safeNotifications.ts` may import
  `expo-notifications` (even dynamically , `_layout.tsx` resolves
  `AndroidImportance` via `safeGetAndroidImportance()` for this reason).
  In Expo Go the app runs cleanly with no engagement funnels; in a release
  APK (or dev build) the module loads once, cached, and all local
  notifications work.
- **No Firebase, no FCM, no `google-services.json`**: we only use local
  scheduled notifications (`scheduleNotificationAsync`, channels,
  `getLastNotificationResponseAsync`, `addNotificationResponseReceivedListener`).
  Those code paths never touch Firebase. The library's bundled FCM pieces are
  inert for our usage. (Remote push from a server would require adding FCM;
  we don't do that.)
- **Offline gate**: `src/services/onlineState.ts` is driven by `OfflineNotice`.
  Every `engagementService` schedule function calls `isOnline()` first and
  returns early if the user is denied access. `_layout.tsx` re-runs
  `initFirstRunEngagement()` when connectivity transitions offline → online
  (so a login while offline doesn't permanently miss the funnel).
- **Rebuild required** to test on device: `npx expo run:android --variant release`
  (Expo Go on Android SDK 53+ throws on `expo-notifications` import; safe wrapper
  prevents the crash but local notifications themselves only fire in a real
  build).
- Config plugin: `expo-notifications` in `app.json` with `color: "#F65592"` +
  `defaultChannel: "private-messages-v2"`. We deliberately do NOT add
  `expo-notifications` plugins for FCM or Google services , they would
  force `google-services.json` for a feature we don't use.
- **Punctuality (Android 12+)**: TIME_INTERVAL triggers use _inexact_ alarms
  unless the app holds `SCHEDULE_EXACT_ALARM` , short delays can drift
  ~15min or be deferred in Doze. `app.json` declares
  `android.permissions: ["android.permission.SCHEDULE_EXACT_ALARM"]` (the
  plugin has no key for this; manifest merge is the only route). Requires
  rebuild to take effect; on Android 14 it is denied by default for fresh
  installs.
- **POST_NOTIFICATIONS gate (Android 13+)**: the OS silently drops every
  notification when this runtime grant is missing , channel creation alone
  is NOT enough. Flow: channel first, then `getPermissionsAsync()` →
  `requestPermissionsAsync()`. `_layout` primer close does a one-time
  re-check (`@dreamdate_notif_reprompt_v1`) and re-requests once if the user
  skipped the primer; never nag after that.

### Why not a different library?

`@notifee/react-native` and others are stronger for local notifications (better
channel/styles/actions), but they're third-party native modules that are
**completely absent from Expo Go** , switching wouldn't fix the Expo Go error
at all and would burn a migration day. `expo-notifications` is first-party,
SDK-matched, fully sufficient for our local-only needs, and we only ever
touch its local-scheduling API.

---

## 10. Legal posture (`src/constants/legalDocuments.ts`)

- **18+** strict gate; user warrants age under penalty of perjury
- **Offline-first**: no servers, no identity tracking, all data device-local
- **Coins are digital entertainment licenses** , non-refundable, non-transferable,
  no real-world monetary value
- **VIP weekly pass** , recurring; non-refundable
- **Section 5 (Permissions)** , revised wording matches the app's actual
  behavior: camera/mic are local-only self-preview during simulated calls,
  notifications are local-only device reminders. No recording, no streaming,
  no remote storage.

---

## 11. Verification workflow

```bash
npx tsc --noEmit    # MUST exit 0 before any code change ships
```

This is the **only** automated check we have. There is no Jest, no Detox, no
E2E. Manual smoke-test list (when in doubt):

1. Login → see `PermissionsPrimerModal` → accept → all 3 OS dialogs appear
2. Land on Discover → 100 coins in pill
3. Wait 3–5 min → notification "Priya sent you a message" → tap → opens chat
4. Open chat → reply within ~2–6s with realistic timing → gift-thanks is varied
5. Wait 2 min from install → `IncomingCallOverlay` rings full-screen → accept → 2 free min
   of call, then FREE badge disappears and coin meter starts
6. After 2 min in call, wait until coins deplete → `Coins Depleted` modal
   → Recharge
7. Profile tab → `DailyCheckInModal` auto-opens once/day
8. Open VIP teaser on Discover (session 2+) → tap → `/vip` screen

---

## 12. Rebuild requirements & gotchas

- **`expo-notifications`** , needs `expo prebuild` + release build to take effect
  on Android (Expo Go on Android SDK 53+ doesn't support notifications)
- **`expo-camera` microphone** , needs `recordAudioAndroid: true` in plugin config
  (already set) + native rebuild for RECORD_AUDIO permission
- **`expo-audio`** , playback-only; needs prebuild + release build for the
  native module on device (works in Expo Go as-is). Sounds regenerate via
  `node scripts/generate-sounds.js`
- **Notification channel** , must be created before requesting notification
  permission on Android 13+ (`setNotificationChannelAsync` before
  `requestPermissionsAsync`); both `PermissionsPrimerModal` and
  `engagementService.ensureChannel` enforce this
- **AppBlurView fallback** , on Android, `BlurView` requires a `blurTarget`
  ref to actually blur. Without it, `AppBlurView` falls back to a plain
  semi-transparent background. The detail-screen chat/gift buttons now
  pass `blurTarget={imageTargetRef}` so they frost over the photo
- **Overflow + shadow** , `overflow: 'hidden'` on the same node as a shadow
  clips the shadow on iOS. The BackButton uses an outer `shadowWrap` (shadow
  only) + inner `wrap` (overflow hidden + blur)
- **AsyncStorage default export** , `await import('@react-native-async-storage/async-storage')`
  returns `{default: AsyncStorage}` in some contexts; the code uses
  `(mod as any).default ?? mod` to be safe
- **`expo-iap` (Play Billing)** , native module: needs prebuild + release
  build (dead in Expo Go by design , billingService degrades to UPI-only).
  Plugin auto-adds `com.android.vending.BILLING`. Products must exist in
  Play Console (`coin_100`, `coin_400`, `coin_1000`, `vip_weekly`) or
  `buyWithPlay` returns `unavailable` and the sheet offers UPI instead

---

## 12b. Payments & billing security (`billingService.ts` + `paymentService.ts`)

The ONLY real-money surface in the app. Two methods, both hardened:

### Google Play Billing , REAL (`src/services/billingService.ts`, `expo-iap`)

- Products (consumable, incl. VIP weekly = manual re-buy, NO auto-renew):
  `pack_100→coin_100`, `pack_199→coin_400`, `pack_299→coin_1000`,
  `vip_weekly_499→vip_weekly` (`PLAY_SKU_BY_PACKAGE_ID`). **Create these
  exact IDs in Play Console** or purchases return `unavailable`.
- Flow: `initConnection` → `fetchProducts` (unknown SKUs omitted → UPI
  fallback modal) → `requestPurchase` (event-based; result via
  `purchaseUpdatedListener`/`purchaseErrorListener`, NOT the return value)
  → verify `purchaseState==='purchased'` + non-empty token + token NOT in
  `@dreamdate_play_tokens_v1` → `fulfillPackage` → `finishTransaction`
  (consume: frees SKU for re-buy AND closes the replay window) → record token.
- **Anti-replay**: a processed token is consumed without re-crediting.
- **Kill-mid-payment recovery**: `_layout` boot calls
  `recoverUnfinishedPurchases()` (silent) , `getAvailablePurchases` finds
  purchased-but-unconsumed tokens and fulfills each exactly once.
- **Double-tap lock**: module-level `purchaseInFlight` + sheet-level
  `payingRef`; 10-min safety timeout releases the lock on OEM ROMs that
  drop Play events.
- Error mapping: `user-cancelled` → silent return to sheet (no modal);
  `already-owned/duplicate` → pending + trigger recovery; network/timeout →
  pending; everything else → failure modal with retry.
- Expo Go safety: expo-iap is lazy-imported inside try/catch , billing is
  simply unavailable there, never a crash.

### UPI deep-link , hardened, honest limits (`paymentService.ts`)

- **STRICT success rule**: credit ONLY when the bank response contains
  `Status=SUCCESS` (parsed per NPCI format) AND a txn id
  (`txnId`/`UPITxnId`/`txnRef`). `resultCode===-1` alone is NOT accepted
  (some UPI apps return RESULT_OK on mere return-to-app).
- Ambiguous results → `pending` (NEVER auto-credit; modal shows txn id +
  support guidance). Explicit fail/cancel/decline → failure modal, no credit.
- Every attempt logged to `@dreamdate_upi_txn_log_v1` (last 50, for manual
  reconciliation). `Linking.openURL` fallback path never credits.
- **Known residual risk (documented, accepted)**: deep-link UPI responses
  cannot be cryptographically verified without a gateway/server. If revenue
  justifies it later: Razorpay/Cashfree + receipt-verification worker.

### Status UI (`PaymentStatusModal.tsx` on `AppModal`)

- THE surface for processing / failure(+retry) / pending / unavailable(+Pay
  with UPI). NO `Alert.alert` anywhere in the purchase flow (all removed).
- Success UI stays with the parents: RechargeModal "Recharge Successful!"
  and vip.tsx "VIP Activated" (sheet calls `onSuccess` and closes silently).

### Rules (do not regress)

- ❌ NEVER credit coins without a verified signal (Play `purchased`+token,
  or UPI Status=SUCCESS+txnId). When in doubt → pending, not credit.
- ❌ NEVER reintroduce a simulated/placeholder billing sheet , the fake
  `GooglePlayBillingModal` (free coins on tap) was deleted for cause: it
  was unlimited free money + a Play Store impersonation-policy violation.
- ❌ NEVER `finishTransaction` before `fulfillPackage` succeeds , consume
  is the point of no return.
- ❌ Do NOT convert VIP weekly to auto-renew without explicit user ask ,
  it is a consumable re-buy by decision.
- ❌ NEVER let a girl repeat the same words in the same sequence. Use the
  v3 corpus + slot grammar + anti-repeat ledger. Don't roll back to the
  inline `Pool[archetype]` arrays with 3-line variants.
- ❌ NEVER add a `__DEV__` / Expo Go / build-flag gate on the dev sheet.
  The passcode IS the only lock; it must work in every APK (dev, release,
  published Play).
- ❌ NEVER store the dev passcode in plain text in source code outside
  `devTools.ts`. Default value lives in `DEV_DEFAULT_PASSCODE`.
- ❌ NEVER train the NLU model on device. The model JSON ships bundled
  (`assets/nlu-model.json`); runtime only does `manager.import()`. Re-train
  on PC via `node scripts/train-nlu.js` after editing `scripts/nluCorpus.ts`.
- ❌ NEVER bypass the anti-repeat ledger by calling `pickPool` for chat
  replies. Use `pickCorpus(intent, arch, profileId, mem, sig, ctx?)` only.
  `pickPool` is reserved for photo/call outcome lines.
- ❌ NEVER pass a `require()`d JSON module to `expo-asset`'s
  `Asset.fromModule(...).downloadAsync(...)`. JSON requires return parsed
  objects (start with `{`), not asset references; only use expo-asset
  for registered media assets (images/fonts/audio). Doing this throws
  `IllegalArgumentException: Illegal character in scheme name at index 0:`
  from the native `ExpoAsset` module and surfaces as an unhandled
  promise rejection (CodedError in the stack).

---

## 13. What NOT to do (established user preferences)

- ❌ Do **not** add borders to cards, list rows, buttons, thumbnails, or
  containers (only the coin pill in header, checkbox/radio idle rings,
  and animated sonar rings are allowed)
- ❌ Do **not** add decorative shadows anywhere except navbar + modals +
  back-button class (see §4 table)
- ❌ Do **not** bring back archetype filter chips, archetype badges on
  Discover cards, archetype tags in history rows, archetype pills in chat
  header or profile detail , the data is kept (chatEngine uses it) but the
  UI must not show the "4 types of females" labeling
- ❌ Do **not** use skeleton cards as the bottom-of-grid loader , use the
  fixed-height `LoadMoreFooter` (small pink spinner + pulsing "Loading
  more..." text, always mounted so the list never jumps; new cards fill
  the space below)
- ❌ Do **not** use `Linking.openURL` for "Rate Experience" to a fake review
  prompt , it must open the actual Play Store listing for `com.bolona.videocall`
- ❌ Do **not** ask permissions in a cold install dialog or scatter
  permission requests , funnel through the single `PermissionsPrimerModal`
- ❌ Do **not** auto-deduct coins in the first 120 seconds of any call
  (the FREE window is sacred)
- ❌ Do **not** use fixed 2.6s ring delay , randomize 1.8–4s
- ❌ Do **not** make her send 2 bubbles by default , 1 bubble is the norm;
  2nd bubble only as a rare afterthought, nudge only when he stays silent
- ❌ Do **not** put em dashes, button narration ("tap the pink button"),
  or poetic monologues in her mouth , short human Hinglish only
- ❌ Do **not** mount `IncomingCallOverlay` inside a tab screen , root
  `_layout.tsx` only, so it covers the tab bar from any screen
- ❌ Do **not** show the outgoing "CALLING..." sonar screen for incoming
  calls , `dir=incoming` goes through the brief `connecting` state
- ❌ Do **not** pre-write chat threads, messages, or call logs the user
  hasn't earned , History starts empty; the funnel _delivers_ the opener
  3–5 min later, and missed calls are logged only via the real overlay flow.
  Never call `initFirstRunEngagement` without its race guard
- ❌ Do **not** `play()`/`seekTo()` an expo-audio player before `isLoaded`
  (silent on Android) , always gate on `playbackStatusUpdate`; resolve
  assets via `expo-asset` on Android release; keep sounds ≥ 1s
- ❌ Do **not** show typing instantly after his message , every reply needs
  its random 1–10s pre-typing silence (the plan's `preTypingMs`); never add
  a fixed lead-in
- ❌ Do **not** show coins-per-min anywhere except under the detail screen's
  center "Video Call" button (the single price display). No rate badges on
  Discover/grid cards (`ProfileCard`, `(tabs)/index`), no hero-overlay rate
  badge, no ringing-screen rate chip. Error modals ("rate is X…") and actual
  spend rows are functional states, NOT displays , they stay
- ❌ Do **not** reorder the intent matcher so generic rules shadow specific
  ones , `video_call` must stay before `whatsapp` ("call karo" is a call ask)
- ❌ Do **not** use fixed delays anywhere a human would vary: call waits,
  funnel slots, retries, follow-ups are ALL randomized
- ❌ Do **not** pass `sound` on Android notification channels (omitted =
  default sound) and do **not** assume scheduling == showing , Android 13+
  needs the POST_NOTIFICATIONS grant, Android 12+ needs
  SCHEDULE_EXACT_ALARM for punctual triggers

---

## 13. Screen capture / recording protection

The entire app is **unrecordable**. Screenshots, screen recordings, and the
recents-apps preview all come out **fully black** on every screen. No screen
is excluded.

- **Library**: `expo-screen-capture` (`~57.0.3`, first-party, bundled in Expo Go
  for SDK 57). On Android it sets the `FLAG_SECURE` window flag; on iOS 11+ it
  blocks screen recording and on iOS 13+ it blocks screenshots. No runtime
  permissions are required.
- **Mounted once at the root** via `src/components/ScreenCaptureGuard.tsx`
  using the `usePreventScreenCapture('app-root')` hook. Because the protection
  is a *window-level* flag, every screen in the Stack (login, tabs, chat,
  call, profile, modals) inherits it automatically — no per-screen wiring.
- **Incoming call ring is doubly guarded**: `IncomingCallOverlay` renders
  inside a native `Modal` window on Android, which can bypass the main
  window's `FLAG_SECURE`. The overlay also calls
  `usePreventScreenCapture('incoming-call-overlay')` so the ring screen is
  protected too. Distinct keys prevent the two hook instances from
  cancelling each other on unmount.
- **No detection overlay**: we deliberately do NOT show a warning modal when
  a screenshot is detected (would require `READ_MEDIA_IMAGES` permission on
  older Android and adds an OS consent prompt). The platform's silent black
  output is the user-visible signal that capture is blocked.

### Verifying it works

- Android emulator: `adb shell input keyevent 120` triggers a screenshot.
  The result saved to `/sdcard/Pictures/` is fully black.
- Recents-apps preview: the thumbnail is fully black.
- Screen recording (`adb shell screenrecord`): the resulting MP4 is fully
  black.
- iOS Simulator: **Device → Trigger Screenshot** from the menu bar. The
  preview shows only black.

---

## 14. Recent change log (high-level)

| Round | Theme                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Borderless tonal redesign (remove borders, add shadows)                                                                                                                                                                                                                                                                                                                                                                         |
| 2     | Shadow purge (shadows only on navbar + modals + back button)                                                                                                                                                                                                                                                                                                                                                                    |
| 3     | Hero/wallet gradients, VIP golden card, Play Store rating, back button shadow fix, skeleton loaders                                                                                                                                                                                                                                                                                                                             |
| 4     | Engagement funnel overhaul , chat realism rewrite, notifications, permissions primer, in-app incoming call, low-balance nudges, daily check-in auto-open, post-call follow-up, VIP teaser, legal §5 update                                                                                                                                                                                                                      |
| 5     | Human chat rewrite (1-bubble norm, nudge model, no AI tells, 1-msg funnel seed, human bios) + call audio (expo-audio ringtone/message pop, synthesized WAVs) + overlay at root w/ Modal + 2-min auto-cut + incoming/outgoing call direction                                                                                                                                                                                     |
| 6     | 50-coin first-install grant · splash flicker fix (navigate behind opaque splash, then fade) · load-more spinner footer · staggered 3-female funnel (T+1/2/3min, blurred photo + confirm-deduct-unblur, catch-up on open) · first-install video call at T+2min anchored to login                                                                                                                                                 |
| 7     | Audio/notification reliability: isLoaded-gated expo-audio playback + expo-asset URI resolution, pop padded to 1s, centralized her-message pop+vibration, SCHEDULE_EXACT_ALARM manifest permission, one-time POST_NOTIFICATIONS re-prompt                                                                                                                                                                                        |
| 8     | Blurred photo UX: "Click to open" affordance (no coin price on image, disclosed in modal), reduced blur (radius 12), active chat notification suppression (silent when in chat, chime only when away), luxury audio synthesis (crystal bell message chime + melodic romantic video call ringtone)                                                                                                                               |
| 9     | Persona engine rewrite: async reply planner with 1–10s pre-typing silence + read-no-reply events, per-girl behavior config (photo/call/greed probabilities, 30/40/50 unlock price), hidden affection meter, persisted anti-repeat memory, 7 photo-request + 5 video-call outcomes, user gallery photo sending, funnel expanded to 10 girls (10–20min apart), randomized incoming-call waits, "she's waiting" locked-photo pings |
| 10    | Tiered video call rates (50 to 500 coins/min across all 20 companions) + universal balance gating across Discover, detail & chat screens (insufficient coins blocks call and routes to Recharge) + pay-per-minute billing on outgoing calls (no free window on dialed calls)                                                                                                                                                    |
| 11    | Real payments: deleted the fake Google Play modal (free coins on tap) → REAL Play Billing via expo-iap (consumables coin_100/400/1000 + vip_weekly, token anti-replay, boot recovery, double-tap lock) + strict UPI verification (Status=SUCCESS + txnId required, ambiguous → pending never credit, txn log) + PaymentStatusModal for every outcome (zero OS Alerts)                                                           |
| 12    | Image overhaul: 360 unique Pexels URLs (13 free + 5 locked boudoir per girl, country-matched, zero reuse, models 21-35 look) + lockedPhotos rendered in detail gallery (blur + price + unlock modal) + chat/funnel photo sends sourced from lockedPhotos (true exclusives) + hornier bios/captions/copy                                                                                                                         |
| 13    | Spicier register upgrade: locked tier → implied-nude mix (topless-covering, hands-on-breasts, sheer/transparent lingerie , spiciest legally-hotlinkable register, verified; Pixabay rejected: unverifiable subjects + unstable signed URLs) + same-shoot gallery rebuild (8 free per girl from same-series clusters, one face per profile) + hornier locked captions (nangi/bra-utar-di register)                               |
| 14    | Reply runner rewrite (cross-chat survival) + HARD 10s reply cap (any girl, any length, busy = brief flicker theater not real delay) + cross-chat nudges (`hello?? kahan gaye`) fire when he's elsewhere (notification + sound + unread) + proactive flirty pings every 10–15 min per enrolled girl (hard register: text flirt / locked-photo tease / call-tease ~60/25/15) with global caps (3/hr, 4min gap) + per-profile typing bus (`subscribeTyping` / `isTypingFor`) + service-level user-send clock (`notifyUserSent`) + gift-thanks moved to runner. Chat screen is now a thin view: history + subscriptions + send. Reply timers NEVER live in the screen again. |
| 15    | v3 conversation corpus (`conversationCorpus.ts`, 30 intents × 4 archetypes, ~2.5k base variants) + slot grammar (opener/mid/closer/particle/emoji pools, combinatorial unique surface strings) + anti-repeat service (`antiRepeat.ts`, sync 30-slot recent ring + 7-day ledger capped 500/girl + cross-girl guard) — HARD INVARIANT: a girl NEVER uses the same words in the same sequence. + Dev sheet (passcode-gated 2760/4-digit, 3-fail 60s lockout, changeable in-sheet, works in every build) with +100/+1k/+10k coin grants, VIP 7d, reset wallet, reset repeat ledger, change passcode (all logged with source: "dev"). Wire: long-press the Profile tab balance number (2.5s). Plan: phases 2-4 (NLU, time/context, harness) still queued. |
| 16    | v3 engine complete: Phase 2 NLU brain (`scripts/train-nlu.js` build-time → `assets/nlu-model.json` 2.2MB bundled → `nluService.ts` `manager.import()` at boot, regex override gates monetization intents) trained on 1,500+ Hinglish utterances across 29 intents (smoke 7/7 on unseen phrasing). Phase 3 time/context/reactions/imperfection (`realism.ts`): tod-flavour prefix/suffix, context callbacks (echo last word, mention promisedCall/awaitingUserPhoto per-archetype), imperfection layer (8% drop punct, 5% lowercase, 12% typing-restart, 50% lazy "k/ok" for tiny inputs). Phase 4 stress harness (`stressHarness.ts`) runnable from dev sheet "Run 200-msg stress" button — verified 500 picks = 500 unique strings, 0 within-30 dupes, 0 cross-girl dupes. Cross-girl ring bumped 30→100. Plan: 2.5k corpus left at headroom to 10k if you want more density per intent. |
| 17    | App-wide screenshot & screen-recording block: `expo-screen-capture` mounted once at the root via `ScreenCaptureGuard` (key `app-root`) → every screen (login, tabs, chat, call, profile, modals) inherits Android `FLAG_SECURE` + iOS 11+ / 13+ secure-screen API → screenshots, screen recordings, and the recents-apps preview all come out fully black. `IncomingCallOverlay` ALSO re-applies the hook (key `incoming-call-overlay`) because the ring screen renders inside a native `Modal` window that can bypass the main window's FLAG_SECURE. No per-screen work needed anywhere. Library is bundled in Expo Go for SDK 57. |
