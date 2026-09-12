import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { buyWithPlay } from "../services/billingService";
import { PaymentPackage, launchUPIPayment } from "../services/paymentService";
import CoinIcon from "./CoinIcon";
import PaymentStatusModal, { PaymentStatus } from "./PaymentStatusModal";

interface PaymentSelectorSheetProps {
  visible: boolean;
  packageItem: PaymentPackage | null;
  onClose: () => void;
  onSuccess: (pkg: PaymentPackage) => void;
}

export default function PaymentSelectorSheet({
  visible,
  packageItem,
  onClose,
  onSuccess,
}: PaymentSelectorSheetProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "google_play">(
    "upi",
  );
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  // Guards double-tap / double-sheet purchase attempts.
  const payingRef = useRef(false);

  if (!packageItem) return null;

  const runUpiFlow = async () => {
    setIsProcessing(true);
    setStatus({
      kind: "processing",
      title: "Opening UPI app…",
      message: `Pay ₹${packageItem.amount} in your UPI app to receive ${packageItem.coinsAwarded} Coins.`,
    });
    const result = await launchUPIPayment(packageItem);
    setIsProcessing(false);

    if (result.success) {
      setStatus(null);
      onSuccess(packageItem);
      onClose();
    } else if (result.pending) {
      setStatus({
        kind: "pending",
        title: "Payment Pending",
        message: result.message || "Payment could not be confirmed.",
        reference: result.txnId,
      });
    } else {
      setStatus({
        kind: "failure",
        title: result.noUpiApp ? "No UPI App Found" : "Payment Incomplete",
        message:
          result.message ||
          "Transaction was cancelled. No amount was charged and no coins were added.",
        reference: result.txnId,
      });
    }
  };

  const runPlayFlow = async () => {
    setIsProcessing(true);
    setStatus({
      kind: "processing",
      title: "Contacting Google Play…",
      message: "Opening the secure Google Play purchase sheet.",
    });
    const res = await buyWithPlay(packageItem);
    setIsProcessing(false);

    if (res.status === "success") {
      setStatus(null);
      onSuccess(packageItem);
      onClose();
    } else if (res.status === "cancelled") {
      // User backed out of the Play sheet ,  silently return to method list.
      setStatus(null);
    } else if (res.status === "pending") {
      setStatus({
        kind: "pending",
        title: "Payment Pending",
        message: res.message,
        reference: res.purchaseToken?.slice(-12),
      });
    } else if (res.status === "unavailable") {
      setStatus({
        kind: "unavailable",
        title: "Google Play Unavailable",
        message: res.message,
      });
    } else {
      setStatus({
        kind: "failure",
        title: "Payment Failed",
        message: res.message,
      });
    }
  };

  const handlePay = async () => {
    if (payingRef.current || isProcessing) return;
    payingRef.current = true;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    try {
      if (selectedMethod === "google_play") {
        await runPlayFlow();
      } else {
        await runUpiFlow();
      }
    } finally {
      payingRef.current = false;
    }
  };

  const handleRetry = () => {
    setStatus(null);
    handlePay();
  };

  const handleUseUpi = () => {
    setStatus(null);
    setSelectedMethod("upi");
    handlePay();
  };

  return (
    <>
      <Modal
        visible={visible && !status}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.dismissArea}
            activeOpacity={1}
            onPress={onClose}
          />

          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isDark ? "#141416" : "#FFFFFF",
                paddingBottom: Math.max(insets.bottom, 16) + 12,
              },
            ]}
          >
            {/* Grab Handle */}
            <View style={styles.handleWrap}>
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(0, 0, 0, 0.15)",
                  },
                ]}
              />
            </View>

            {/* Header: Title & Close */}
            <View style={styles.header}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDark ? "#FFFFFF" : "#111827" },
                ]}
              >
                Checkout
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>

            {/* Compact Minimal Order Summary Strip */}
            <View
              style={[
                styles.summaryStrip,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.04)"
                    : "rgba(0, 0, 0, 0.03)",
                },
              ]}
            >
              <View style={styles.summaryLeft}>
                <View style={styles.coinsRow}>
                  <CoinIcon size={18} />
                  <Text
                    style={[
                      styles.coinsAmount,
                      { color: isDark ? "#FFFFFF" : "#111827" },
                    ]}
                  >
                    {packageItem.coinsAwarded.toLocaleString()} Coins
                  </Text>
                  {packageItem.isVip && (
                    <View style={styles.vipBadge}>
                      <Text style={styles.vipBadgeText}>VIP</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.packSubtitle,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  {packageItem.title}
                </Text>
              </View>

              <View style={styles.summaryRight}>
                <View style={styles.priceRow}>
                  {packageItem.originalAmount ? (
                    <Text style={styles.struckPrice}>
                      ₹{packageItem.originalAmount}
                    </Text>
                  ) : null}
                  <Text style={styles.priceText}>₹{packageItem.amount}</Text>
                </View>
                {packageItem.discountPercentage ? (
                  <Text style={styles.discountText}>
                    {packageItem.discountPercentage}% OFF
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Section label */}
            <Text
              style={[
                styles.sectionLabel,
                { color: isDark ? "#6B7280" : "#9CA3AF" },
              ]}
            >
              PAY WITH
            </Text>

            {/* Payment Method Rows */}
            <View style={styles.methodsList}>
              {/* Option 1: UPI */}
              <TouchableOpacity
                style={[
                  styles.methodRow,
                  {
                    backgroundColor:
                      selectedMethod === "upi"
                        ? isDark
                          ? "rgba(246, 85, 146, 0.12)"
                          : "rgba(246, 85, 146, 0.08)"
                        : isDark
                          ? "rgba(255, 255, 255, 0.03)"
                          : "rgba(0, 0, 0, 0.02)",
                  },
                ]}
                onPress={() => setSelectedMethod("upi")}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.methodIconBox,
                    { backgroundColor: "rgba(99, 102, 241, 0.15)" },
                  ]}
                >
                  <Ionicons name="flash" size={17} color="#6366F1" />
                </View>
                <View style={styles.methodInfo}>
                  <View style={styles.methodNameRow}>
                    <Text
                      style={[
                        styles.methodName,
                        { color: isDark ? "#FFFFFF" : "#111827" },
                      ]}
                    >
                      UPI
                    </Text>
                    <View style={styles.fastTag}>
                      <Text style={styles.fastTagText}>Instant</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.methodSub,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    GPay, PhonePe, Paytm, BHIM
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedMethod === "upi"
                      ? styles.radioCircleSelected
                      : {
                          borderWidth: 2,
                          borderColor: isDark
                            ? "rgba(255, 255, 255, 0.2)"
                            : "rgba(0, 0, 0, 0.15)",
                        },
                  ]}
                >
                  {selectedMethod === "upi" && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>

              {/* Option 2: Google Play */}
              <TouchableOpacity
                style={[
                  styles.methodRow,
                  {
                    backgroundColor:
                      selectedMethod === "google_play"
                        ? isDark
                          ? "rgba(246, 85, 146, 0.12)"
                          : "rgba(246, 85, 146, 0.08)"
                        : isDark
                          ? "rgba(255, 255, 255, 0.03)"
                          : "rgba(0, 0, 0, 0.02)",
                  },
                ]}
                onPress={() => setSelectedMethod("google_play")}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.methodIconBox,
                    { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                  ]}
                >
                  <Ionicons
                    name="logo-google-playstore"
                    size={16}
                    color="#10B981"
                  />
                </View>
                <View style={styles.methodInfo}>
                  <Text
                    style={[
                      styles.methodName,
                      { color: isDark ? "#FFFFFF" : "#111827" },
                    ]}
                  >
                    Google Play
                  </Text>
                  <Text
                    style={[
                      styles.methodSub,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    Cards, Netbanking, Balance
                  </Text>
                </View>
                <View
                  style={[
                    styles.radioCircle,
                    selectedMethod === "google_play"
                      ? styles.radioCircleSelected
                      : {
                          borderWidth: 2,
                          borderColor: isDark
                            ? "rgba(255, 255, 255, 0.2)"
                            : "rgba(0, 0, 0, 0.15)",
                        },
                  ]}
                >
                  {selectedMethod === "google_play" && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.payButton, isProcessing && { opacity: 0.8 }]}
              onPress={handlePay}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.payButtonContent}>
                  <Text style={styles.payButtonText}>
                    Pay ₹{packageItem.amount}
                  </Text>
                  <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Micro Trust & Security Assurance */}
            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark" size={13} color="#10B981" />
              <Text style={styles.trustText}>
                100% Safe & Secure Payment
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment status surface for every outcome (no OS alerts) */}
      <PaymentStatusModal
        status={visible ? status : null}
        onClose={() => setStatus(null)}
        onRetry={handleRetry}
        onUseUpi={handleUseUpi}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
  },
  handleWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  summaryLeft: {
    gap: 3,
  },
  coinsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coinsAmount: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  vipBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  vipBadgeText: {
    color: "#5C3A0A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  packSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  struckPrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    fontWeight: "500",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F65592",
    letterSpacing: -0.3,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10B981",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  methodsList: {
    gap: 8,
    marginBottom: 18,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 12,
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  methodInfo: {
    flex: 1,
    gap: 2,
  },
  methodNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  methodName: {
    fontSize: 15,
    fontWeight: "700",
  },
  fastTag: {
    backgroundColor: "rgba(16, 185, 129, 0.16)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  fastTagText: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "800",
  },
  methodSub: {
    fontSize: 11,
    fontWeight: "400",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    backgroundColor: "#F65592",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  payButton: {
    backgroundColor: "#F65592",
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  payButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  trustText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});
