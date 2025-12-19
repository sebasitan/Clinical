import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ReceptionistModel } from '@/lib/models';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const body = await request.json();

        const receptionist = await ReceptionistModel.findOneAndUpdate(
            { id: params.id },
            { $set: body },
            { new: true }
        );

        if (!receptionist) {
            return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 });
        }

        return NextResponse.json(receptionist);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const result = await ReceptionistModel.findOneAndDelete({ id: params.id });

        if (!result) {
            return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
