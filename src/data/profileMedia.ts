/**
 * Per-profile media manifest.
 *
 * Source of truth for which images belong to which girl (1..39). Generated
 * from the live listing at /private-video/v1/images so the in-app bindings
 * always match what's actually uploaded. Files with the `_u` suffix are
 * locked (boudoir-exclusive) images that require coins to unlock.
 *
 * Profiles themselves live in mockProfiles.ts (names, bios, archetype, etc.)
 * and look up their media here.
 */

export interface GirlMedia {
  readonly free: readonly string[];
  readonly locked: readonly string[];
}

export const GIRL_MEDIA: readonly GirlMedia[] = [
  { free: ['img_1_1.jpg'], locked: [] },
  { free: ['img_2_1.jpg', 'img_2_2.jpg'], locked: ['img_2_3_u.jpg'] },
  { free: ['img_3_1.jpg', 'img_3_2.jpg'], locked: [] },
  { free: ['img_4_1.jpg'], locked: [] },
  { free: ['img_5_1.jpg'], locked: [] },
  { free: ['img_6_1.jpg'], locked: [] },
  { free: ['img_7_1.jpg', 'img_7_2.jpg', 'img_7_3.jpg', 'img_7_4.jpg'], locked: [] },
  {
    free: ['img_8_1.jpg', 'img_8_2.jpg', 'img_8_3.jpg'],
    locked: ['img_8_4_u.jpg', 'img_8_5_u.jpg'],
  },
  { free: ['img_9_1.jpg', 'img_9_2.jpg', 'img_9_3.jpg', 'img_9_4.jpg'], locked: [] },
  { free: ['img_10_1.jpg', 'img_10_2.jpg', 'img_10_3.jpg', 'img_10_4.jpg'], locked: [] },
  {
    free: ['img_11_1.jpg', 'img_11_2.jpg', 'img_11_3.jpg', 'img_11_4.jpg', 'img_11_7.jpg'],
    locked: ['img_11_5_u.jpg', 'img_11_6_u.jpg'],
  },
  { free: ['img_12_1.jpg', 'img_12_2.jpg', 'img_12_3.jpg', 'img_12_4.jpg'], locked: [] },
  { free: ['img_13_1.jpg'], locked: ['img_13_2_u.jpg'] },
  { free: ['img_14_1.jpg'], locked: [] },
  {
    free: [
      'img_15_1.jpg',
      'img_15_2.jpg',
      'img_15_3.jpg',
      'img_15_4.jpg',
      'img_15_5.jpg',
      'img_15_6.jpg',
    ],
    locked: ['img_15_7_u.jpg'],
  },
  { free: ['img_16_1.jpg'], locked: [] },
  { free: ['img_17_1.jpg'], locked: ['img_17_2_u.jpg'] },
  {
    free: ['img_18_1.jpg', 'img_18_4.jpg', 'img_18_5.jpg', 'img_18_6.jpg'],
    locked: ['img_18_2_u.jpg', 'img_18_3_u.jpg'],
  },
  { free: ['img_19_1.jpg'], locked: [] },
  { free: ['img_20_1.jpg'], locked: [] },
  { free: ['img_21_1.jpg'], locked: [] },
  { free: ['img_22_1.jpg'], locked: [] },
  {
    free: [
      'img_23_1.png',
      'img_23_2.png',
      'img_23_3.png',
      'img_23_4.png',
      'img_23_5.png',
      'img_23_6.png',
    ],
    locked: ['img_23_7_u.png', 'img_23_8_u.jpg'],
  },
  { free: ['img_24_1.jpg'], locked: [] },
  { free: ['img_25_1.jpg'], locked: [] },
  { free: ['img_26_1.jpg'], locked: [] },
  { free: ['img_27_1.jpg'], locked: [] },
  { free: ['img_28_1.jpg', 'img_28_2.jpg'], locked: [] },
  { free: ['img_29_1.jpg', 'img_29_2.jpg'], locked: [] },
  { free: ['img_30_1.jpg', 'img_30_2.jpg'], locked: [] },
  { free: ['img_31_1.jpg'], locked: [] },
  { free: ['img_32_1.jpg'], locked: ['img_32_2_u.jpg'] },
  { free: ['img_33_1.jpg'], locked: [] },
  {
    free: ['img_34_1.jpg', 'img_34_2.jpg', 'img_34_3.jpg'],
    locked: ['img_34_4_u.jpg'],
  },
  { free: ['img_35_1.jpg'], locked: [] },
  { free: ['img_36_1.jpg'], locked: [] },
  { free: ['img_37_1.jpg'], locked: [] },
  { free: ['img_38_1.PNG'], locked: ['img_38_2_u.jpg'] },
  { free: ['img_39_1.jpg'], locked: [] },
];

export function getMediaForGirl(index1Based: number): GirlMedia {
  const girl = GIRL_MEDIA[index1Based - 1];
  if (!girl) {
    return { free: [], locked: [] };
  }
  return girl;
}
