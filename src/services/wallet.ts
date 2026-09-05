import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const WALLET_KEY = '@talkmate_user_coins_v1';
const INITIAL_COINS = 300;

type WalletListener = (coins: number) => void;
const listeners = new Set<WalletListener>();

let currentCoins = INITIAL_COINS;

export async function initWallet(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(WALLET_KEY);
    if (stored !== null) {
      currentCoins = parseInt(stored, 10) || INITIAL_COINS;
    } else {
      currentCoins = INITIAL_COINS;
      await AsyncStorage.setItem(WALLET_KEY, currentCoins.toString());
    }
  } catch (e) {
    currentCoins = INITIAL_COINS;
  }
  notifyListeners();
  return currentCoins;
}

export function getCoins(): number {
  return currentCoins;
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

function notifyListeners() {
  listeners.forEach((l) => l(currentCoins));
}

export function useWallet() {
  const [coins, setCoins] = useState<number>(currentCoins);

  useEffect(() => {
    initWallet().then(setCoins);
    const listener: WalletListener = (newCoins) => setCoins(newCoins);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    coins,
    deductCoins,
    addCoins,
  };
}
