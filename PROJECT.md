# DreamDate — Project Context for AI Assistants

> **Read this file first** when starting a new chat about this repo. It captures the
> app's purpose, architecture, design system, engagement funnel, storage layout,
> and the explicit user preferences established across our recent work.

---

## 1. What this app is

**DreamDate** — an Expo SDK 57 (React Native 0.86, React 19) **AI-companion / virtual-dating simulation app**, Android-first. Package: `com.amitnarwal.dreamdate`.

- **100% offline** — no backend, no remote DB, no analytics, no identity tracking.
  All data lives in AsyncStorage on the user's device.
- **Monetized** via in-app **Coins** (consumable, for video calls & gifts) and a
  **Weekly VIP** pass (recurring subscription).
- **18+ gated** — login screen requires explicit consent checkbox before entry.
- **AI character simulation** — profiles are pre-seeded; chat replies are
  generated locally; "video calls" are pre-recorded looping videos with the
  user's camera shown only as a local self-preview overlay.
- **Disclosed** as a simulation at login + throughout legal docs ("100% Offline
  Simulation", "all profiles… entirely fictitious, pre-recorded, automated").

The app deliberately feels alive while remaining offline — all "she texted you"
and "she called you" events are scheduled locally with `expo-notifications`
or in-app timers. This is the engagement/psychology funnel (see §5).

---

## 2. Tech stack & commands

| | |
|---|---|
| Framework | Expo SDK 57 (`expo`, `expo-router`) |
| React | 19.2.3 |
| React Native | 0.86.3 |
| Animations | `react-native-reanimated` 4.5 + `Animated` API |
| Native blur | `expo-blur` |
| Notifications | `expo-notifications` (local scheduled only) |
| Camera + Mic | `expo-camera` (self-preview only) |
| Video | `expo-video` (looped pre-recorded clips) |
| Payment | UPI intent launcher (`expo-intent-launcher`) + Google Play Billing mock |
| Storage | `@react-native-async-storage/async-storage` |
| Icons | `@expo/vector-icons` (Ionicons) |
| Linking | `expo-linking` (for Play Store open) |
| TypeScript | 6.0.3, strict |

**Commands**

```bash
npm install                  # install deps
npx tsc --noEmit            # typecheck — MUST pass before shipping any change
npx expo start               # dev (Expo Go — note: notifications won't work here)
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
│   │   ├── index.tsx             # Discover — profile grid + skeleton loaders + VIP teaser strip + IncomingCallOverlay
│   │   ├── history.tsx           # Chats & Calls tabs (swipeable)
│   │   └── profile.tsx           # Hero card (gradient) + wallet (gradient) + VIP/coins/settings/check-in/nudge
│   ├── chat/[id].tsx             # Chat screen with realistic replies + gift card
│   ├── call/[id].tsx             # Video call: ring → connected (FREE first 120s) → ended; reconnect glitch; follow-up
│   └── profile/[id].tsx          # Companion detail w/ photo gallery
│
├── components/                   # Shared UI
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
│   ├── GooglePlayBillingModal.tsx # Mock Google Play IAB sheet
│   ├── IncomingCallOverlay.tsx   # Full-screen ring for in-app simulated call
│   ├── LegalViewerModal.tsx      # Tabs: Terms / Privacy
│   ├── OfflineNotice.tsx         # Connectivity ping overlay
│   ├── PaymentSelectorSheet.tsx  # UPI vs Google Play bottom sheet (subtle shadow)
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
│   └── mockProfiles.ts           # 12 profiles + ARCHETYPE_META + VIRTUAL_GIFTS + FAKE_CALL_VIDEOS
│                                 # NOTE: archetype field exists for chat-engine personality only;
│                                 #       archetype badges/tags/filter chips are deliberately NOT in the UI.
│
├── hooks/
│   └── use-{color-scheme,theme}.ts
│
└── services/
    ├── chatEngine.ts             # Realistic reply engine (see §6) — variant pools + anti-repeat + timing
    ├── callHistoryService.ts     # local call log (type: incoming/outgoing/missed)
    ├── engagementService.ts      # First-run funnel: notifications, channel, deep links (see §5)
    ├── incomingCallService.ts    # In-app ringing orchestrator (singleton; 4–6 min after first session)
    ├── paymentService.ts         # RECHARGE_PACKAGES + VIP_WEEKLY_PACKAGE + launchUPIPayment
    ├── wallet.ts                  # addCoins / deductCoins / activateWeeklyVip / useWallet hook
    └── chatHistoryService.ts
```

---

## 4. Design System — "Borderless Tonal"

The cardinal rule (user feedback): **no decorative borders; no decorative
shadows**. Depth comes from **tonal fill layering** of surfaces, not strokes
or elevation.

### Allowed shadows
Only on **floating layers that lift off the canvas**:

| Layer | Shadow |
|---|---|
| Bottom navbar | `offset 0,6 / opacity 0.25 / radius 12 / elevation 6` (THE small one) |
| Floating modals/sheets (`AppModal`, `RechargeModal`, `PaymentSelectorSheet`) | `opacity ~0.12–0.32 / radius 6–20 / elevation 3–8` (subtle) |
| Back button & detail-screen chat/gift circles | `opacity 0.18 / radius 6 / elevation 2` (mild) |
| `IncomingCallOverlay` zIndex 9999 | Required for stacking, not visual |

Everything else is flat: hero cards, wallet, perk cards, list rows, profile
detail thumbnails, call screen info card, etc.

### Selection states
- **Small controls** (chips, tabs, radio active): solid primary `#F65592` fill
- **Large cards** (coin packs, payment methods, gift cards, plan card): soft
  pink-tinted fill `rgba(246,85,146,0.12–0.22)` with primary text + checkmark
- **Radio idle** = `borderWidth: 2` with subtle stroke (this is one allowed
  outline — it's a real interactive control affordance, not decorative)

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
6. **Frosted glass circles for chat/gift actions** on detail screen —
   same visual treatment as the back button (frosted glass + mild shadow +
   `blurTarget` pointing at the photo so the frost is real on Android)
7. **VIP hero profile card** = golden gradient + 3 decorative light orbs +
   gold-tinted dividers + white/gold text + solid gold `VIP ELITE` badge
8. **Wallet card** = primary pink gradient (`#F65592 → #E11D48 → #BE185D`)
   with 2 white light orbs, white text, white "Recharge" pill
9. **Coin pill in header** is the ONLY bordered UI element we keep
   (subtle hairline `rgba(255,255,255,0.14)` dark / `rgba(0,0,0,0.08)` light)

---

## 5. Engagement & Psychology Funnel

This is the system's heart — all timed locally, no server.

### First-run sequence (after Fast Login)

```
t=0       Fast Login → +100 coins, persist user, jump to Discover
          ↓
          _layout.tsx mounts → PermissionsPrimerModal shows once
          (`@dreamdate_permissions_primed_v1` flag) → requests camera+mic+notif
          ↓
          AuthContext → initFirstRunEngagement() schedules:
          • local notification: "Priya sent you a message 💬" @ T+3–5 min
            (pre-seeded chat thread with 2 opener msgs, unread)
          • local notification: "Missed video call from Ananya 💋"
            @ T+20–35 min + writes a missed call log entry
          ↓
          Discover focus → incomingCallService.scheduleFirstIfEligible()
          fires a full-screen IncomingCallOverlay 4–6 min into the session.
          Accept → router.push('/call/{id}'); 2 free minutes.
          Decline → retry after 2 min (max 2 retries) → missed call log
```

### Engagement service (key functions in `src/services/engagementService.ts`)
- `setupNotificationHandler()` — call once at app boot
- `initFirstRunEngagement()` — call after Fast Login
- `markMessageFunnelFired()` / `markCallFunnelFired()` — cancel scheduled notifs
  when user actually opens the chat/call (called from `_layout` response
  listener + from `call/[id].tsx` entry)
- `markEngagementDone()` — cancel everything (e.g., when user already has
  organic threads)
- `schedulePostDepletionReminder(profileName)` — 30 min after coin depletion
- `maybeScheduleReengagement(profileName)` — max 1×/24h

### Notification contract
- Channel: `private-messages` (Android), `Notifications.AndroidImportance.HIGH`,
  pink light color, default sound
- `data: { url: '/chat/{id}' | '/call/{id}' | '/(tabs)', type: 'incoming_message' | 'missed_call' | 'recharge_reminder' | 're_engagement' }`
- Response listener in `_layout.tsx` routes via `router.push(url)` and
  calls the appropriate `mark*FunnelFired()`

### Always-on nudges (max 1×/day each)
- **Auto-open Daily Check-In** — `profile.tsx` `useFocusEffect` opens the modal
  once per calendar day (`@dreamdate_checkin_auto_v1` flag)
- **Low-balance nudge** — fires AppModal `Only X coins left` when `coins < 25`,
  routes to Recharge. Capped at 1×/24h (`@dreamdate_last_nudge_v1`)

### Monetization pressure (what nudges users to buy)
1. **Coin depletion during call** (rate 35–50/min; 100 coins ≈ 2 min call) →
   `coinsDepletedModalVisible` → Recharge
2. **Gift failure** → `GiftModal` `onNeedRecharge` → Recharge
3. **VIP teaser strip** on Discover from session 2+ (`@dreamdate_launch_count_v1`)
4. **Weekly VIP** page accessible from profile menu; success unlocks golden
   gradient profile card + 1,500 weekly coin grant

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

## 6. Chat engine realism (`src/services/chatEngine.ts`)

`getSimulatedReply(userMessage, profile)` returns `{ bubbles, delayMs,
additionalDelayMs, photoUrl?, isDelayed? }`.

### Realism mechanics
- **Variable typing delay**: `700ms base + 36ms/char + 0–1500ms jitter` —
  proportional to message length
- **Variant pools**: 3–5 variants per topic (bot, whatsapp, photo, food,
  outfit, activity, compliment, love, call, short, greet, fallback) per
  archetype (playful_tease, sweet_romantic, bold_alluring, mysterious_sensual)
- **Anti-repeat memory**: per-profile last-4 sigs tracked in
  `@dreamdate_reply_history_v5_{profileId}` + in-memory LRU as fallback
- **Probabilities**:
  - 34% sell-CTA in any reply (was 100%; too bot-like before)
  - 18% double-text (3rd bubble after 2–6s)
  - 10% delayed reply (30–65s, "was AFK")
  - 12% quick single-word reply
- **Gift thanks**: 5 variants per archetype, references actual gift name,
  uses `generateGiftThanks(name, archetype)`
- **Post-call follow-up**: `generatePostCallFollowUp(profile, durationSec)`
  writes 1 message 1–3 min after call ends (timer scheduled in
  `handleEndCall`)
- **Time-of-day awareness**: `getTimeAwareGreeting(archetype, name)` — morning/
  afternoon/evening/night variants
- **Caller must call** `setReplyContext(profileId)` before `getSimulatedReply`

### Openers
- 3–4 variants per archetype (varied vibe: late night, missed you, casual)
- Returned as 1–2 messages (35% chance single, 65% double)
- Timestamps randomized 2–5 min ago / 15–90s ago

### Callbacks the chat screen (`src/app/chat/[id].tsx`) wires
- `setReplyContext(profile.id)` before `getSimulatedReply(text, profile)`
- After gift send: `generateGiftThanks(gift.name, profile.archetype)`
  with delay = `1200 + text.length * 36 + jitter(0, 1500)`
- After call ends: schedule follow-up via `generatePostCallFollowUp` + write
  to `@dreamdate_chat_history_v5_{profileId}`

---

## 7. Call realism (`src/app/call/[id].tsx`)

| Behavior | Implementation |
|---|---|
| Ring duration | `1800 + random*2200` ms (1.8–4s) — was fixed 2.6s |
| FREE first 120s | Skip coin deduction; green `FREE` badge on screen |
| Reconnect glitch | One random 850ms pause at T+45–75s, video pauses + "Reconnecting…" overlay |
| Mic permission | Requested alongside camera at entry |
| Coin deduction | `callRate` per minute after 120s; if insufficient → end + `coinsDepletedModal` + `schedulePostDepletionReminder` |
| Post-call follow-up | `generatePostCallFollowUp(profile, durationSec)` written 1–3 min after end |
| Save log | `saveCallLog({type: 'outgoing', durationSeconds, coinsSpent})` |

### In-app simulated incoming call (`src/components/IncomingCallOverlay.tsx`)
- Triggered by `incomingCallService` singleton 4–6 min into first Discover session
- Full-screen BlurView with sonar pulses + avatar pulse animation
- Heavy haptic on trigger
- Accept → `incomingCallService.accepted(id)` + `router.push('/call/{id}')`
- Decline → `incomingCallService.declined(id)` → retries after 2 min (max 2)
- After max retries → `saveCallLog({type: 'incoming', durationSeconds: 0})`

---

## 8. Storage keys registry (`@dreamdate_*`)

All AsyncStorage keys are versioned for safe rollouts.

### Auth & users
- `@dreamdate_auth_user_v1` — local guest session
- `@dreamdate_welcome_bonus_v1` — has 100-coin bonus been awarded?
- `@dreamdate_launch_count_v1` — incremented on every app boot (for VIP teaser gate)

### Permissions & engagement gates
- `@dreamdate_permissions_primed_v1` — PermissionsPrimerModal shown?
- `@dreamdate_checkin_auto_v1` — last day Daily Check-In auto-opened
- `@dreamdate_last_nudge_v1` — last low-balance nudge timestamp
- `@dreamdate_vip_teaser_seen_v1` — VIP teaser strip dismissed/seen
- `@dreamdate_engagement_state_v1` — funnel state (msg/call notif ids, completion)
- `@dreamdate_last_engagement_notif_v1` — last re-engagement notif timestamp
- `@dreamdate_post_depletion_notif_v1` — active post-depletion notif id
- `@dreamdate_incoming_call_fired_v1` — incoming call fired already?

### Wallet
- `@dreamdate_user_coins_v2` — coin balance
- `@dreamdate_user_vip_v2` — VIP expiration timestamp
- `@dreamdate_has_purchased_v1` — has any purchase occurred (drives locked
  content in `DailyCheckInModal` and `VIP`)

### Chat (v5 — current)
- `@dreamdate_chat_history_v5_{profileId}` — message array
- `@dreamdate_active_chat_threads_v5` — list of profileIds with history
- `@dreamdate_reply_history_v5_{profileId}` — last 4 reply sigs (anti-repeat)

### Calls
- `@dreamdate_call_logs_v1` — call log entries (incl. missed-call entries
  written by engagement funnel)

### Daily check-in (v2 — current)
- `@dreamdate_checkin_current_day_v2` — next-day index (0–6)
- `@dreamdate_last_checkin_timestamp_v2` — last claimed date string

> **Versioning note**: the `_v2` on check-in keys + `_v5` on chat keys
> are deliberate — earlier versions had bugs (e.g. check-in marking 2 days
> completed at once). Bumping the key resets polluted state for all users.

---

## 9. Notifications architecture

- Library: `expo-notifications` (local scheduled only — no remote push)
- Channel: `private-messages` (Android) with HIGH importance + sound + pink light
- Handler in `_layout.tsx` via `setupNotificationHandler()`:
  ```js
  shouldShowBanner: true, shouldShowList: true,
  shouldPlaySound: true, shouldSetBadge: true
  ```
- Deep-link contract: `data: { url, type }` → `router.push(url)` on tap
- **Rebuild required** to test: `npx expo run:android --variant release`
  (Expo Go on Android SDK 53+ doesn't support push notifications)
- Config plugin: `expo-notifications` in `app.json` with `color: "#F65592"` +
  `defaultChannel: "private-messages"`

---

## 10. Legal posture (`src/constants/legalDocuments.ts`)

- **18+** strict gate; user warrants age under penalty of perjury
- **Offline-first**: no servers, no identity tracking, all data device-local
- **Coins are digital entertainment licenses** — non-refundable, non-transferable,
  no real-world monetary value
- **VIP weekly pass** — recurring; non-refundable
- **Section 5 (Permissions)** — revised wording matches the app's actual
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
5. Wait 4–6 min → `IncomingCallOverlay` rings full-screen → accept → 2 free min
   of call, then FREE badge disappears and coin meter starts
6. After 2 min in call, wait until coins deplete → `Coins Depleted` modal
   → Recharge
7. Profile tab → `DailyCheckInModal` auto-opens once/day
8. Open VIP teaser on Discover (session 2+) → tap → `/vip` screen

---

## 12. Rebuild requirements & gotchas

- **`expo-notifications`** — needs `expo prebuild` + release build to take effect
  on Android (Expo Go on Android SDK 53+ doesn't support notifications)
- **`expo-camera` microphone** — needs `recordAudioAndroid: true` in plugin config
  (already set) + native rebuild for RECORD_AUDIO permission
- **Notification channel** — must be created before requesting notification
  permission on Android 13+ (`setNotificationChannelAsync` before
  `requestPermissionsAsync`); both `PermissionsPrimerModal` and
  `engagementService.ensureChannel` enforce this
- **AppBlurView fallback** — on Android, `BlurView` requires a `blurTarget`
  ref to actually blur. Without it, `AppBlurView` falls back to a plain
  semi-transparent background. The detail-screen chat/gift buttons now
  pass `blurTarget={imageTargetRef}` so they frost over the photo
- **Overflow + shadow** — `overflow: 'hidden'` on the same node as a shadow
  clips the shadow on iOS. The BackButton uses an outer `shadowWrap` (shadow
  only) + inner `wrap` (overflow hidden + blur)
- **AsyncStorage default export** — `await import('@react-native-async-storage/async-storage')`
  returns `{default: AsyncStorage}` in some contexts; the code uses
  `(mod as any).default ?? mod` to be safe

---

## 13. What NOT to do (established user preferences)

- ❌ Do **not** add borders to cards, list rows, buttons, thumbnails, or
  containers (only the coin pill in header, checkbox/radio idle rings,
  and animated sonar rings are allowed)
- ❌ Do **not** add decorative shadows anywhere except navbar + modals +
  back-button class (see §4 table)
- ❌ Do **not** bring back archetype filter chips, archetype badges on
  Discover cards, archetype tags in history rows, archetype pills in chat
  header or profile detail — the data is kept (chatEngine uses it) but the
  UI must not show the "4 types of females" labeling
- ❌ Do **not** use ActivityIndicator as the bottom-of-grid loader — use the
  `SkeletonCard` component (same 260×48% dimensions so there's no jump)
- ❌ Do **not** use `Linking.openURL` for "Rate Experience" to a fake review
  prompt — it must open the actual Play Store listing for `com.amitnarwal.dreamdate`
- ❌ Do **not** ask permissions in a cold install dialog or scatter
  permission requests — funnel through the single `PermissionsPrimerModal`
- ❌ Do **not** auto-deduct coins in the first 120 seconds of any call
  (the FREE window is sacred)
- ❌ Do **not** use fixed 2.6s ring delay — randomize 1.8–4s

---

## 14. Recent change log (high-level)

| Round | Theme |
|---|---|
| 1 | Borderless tonal redesign (remove borders, add shadows) |
| 2 | Shadow purge (shadows only on navbar + modals + back button) |
| 3 | Hero/wallet gradients, VIP golden card, Play Store rating, back button shadow fix, skeleton loaders |
| 4 | Engagement funnel overhaul — chat realism rewrite, notifications, permissions primer, in-app incoming call, low-balance nudges, daily check-in auto-open, post-call follow-up, VIP teaser, legal §5 update |
