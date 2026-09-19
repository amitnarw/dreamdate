# BoloNa — Production Release & Handover Guide

This document contains all critical credentials, binary files, and configuration details required to publish and manage **BoloNa** on the Google Play Store.

---

## 1. Production Release Binary (.aab)

The Google Play App Bundle is compiled, signed, and ready for upload:

- **File**: `BoloNa-v1.0.0-release.aab` (in project root)
- **Path**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Application ID / Package Name**: `com.bolona.videocall`
- **Version Code**: `1`
- **Version Name**: `1.0.0`
- **Target SDK**: Android 15 (API 35)
- **Min SDK**: Android 7.0 (API 24)
- **Architecture**: Supports all physical Android devices (`arm64-v8a`, `armeabi-v7a`)

---

## 2. Production Signing Keystore

> ⚠️ **CRITICAL**: Store `release.keystore` and its passwords in a safe, backed-up location (e.g. 1Password, Google Drive). Every future update pushed to Google Play must be signed with this exact keystore.

- **Keystore File**: `android/app/release.keystore`
- **Keystore Format**: PKCS12
- **Key Alias**: `bolona-release`
- **Keystore Password**: `bolona@2026`
- **Key Password**: `bolona@2026`
- **Certificate Validity**: Until February 5, 2054 (10,000 days)
- **Certificate Owner**: `CN=BoloNa App, OU=Mobile, O=BoloNa, L=Mumbai, ST=MH, C=IN`

### Certificate Fingerprints
If you link Firebase, Google Cloud, or Google Sign-In, add these fingerprints:
- **SHA-256**:
  ```text
  24:D2:1A:A9:2C:76:B9:AB:90:27:00:83:BE:44:3D:64:5E:4E:8E:49:D0:43:DD:14:26:FC:75:39:96:F1:96:27
  ```
- **SHA-1**:
  ```text
  BA:DD:D6:18:DF:79:93:A9:64:EC:5C:67:FF:23:BD:B1:64:5D:98:FF
  ```

---

## 3. Google Play Console Setup Steps

### Step A: Upload Initial Build
1. Log into your [Google Play Console](https://play.google.com/console).
2. Select your app (`com.bolona.videocall`).
3. In the left menu, go to **Testing** → **Internal testing** (or **Closed testing**).
4. Click **Create new release**, upload `BoloNa-v1.0.0-release.aab`, and save.

### Step B: Create In-App Products
Once the `.aab` is uploaded, Google Play unlocks the **In-app products** screen.  
Go to **Monetize with Play** → **Products** → **In-app products**, click **Create product**, and add these exact Product IDs:

| Product ID (Must Match Exactly) | In-App Item | Price (INR) | Product Type |
| :--- | :--- | :--- | :--- |
| `coin_100` | 100 Coins Starter Pack | ₹100 | In-app product (Consumable) |
| `coin_400` | 400 Coins Popular Value | ₹199 | In-app product (Consumable) |
| `coin_1000` | 1,000 Coins Mega Saver | ₹299 | In-app product (Consumable) |
| `vip_weekly` | Weekly VIP All-Access Pass | ₹499 | In-app product (Consumable) |
| `flash_99` | 350 Coins Flash Welcome Deal | ₹99 | In-app product (Consumable) |
| `flash_199` | 800 Coins + VIP Mega Combo | ₹199 | In-app product (Consumable) |

*Note: Set the status of each product to **Active**.*

### Step C: Set Up Free License Testers
To test Google Play payments on your phone without actual bank deductions:
1. Go to **Settings** → **License testing**.
2. Add your tester Google/Gmail accounts.
3. Set **License test response** to `RESPOND_NORMALLY`.

---

## 4. How to Build Future Updates

Whenever you make updates and want to compile a new `.aab`:
1. In `android/app/build.gradle`, increment `versionCode` (e.g. `2`, `3`, ...) and update `versionName` (e.g. `"1.0.1"`).
2. Open terminal in the `android` folder and run:
   ```powershell
   ./gradlew bundleRelease
   ```
3. The newly signed bundle will be generated at `android/app/build/outputs/bundle/release/app-release.aab`.
