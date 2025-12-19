import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PatientModel, AppointmentModel } from '@/lib/models';
import { sendSMSReminder } from '@/lib/sms';
import { sendWhatsAppReminder } from '@/lib/whatsapp';
import { sendAppointmentReminder } from '@/lib/email';

/**
 * MASTER AUTOMATION ENGINE
 * Handles:
 * 1. Booking Reminders (X days before appointment)
 * 2. Follow-up Care Reminders (Periodical until completed)
 */
export async function GET(req: Request) {
    try {
        await dbConnect();
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let logs: string[] = [];
        let count = { booking: 0, followUp: 0 };

        // --- PART 1: BOOKING REMINDERS (Rule: 1 & 2 days before) ---
        // Find appointments for the next 2 days
        const startOfTomorrow = new Date(now);
        startOfTomorrow.setDate(now.getDate() + 1);
        const endOfOvermorrow = new Date(now);
        endOfOvermorrow.setDate(now.getDate() + 3);

        const appointments = await AppointmentModel.find({
            status: 'confirmed'
        });

        for (const apt of appointments) {
            const aptDate = new Date(apt.appointmentDate);
            aptDate.setHours(0, 0, 0, 0);

            const diffTime = aptDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Logic: Send if 1 or 2 days before
            if (diffDays === 1 || diffDays === 2) {
                // In a real app, we'd check if already sent for this specific sequence
                const dateStr = aptDate.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short' });
                await sendWhatsAppReminder(apt.patientPhone, apt.patientName, "Clinic", dateStr, apt.timeSlot);
                count.booking++;
                logs.push(`Booking Reminder: ${apt.patientName} (${diffDays}d before)`);
            }
        }

        // --- PART 2: CLINICAL FOLLOW-UP REMINDERS (Periodical until completed) ---
        const carePatients = await PatientModel.find({
            "continuedTreatment.active": true,
            "continuedTreatment.status": "in-progress"
        });

        for (const patient of carePatients) {
            // Logic: If nextFollowUpDate matches today or is overdue by a multiple of cycle
            if (!patient.continuedTreatment.nextFollowUpDate) continue;

            const followUpDate = new Date(patient.continuedTreatment.nextFollowUpDate);
            followUpDate.setHours(0, 0, 0, 0);

            const diffTime = followUpDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Send reminder 1 day before the care date
            if (diffDays === 1) {
                const dateStr = followUpDate.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'short' });
                const channels = patient.continuedTreatment.preferredChannels;

                if (channels.whatsapp) await sendWhatsAppReminder(patient.phone, patient.name, "Clinic", dateStr, "Care Visit");
                if (channels.email && patient.email) await sendAppointmentReminder(patient.email, patient.name, "Clinic", dateStr, "Care Visit");

                count.followUp++;
                logs.push(`Care Follow-up: ${patient.name}`);
            }
        }

        return NextResponse.json({
            success: true,
            processed: count,
            logs,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Automation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
