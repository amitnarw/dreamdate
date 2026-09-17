import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { MOCK_PROFILES } from "../data/mockProfiles";
import {
  DEV_DEFAULT_PASSCODE,
  DEV_PASSCODE_LEN,
  checkPasscode,
  devActions,
  getLockoutRemainingMs,
  setPasscode,
} from "../services/devTools";
import { runStressHarness } from "../services/stressHarness";
import { runCorpusLint } from "../services/corpusLint";

type Mode = "passcode" | "sheet" | "change-passcode";

interface Props {
  visible: boolean;
  onClose: () => void;
  onAny?: () => void;
}

export default function DevSheetModal({ visible, onClose, onAny }: Props) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("passcode");
  const [code, setCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lockoutEndsAt, setLockoutEndsAt] = useState<number>(0);
  const [_, force] = useState(0);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [stressReport, setStressReport] = useState<string | null>(null);
  const [lintReport, setLintReport] = useState<string | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setMode("passcode");
      setCode("");
      setConfirmCode("");
      setError(null);
      setActionMessage(null);
    }
  }, [visible]);

  useEffect(() => {
    if (lockoutEndsAt === 0) return;
    const tick = () => {
      const remain = getLockoutRemainingMs();
      if (remain <= 0) {
        setLockoutEndsAt(0);
        setError(null);
      } else {
        force((n) => n + 1);
      }
    };
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [lockoutEndsAt]);

  function press(key: string) {
    if (mode === "change-passcode") {
      if (key === "del") {
        setConfirmCode((c) => c.slice(0, -1));
      } else if (confirmCode.length < DEV_PASSCODE_LEN) {
        setConfirmCode((c) => c + key);
      }
      return;
    }
    if (key === "del") {
      setCode((c) => c.slice(0, -1));
    } else if (code.length < DEV_PASSCODE_LEN) {
      setCode((c) => c + key);
    }
  }

  useEffect(() => {
    if (mode !== "passcode") return;
    if (code.length !== DEV_PASSCODE_LEN) return;
    (async () => {
      const r = await checkPasscode(code);
      if (r.ok) {
        setError(null);
        setMode("sheet");
        setCode("");
      } else if (r.locked) {
        setLockoutEndsAt(Date.now() + r.remainingMs);
        setError("Locked. Try again in a minute.");
        setCode("");
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) {}
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
      } else {
        setError(`Wrong code. ${r.remainingAttempts} attempt${r.remainingAttempts === 1 ? "" : "s"} left.`);
        setCode("");
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
      }
    })();
  }, [code, mode]);

  useEffect(() => {
    if (mode !== "change-passcode") return;
    if (confirmCode.length !== DEV_PASSCODE_LEN) return;
    (async () => {
      const ok = await setPasscode(confirmCode);
      if (ok) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        setActionMessage("Passcode updated");
        setMode("sheet");
        setConfirmCode("");
      }
    })();
  }, [confirmCode, mode]);

  async function runAction(name: string, fn: () => Promise<any>) {
    try {
      setBusyAction(name);
      setActionMessage(null);
      await fn();
      setActionMessage("Done");
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      onAny?.();
    } catch (e: any) {
      setActionMessage(e?.message ?? "Failed");
    } finally {
      setBusyAction(null);
      setTimeout(() => setActionMessage(null), 1800);
    }
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? "#1A1F26" : "#FFFFFF",
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {mode === "passcode" || mode === "change-passcode" ? (
            <View>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.title,
                      { color: isDark ? "#FFFFFF" : "#111827" },
                    ]}
                  >
                    {mode === "change-passcode" ? "New Passcode" : "Dev Sheet"}
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {mode === "change-passcode"
                      ? `Enter a new ${DEV_PASSCODE_LEN}-digit code`
                      : `Enter ${DEV_PASSCODE_LEN}-digit passcode`}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={isDark ? "#9CA3AF" : "#6B7280"} />
                </TouchableOpacity>
              </View>

              <Animated.View
                style={[
                  styles.dotsRow,
                  { transform: [{ translateX: shakeAnim }] },
                ]}
              >
                {Array.from({ length: DEV_PASSCODE_LEN }).map((_, i) => {
                  const filled =
                    (mode === "change-passcode" ? confirmCode : code).length > i;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        {
                          backgroundColor: filled
                            ? "#F65592"
                            : isDark
                            ? "#2D333B"
                            : "#E5E7EB",
                        },
                      ]}
                    />
                  );
                })}
              </Animated.View>

              {error ? (
                <Text style={[styles.error, { color: "#EF4444" }]}>{error}</Text>
              ) : null}
              {lockoutEndsAt > 0 ? (
                <Text style={[styles.error, { color: "#F59E0B" }]}>
                  Locked. {Math.ceil(getLockoutRemainingMs() / 1000)}s left.
                </Text>
              ) : null}

              <View style={styles.pad}>
                {[
                  ["1", "2", "3"],
                  ["4", "5", "6"],
                  ["7", "8", "9"],
                  ["", "0", "del"],
                ].map((row, ri) => (
                  <View key={ri} style={styles.padRow}>
                    {row.map((k, ki) =>
                      k === "" ? (
                        <View key={ki} style={styles.padKeyEmpty} />
                      ) : (
                        <TouchableOpacity
                          key={ki}
                          style={[
                            styles.padKey,
                            {
                              backgroundColor:
                                k === "del"
                                  ? isDark
                                    ? "#2A3038"
                                    : "#F3F4F6"
                                  : isDark
                                  ? "#22282F"
                                  : "#F9FAFB",
                            },
                          ]}
                          onPress={() => press(k)}
                          activeOpacity={0.6}
                        >
                          {k === "del" ? (
                            <Ionicons
                              name="backspace-outline"
                              size={22}
                              color={isDark ? "#E5E7EB" : "#374151"}
                            />
                          ) : (
                            <Text
                              style={[
                                styles.padKeyText,
                                { color: isDark ? "#FFFFFF" : "#111827" },
                              ]}
                            >
                              {k}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ maxHeight: 540 }}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.title,
                      { color: isDark ? "#FFFFFF" : "#111827" },
                    ]}
                  >
                    Dev Sheet
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { color: isDark ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    Testing tools,  every action is logged
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={isDark ? "#9CA3AF" : "#6B7280"} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Coins
                </Text>
                <View style={styles.row}>
                  <ActionButton
                    label="+100"
                    onPress={() => runAction("+100", () => devActions.addCoins(100))}
                    busy={busyAction === "+100"}
                  />
                  <ActionButton
                    label="+1,000"
                    onPress={() => runAction("+1000", () => devActions.addCoins(1000))}
                    busy={busyAction === "+1000"}
                  />
                  <ActionButton
                    label="+10,000"
                    onPress={() => runAction("+10000", () => devActions.addCoins(10000))}
                    busy={busyAction === "+10000"}
                  />
                </View>

                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  VIP
                </Text>
                <View style={styles.row}>
                  <ActionButton
                    label="Activate VIP 7d"
                    wide
                    onPress={() => runAction("vip", () => devActions.activateVip())}
                    busy={busyAction === "vip"}
                  />
                </View>

                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  State
                </Text>
                <View style={styles.row}>
                  <ActionButton
                    label="Reset Wallet"
                    destructive
                    wide
                    onPress={() => runAction("resetWallet", () => devActions.resetWallet())}
                    busy={busyAction === "resetWallet"}
                  />
                </View>
                <View style={styles.row}>
                  <ActionButton
                    label="Clear Repeat Ledger"
                    destructive
                    wide
                    onPress={() =>
                      runAction("resetLedger", () => devActions.resetRepeatLedger())
                    }
                    busy={busyAction === "resetLedger"}
                  />
                </View>

                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Stress harness
                </Text>
                <View style={styles.row}>
                  <ActionButton
                    label="Run 200-msg stress"
                    wide
                    onPress={async () => {
                      try {
                        setBusyAction("stress");
                        setStressReport(null);
                        const r = await runStressHarness(200);
                        setStressReport(r.message);
                      } catch (e: any) {
                        setStressReport("ERR: " + (e?.message ?? "?"));
                      } finally {
                        setBusyAction(null);
                      }
                    }}
                    busy={busyAction === "stress"}
                  />
                  <ActionButton
                    label="Lint corpus"
                    wide
                    onPress={async () => {
                      try {
                        setBusyAction("lint");
                        setLintReport(null);
                        const v = runCorpusLint();
                        setLintReport(
                          v.length
                            ? `${v.length} violation(s):\n` +
                              v
                                .slice(0, 6)
                                .map((x) => `  ${x.rule} [${x.arch}] "${x.preview}"`)
                                .join("\n")
                            : "OK — all intent pools clean",
                        );
                      } catch (e: any) {
                        setLintReport("ERR: " + (e?.message ?? "?"));
                      } finally {
                        setBusyAction(null);
                      }
                    }}
                    busy={busyAction === "lint"}
                  />
                </View>
                {lintReport ? (
                  <View
                    style={[
                      styles.reportBox,
                      {
                        backgroundColor: lintReport.startsWith("OK")
                          ? "rgba(34,197,94,0.12)"
                          : "rgba(239,68,68,0.12)",
                        borderColor: lintReport.startsWith("OK")
                          ? "rgba(34,197,94,0.4)"
                          : "rgba(239,68,68,0.4)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reportText,
                        { color: isDark ? "#E5E7EB" : "#1F2937" },
                      ]}
                    >
                      {lintReport}
                    </Text>
                  </View>
                ) : null}

                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isDark ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Security
                </Text>
                <View style={styles.row}>
                  <ActionButton
                    label="Change Passcode"
                    wide
                    onPress={() => {
                      setMode("change-passcode");
                      setConfirmCode("");
                    }}
                  />
                </View>

                <Text
                  style={[
                    styles.hint,
                    { color: isDark ? "#6B7280" : "#9CA3AF" },
                  ]}
                >
                  Default passcode: {DEV_DEFAULT_PASSCODE}. Active in every build.
                </Text>

                {stressReport ? (
                  <View
                    style={[
                      styles.reportBox,
                      {
                        backgroundColor: stressReport.startsWith("PASS")
                          ? "#10B98122"
                          : stressReport.startsWith("FAIL")
                          ? "#EF444422"
                          : isDark
                          ? "#22282F"
                          : "#F3F4F6",
                        borderColor: stressReport.startsWith("PASS")
                          ? "#10B981"
                          : stressReport.startsWith("FAIL")
                          ? "#EF4444"
                          : isDark
                          ? "#2D333B"
                          : "#E5E7EB",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reportText,
                        {
                          color: isDark ? "#FFFFFF" : "#111827",
                        },
                      ]}
                    >
                      {stressReport}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              {actionMessage ? (
                <View
                  style={[
                    styles.toast,
                    {
                      backgroundColor: actionMessage === "Done"
                        ? "#10B981"
                        : isDark
                        ? "#2A3038"
                        : "#E5E7EB",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: actionMessage === "Done" ? "#FFFFFF" : isDark ? "#E5E7EB" : "#111827",
                      fontWeight: "600",
                    }}
                  >
                    {actionMessage}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ActionButton({
  label,
  onPress,
  busy,
  destructive,
  wide,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  destructive?: boolean;
  wide?: boolean;
}) {
  const { isDark } = useTheme();
  const bg = destructive
    ? isDark
      ? "#3A1A1F"
      : "#FEE2E2"
    : isDark
    ? "#22282F"
    : "#F3F4F6";
  const color = destructive
    ? "#EF4444"
    : isDark
    ? "#FFFFFF"
    : "#111827";
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={busy}
      style={[
        styles.actionBtn,
        { backgroundColor: bg, width: wide ? "100%" : undefined, flex: wide ? undefined : 1, opacity: busy ? 0.5 : 1 },
      ]}
    >
      <Text style={[styles.actionLabel, { color }]}>{busy ? "..." : label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingTop: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  title: { fontSize: 19, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginVertical: 14,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  error: {
    textAlign: "center",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  pad: { marginTop: 8, paddingHorizontal: 12 },
  padRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  padKey: {
    flex: 1,
    marginHorizontal: 4,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  padKeyEmpty: { flex: 1, marginHorizontal: 4 },
  padKeyText: { fontSize: 22, fontWeight: "600" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontWeight: "600", fontSize: 13 },
  hint: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 14,
  },
  toast: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  reportBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  reportText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
});
