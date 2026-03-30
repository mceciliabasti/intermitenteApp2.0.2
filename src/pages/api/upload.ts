
import type { NextApiRequest, NextApiResponse } from 'next';

import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
const formidable = require('formidable');
import fs from 'fs';

// Validar variables de entorno necesarias
const missingVars = [];
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
if (!process.env.CLOUDINARY_CLOUD_NAME) missingVars.push('CLOUDINARY_CLOUD_NAME');
if (!process.env.CLOUDINARY_API_KEY) missingVars.push('CLOUDINARY_API_KEY');
if (!process.env.CLOUDINARY_API_SECRET) missingVars.push('CLOUDINARY_API_SECRET');

let supabase: ReturnType<typeof createClient> | null = null;
if (missingVars.length === 0) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (missingVars.length > 0) {
    res.status(500).json({ error: 'Missing environment variables', missing: missingVars });
    return;
  }
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    const form = new formidable.IncomingForm({
      maxFileSize: 10 * 1024 * 1024 // 10MB
    });
    form.parse(req, async (err: any, fields: any, files: any) => {
      try {
        if (err) {
          res.status(500).json({ error: 'Error parsing form data', details: err.message });
          return;
        }
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!file) {
          res.status(400).json({ error: 'No file uploaded' });
          return;
        }
        const data = fs.readFileSync(file.filepath);
        const isPDF = file.mimetype === 'application/pdf';
        if (isPDF) {
          // Subir a Supabase Storage
          const bucket = 'pdf';
          const fileName = `${Date.now()}-${file.originalFilename}`;
          try {
            const { data: uploadData, error } = await supabase.storage.from(bucket).upload(fileName, data, {
              contentType: file.mimetype,
              upsert: false,
            });
            if (error) {
              console.error('Supabase upload error:', error);
              res.status(500).json({ error: 'Failed to upload PDF to Supabase', details: error.message });
              return;
            }
            // Obtener URL pública
            const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(fileName);
            if (!publicUrl || !publicUrl.publicUrl) {
              console.error('Supabase getPublicUrl error: No public URL returned');
              res.status(500).json({ error: 'Failed to get public URL from Supabase' });
              return;
            }
            res.status(200).json({ url: publicUrl.publicUrl });
          } catch (err) {
            console.error('Unexpected error uploading PDF to Supabase:', err);
            res.status(500).json({ error: 'Unexpected error uploading PDF to Supabase', details: (err instanceof Error ? err.message : String(err)) });
          }
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
          res.status(200).json({ url: result.secure_url });
        }
      } catch (err) {
        console.error('Unexpected error in upload handler:', err);
        res.status(500).json({ error: 'Unexpected error in upload handler', details: (err instanceof Error ? err.message : String(err)) });
      }
    });
  } catch (err) {
    // Manejo global de errores para cualquier excepción inesperada
    console.error('Global API error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Unexpected global error in API route', details: (err instanceof Error ? err.message : String(err)) });
    }
  }
}
