import { NextResponse } from 'next/server';
import { uploadBase64Image } from '@/lib/cloudinary';

export async function POST(request: Request) {
    try {
        const { image, folder } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const result = await uploadBase64Image(image, folder || 'dental-clinic/doctors');

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
