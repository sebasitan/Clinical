import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ReminderLogModel } from '@/lib/models';

// GET reminder activity logs
export async function GET() {
    try {
        await dbConnect();

        // Get the last 20 reminder logs, sorted by most recent first
        const logs = await ReminderLogModel.find({})
            .sort({ timestamp: -1 })
            .limit(20);

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error('Error fetching reminder logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
