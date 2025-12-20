
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

export class MoceanClient {
    private config: MoceanConfig;

    constructor() {
        const apiKey = process.env.MOCEAN_API_KEY;
        const apiSecret = process.env.MOCEAN_API_SECRET;

        if (!apiKey || !apiSecret) {
            console.warn('[Mocean] API Key or Secret missing. Notifications will fail.');
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
            // Ensure number has no + if Mocean requires it (Mocean usually accepts both but prefers international w/o + or with +)
            // Let's keep it safe.
            const cleanTo = to.replace('+', '');

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

    async sendWhatsApp(to: string, text: string) {
        try {
            const cleanTo = to.replace('+', '');
            // Mocean WhatsApp Endpoint (Generic/Standard)
            // If strictly using templates, params would differ. Assumes freeform text permission or fallback.
            const data = await this.post('/send-message', {
                'mocean-to': cleanTo,
                'mocean-medium': 'whatsapp',
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
}

export const mocean = new MoceanClient();
