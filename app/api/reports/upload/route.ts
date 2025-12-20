import { NextResponse } from 'next/server';
import { uploadBase64Image } from '@/lib/cloudinary';

export async function POST(request: Request) {
    try {
        const { file, fileName } = await request.json();

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        console.log(`[Report API] Uploading report: ${fileName || 'Unnamed'}`);

        // We use uploadBase64Image which calls cloudinary.uploader.upload
        // This supports data URIs including PDFs
        const result = await uploadBase64Image(file, 'dental-clinic/reports');

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error: any) {
        console.error('[Report API] Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
