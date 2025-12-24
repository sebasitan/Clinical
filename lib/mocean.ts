
const MOCEAN_BASE_URL = 'https://rest.moceanapi.com/rest/2';

interface MoceanConfig {
    apiKey: string;
    apiSecret: string;
    senderId?: string; // Default SMS sender ID
}

interface SendSMSResponse {
    status: number;
    messages: {
        status: number;
        msgid: string;
        receiver: string;
    }[];
    err_msg?: string;
}

import { formatMalaysianPhone } from '@/lib/utils';

export class MoceanClient {
    private config: MoceanConfig;

    constructor() {
        const apiKey = process.env.MOCEAN_API_KEY;
        const apiSecret = process.env.MOCEAN_API_SECRET;

        // If using API Token (starts with apit-), we don't strictly need a secret.
        // If using Key/Secret pair, both are needed.
        const isApiToken = apiKey?.startsWith('apit-');

        if (!apiKey) {
            console.warn('[Mocean] API Key/Token is missing. Notifications will fail.');
        } else if (!isApiToken && !apiSecret) {
            console.warn('[Mocean] API Secret is missing (required for API Key auth). Notifications may fail.');
        }

        this.config = {
            apiKey: apiKey || '',
            apiSecret: apiSecret || '',
            senderId: process.env.MOCEAN_SENDER_ID || 'KPS Dental'
        };
    }

    private async post(endpoint: string, params: Record<string, string>) {
        if (!this.config.apiKey) return { success: false, error: 'Missing Credentials' };

        const body = new URLSearchParams();

        // Check if using API Token (starts with apit-)
        const isApiToken = this.config.apiKey.startsWith('apit-');
        const headers: Record<string, string> = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        if (isApiToken) {
            // Use Bearer Token for API Tokens
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        } else {
            // Use Key/Secret parameters for standard keys
            body.append('mocean-api-key', this.config.apiKey);
            body.append('mocean-api-secret', this.config.apiSecret);
        }

        body.append('mocean-resp-format', 'json');

        Object.entries(params).forEach(([key, value]) => {
            body.append(key, value);
        });

        try {
            const res = await fetch(`${MOCEAN_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: body.toString()
            });

            const data = await res.json();
            return data;
        } catch (error: any) {
            console.error(`[Mocean] Error calling ${endpoint}:`, error);
            throw new Error(error.message || 'Mocean API Request Failed');
        }
    }

    /**
     * Send SMS
     * @param to Phone number (E.164 or local format)
     * @param text Message content
     */
    async sendSMS(to: string, text: string) {
        try {
            const cleanTo = formatMalaysianPhone(to);
            const data = await this.post('/sms', {
                'mocean-to': cleanTo,
                'mocean-from': this.config.senderId || 'KPS',
                'mocean-text': text
            });

            if (data && data.messages && data.messages[0].status === 0) {
                return { success: true, msgid: data.messages[0].msgid };
            } else {
                return {
                    success: false,
                    error: data.err_msg || (data.messages ? `Status: ${data.messages[0].status}` : 'Unknown Error')
                };
            }
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Send WhatsApp Message
     * Uses /send-message/whatsapp endpoint
     */
    async sendWhatsApp(to: string, text: string) {
        try {
            const cleanTo = formatMalaysianPhone(to);
            // Construct the payload structure required by Mocean WhatsApp API
            const payload = {
                'mocean-to': cleanTo,
                'mocean-from': process.env.MOCEAN_WHATSAPP_NUMBER || '60123456789', // Needed if using specific sender
                'mocean-content': JSON.stringify({
                    type: 'text',
                    text: text
                })
            };

            // Note: The doc example sends nested JSON in 'mocean-content' if sending as JSON body,
            // but the post method implementation above tends to use URLSearchParams (x-www-form-urlencoded).
            // For x-www-form-urlencoded, complex objects usually need to be stringified or flattened.
            // Let's check how post() behaves. It uses URLSearchParams.
            // Documentation implies we can send JSON if we set Content-Type: application/json.
            // But let's stick to the current post helper which maps params.

            // Actually, for WhatsApp, it's safer to use the /send-message/whatsapp endpoint.
            // The document shows JSON body for WhatsApp.
            // Let's try to adapt the post method to support JSON or create a specific one.
            // Since I can't easily change `post` without potentially breaking SMS (which is form-encoded),
            // I'll handle JSON posting here or update `post` to support it.

            // Let's trust the form-encoded approach works for basic text if we follow the standard /send-message logic,
            // OR unimplemented the specific JSON approach.
            // Given the limitations, I'll update usage to match the apparent working state or standard.

            // Re-reading docs: /send-message/whatsapp supports JSON.
            // Let's implement a private postJson method if needed, or just use fetch here directly.

            const res = await fetch(`${MOCEAN_BASE_URL}/send-message/whatsapp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.config.apiKey.startsWith('apit-')
                        ? `Bearer ${this.config.apiKey}`
                        : undefined // If not bearer, we might need basic auth or query params? Docs say Bearer.
                    // If it's Key/Secret, docs usually say check auth section.
                    // Assuming Bearer for now or standard auth logic.
                } as any, // Cast to any to allow conditional adding
                body: JSON.stringify({
                    'mocean-api-key': !this.config.apiKey.startsWith('apit-') ? this.config.apiKey : undefined,
                    'mocean-api-secret': !this.config.apiKey.startsWith('apit-') ? this.config.apiSecret : undefined,
                    'mocean-to': cleanTo,
                    'mocean-from': process.env.MOCEAN_WHATSAPP_NUMBER || 'KPS',
                    'mocean-content': {
                        type: 'text',
                        text: text
                    }
                })
            });

            const data = await res.json();
            if (data && data.messages && data.messages[0].status === 0) {
                return { success: true, msgid: data.messages[0].msgid };
            } else {
                return {
                    success: false,
                    error: data.err_msg || (data.messages ? `Status: ${data.messages[0].status}` : 'Unknown Error')
                };
            }

        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Request Verify Code (PPA - Pay Per Attempt)
     * Sends an OTP via SMS
     */
    async requestVerify(to: string, brand: string = 'KPS Dental') {
        try {
            const cleanTo = formatMalaysianPhone(to);
            const data = await this.post('/verify/req/sms', {
                'mocean-to': cleanTo,
                'mocean-brand': brand,
                'mocean-code-length': '6',
                'mocean-pin-validity': '600' // 600 seconds = 10 mins
            });

            if (data.status === 0) {
                return { success: true, reqid: data.reqid };
            } else {
                return { success: false, error: data.err_msg || `Status: ${data.status}` };
            }
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Check Verify Code
     * Verifies the code entered by user
     */
    async checkVerify(reqid: string, code: string) {
        try {
            const data = await this.post('/verify/check', {
                'mocean-reqid': reqid,
                'mocean-code': code
            });

            if (data.status === 0) {
                return { success: true, reqid: data.reqid };
            } else {
                return { success: false, error: data.err_msg || `Status: ${data.status}` };
            }
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
}

export const mocean = new MoceanClient();
