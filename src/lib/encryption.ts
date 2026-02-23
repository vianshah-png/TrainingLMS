import crypto from 'crypto';

// The key must be 32 bytes for aes-256-cbc
// We use a fallback key for development but it should be set in production
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'BalanceNutritionSecretKey1234567';

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
