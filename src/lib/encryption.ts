import crypto from 'crypto';

// The key must be exactly 32 bytes for aes-256-cbc
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY || 'BalanceNutritionSecretKey1234567BN'; // 34 chars example

// Ensure it's exactly 32 bytes
const ENCRYPTION_KEY = ENCRYPTION_KEY_RAW.slice(0, 32).padEnd(32, '0');

if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    console.error("FATAL: ENCRYPTION_KEY is missing in production. Using insecure fallback.");
}

export function encryptData(data: any): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptData(token: string): any {
    try {
        const [ivHex, encryptedData] = token.split(':');
        if (!ivHex || !encryptedData) throw new Error("Invalid token format");

        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            Buffer.from(ENCRYPTION_KEY),
            Buffer.from(ivHex, 'hex')
        );

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
}
