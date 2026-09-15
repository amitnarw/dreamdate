/**
 * SkeletonImage — wraps expo-image with a themed pulsing skeleton placeholder
 * until the image finishes loading, then fades the image in.
 *
 * - Pulse: Animated.loop opacity 1.0 → 0.55 → 1.0, ~1200ms, native driver.
 * - Tonal fill per theme (Borderless Tonal, no borders/shadows).
 * - Empty/missing URI: shows the skeleton + a centered person silhouette.
 * - Drop-in replacement for <ExpoImage source={{uri}} /> with the same props
 *   (contentFit, cachePolicy, blurRadius, recyclingKey, transition).
 */
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { MEDIA_HEADERS } from "../services/videoService";

const SKELETON_DURATION = 1200;
const SKELETON_MIN_OPACITY = 0.55;

export interface SkeletonImageProps {
  uri?: string;
  style?: any;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  cachePolicy?: "none" | "disk" | "memory" | "memory-disk";
  blurRadius?: number;
  recyclingKey?: string;
  transition?: number;
  /**
   * Optional HTTP headers to send with the request. Defaults to MEDIA_HEADERS
   * (carrying the X-App-Key) since all remote girl-media URLs in this app are
   * authenticated. Pass an empty object to disable.
   */
  headers?: Record<string, string>;
}

const SkeletonImage: React.FC<SkeletonImageProps> = ({
  uri,
  style,
  contentFit = "cover",
  cachePolicy = "memory-disk",
  blurRadius,
  recyclingKey,
  transition = 140,
  headers = MEDIA_HEADERS,
}) => {
  const { isDark } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: SKELETON_MIN_OPACITY,
          duration: SKELETON_DURATION / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: SKELETON_DURATION / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Reset loaded state when uri changes so old cache flashes don't bleed in
  useEffect(() => {
    setLoaded(false);
  }, [uri]);

  const skeletonColor = isDark ? "#2A2C2D" : "#E5E7EB";

  return (
    <View style={[{ overflow: "hidden", backgroundColor: skeletonColor }, style]}>
      {uri ? (
        <ExpoImage
          source={headers ? { uri, headers } : { uri }}
          style={style}
          contentFit={contentFit}
          cachePolicy={cachePolicy}
          blurRadius={blurRadius}
          recyclingKey={recyclingKey ?? uri}
          transition={transition}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      ) : null}
      {!loaded && (
        <Animated.View
          pointerEvents="none"
          style={[
            style,
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: skeletonColor,
              opacity: pulse,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Ionicons
            name="person"
            size={28}
            color={isDark ? "#3F4144" : "#C7CCD3"}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default SkeletonImage;
