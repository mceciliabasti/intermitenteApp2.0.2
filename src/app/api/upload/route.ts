import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

export const dynamic = 'force-dynamic'; // Necesario para endpoints con upload en app router

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

async function parseForm(req: NextRequest): Promise<{ fields: any; files: any }> {
  const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
  return new Promise((resolve, reject) => {
    form.parse(req as any, (err: any, fields: any, files: any) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
  }
  try {
    // formidable no soporta Request directamente, necesitamos workaround
    // Usamos un buffer temporal
    const body = await req.arrayBuffer();
    const tempPath = `/tmp/upload-${Date.now()}`;
    fs.writeFileSync(tempPath, Buffer.from(body));
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
    let file: any = null;
    // Convertir Headers (Web API) a objeto plano para formidable
    const plainHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      plainHeaders[key] = value;
    });
    await new Promise<void>((resolve, reject) => {
      form.parse(
        { ...req, url: '', headers: plainHeaders, method: 'POST',
          on: function() { return this; },
          pipe: function<T extends NodeJS.WritableStream>(destination: T, _options?: { end?: boolean }) { return destination; },
          resume: function() { return this; },
          readable: true,
          // @ts-ignore
          _read: function() { return this; },
          // @ts-ignore
          _destroy: function() { return this; },
          // @ts-ignore
          _readableState: {},
          // @ts-ignore
          _events: {},
          // @ts-ignore
          _eventsCount: 0,
          // @ts-ignore
          _writableState: {},
          // @ts-ignore
          _writable: true,
          // @ts-ignore
          _writableEnded: false,
          // @ts-ignore
          _writableFinished: false,
          // @ts-ignore
          _readable: true,
          // @ts-ignore
          _readableEnded: false,
          // @ts-ignore
          _readableFinished: false,
          // @ts-ignore
          _destroyed: false,
          // @ts-ignore
          _closed: false,
          // @ts-ignore
          _ended: false,
          // @ts-ignore
          _final: false,
          // @ts-ignore
          _finalCalled: false,
          // @ts-ignore
          _buffer: Buffer.from(body),
        },
        (err: any, fields: any, files: any) => {
          if (err) reject(err);
          else {
            file = Array.isArray(files.file) ? files.file[0] : files.file;
            resolve();
          }
        }
      );
    });
    if (!file) {
      fs.unlinkSync(tempPath);
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const data = fs.readFileSync(file.filepath);
    const isPDF = file.mimetype === 'application/pdf';
    if (isPDF) {
      // Subir a Supabase Storage
      const bucket = 'pdf';
      const fileName = `${Date.now()}-${file.originalFilename}`;
      const { data: uploadData, error } = await supabase.storage.from(bucket).upload(fileName, data, {
        contentType: file.mimetype,
        upsert: false,
      });
      if (error) {
        fs.unlinkSync(tempPath);
        return NextResponse.json({ error: 'Failed to upload PDF to Supabase', details: error.message }, { status: 500 });
      }
      const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
      fs.unlinkSync(tempPath);
      if (!publicUrl || !publicUrl.publicUrl) {
        return NextResponse.json({ error: 'Failed to get public URL from Supabase' }, { status: 500 });
      }
      return NextResponse.json({ url: publicUrl.publicUrl });
    } else {
      // Subir a Cloudinary
      const base64 = data.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64}`;
      const baseName = file.originalFilename.replace(/\.[^/.]+$/, '');
      const publicId = `${Date.now()}-${baseName}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'auto',
        folder: 'materials',
        public_id: publicId,
      });
      fs.unlinkSync(tempPath);
      return NextResponse.json({ url: result.secure_url });
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected error in upload handler', details: err?.message || String(err) }, { status: 500 });
  }
}
