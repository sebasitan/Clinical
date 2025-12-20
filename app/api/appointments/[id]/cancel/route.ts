import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AppointmentModel, SlotModel } from '@/lib/models';

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;

        // 1. Find the appointment
        const appointment = await AppointmentModel.findOne({ id: params.id });
        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        if (appointment.status === 'cancelled' || appointment.status === 'completed') {
            return NextResponse.json({ error: 'Appointment is already cancelled or completed' }, { status: 400 });
        }

        // 2. Free up the slot
        if (appointment.slotId) {
            await SlotModel.findOneAndUpdate(
                { id: appointment.slotId },
                { status: 'available', appointmentId: null }
            );
        }

        // 3. Update appointment status
        const oldDate = appointment.appointmentDate;
        appointment.status = 'cancelled';
        await appointment.save();

        // 4. Send Notifications
        try {
            // Send Email
            if (appointment.patientEmail) {
                const { sendAppointmentCancelled } = await import('@/lib/email');
                await sendAppointmentCancelled(
                    appointment.patientEmail,
                    appointment.patientName,
                    params.id,
                    oldDate
                );
            }

            // Send WhatsApp
            const { sendWhatsAppCancelled } = await import('@/lib/whatsapp');
            await sendWhatsAppCancelled(
                appointment.patientPhone,
                appointment.patientName,
                params.id,
                oldDate
            );

            // Send SMS
            const { sendSMSCancelled } = await import('@/lib/sms');
            await sendSMSCancelled(
                appointment.patientPhone,
                params.id,
                oldDate
            );
        } catch (notifError) {
            console.error('[Cancel API] Notification failed:', notifError);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[Cancel API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
