// Endpoint desactivado. Usar src/pages/api/upload.ts para carga de archivos.
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file = data.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Convert buffer to base64 for Cloudinary
  const base64 = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'auto',
      folder: 'materials',
      public_id: `${Date.now()}-${file.name}`,
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload file', details: error.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
  const data = await request.formData();
  const file = data.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Convert buffer to base64 for Cloudinary
  const base64 = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'auto',
      folder: 'materials',
      public_id: `${Date.now()}-${file.name}`,
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload file', details: error.message }, { status: 500 });
  }
}