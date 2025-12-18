import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SlotModel, AppointmentModel } from '@/lib/models';

export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    const query: any = {};
    if (doctorId) query.doctorId = doctorId;
    if (date) query.date = date;

    // Fetch explict slots (if any logic uses them) AND appointments to derive availability
    // Simplified: Just fetch appointments and 'blocked' slots

    // In our model, we have a SlotModel.
    // If we are using the detailed engine, we check SlotModel.
    const slots = await SlotModel.find(query);

    // Also fetch appointments for this day/doctor to be sure? 
    // The SlotModel should be the source of truth if we update it correctly on booking.

    return NextResponse.json(slots);
}
