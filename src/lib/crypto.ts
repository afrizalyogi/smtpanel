import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Gets a derived key from the environment variable ENCRYPTION_KEY.
 * The ENCRYPTION_KEY must be a 32-character secure string.
 */
function getKey(salt: Buffer): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error('ENCRYPTION_KEY environment variable is missing or less than 32 characters.');
  }
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts an object payload into a base64 string.
 */
export function encrypt(payload: any): string {
  const text = JSON.stringify(payload);
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getKey(salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const tag = cipher.getAuthTag();

  // Format: salt:iv:tag:encryptedData
  return `${salt.toString('base64')}:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts a base64 string back into the object payload.
 */
export function decrypt(encryptedData: string): any {
  const parts = encryptedData.split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted data format.');

  const salt = Buffer.from(parts[0], 'base64');
  const iv = Buffer.from(parts[1], 'base64');
  const tag = Buffer.from(parts[2], 'base64');
  const encryptedText = parts[3];

  const key = getKey(salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
