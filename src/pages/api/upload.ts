import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
const formidable = require('formidable');
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb',
  },
};
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
        const base64 = data.toString('base64');
        const dataUri = `data:${file.mimetype};base64,${base64}`;
        const result = await cloudinary.uploader.upload(dataUri, {
          resource_type: 'auto',
          folder: 'materials',
          public_id: `${Date.now()}-${file.originalFilename.replace(/\.[^/.]+$/, '')}`,
        });
        res.status(200).json({ url: result.secure_url });
      } catch (error) {
        res.status(500).json({ error: 'Failed to upload file', details: (error as Error).message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: (error as Error).message });
  }
}
