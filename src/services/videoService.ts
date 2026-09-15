/**
 * Global Private Video Service
 * Provides helpers to access and stream private videos hosted on Hostinger.
 *
 * Auth note: URLs returned here are CLEAN (no ?key=...). Authentication
 * happens via the X-App-Key header, which consumers must pass to expo-image
 * / expo-video / Image source objects. The key itself is held in appKeys.ts
 * to keep the literal out of the bytecode string table.
 */

import { getMediaKey, getMediaHeaders } from "./appKeys";

export const PRIVATE_VIDEO_CONFIG = {
  BASE_URL: "https://dubaiwalatrader.com/wp-json/private-video/v1",
  STREAM_ENDPOINT:
    "https://dubaiwalatrader.com/wp-json/private-video/v1/stream",
  LIST_ENDPOINT: "https://dubaiwalatrader.com/wp-json/private-video/v1/list",
  IMAGE_ENDPOINT: "https://dubaiwalatrader.com/image.php",
  IMAGE_LIST_ENDPOINT:
    "https://dubaiwalatrader.com/wp-json/private-video/v1/images",
  TOTAL_VIDEOS: 39,
  TOTAL_PROFILES: 39,
  IMAGE_EXTENSIONS: ["jpg", "jpeg", "png", "webp", "gif"] as const,
};

/**
 * Returns the auth headers every authenticated media request needs.
 * Same payload for image.php, the WP stream endpoint, and the list endpoints.
 */
export const MEDIA_HEADERS: Record<string, string> = getMediaHeaders();

/**
 * Returns a direct streaming URL for a given video file or index. The URL
 * does NOT embed the key; the consumer must attach headers from getMediaHeaders().
 *
 * Examples:
 *   getVideoStreamUrl(1)             // => ".../stream/vid_1.mp4"
 *   getVideoStreamUrl('vid_1')       // => ".../stream/vid_1.mp4"
 *   getVideoStreamUrl('vid_1.mp4')   // => ".../stream/vid_1.mp4"
 */
export function getVideoStreamUrl(identifier: string | number): string {
  let fileName: string;

  if (typeof identifier === "number") {
    // 1-indexed video number, clamped between 1 and TOTAL_VIDEOS
    const safeNum = Math.max(
      1,
      Math.min(identifier, PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS),
    );
    fileName = `vid_${safeNum}.mp4`;
  } else {
    let clean = identifier.trim();
    if (!clean.endsWith(".mp4")) {
      clean = `${clean}.mp4`;
    }
    fileName = clean;
  }

  return `${PRIVATE_VIDEO_CONFIG.STREAM_ENDPOINT}/${fileName}`;
}

/**
 * Returns an array of all available video streaming URLs (vid_1 to vid_39).
 */
export function getAllVideoUrls(): string[] {
  return Array.from({ length: PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS }, (_, i) =>
    getVideoStreamUrl(i + 1),
  );
}

/**
 * Returns a consistent, deterministic video URL for any profile ID or index.
 * Ensures each profile maps to a valid video in the 1..39 range.
 */
export function getVideoForProfile(profileIdOrIndex: string | number): string {
  if (typeof profileIdOrIndex === "number") {
    const videoNum =
      (profileIdOrIndex % PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS +
        PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS) %
      PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS + 1;
    return getVideoStreamUrl(videoNum);
  }

  // Hash string ID to a number between 1 and TOTAL_VIDEOS
  let hash = 0;
  for (let i = 0; i < profileIdOrIndex.length; i++) {
    hash = (hash << 5) - hash + profileIdOrIndex.charCodeAt(i);
    hash |= 0;
  }
  const videoNum =
    (Math.abs(hash) % PRIVATE_VIDEO_CONFIG.TOTAL_VIDEOS) + 1;
  return getVideoStreamUrl(videoNum);
}

export interface RemoteVideoMeta {
  name: string;
  size: number;
}

export interface RemoteImageMeta {
  name: string;
  size: number;
}

/**
 * Returns a direct URL for a given image filename. The URL does NOT embed
 * the key; consumers must attach MEDIA_HEADERS to their source objects.
 *
 * Examples:
 *   getImageUrl('img_1_1.jpg')              // => ".../image.php?file=img_1_1.jpg"
 *   getImageUrl('img_15_7_u.jpg')           // => ".../image.php?file=img_15_7_u.jpg"
 */
export function getImageUrl(fileName: string): string {
  return `${PRIVATE_VIDEO_CONFIG.IMAGE_ENDPOINT}?file=${fileName}`;
}

/**
 * Fetches the live list of images currently uploaded on the Hostinger server.
 */
export async function fetchLiveImageList(): Promise<RemoteImageMeta[]> {
  try {
    const response = await fetch(PRIVATE_VIDEO_CONFIG.IMAGE_LIST_ENDPOINT, {
      method: "GET",
      headers: {
        ...MEDIA_HEADERS,
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image list: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("[videoService] fetchLiveImageList error:", error);
    return [];
  }
}

/**
 * Fetches the live list of videos currently uploaded on the Hostinger server.
 */
export async function fetchLiveVideoList(): Promise<RemoteVideoMeta[]> {
  try {
    const response = await fetch(PRIVATE_VIDEO_CONFIG.LIST_ENDPOINT, {
      method: "GET",
      headers: {
        ...MEDIA_HEADERS,
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video list: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("[videoService] fetchLiveVideoList error:", error);
    return [];
  }
}
