import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AnnouncementModel } from '@/lib/models';

export async function GET(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const isAdmin = searchParams.get('admin') === 'true';

        let query = {};
        if (!isAdmin) {
            const today = new Date().toISOString().split('T')[0];
            query = {
                isActive: true,
                startDate: { $lte: today },
                endDate: { $gte: today }
            };
        }

        const announcements = await AnnouncementModel.find(query).sort({ createdAt: -1 });
        return NextResponse.json(announcements);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        if (!body.id) {
            body.id = Math.random().toString(36).substring(2, 11);
        }

        const announcement = await AnnouncementModel.create(body);
        return NextResponse.json(announcement, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}
