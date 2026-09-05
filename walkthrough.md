# Details Screen Exit Animation: Fade Out from Top to Bottom

## Applied Animation:
In [`src/app/profile/[id].tsx`](file:///c:/Users/Narwal/Desktop/dreamdate/src/app/profile/[id].tsx), updated the details screen dismiss behavior:
- **Fade Out from Top to Bottom**:
  - When dismissed via the top back button or Android hardware back button:
    - `fadeAnim`: Fades opacity from `1` to `0` over **220ms** with `Easing.out(Easing.ease)`.
    - `slideAnim`: Translates downwards from `0` to `SCREEN_HEIGHT * 0.5` over **220ms** with `Easing.in(Easing.cubic)`.
    - `backdropOpacity`: Fades from `1` to `0`.
  - The screen smoothly glides downwards while dissolving into the background.

---

## Verification:
- **TypeScript**: `npx tsc --noEmit` passed with 0 errors.
- **Expo Bundler**: `npx expo export --no-bytecode` bundled all 11 routes for Android, iOS, and Web with 0 errors.
