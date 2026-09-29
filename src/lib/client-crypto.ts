// Uses Web Crypto API for Client-Side Token Encryption/Decryption
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const ALGORITHM = 'AES-GCM';

const getDerivationAlgorithm = (salt: Uint8Array) => ({
  name: 'PBKDF2',
  salt,
  iterations: ITERATIONS,
  hash: 'SHA-256'
});

async function getKeyMaterial(pin: string) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
}

const toBase64 = (arr: Uint8Array) => btoa(String.fromCharCode.apply(null, Array.from(arr)));
const fromBase64 = (str: string) => new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));

/**
 * Encrypts arbitrary object data with a user-provided PIN.
 * Returns a securely encrypted string token.
 */
export async function encryptWithPin(data: object, pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await getKeyMaterial(pin);
  
  const key = await crypto.subtle.deriveKey(
    getDerivationAlgorithm(salt),
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt']
  );
  
  const enc = new TextEncoder();
  const encoded = enc.encode(JSON.stringify(data));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );
  
  const encryptedArray = new Uint8Array(encrypted);
  
  return `smtpanel://${toBase64(salt)}:${toBase64(iv)}:${toBase64(encryptedArray)}`;
}

/**
 * Decrypts a secure string token using the provided PIN.
 * Returns the original object data.
 */
export async function decryptWithPin(token: string, pin: string): Promise<any> {
  const raw = token.replace('smtpanel://', '');
  const parts = raw.split(':');
  if (parts.length !== 3) throw new Error('Invalid token format');
  
  const salt = fromBase64(parts[0]);
  const iv = fromBase64(parts[1]);
  const encrypted = fromBase64(parts[2]);
  
  const keyMaterial = await getKeyMaterial(pin);
  const key = await crypto.subtle.deriveKey(
    getDerivationAlgorithm(salt),
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encrypted
  );
  
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
}
