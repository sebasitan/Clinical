import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PatientModel } from '@/lib/models';
import { sendSMSReminder } from '@/lib/sms';
import { sendWhatsAppReminder } from '@/lib/whatsapp';
import { sendAppointmentReminder } from '@/lib/email';

/**
 * CRON API to process Continued Care reminders.
 * This should be called once per day by a scheduler (e.g., Vercel Cron, GitHub Actions).
 */
export async function GET(req: Request) {
    try {
        await dbConnect();

        // 1. Find all patients with active continued treatment
        const patients = await PatientModel.find({ "continuedTreatment.active": true });

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let processedCount = 0;

        for (const patient of patients) {
            const followUpDate = new Date(patient.continuedTreatment.nextFollowUpDate);
            followUpDate.setHours(0, 0, 0, 0);

            // Calculate difference in days
            const diffTime = followUpDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Reminder Logic: Send reminders 3, 2, and 1 day before
            if (diffDays >= 1 && diffDays <= 3) {
                const channels = patient.continuedTreatment.preferredChannels;
                const formattedDate = followUpDate.toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                // Send via enabled channels
                if (channels.sms) {
                    await sendSMSReminder(patient.phone, patient.name, "Your Case Doctor", formattedDate, "TBD");
                }

                if (channels.whatsapp) {
                    await sendWhatsAppReminder(patient.phone, patient.name, "Your Case Doctor", formattedDate, "TBD");
                }

                if (channels.email && patient.email) {
                    await sendAppointmentReminder(patient.email, patient.name, "Your Case Doctor", formattedDate, "TBD");
                }

                processedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed reminders for ${processedCount} patients in care sequence.`,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Care Automation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
