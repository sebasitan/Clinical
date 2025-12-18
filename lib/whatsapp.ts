import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function sendWhatsAppConfirmation(
    to: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    timeSlot: string,
    appointmentId: string
) {
    try {
        // Format phone number for WhatsApp (must include country code)
        const formattedPhone = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;

        const message = await client.messages.create({
            from: `whatsapp:${twilioPhone}`,
            to: formattedPhone,
            body: `✅ *Appointment Confirmed*

Dear ${patientName},

Your dental appointment has been successfully scheduled at *Klinik Pergigian Setapak*.

📋 *Appointment Details:*
• ID: ${appointmentId}
• Doctor: ${doctorName}
• Date: ${appointmentDate}
• Time: ${timeSlot}

📍 *Location:*
Jalan Genting Klang, Setapak
53300 Kuala Lumpur

⚠️ *Important Reminders:*
• Arrive 10 minutes early
• Bring your IC
• Contact us 24h in advance to reschedule

📞 Contact: +60 3-4142 1234

Thank you for choosing us! 🦷`,
        });

        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error('WhatsApp error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendWhatsAppReminder(
    to: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    timeSlot: string
) {
    try {
        const formattedPhone = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;

        const message = await client.messages.create({
            from: `whatsapp:${twilioPhone}`,
            to: formattedPhone,
            body: `⏰ *Appointment Reminder*

Dear ${patientName},

This is a friendly reminder about your upcoming dental appointment:

👨‍⚕️ Doctor: ${doctorName}
📅 Date: ${appointmentDate}
🕐 Time: ${timeSlot}

See you soon! 🦷

- Klinik Pergigian Setapak`,
        });

        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error('WhatsApp reminder error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendWhatsAppOTP(to: string, otp: string) {
    try {
        const formattedPhone = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;

        const message = await client.messages.create({
            from: `whatsapp:${twilioPhone}`,
            to: formattedPhone,
            body: `🔐 *Verification Code*

Your OTP for appointment booking:

*${otp}*

This code will expire in 10 minutes.
Do not share this code with anyone.

- Klinik Pergigian Setapak`,
        });

        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error('WhatsApp OTP error:', error);
        return { success: false, error: error.message };
    }
}
