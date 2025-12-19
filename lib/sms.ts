import twilio from 'twilio';

/**
 * Sanitizes phone number to E.164 format
 */
function sanitizePhone(phone: string): string {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    return cleaned;
}

function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
        throw new Error('Twilio Credentials Missing (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN)');
    }
    return twilio(accountSid, authToken);
}

/**
 * Sends a verification code (OTP) via SMS using Twilio Verify
 * @param to Phone number in E.164 format
 */
export async function sendSMSOTP(to: string) {
    try {
        const client = getTwilioClient();
        const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA549c93a543dddbd19698d9133ab327a5';
        const formattedPhone = sanitizePhone(to);

        console.log(`[Twilio] Sending OTP to ${formattedPhone} using service ${serviceSid}`);

        const verification = await client.verify.v2.services(serviceSid)
            .verifications
            .create({ to: formattedPhone, channel: 'sms' });

        return { success: true, sid: verification.sid };
    } catch (error: any) {
        console.error('Twilio Verify Send Error:', error);
        return { success: false, error: error.message || 'Unknown Twilio error' };
    }
}

/**
 * Verifies the code entered by the user
 * @param to Phone number in E.164 format
 * @param code The 6-digit code to verify
 */
export async function verifySMSOTP(to: string, code: string) {
    try {
        const client = getTwilioClient();
        const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA549c93a543dddbd19698d9133ab327a5';
        const formattedPhone = sanitizePhone(to);

        const verificationCheck = await client.verify.v2.services(serviceSid)
            .verificationChecks
            .create({ to: formattedPhone, code });

        return {
            success: verificationCheck.status === 'approved',
            status: verificationCheck.status
        };
    } catch (error: any) {
        console.error('Twilio Verify Check Error:', error);
        return { success: false, error: error.message || 'Verification failed' };
    }
}
