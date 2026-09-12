import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
  PaymentPackage,
  RECHARGE_PACKAGES,
  VIP_WEEKLY_PACKAGE,
  fulfillPackage,
} from "./paymentService";

/* ------------------------------------------------------------------ */
/* Real Google Play Billing via expo-iap (OpenIAP).                     */
/*                                                                     */
/* - expo-iap is a NATIVE module: it NEVER loads in Expo Go. Every     */
/*   entry point lazy-imports it inside try/catch and degrades to      */
/*   "unavailable" (UPI-only + modal) instead of crashing.             */
/* - All 4 products are CONSUMABLE (VIP weekly = manual re-buy, no     */
/*   auto-renew). purchaseToken is the anti-replay anchor: a token is  */
/*   credited at most once, then consumed so the SKU can be re-bought. */
/* - Kill-mid-payment recovery: getAvailablePurchases() at boot finds  */
/*   purchased-but-unconsumed tokens and fulfills them (no loss, no    */
/*   double-credit ,  the token log makes it idempotent).               */
/* ------------------------------------------------------------------ */

const PROCESSED_TOKENS_KEY = "@dreamdate_play_tokens_v1";
const MAX_TOKENS = 200;

/** Play Console product IDs ,  must match EXACTLY what you create there. */
export const PLAY_SKU_BY_PACKAGE_ID: Record<string, string> = {
  pack_100: "coin_100",
  pack_199: "coin_400",
  pack_299: "coin_1000",
  vip_weekly_499: "vip_weekly",
};

export type PlayBuyStatus =
  | "success"
  | "cancelled"
  | "pending"
  | "unavailable"
  | "failed";

export interface PlayBuyResult {
  status: PlayBuyStatus;
  message: string;
  purchaseToken?: string;
}

type IapModule = typeof import("expo-iap");

let iapMod: IapModule | null = null;
let connected = false;
let listenersArmed = false;
let purchaseInFlight = false;

interface PendingWaiter {
  pkg: PaymentPackage;
  resolve: (r: PlayBuyResult) => void;
}
const pendingWaiters = new Map<string, PendingWaiter>(); // sku -> waiter

async function getIap(): Promise<IapModule | null> {
  if (Platform.OS !== "android") return null;
  if (iapMod) return iapMod;
  try {
    iapMod = (await import("expo-iap")) as IapModule;
    return iapMod;
  } catch (e) {
    return null; // Expo Go / missing native module ,  billing unavailable
  }
}

async function readTokens(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(PROCESSED_TOKENS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function hasToken(token: string): Promise<boolean> {
  return (await readTokens()).includes(token);
}

async function recordToken(token: string): Promise<void> {
  try {
    const tokens = await readTokens();
    tokens.push(token);
    await AsyncStorage.setItem(
      PROCESSED_TOKENS_KEY,
      JSON.stringify(tokens.slice(-MAX_TOKENS)),
    );
  } catch (e) {}
}

function armListeners(mod: IapModule): void {
  if (listenersArmed) return;
  listenersArmed = true;
  try {
    mod.purchaseUpdatedListener((purchase: any) => {
      const sku: string =
        purchase?.productId ?? purchase?.productIds?.[0] ?? "";
      const waiter = pendingWaiters.get(sku);
      if (waiter) {
        pendingWaiters.delete(sku);
        settlePurchase(mod, waiter.pkg, purchase)
          .then(waiter.resolve)
          .catch(() =>
            waiter.resolve({
              status: "failed",
              message:
                "Could not finalize the purchase. Your money is safe ,  it will be recovered automatically.",
            }),
          );
      } else {
        // No active sheet (e.g. app was killed and relaunched mid-flow):
        // still finalize so the token can't linger unconsumed.
        settlePurchase(mod, null, purchase).catch(() => {});
      }
    });
  } catch (e) {}
  try {
    mod.purchaseErrorListener((error: any) => {
      const code = String(error?.code ?? "");
      const sku: string =
        error?.productId ?? (error?.productIds?.[0] as string) ?? "";
      // Find waiter by sku, else resolve the single in-flight waiter
      let key: string | null = sku && pendingWaiters.has(sku) ? sku : null;
      if (!key && pendingWaiters.size === 1) {
        key = [...pendingWaiters.keys()][0];
      }
      if (!key) return;
      const waiter = pendingWaiters.get(key)!;
      pendingWaiters.delete(key);
      purchaseInFlight = false;
      if (code === "user-cancelled") {
        waiter.resolve({
          status: "cancelled",
          message: "Purchase cancelled. No money was charged.",
        });
      } else if (code === "already-owned" || code === "duplicate-purchase") {
        // Token exists but unconsumed (previous kill) ,  recovery will credit it.
        waiter.resolve({
          status: "pending",
          message:
            "A previous purchase is still finishing. It will be credited automatically ,  check your balance in a moment.",
        });
        recoverUnfinishedPurchases().catch(() => {});
      } else if (
        code === "network-error" ||
        code === "service-timeout" ||
        code === "service-disconnected"
      ) {
        waiter.resolve({
          status: "pending",
          message:
            "Network issue while confirming. If money was debited, coins will be credited automatically.",
        });
      } else {
        waiter.resolve({
          status: "failed",
          message:
            error?.message || "Google Play could not complete the purchase.",
        });
      }
    });
  } catch (e) {}
}

/**
 * Fulfill + consume one purchased token. Idempotent: a token already in
 * the processed log is consumed WITHOUT crediting again (anti-replay).
 * Returns true if coins were credited by THIS call.
 */
async function settlePurchase(
  mod: IapModule,
  pkg: PaymentPackage | null,
  purchase: any,
): Promise<PlayBuyResult> {
  const state = String(purchase?.purchaseState ?? "");
  const token: string = purchase?.purchaseToken ?? "";
  const sku: string = purchase?.productId ?? purchase?.productIds?.[0] ?? "";

  if (state === "pending") {
    purchaseInFlight = false;
    return {
      status: "pending",
      message:
        "Payment is pending with Google Play (e.g. cash/UPI pending). Coins will be added automatically once it clears.",
      purchaseToken: token || undefined,
    };
  }
  if (state !== "purchased") {
    purchaseInFlight = false;
    return {
      status: "failed",
      message:
        "Google Play did not confirm this purchase. No money was charged.",
    };
  }
  if (!token) {
    purchaseInFlight = false;
    return {
      status: "failed",
      message:
        "Purchase arrived without a token. Money is safe ,  contact support with your order ID.",
    };
  }

  const resolved: PaymentPackage | null = pkg ?? skuToPackage(sku);
  const already = await hasToken(token);
  if (!already && resolved) {
    await fulfillPackage(resolved);
  }
  // Always consume: frees the SKU for re-buy AND closes the replay window.
  try {
    await mod.finishTransaction({ purchase, isConsumable: true });
  } catch (e) {
    // Consume failed (network?) ,  token is still recorded so recovery
    // finishes it later without double-crediting.
  }
  if (!already) await recordToken(token);
  purchaseInFlight = false;
  return {
    status: "success",
    message: already
      ? "This purchase was already credited earlier. No double charge."
      : "Payment completed successfully!",
    purchaseToken: token,
  };
}

function skuToPackage(sku: string): PaymentPackage | null {
  const all = [...RECHARGE_PACKAGES, VIP_WEEKLY_PACKAGE];
  return all.find((p) => PLAY_SKU_BY_PACKAGE_ID[p.id] === sku) ?? null;
}

async function ensureConnected(mod: IapModule): Promise<boolean> {
  if (connected) return true;
  try {
    const ok = await mod.initConnection();
    connected = !!ok;
    return connected;
  } catch (e) {
    return false;
  }
}

/** Is real Play Billing usable on this device/build? Never throws. */
export async function isPlayBillingAvailable(): Promise<boolean> {
  const mod = await getIap();
  if (!mod) return false;
  return ensureConnected(mod);
}

/**
 * Launch the REAL Google Play purchase sheet for a package.
 * Resolves exactly once (success / cancelled / pending / failed).
 * Double-tap safe: a second call while one is in flight is rejected.
 */
export function buyWithPlay(pkg: PaymentPackage): Promise<PlayBuyResult> {
  return (async (): Promise<PlayBuyResult> => {
    if (purchaseInFlight) {
      return {
        status: "failed",
        message: "A purchase is already in progress. Please wait.",
      };
    }
    const mod = await getIap();
    if (!mod) {
      return {
        status: "unavailable",
        message:
          "Google Play Billing is not available in this build. Please pay with UPI instead.",
      };
    }
    const ok = await ensureConnected(mod);
    if (!ok) {
      return {
        status: "unavailable",
        message:
          "Could not connect to Google Play. Check your connection or pay with UPI.",
      };
    }
    const sku = PLAY_SKU_BY_PACKAGE_ID[pkg.id];
    if (!sku) {
      return {
        status: "failed",
        message: "Unknown product. Please try again.",
      };
    }
    // Verify the product exists in Play Console (unknown SKUs are omitted).
    try {
      const products =
        (await mod.fetchProducts({ skus: [sku], type: "in-app" })) ?? [];
      const found = (products as any[]).some(
        (p) => p?.productId === sku || (p as any)?.id === sku,
      );
      if (!found) {
        return {
          status: "unavailable",
          message:
            "This pack is not set up on Google Play yet. Please pay with UPI for now.",
        };
      }
    } catch (e) {
      return {
        status: "unavailable",
        message:
          "Could not reach Google Play. Please check your connection or pay with UPI.",
      };
    }

    armListeners(mod);
    purchaseInFlight = true;
    return new Promise<PlayBuyResult>((resolve) => {
      // Safety timeout: Play sheet can be abandoned without an event on
      // some OEM ROMs. 10 min cap, then release the lock.
      const timer = setTimeout(
        () => {
          if (pendingWaiters.has(sku)) {
            pendingWaiters.delete(sku);
            purchaseInFlight = false;
            resolve({
              status: "pending",
              message:
                "Still waiting on Google Play. If money was debited, coins will be credited automatically.",
            });
          }
        },
        10 * 60 * 1000,
      );
      pendingWaiters.set(sku, {
        pkg,
        resolve: (r) => {
          clearTimeout(timer);
          resolve(r);
        },
      });
      mod
        .requestPurchase({
          request: { google: { skus: [sku] } },
          type: "in-app",
        })
        .catch((err: any) => {
          if (pendingWaiters.has(sku)) {
            pendingWaiters.delete(sku);
            clearTimeout(timer);
            purchaseInFlight = false;
            const code = String((err as any)?.code ?? "");
            if (code === "user-cancelled") {
              resolve({
                status: "cancelled",
                message: "Purchase cancelled. No money was charged.",
              });
            } else {
              resolve({
                status: "failed",
                message:
                  (err as any)?.message || "Google Play rejected the request.",
              });
            }
          }
        });
    });
  })();
}

/**
 * Boot recovery: credit every purchased-but-unconsumed token exactly once.
 * Silent ,  no UI. Call once at app start (fire-and-forget).
 */
export async function recoverUnfinishedPurchases(): Promise<number> {
  try {
    const mod = await getIap();
    if (!mod) return 0;
    const ok = await ensureConnected(mod);
    if (!ok) return 0;
    armListeners(mod);
    let purchases: any[] = [];
    try {
      purchases = (await mod.getAvailablePurchases()) as any[];
    } catch (e) {
      return 0;
    }
    let credited = 0;
    for (const p of purchases ?? []) {
      try {
        const state = String(p?.purchaseState ?? "");
        const token: string = p?.purchaseToken ?? "";
        const sku: string = p?.productId ?? p?.productIds?.[0] ?? "";
        if (state !== "purchased" || !token) continue;
        if (!Object.values(PLAY_SKU_BY_PACKAGE_ID).includes(sku)) continue;
        if (await hasToken(token)) {
          // Already credited earlier ,  just consume to close the window.
          try {
            await mod.finishTransaction({ purchase: p, isConsumable: true });
          } catch (e) {}
          continue;
        }
        const pkg = skuToPackage(sku);
        if (!pkg) continue;
        await fulfillPackage(pkg);
        await recordToken(token);
        try {
          await mod.finishTransaction({ purchase: p, isConsumable: true });
        } catch (e) {}
        credited += 1;
      } catch (e) {}
    }
    return credited;
  } catch (e) {
    return 0;
  }
}
