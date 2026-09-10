import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';
import { activateWeeklyVip, addCoins, recordPurchase } from './wallet';

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
    id: 'pack_100',
    title: 'Starter Recharge',
    amount: 100,
    originalAmount: 200,
    discountPercentage: 50,
    coinsAwarded: 120,
    note: 'DreamDate 120 Coins Recharge',
  },
  {
    id: 'pack_150',
    title: 'Popular Recharge',
    amount: 150,
    originalAmount: 250,
    discountPercentage: 40,
    coinsAwarded: 200,
    note: 'DreamDate 200 Coins Recharge',
  },
  {
    id: 'pack_200',
    title: 'Pro Super Saver',
    amount: 200,
    originalAmount: 350,
    discountPercentage: 43,
    coinsAwarded: 300,
    note: 'DreamDate 300 Coins Recharge',
  },
];

export const VIP_WEEKLY_PACKAGE: PaymentPackage = {
  id: 'vip_weekly_500',
  title: 'Weekly VIP All-Access',
  amount: 500,
  originalAmount: 1000,
  discountPercentage: 50,
  coinsAwarded: 1500,
  isVip: true,
  note: 'DreamDate Weekly VIP Pass',
};

const UPI_PAYEE_VPA = 'dararaj842@okaxis';
const UPI_PAYEE_NAME = 'Darasingh Rajput';
const UPI_AID = 'uGICAgMD1x9exUA';

export interface UPIPaymentResult {
  success: boolean;
  cancelled?: boolean;
  message?: string;
  rawResponse?: string;
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
export async function launchUPIPayment(pkg: PaymentPackage): Promise<UPIPaymentResult> {
  const formattedAmount = pkg.amount.toFixed(2);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_PAYEE_VPA)}&pn=${encodeURIComponent(
    UPI_PAYEE_NAME
  )}&am=${encodeURIComponent(formattedAmount)}&cu=INR&aid=${encodeURIComponent(
    UPI_AID
  )}&tn=${encodeURIComponent(pkg.note)}`;

  if (Platform.OS === 'android') {
    try {
      const result = await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: upiUrl,
      });

      // resultCode:
      // -1 = ResultCode.Success (Activity.RESULT_OK)
      //  0 = ResultCode.Canceled (Activity.RESULT_CANCELED - user pressed back or cancelled)
      if (result.resultCode === 0) {
        return {
          success: false,
          cancelled: true,
          message: 'Payment was cancelled. No amount was charged and no coins were added.',
        };
      }

      const rawData = (result.data || (result as any).extra?.response || '').toString();
      const lowerData = rawData.toLowerCase();

      if (lowerData.includes('fail') || lowerData.includes('cancel') || lowerData.includes('decline')) {
        return {
          success: false,
          cancelled: true,
          message: 'UPI transaction was declined or failed in your bank app.',
        };
      }

      // Successful completion confirmed by UPI activity
      if (result.resultCode === -1 || lowerData.includes('success')) {
        await fulfillPackage(pkg);
        return {
          success: true,
          message: 'Payment completed successfully!',
          rawResponse: rawData,
        };
      }

      return {
        success: false,
        cancelled: true,
        message: 'Payment could not be confirmed. No coins were credited.',
      };
    } catch (error: any) {
      console.log('IntentLauncher exception, falling back to Linking', error);
    }
  }

  // Fallback for non-Android or if IntentLauncher fails
  try {
    const supported = await Linking.canOpenURL(upiUrl);
    if (supported) {
      await Linking.openURL(upiUrl);
      // Do NOT blindly credit coins upon URL open
      return {
        success: false,
        cancelled: true,
        message: 'Please complete payment in your UPI app.',
      };
    } else {
      Alert.alert(
        'UPI App Not Found',
        'No supported UPI app found. Please install Google Pay, PhonePe, Paytm, or BHIM on your device.'
      );
      return {
        success: false,
        cancelled: true,
        message: 'No supported UPI app found.',
      };
    }
  } catch (error) {
    return {
      success: false,
      cancelled: true,
      message: 'Failed to launch UPI application.',
    };
  }
}
