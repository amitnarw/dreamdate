/**
 * Global Blur & Frosted Glass Configuration for DreamDate
 * 
 * Modifying any parameter here immediately updates blur across the entire application:
 * - Bottom Navigation Bar
 * - Back Buttons
 * - Search Buttons
 * - Homepage Cards & Details Panels
 * - Status Badges (Online / Busy)
 * - Profile Screen Action Buttons (Chat, Gift)
 * - Headers and Modals
 */

export const AppBlurConfig = {
  // Master Blur Intensity (increased by 20% from 20 -> 24)
  intensity: 24,

  // Theme Tint ('dark' | 'light' | 'default')
  tint: 'dark' as const,

  // Native Android Blur Engine
  blurMethod: 'dimezisBlurView' as const,

  // Divisor for blur radius on Android (1 = max blur radius)
  blurReductionFactor: 1,

  // Glass Frosted Tint Color
  backgroundColor: 'rgba(28, 18, 22, 0.40)',

  // Web Glassmorphic Backdrop Filter (increased by 20% from 8px -> 10px)
  webBackdropFilter: 'blur(10px) saturate(160%)',
};

export type AppBlurConfigType = typeof AppBlurConfig;
