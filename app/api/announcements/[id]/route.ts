import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AnnouncementModel } from '@/lib/models';
import { isValidObjectId } from 'mongoose';

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const body = await request.json();

        // Strip _id to prevent Mongoose errors
        const { _id, ...updateData } = body;

        // Try to find by custom id first, then by _id
        let announcement = await AnnouncementModel.findOneAndUpdate(
            { id: params.id },
            { $set: updateData },
            { new: true }
        );

        if (!announcement && isValidObjectId(params.id)) {
            announcement = await AnnouncementModel.findByIdAndUpdate(
                params.id,
                { $set: updateData },
                { new: true }
            );
        }

        if (!announcement) {
            return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
        }
        return NextResponse.json(announcement);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;

        // Try to delete by custom id
        let announcement = await AnnouncementModel.findOneAndDelete({ id: params.id });

        // Fallback to _id if not found and it's a valid ObjectId
        if (!announcement && isValidObjectId(params.id)) {
            announcement = await AnnouncementModel.findByIdAndDelete(params.id);
        }

        if (!announcement) {
            return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Announcement deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
