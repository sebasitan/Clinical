import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { ReminderModel } from "@/lib/models";

export async function GET() {
    try {
        await dbConnect();
        const reminders = await ReminderModel.find({}).sort({ createdAt: -1 });
        return NextResponse.json(reminders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const data = await req.json();
        const reminder = await ReminderModel.create({
            ...data,
            id: `REM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        });
        return NextResponse.json(reminder, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
