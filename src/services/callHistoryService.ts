import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CallLogItem {
  id: string;
  profileId: string;
  name: string;
  avatar: string;
  city: string;
  type: "incoming" | "outgoing" | "missed";
  timestamp: number;
  durationSeconds: number;
  coinsSpent: number;
}

// Bumped to v2: v1 was polluted by the old funnel, which pre-wrote fake
// missed-call entries at login (since removed ,  missed calls are now only
// logged when the real incoming-call overlay is declined past max retries,
// or a real call ends).
const CALL_HISTORY_STORAGE_KEY = "@dreamdate_call_logs_v2";

export async function getLocalCallLogs(): Promise<CallLogItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CALL_HISTORY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load call logs", e);
  }
  return [];
}

export async function saveCallLog(
  record: Omit<CallLogItem, "id" | "timestamp">,
): Promise<CallLogItem> {
  const newRecord: CallLogItem = {
    ...record,
    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
  };

  try {
    const existing = await getLocalCallLogs();
    const updated = [newRecord, ...existing];
    await AsyncStorage.setItem(
      CALL_HISTORY_STORAGE_KEY,
      JSON.stringify(updated),
    );
  } catch (e) {
    console.error("Failed to save call log", e);
  }

  return newRecord;
}

export async function clearCallLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CALL_HISTORY_STORAGE_KEY);
  } catch (e) {}
}
