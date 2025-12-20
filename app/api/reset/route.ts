import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SlotModel, AppointmentModel, LeaveModel } from '@/lib/models';

export async function POST() {
    try {
        await dbConnect();

        // Delete all data that affects slot availability and history
        await Promise.all([
            SlotModel.deleteMany({}),
            AppointmentModel.deleteMany({}),
            LeaveModel.deleteMany({})
        ]);

        return NextResponse.json({
            success: true,
            message: "All slots, appointments, and leaves have been cleared successfully."
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
