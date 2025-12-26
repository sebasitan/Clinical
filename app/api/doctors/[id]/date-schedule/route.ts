import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DoctorDateSchedule } from '@/lib/models';

// GET /api/doctors/[id]/date-schedule
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id: doctorId } = await props.params;
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
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id: doctorId } = await props.params;
        const body = await request.json();
        const schedules = body.schedules || {};

        // Validation: Prevent saving schedules for past dates
        const todayStr = new Date().toISOString().split('T')[0];
        const pastDates = Object.keys(schedules).filter(date => date < todayStr);

        if (pastDates.length > 0) {
            return NextResponse.json({
                error: 'Cannot set schedules for past dates',
                pastDates
            }, { status: 400 });
        }

        // Upsert the schedule
        const schedule = await DoctorDateSchedule.findOneAndUpdate(
            { doctorId },
            { doctorId, schedules },
            { upsert: true, new: true }
        );

        return NextResponse.json(schedule, { status: 200 });
    } catch (error) {
        console.error('Error saving date schedule:', error);
        return NextResponse.json({ error: 'Failed to save date schedule' }, { status: 500 });
    }
}
