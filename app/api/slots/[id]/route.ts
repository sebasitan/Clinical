import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SlotModel } from '@/lib/models';

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const body = await request.json();
        const { status, blockReason } = body;

        const slot = await SlotModel.findOneAndUpdate(
            { id: params.id },
            { $set: { status, blockReason } },
            { new: true }
        );

        if (!slot) {
            return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
        }

        return NextResponse.json(slot);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
