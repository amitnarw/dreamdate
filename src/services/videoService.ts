/**
 * Global Private Video Service
 * Provides helpers to access and stream private videos hosted on Hostinger.
 */

export const PRIVATE_VIDEO_CONFIG = {
  BASE_URL: 'https://dubaiwalatrader.com/wp-json/private-video/v1',
  STREAM_ENDPOINT: 'https://dubaiwalatrader.com/wp-json/private-video/v1/stream',
  LIST_ENDPOINT: 'https://dubaiwalatrader.com/wp-json/private-video/v1/list',
  APP_KEY: 'v9Kp2xR7mQ4zL8aN6tY3sW1',
  TOTAL_VIDEOS: 38,
};

/**
 * Returns a direct, authenticated streaming URL for a given video file or index.
 *
 * Examples:
 *   getVideoStreamUrl(1)             // => ".../stream/vid_1.mp4?key=..."
 *   getVideoStreamUrl('vid_1')       // => ".../stream/vid_1.mp4?key=..."
 *   getVideoStreamUrl('vid_1.mp4')   // => ".../stream/vid_1.mp4?key=..."
 */
export function getVideoStreamUrl(identifier: string | number): string {
  let fileName: string;

  if (typeof identifier === 'number') {
    // 1-indexed video number, clamped between 1 and TOTAL_VIDEOS
    const safeNum = Math.max(1, Math.min(identifier, PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS));
    fileName = `vid_${safeNum}.mp4`;
  } else {
    let clean = identifier.trim();
    if (!clean.endsWith('.mp4')) {
      clean = `${clean}.mp4`;
    }
    fileName = clean;
  }

  return `${PRIVATE_VIDEO_CONFIG.STREAM_ENDPOINT}/${fileName}?key=${PRIVATE_VIDEO_CONFIG.APP_KEY}`;
}

/**
 * Returns an array of all available video streaming URLs (vid_1 to vid_38).
 */
export function getAllVideoUrls(): string[] {
  return Array.from({ length: PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS }, (_, i) =>
    getVideoStreamUrl(i + 1)
  );
}

/**
 * Returns a consistent, deterministic video URL for any profile ID or index.
 * Ensures each profile maps to a valid video in the 1..38 range.
 */
export function getVideoForProfile(profileIdOrIndex: string | number): string {
  if (typeof profileIdOrIndex === 'number') {
    const videoNum = ((profileIdOrIndex % PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS) + PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS) % PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS + 1;
    return getVideoStreamUrl(videoNum);
  }

  // Hash string ID to a number between 1 and TOTAL_VIDEOS
  let hash = 0;
  for (let i = 0; i < profileIdOrIndex.length; i++) {
    hash = (hash << 5) - hash + profileIdOrIndex.charCodeAt(i);
    hash |= 0;
  }
  const videoNum = (Math.abs(hash) % PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS) + 1;
  return getVideoStreamUrl(videoNum);
}

export interface RemoteVideoMeta {
  name: string;
  size: number;
}

/**
 * Fetches the live list of videos currently uploaded on the Hostinger server.
 */
export async function fetchLiveVideoList(): Promise<RemoteVideoMeta[]> {
  try {
    const response = await fetch(PRIVATE_VIDEO_CONFIG.LIST_ENDPOINT, {
      method: 'GET',
      headers: {
        'X-App-Key': PRIVATE_VIDEO_CONFIG.APP_KEY,
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video list: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('[videoService] fetchLiveVideoList error:', error);
    return [];
  }
}
