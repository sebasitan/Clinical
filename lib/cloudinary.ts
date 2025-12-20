import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

// Log warning if placeholder is used (but don't log the secret itself)
if (process.env.CLOUDINARY_API_SECRET?.includes('your_cloudinary_secret')) {
    console.warn('[Cloudinary] WARNING: Using placeholder API_SECRET. Uploads will fail with "Invalid Signature".');
}

export default cloudinary;

export async function uploadImage(file: File, folder: string = 'dental-clinic') {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto',
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        ).end(buffer);
    });
}

export async function uploadBase64Image(base64String: string, folder: string = 'dental-clinic') {
    try {
        const result = await cloudinary.uploader.upload(base64String, {
            folder: folder,
            resource_type: 'auto',
        });
        return result;
    } catch (error) {
        throw error;
    }
}
