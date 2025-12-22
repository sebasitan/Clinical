
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db'; // Corrected import
import { ConsultationModel } from '@/lib/models';

// GET: Fetch records, optionally filtered by doctorId
export async function GET(request: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctorId');

        const query = doctorId ? { doctorId } : {};
        const records = await ConsultationModel.find(query).sort({ consultationDate: -1 }); // Newest first

        return NextResponse.json(records);
    } catch (error) {
        console.error("Error fetching consultation records:", error);
        return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
    }
}

// POST: Create new record(s) - Supports bulk insert for CSV upload
export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        // Check if array (Bulk) or object (Single)
        const isBulk = Array.isArray(body);
        const records = isBulk ? body : [body];

        // Format/Validation could be added here
        // For now, assuming client sends correct structure matching Schema

        // Ensure IDs if not provided (though Mongoose usually handles _id, custom id might be needed)
        const recordsWithIds = records.map(r => ({
            ...r,
            id: r.id || crypto.randomUUID(), // Ensure custom string ID is present
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        const result = await ConsultationModel.insertMany(recordsWithIds);

        return NextResponse.json({
            message: `Successfully added ${result.length} records`,
            data: result
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating consultation record:", error);
        return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
    }
}
