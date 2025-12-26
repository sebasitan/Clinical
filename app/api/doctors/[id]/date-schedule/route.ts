import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DoctorDateSchedule } from '@/lib/models';

// GET /api/doctors/[id]/date-schedule
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const doctorId = params.id;
        const schedule = await DoctorDateSchedule.findOne({ doctorId });

        if (!schedule) {
            return NextResponse.json({ doctorId, schedules: {} }, { status: 200 });
        }

        return NextResponse.json(schedule, { status: 200 });
    } catch (error) {
        console.error('Error fetching date schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch date schedule' }, { status: 500 });
    }
}

// POST /api/doctors/[id]/date-schedule
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const doctorId = params.id;
        const body = await request.json();

        // Upsert the schedule
        const schedule = await DoctorDateSchedule.findOneAndUpdate(
            { doctorId },
            { doctorId, schedules: body.schedules },
            { upsert: true, new: true }
        );

        return NextResponse.json(schedule, { status: 200 });
    } catch (error) {
        console.error('Error saving date schedule:', error);
        return NextResponse.json({ error: 'Failed to save date schedule' }, { status: 500 });
    }
}
