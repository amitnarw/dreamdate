import AsyncStorage from "@react-native-async-storage/async-storage";
import * as IntentLauncher from "expo-intent-launcher";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { activateWeeklyVip, addCoins, recordPurchase } from "./wallet";

export interface PaymentPackage {
  id: string;
  title: string;
  amount: number; // In INR (Net final price)
  originalAmount: number; // Struck-through reference price
  discountPercentage: number; // e.g. 50%
  coinsAwarded: number;
  isVip?: boolean;
  note: string;
}

// Packages with visible discount badges & net final prices
export const RECHARGE_PACKAGES: PaymentPackage[] = [
  {
    id: "pack_100",
    title: "Starter Pack",
    amount: 100,
    originalAmount: 150,
    discountPercentage: 33,
    coinsAwarded: 100,
    note: "BoloNa 100 Coins Recharge",
  },
  {
    id: "pack_199",
    title: "Popular Value Pack",
    amount: 199,
    originalAmount: 399,
    discountPercentage: 50,
    coinsAwarded: 400,
    note: "BoloNa 400 Coins Recharge",
  },
  {
    id: "pack_299",
    title: "Mega Saver Pack",
    amount: 299,
    originalAmount: 699,
    discountPercentage: 57,
    coinsAwarded: 1000,
    note: "BoloNa 1000 Coins Recharge",
  },
];

export const VIP_WEEKLY_PACKAGE: PaymentPackage = {
  id: "vip_weekly_499",
  title: "Weekly VIP All-Access",
  amount: 499,
  originalAmount: 999,
  discountPercentage: 50,
  coinsAwarded: 1500,
  isVip: true,
  note: "BoloNa Weekly VIP Pass",
};

const UPI_PAYEE_VPA = "dararaj842-1@okhdfcbank";
const UPI_PAYEE_NAME = "Darasingh Rajput";
const UPI_AID = "uGICAgMD1x9exUA";

export interface UPIPaymentResult {
  success: boolean;
  cancelled?: boolean;
  /** Ambiguous result: money MAY have moved ,  never auto-credited. */
  pending?: boolean;
  /** No UPI app installed ,  caller shows the failure modal. */
  noUpiApp?: boolean;
  txnId?: string;
  message?: string;
  rawResponse?: string;
}

const UPI_TXN_LOG_KEY = "@dreamdate_upi_txn_log_v1";
const MAX_TXN_LOG = 50;

export interface UpiTxnEntry {
  ts: number;
  packageId: string;
  amount: number;
  outcome:
    | "success"
    | "cancelled"
    | "failed"
    | "pending"
    | "no_app"
    | "launch_error";
  txnId?: string;
  rawResponse?: string;
}

async function logUpiAttempt(entry: UpiTxnEntry): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(UPI_TXN_LOG_KEY);
    const log: UpiTxnEntry[] = raw ? JSON.parse(raw) : [];
    log.push(entry);
    await AsyncStorage.setItem(
      UPI_TXN_LOG_KEY,
      JSON.stringify(log.slice(-MAX_TXN_LOG)),
    );
  } catch (e) {}
}

/**
 * Strict UPI response parser (NPCI deep-link response format):
 *   txnId=...&responseCode=00&Status=SUCCESS&txnRef=...
 * Credits ONLY when BOTH hold:
 *   1. Status param is exactly SUCCESS (case-insensitive), AND
 *   2. a transaction id (txnId / UPITxnId / txnRef) is present.
 * resultCode === -1 alone is NOT accepted ,  several UPI apps return
 * RESULT_OK on mere return-to-app without payment. Ambiguous results
 * become PENDING (never auto-credit; user is told to contact support
 * with the txn id if debited).
 */
function parseUpiResponse(raw: string): { status: string; txnId?: string } {
  const normalized = (raw || "").replace(/[?&#]/g, "&");
  const params = new Map<string, string>();
  for (const part of normalized.split("&")) {
    const eq = part.indexOf("=");
    if (eq > 0) {
      params.set(
        part.slice(0, eq).trim().toLowerCase(),
        part.slice(eq + 1).trim(),
      );
    }
  }
  const status = (
    params.get("status") ??
    params.get("txnstatus") ??
    params.get("responsecode") ??
    ""
  ).toUpperCase();
  const txnId =
    params.get("txnid") ??
    params.get("upitxnid") ??
    params.get("txnref") ??
    undefined;
  return { status, txnId };
}

function isUpiSuccess(status: string, rawLower: string): boolean {
  if (status === "SUCCESS" || status === "00" || status === "S") return true;
  if (/\bstatus\s*=\s*success\b/.test(rawLower)) return true;
  return false;
}

function isUpiFailure(rawLower: string): boolean {
  return (
    rawLower.includes("fail") ||
    rawLower.includes("cancel") ||
    rawLower.includes("decline") ||
    rawLower.includes("error") ||
    /\bstatus\s*=\s*failure\b/.test(rawLower)
  );
}

/**
 * Fulfills the purchased package by updating the offline local wallet
 * and unlocks daily check-in perks.
 */
export async function fulfillPackage(pkg: PaymentPackage): Promise<void> {
  await recordPurchase();
  if (pkg.isVip) {
    await activateWeeklyVip(pkg.coinsAwarded);
  } else {
    await addCoins(pkg.coinsAwarded);
  }
}

/**
 * Launches the device's installed UPI applications (GPay, PhonePe, Paytm, BHIM)
 * via Android Activity Intent and checks the resultCode.
 * If user cancels or presses BACK, resultCode is 0 (CANCELED) and NO coins are given.
 */
export async function launchUPIPayment(
  pkg: PaymentPackage,
): Promise<UPIPaymentResult> {
  const formattedAmount = pkg.amount.toFixed(2);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_PAYEE_VPA)}&pn=${encodeURIComponent(
    UPI_PAYEE_NAME,
  )}&am=${encodeURIComponent(formattedAmount)}&cu=INR&aid=${encodeURIComponent(
    UPI_AID,
  )}&tn=${encodeURIComponent(pkg.note)}`;

  if (Platform.OS === "android") {
    try {
      const result = await IntentLauncher.startActivityAsync(
        "android.intent.action.VIEW",
        {
          data: upiUrl,
        },
      );

      // resultCode:
      // -1 = ResultCode.Success (Activity.RESULT_OK)
      //  0 = ResultCode.Canceled (Activity.RESULT_CANCELED - user pressed back or cancelled)
      if (result.resultCode === 0) {
        await logUpiAttempt({
          ts: Date.now(),
          packageId: pkg.id,
          amount: pkg.amount,
          outcome: "cancelled",
        });
        return {
          success: false,
          cancelled: true,
          message:
            "Payment was cancelled. No amount was charged and no coins were added.",
        };
      }

      const rawData = (
        result.data ||
        (result as any).extra?.response ||
        ""
      ).toString();
      const lowerData = rawData.toLowerCase();
      const { status, txnId } = parseUpiResponse(rawData);

      // Explicit failure from the bank app ,  never credit.
      if (isUpiFailure(lowerData) && !isUpiSuccess(status, lowerData)) {
        await logUpiAttempt({
          ts: Date.now(),
          packageId: pkg.id,
          amount: pkg.amount,
          outcome: "failed",
          txnId,
          rawResponse: rawData.slice(0, 300),
        });
        return {
          success: false,
          cancelled: true,
          message:
            "UPI transaction was declined or failed in your bank app. No coins were added.",
          txnId,
          rawResponse: rawData,
        };
      }

      // STRICT success: Status=SUCCESS *and* a transaction id.
      if (isUpiSuccess(status, lowerData) && txnId) {
        await fulfillPackage(pkg);
        await logUpiAttempt({
          ts: Date.now(),
          packageId: pkg.id,
          amount: pkg.amount,
          outcome: "success",
          txnId,
          rawResponse: rawData.slice(0, 300),
        });
        return {
          success: true,
          message: "Payment completed successfully!",
          txnId,
          rawResponse: rawData,
        };
      }

      // Ambiguous (RESULT_OK with no usable response, unknown codes…):
      // money MAY have moved ,  do NOT credit, mark PENDING instead.
      await logUpiAttempt({
        ts: Date.now(),
        packageId: pkg.id,
        amount: pkg.amount,
        outcome: "pending",
        txnId,
        rawResponse: rawData.slice(0, 300),
      });
      return {
        success: false,
        pending: true,
        message:
          "Payment could not be confirmed." +
          (txnId ? ` Txn ID: ${txnId}.` : "") +
          " If money was debited, contact support with your UPI reference ,  coins were NOT added automatically.",
        txnId,
        rawResponse: rawData,
      };
    } catch (error: any) {
      console.log("IntentLauncher exception, falling back to Linking", error);
    }
  }

  // Fallback for non-Android or if IntentLauncher fails
  try {
    const supported = await Linking.canOpenURL(upiUrl);
    if (supported) {
      await Linking.openURL(upiUrl);
      // Do NOT blindly credit coins upon URL open
      await logUpiAttempt({
        ts: Date.now(),
        packageId: pkg.id,
        amount: pkg.amount,
        outcome: "pending",
      });
      return {
        success: false,
        pending: true,
        message:
          "Please complete payment in your UPI app. Coins are added only after a confirmed bank response.",
      };
    } else {
      await logUpiAttempt({
        ts: Date.now(),
        packageId: pkg.id,
        amount: pkg.amount,
        outcome: "no_app",
      });
      return {
        success: false,
        cancelled: true,
        noUpiApp: true,
        message:
          "No UPI app found. Please install Google Pay, PhonePe, Paytm, or BHIM to pay with UPI.",
      };
    }
  } catch (error) {
    await logUpiAttempt({
      ts: Date.now(),
      packageId: pkg.id,
      amount: pkg.amount,
      outcome: "launch_error",
    });
    return {
      success: false,
      cancelled: true,
      message: "Failed to launch UPI application.",
    };
  }
}
