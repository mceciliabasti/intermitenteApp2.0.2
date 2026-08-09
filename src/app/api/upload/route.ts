import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'; // Necesario para endpoints con upload en app router
export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

function sanitizeFileName(name: string) {
  return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
}

function uploadToCloudinary(buffer: Buffer, mimeType: string, fileName: string) {
  const baseName = fileName.replace(/\.[^/.]+$/, '');
  const publicId = `${Date.now()}-${baseName}`;

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'materials',
        public_id: publicId,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
          return;
        }
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const data = Buffer.from(bytes);
    const mimeType = file.type || 'application/octet-stream';
    const fileName = sanitizeFileName(file.name || 'file');
    const isPDF = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not initialized for PDF upload' }, { status: 500 });
      }

      // Subir a Supabase Storage
      const bucket = 'pdf';
      const storageName = `${Date.now()}-${fileName}`;
      const { error } = await supabase.storage.from(bucket).upload(storageName, data, {
        contentType: mimeType,
        upsert: false,
      });
      if (error) {
        return NextResponse.json({ error: 'Failed to upload PDF to Supabase', details: error.message }, { status: 500 });
      }
      const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(storageName);
      if (!publicUrl || !publicUrl.publicUrl) {
        return NextResponse.json({ error: 'Failed to get public URL from Supabase' }, { status: 500 });
      }
      return NextResponse.json({ url: publicUrl.publicUrl });
    } else {
      // Subir a Cloudinary
      const url = await uploadToCloudinary(data, mimeType, fileName);
      return NextResponse.json({ url });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected error in upload handler', details: err?.message || String(err) }, { status: 500 });
  }
}
