import twilio from 'twilio';
import { generateGoogleCalendarLink } from './calendar-utils';

function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
        throw new Error('Twilio Credentials Missing (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN)');
    }
    return twilio(accountSid, authToken);
}

export async function sendWhatsAppConfirmation(
    to: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    timeSlot: string,
    appointmentId: string,
    patientIC?: string
) {
    try {
        const calendarLink = generateGoogleCalendarLink(
            `Dental Appointment with ${doctorName}`,
            `Dental consultation at Klinik Pergigian Setapak (Sri Rampai). ID: ${appointmentId}`,
            "Klinik Pergigian Setapak (Sri Rampai)",
            appointmentDate,
            timeSlot
        );
        const client = getTwilioClient();
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
        // Format phone number for WhatsApp (must include country code)
        const formattedPhone = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;

        const message = await client.messages.create({
            from: `whatsapp:${twilioPhone}`,
            to: formattedPhone,
            body: `✅ *Appointment Confirmed*

Dear ${patientName},

Your dental appointment has been successfully scheduled at *Klinik Pergigian Setapak (Sri Rampai)*.

📋 *Appointment Details:*
• ID: ${appointmentId}
• Patient IC: ${patientIC || 'N/A'}
• Doctor: ${doctorName}
• Date: ${appointmentDate}
• Time: ${timeSlot}

📍 *Location:*
16-2, Jalan 46/26, Taman Sri Rampai,
53300 Kuala Lumpur

🗓️ *Add to Calendar:*
${calendarLink}

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
        const client = getTwilioClient();
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
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

- Klinik Pergigian Setapak (Sri Rampai)`,
        });

        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error('WhatsApp reminder error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendWhatsAppOTP(to: string, otp: string) {
    try {
        const client = getTwilioClient();
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
        const formattedPhone = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;

        const message = await client.messages.create({
            from: `whatsapp:${twilioPhone}`,
            to: formattedPhone,
            body: `🔐 *Verification Code*

Your OTP for appointment booking:

*${otp}*

This code will expire in 10 minutes.
Do not share this code with anyone.

- Klinik Pergigian Setapak (Sri Rampai)`,
        });

        return { success: true, messageId: message.sid };
    } catch (error: any) {
        console.error('WhatsApp OTP error:', error);
        return { success: false, error: error.message };
    }
}
