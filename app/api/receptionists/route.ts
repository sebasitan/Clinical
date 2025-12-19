import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ReceptionistModel } from '@/lib/models';

export async function GET() {
    try {
        await dbConnect();
        const receptionists = await ReceptionistModel.find({}).sort({ createdAt: -1 });
        return NextResponse.json(receptionists);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        const receptionist = await ReceptionistModel.create({
            ...body,
            id: body.id || crypto.randomUUID(),
        });

        return NextResponse.json(receptionist);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
