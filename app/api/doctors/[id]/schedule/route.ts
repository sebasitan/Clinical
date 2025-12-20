import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ScheduleModel } from '@/lib/models';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const schedule = await ScheduleModel.findOne({ doctorId: params.id });
        if (!schedule) {
            return NextResponse.json({ doctorId: params.id, days: {} });
        }
        return NextResponse.json(schedule);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const body = await request.json();

        const schedule = await ScheduleModel.findOneAndUpdate(
            { doctorId: params.id },
            { $set: { days: body.days } },
            { upsert: true, new: true }
        );

        return NextResponse.json(schedule);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
