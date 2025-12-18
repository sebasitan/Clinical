import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AppointmentModel, SlotModel } from '@/lib/models';

// GET all appointments (with optional filters)
export async function GET(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctorId');
        const date = searchParams.get('date');

        const query: any = {};
        if (doctorId) query.doctorId = doctorId;
        if (date) query.appointmentDate = date;

        const appointments = await AppointmentModel.find(query).sort({ createdAt: -1 });
        return NextResponse.json(appointments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
}

// POST new appointment
export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // 1. Verify Slot Availability (Concurrency Check)
        if (body.slotId) {
            const slot = await SlotModel.findOne({ id: body.slotId });
            if (slot && slot.status !== 'available') {
                return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 });
            }
        }

        // 2. Create Appointment
        const appointmentId = `APT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const newAppointment = await AppointmentModel.create({
            ...body,
            id: appointmentId
        });

        // 3. Update Slot Status to Booked
        if (body.slotId) {
            await SlotModel.findOneAndUpdate(
                { id: body.slotId },
                { status: 'booked', appointmentId: appointmentId }
            );
        }

        return NextResponse.json(newAppointment, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }
}
