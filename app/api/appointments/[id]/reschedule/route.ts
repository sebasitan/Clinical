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
        const body = await request.json();
        const { newSlotId, newDate, newTimeSlot } = body;

        // 1. Find the existing appointment
        const appointment = await AppointmentModel.findOne({ id: params.id });
        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        if (appointment.status === 'cancelled' || appointment.status === 'completed') {
            return NextResponse.json({ error: 'Cannot reschedule a completed or cancelled appointment' }, { status: 400 });
        }

        // 2. Verify new slot availability
        const newSlot = await SlotModel.findOne({ id: newSlotId });
        if (!newSlot || newSlot.status !== 'available') {
            return NextResponse.json({ error: 'New time slot is no longer available' }, { status: 409 });
        }

        // 3. Update the old slot to 'available'
        if (appointment.slotId) {
            await SlotModel.findOneAndUpdate(
                { id: appointment.slotId },
                { status: 'available', appointmentId: null }
            );
        }

        // 4. Lock the new slot
        await SlotModel.findOneAndUpdate(
            { id: newSlotId },
            { status: 'booked', appointmentId: params.id }
        );

        // 5. Update the appointment
        appointment.appointmentDate = newDate;
        appointment.timeSlot = newTimeSlot;
        appointment.slotId = newSlotId;
        appointment.status = 'pending'; // Reset to pending if it was rejected/no-show before? Or stay confirmed. Let's keep it pending for review or just confirmed.

        await appointment.save();

        // 6. Send Notifications
        try {
            const doctor = await AppointmentModel.db.model('Doctor').findOne({ id: appointment.doctorId });
            const doctorName = doctor?.name || 'Your Dentist';

            // Send Email
            if (appointment.patientEmail) {
                const { sendAppointmentRescheduled } = await import('@/lib/email');
                await sendAppointmentRescheduled(
                    appointment.patientEmail,
                    appointment.patientName,
                    doctorName,
                    newDate,
                    newTimeSlot,
                    params.id
                );
            }

            // Send WhatsApp
            const { sendWhatsAppRescheduled } = await import('@/lib/whatsapp');
            await sendWhatsAppRescheduled(
                appointment.patientPhone,
                appointment.patientName,
                doctorName,
                newDate,
                newTimeSlot,
                params.id
            );

            // Send SMS
            const { sendSMSRescheduled } = await import('@/lib/sms');
            await sendSMSRescheduled(
                appointment.patientPhone,
                doctorName,
                newDate,
                newTimeSlot,
                params.id
            );
        } catch (notifError) {
            console.error('[Reschedule Notif] Failed to send notifications:', notifError);
            // Don't fail the whole request if only notifications fail
        }

        return NextResponse.json({
            success: true,
            appointment
        });

    } catch (error: any) {
        console.error('[Reschedule API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
