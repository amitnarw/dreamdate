import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const WALLET_KEY = "@dreamdate_user_coins_v2";
const VIP_STORAGE_KEY = "@dreamdate_user_vip_v2";
const HAS_PURCHASED_KEY = "@dreamdate_has_purchased_v1";
const INITIAL_COINS = 50; // 50 free coins on first install ,  the ONLY free grant

type WalletListener = (
  coins: number,
  isVip: boolean,
  hasPurchased: boolean,
) => void;
const listeners = new Set<WalletListener>();

let currentCoins = INITIAL_COINS;
let currentVipExpiresAt: number | null = null;
let currentHasPurchased = false;

export async function initWallet(): Promise<{
  coins: number;
  isVip: boolean;
  hasPurchased: boolean;
}> {
  try {
    const storedCoins = await AsyncStorage.getItem(WALLET_KEY);
    if (storedCoins !== null) {
      currentCoins = parseInt(storedCoins, 10) || 0;
    } else {
      currentCoins = INITIAL_COINS;
      await AsyncStorage.setItem(WALLET_KEY, currentCoins.toString());
    }

    const storedVip = await AsyncStorage.getItem(VIP_STORAGE_KEY);
    if (storedVip !== null) {
      const timestamp = parseInt(storedVip, 10);
      if (timestamp > Date.now()) {
        currentVipExpiresAt = timestamp;
      } else {
        currentVipExpiresAt = null;
        await AsyncStorage.removeItem(VIP_STORAGE_KEY);
      }
    }

    const storedPurchased = await AsyncStorage.getItem(HAS_PURCHASED_KEY);
    currentHasPurchased = storedPurchased === "true";
  } catch (e) {
    currentCoins = INITIAL_COINS;
  }
  notifyListeners();
  return {
    coins: currentCoins,
    isVip: isVipActive(),
    hasPurchased: currentHasPurchased,
  };
}

export function getCoins(): number {
  return currentCoins;
}

export function isVipActive(): boolean {
  if (!currentVipExpiresAt) return false;
  return currentVipExpiresAt > Date.now();
}

export function hasUserPurchased(): boolean {
  return currentHasPurchased;
}

export function getVipExpiresAt(): number | null {
  return currentVipExpiresAt;
}

export async function recordPurchase(): Promise<void> {
  currentHasPurchased = true;
  try {
    await AsyncStorage.setItem(HAS_PURCHASED_KEY, "true");
  } catch (e) {}
  notifyListeners();
}

export async function addCoins(amount: number): Promise<number> {
  currentCoins += amount;
  try {
    await AsyncStorage.setItem(WALLET_KEY, currentCoins.toString());
  } catch (e) {}
  notifyListeners();
  return currentCoins;
}

export async function deductCoins(amount: number): Promise<boolean> {
  if (currentCoins < amount) {
    return false;
  }
  currentCoins -= amount;
  try {
    await AsyncStorage.setItem(WALLET_KEY, currentCoins.toString());
  } catch (e) {}
  notifyListeners();
  return true;
}

export async function activateWeeklyVip(
  bonusCoins: number = 1500,
): Promise<void> {
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const newExpiration =
    (isVipActive() && currentVipExpiresAt ? currentVipExpiresAt : Date.now()) +
    oneWeekMs;
  currentVipExpiresAt = newExpiration;
  currentCoins += bonusCoins;
  currentHasPurchased = true;

  try {
    await AsyncStorage.setItem(VIP_STORAGE_KEY, newExpiration.toString());
    await AsyncStorage.setItem(WALLET_KEY, currentCoins.toString());
    await AsyncStorage.setItem(HAS_PURCHASED_KEY, "true");
  } catch (e) {}

  notifyListeners();
}

function notifyListeners() {
  const isVip = isVipActive();
  listeners.forEach((l) => l(currentCoins, isVip, currentHasPurchased));
}

export function useWallet() {
  const [coins, setCoins] = useState<number>(currentCoins);
  const [isVip, setIsVip] = useState<boolean>(isVipActive());
  const [hasPurchased, setHasPurchased] =
    useState<boolean>(currentHasPurchased);

  useEffect(() => {
    initWallet().then((res) => {
      setCoins(res.coins);
      setIsVip(res.isVip);
      setHasPurchased(res.hasPurchased);
    });
    const listener: WalletListener = (newCoins, newVip, newPurchased) => {
      setCoins(newCoins);
      setIsVip(newVip);
      setHasPurchased(newPurchased);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    coins,
    isVip,
    hasPurchased,
    deductCoins,
    addCoins,
    activateWeeklyVip,
    recordPurchase,
  };
}
