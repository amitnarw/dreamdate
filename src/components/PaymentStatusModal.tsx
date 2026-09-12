import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import AppModal from "./AppModal";

/* ------------------------------------------------------------------ */
/* Single payment-status surface for EVERY payment outcome. No more    */
/* OS Alert.alerts anywhere in the purchase flow: processing, success  */
/* (when the parent has no success modal of its own), failure,        */
/* pending (money may have moved ,  never auto-credited), and           */
/* unavailable (Play Billing missing / product not configured).        */
/* ------------------------------------------------------------------ */

export type PaymentStatusKind =
  | "processing"
  | "success"
  | "failure"
  | "pending"
  | "unavailable";

export interface PaymentStatus {
  kind: PaymentStatusKind;
  title: string;
  message: string;
  /** e.g. txn id / purchase token snippet for support copy */
  reference?: string;
}

interface PaymentStatusModalProps {
  status: PaymentStatus | null;
  onClose: () => void;
  /** Retry action for failures (re-runs the same method). */
  onRetry?: () => void;
  /** Shown on 'unavailable' ,  lets the user jump straight to UPI. */
  onUseUpi?: () => void;
}

export default function PaymentStatusModal({
  status,
  onClose,
  onRetry,
  onUseUpi,
}: PaymentStatusModalProps) {
  useEffect(() => {
    if (status && (status.kind === "success" || status.kind === "failure")) {
      try {
        Haptics.notificationAsync(
          status.kind === "success"
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error,
        );
      } catch (e) {}
    }
  }, [status]);

  if (!status) return null;

  const icon =
    status.kind === "success"
      ? "checkmark-circle"
      : status.kind === "failure"
        ? "close-circle"
        : status.kind === "pending"
          ? "time"
          : status.kind === "unavailable"
            ? "information-circle"
            : "hourglass";

  const iconColor =
    status.kind === "success"
      ? "#10B981"
      : status.kind === "failure"
        ? "#EF4444"
        : status.kind === "pending"
          ? "#F59E0B"
          : "#F65592";

  const description = status.reference
    ? `${status.message}\n\nRef: ${status.reference}`
    : status.message;

  if (status.kind === "processing") {
    return (
      <AppModal
        visible
        onClose={() => {}}
        title={status.title}
        description={status.message}
        icon={icon}
        iconColor={iconColor}
      >
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <ActivityIndicator size="large" color="#F65592" />
        </View>
      </AppModal>
    );
  }

  if (status.kind === "failure" && onRetry) {
    return (
      <AppModal
        visible
        onClose={onClose}
        title={status.title}
        description={description}
        icon={icon}
        iconColor={iconColor}
        primaryAction={{ label: "Try Again", onPress: onRetry }}
        secondaryAction={{ label: "Close", onPress: onClose }}
      />
    );
  }

  if (status.kind === "unavailable" && onUseUpi) {
    return (
      <AppModal
        visible
        onClose={onClose}
        title={status.title}
        description={description}
        icon={icon}
        iconColor={iconColor}
        primaryAction={{ label: "Pay with UPI", onPress: onUseUpi }}
        secondaryAction={{ label: "Close", onPress: onClose }}
      />
    );
  }

  return (
    <AppModal
      visible
      onClose={onClose}
      title={status.title}
      description={description}
      icon={icon}
      iconColor={iconColor}
      primaryAction={{
        label: status.kind === "success" ? "Done" : "OK",
        onPress: onClose,
      }}
    />
  );
}
