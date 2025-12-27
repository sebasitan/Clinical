import { BudgetSMS } from './budgetsms';

// Environment variables:
// BUDGETSMS_USERNAME
// BUDGETSMS_USERID
// BUDGETSMS_HANDLE
// BUDGETSMS_SENDER_ID (optional)

interface BudgetSMSConfig {
    username: string;
    userid: string;
    handle: string;
    senderId?: string;
}

export class BudgetSMSClient {
    private config: BudgetSMSConfig;
    private baseUrl = 'https://api.budgetsms.net/sendsms/';

    constructor() {
        this.config = {
            username: process.env.BUDGETSMS_USERNAME || '',
            userid: process.env.BUDGETSMS_USERID || '',
            handle: process.env.BUDGETSMS_HANDLE || '',
            senderId: process.env.BUDGETSMS_SENDER_ID || 'KPS Dental'
        };

        if (!this.config.username || !this.config.userid || !this.config.handle) {
            console.warn('[BudgetSMS] Configuration missing. SMS will fail.');
        }
    }

    async sendSMS(to: string, message: string): Promise<boolean> {
        try {
            // Clean phone number (remove + and spaces)
            const cleanTo = to.replace(/\D/g, '');

            const params = new URLSearchParams({
                username: this.config.username,
                userid: this.config.userid,
                handle: this.config.handle,
                to: cleanTo,
                msg: message,
                from: this.config.senderId || 'KPS'
            });

            const response = await fetch(`${this.baseUrl}?${params.toString()}`);
            const text = await response.text();

            if (text.startsWith('OK')) {
                return true;
            } else {
                console.error(`[BudgetSMS] Error sending SMS: ${text}`);
                return false;
            }
        } catch (error) {
            console.error('[BudgetSMS] Request failed', error);
            return false;
        }
    }
}

export const budgetsms = new BudgetSMSClient();
