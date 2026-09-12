import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Profile } from "../data/mockProfiles";
import { useWallet } from "../services/wallet";
import AppModal from "./AppModal";
import RechargeModal from "./RechargeModal";

interface Props {
  profile: Profile;
}

export default function ProfileCard({ profile }: Props) {
  const router = useRouter();
  const { coins } = useWallet();
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [lowBalanceVisible, setLowBalanceVisible] = useState(false);

  const handleVideoCall = () => {
    if (coins < profile.callRate) {
      setLowBalanceVisible(true);
      return;
    }
    router.push(`/call/${profile.id}` as any);
  };

  const handleChat = () => {
    router.push(`/chat/${profile.id}` as any);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.imageContainer}
        activeOpacity={0.9}
        onPress={() => router.push(`/profile/${profile.id}` as any)}
      >
        <Image source={{ uri: profile.avatar }} style={styles.image} />

        {/* Online Pulse Badge */}
        {profile.isOnline && (
          <View style={styles.onlineBadgeWrap}>
            <BlurView intensity={50} tint="dark" style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>ONLINE</Text>
            </BlurView>
          </View>
        )}

        {/* Bottom Overlay Info */}
        <BlurView intensity={75} tint="dark" style={styles.overlay}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.name}, {profile.age}
            </Text>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{profile.rating}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={12} color="#A09FB1" />
            <Text style={styles.locationText} numberOfLines={1}>
              {profile.city}, {profile.country}
            </Text>
          </View>

          <Text style={styles.tagline} numberOfLines={1}>
            {profile.tagline}
          </Text>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={handleChat}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callBtn}
              onPress={handleVideoCall}
              activeOpacity={0.8}
            >
              <Ionicons name="videocam" size={18} color="#FFF" />
              <Text style={styles.callBtnText}>Video Call</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>

      <AppModal
        visible={lowBalanceVisible}
        onClose={() => setLowBalanceVisible(false)}
        title="Insufficient Coins"
        description={`${profile.name}'s video call rate is ${profile.callRate} coins/min. You have ${coins} coins. Please recharge to start calling!`}
        icon="videocam-outline"
        primaryAction={{
          label: "Recharge Now",
          onPress: () => {
            setLowBalanceVisible(false);
            setRechargeModalVisible(true);
          },
        }}
        secondaryAction={{
          label: "Cancel",
          onPress: () => setLowBalanceVisible(false),
        }}
      />

      <RechargeModal
        visible={rechargeModalVisible}
        onClose={() => setRechargeModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    height: 290,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#121414",
    marginBottom: 14,
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  onlineBadgeWrap: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(12, 15, 16, 0.65)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  onlineText: {
    color: "#4ADE80",
    fontSize: 10,
    fontWeight: "800",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingTop: 16,
    backgroundColor: "rgba(30, 32, 32, 0.75)",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  name: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 4,
  },
  locationText: {
    color: "#A09FB1",
    fontSize: 11,
  },
  tagline: {
    color: "#D4C2C9",
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 8,
  },
  btnRow: {
    flexDirection: "row",
    gap: 6,
  },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  chatBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  callBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F65592",
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  callBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
