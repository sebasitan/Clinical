import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ReminderSettingsModel } from '@/lib/models';

// GET reminder settings
export async function GET() {
    try {
        await dbConnect();

        // Get the first (and only) settings document
        let settings = await ReminderSettingsModel.findOne({});

        // If no settings exist, create default settings
        if (!settings) {
            settings = await ReminderSettingsModel.create({
                enabled: true,
                daysBefore: [1, 2],
                channels: {
                    sms: false,
                    whatsapp: true,
                    email: true
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Error fetching reminder settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST/UPDATE reminder settings
export async function POST(req: Request) {
    try {
        await dbConnect();
        const data = await req.json();

        // Update or create settings (there should only be one document)
        const settings = await ReminderSettingsModel.findOneAndUpdate(
            {},
            {
                enabled: data.enabled,
                daysBefore: data.daysBefore,
                channels: data.channels,
                updatedBy: data.updatedBy || 'admin'
            },
            { upsert: true, new: true }
        );

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Error saving reminder settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
