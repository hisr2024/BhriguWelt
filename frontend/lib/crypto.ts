/**
 * Cryptography utilities for secure offline storage
 * Uses WebCrypto API for AES-GCM encryption
 */

// Constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;
const ITERATIONS = 310000; // PBKDF2 iterations
const HASH = 'SHA-256';

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a random initialization vector (IV)
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derive a cryptographic key from a passcode using PBKDF2
 */
export async function deriveKey(
  passcode: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // Convert passcode to buffer
  const encoder = new TextEncoder();
  const passcodeBuffer = encoder.encode(passcode);

  // Import passcode as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passcodeBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // Not extractable for security
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encrypt(
  data: string,
  key: CryptoKey
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const iv = generateIV();

  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    dataBuffer
  );

  return { encrypted, iv };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decrypt(
  encrypted: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Convert ArrayBuffer to Base64 string for storage
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert Uint8Array to Base64 string
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
  return arrayBufferToBase64(array.buffer);
}

/**
 * Convert Base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(base64ToArrayBuffer(base64));
}

/**
 * Encrypt and encode data for storage
 */
export async function encryptForStorage(
  data: any,
  key: CryptoKey
): Promise<string> {
  const jsonString = JSON.stringify(data);
  const { encrypted, iv } = await encrypt(jsonString, key);

  // Combine IV and encrypted data
  const combined = {
    iv: uint8ArrayToBase64(iv),
    data: arrayBufferToBase64(encrypted),
  };

  return JSON.stringify(combined);
}

/**
 * Decrypt and decode data from storage
 */
export async function decryptFromStorage(
  encryptedString: string,
  key: CryptoKey
): Promise<any> {
  const combined = JSON.parse(encryptedString);
  const iv = base64ToUint8Array(combined.iv);
  const encrypted = base64ToArrayBuffer(combined.data);

  const decryptedString = await decrypt(encrypted, key, iv);
  return JSON.parse(decryptedString);
}

/**
 * Hash a passcode for verification (not for encryption)
 */
export async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode);
  const hashBuffer = await crypto.subtle.digest(HASH, data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Verify a passcode against a stored hash
 */
export async function verifyPasscode(
  passcode: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashPasscode(passcode);
  return hash === storedHash;
}

/**
 * Generate a secure random passcode (for testing/demo purposes)
 */
export function generateSecurePasscode(length: number = 4): string {
  const digits = '0123456789';
  let passcode = '';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));

  for (let i = 0; i < length; i++) {
    passcode += digits[(randomValues[i] ?? 0) % digits.length] ?? '';
  }

  return passcode;
}

/**
 * Check if WebCrypto API is available
 */
export function isCryptoAvailable(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.getRandomValues !== 'undefined'
  );
}
