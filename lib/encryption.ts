import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.PROFILE_ENCRYPTION_KEY || 'default-key-change-in-production-32';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function maskSSN(ssn: string): string {
  // Mostrar solo los últimos 4 dígitos
  return '***-**-' + ssn.slice(-4);
}

export function maskRoutingNumber(routingNumber: string): string {
  // Mostrar solo los últimos 4 dígitos
  return '*****' + routingNumber.slice(-4);
}
