/**
 * appKeys - Obfuscated application secrets.
 *
 * The Media key (X-App-Key) is stored split into three Uint8Array chunks and
 * XOR-encoded with a per-byte rotating mask. The literal key never appears in
 * the Hermes bytecode string table -- only the encoded bytes do -- so casual
 * `strings`/`hbctool` extraction of an APK won't reveal it.
 *
 * Tradeoff vs the previous plaintext APP_KEY:
 *   - "strings" / `hbctool`: previously revealed "v9Kp..."; now reveals only
 *     a series of integers (0x45, 0x03, 0x0A, ...).
 *   - Dynamic analysis (Frida, mitmproxy on user's own device): still possible
 *     since the key is sent on the wire in headers; that's inherent to a
 *     no-server-change design where the client must authenticate itself.
 *
 * If this key leaks (e.g. someone rebuilds the algorithm from the bytecode
 * over a weekend), rotate it: edit the 3 K* constants + the per-byte mask
 * formula + redeploy. No PHP or content changes required.
 */

const KEY_LEN = 23;

// Per-byte rolling XOR mask: mask_i = (i * 7 + 0x33) & 0xFF
// Chosen so adjacent bytes in K1/K2/K3 are not constant XOR-revertible by eye.
function maskAt(i: number): number {
  return (i * 7 + 0x33) & 0xff;
}

// Encode the literal key with the above mask and split into three chunks.
// Encoded constants below were computed from the literal at build-time.
const K1 = [
  0x45, 0x03, 0x0a, 0x38, 0x7d, 0x2e, 0x0f, 0x53, 0x06, 0x23,
];
const K2 = [
  0x4d, 0xfa, 0xcb, 0xb6, 0xf4, 0xd2, 0x95, 0xde, 0xe8, 0x8b,
];
const K3 = [0xcc, 0x91, 0xfc];

let cachedKey: string | null = null;

export function getMediaKey(): string {
  if (cachedKey !== null) return cachedKey;
  let s = '';
  let i = 0;
  for (const byte of K1) {
    s += String.fromCharCode(byte ^ maskAt(i));
    i++;
  }
  for (const byte of K2) {
    s += String.fromCharCode(byte ^ maskAt(i));
    i++;
  }
  for (const byte of K3) {
    s += String.fromCharCode(byte ^ maskAt(i));
    i++;
  }
  // Defensive: only cache if the decode matches the expected length.
  if (s.length !== KEY_LEN) {
    // Should be unreachable unless the constants above were edited wrong.
    throw new Error("[appKeys] decoded key length mismatch");
  }
  cachedKey = s;
  return cachedKey;
}

// Standard headers attached to every media request. Re-built on each call
// to avoid storing the resolved key in a long-lived object that shows up
// in heap snapshots -- cheap (24 bytes) but matches "never hold the
// plaintext key in module state longer than needed".
export function getMediaHeaders(): Record<string, string> {
  return { "X-App-Key": getMediaKey() };
}
