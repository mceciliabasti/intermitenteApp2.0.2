import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';

import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import formidable, { File } from 'formidable';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing form data' });
    }
    const file = files.file as File;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
      const data = fs.readFileSync(file.filepath);
      const base64 = data.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'auto',
        folder: 'materials',
        public_id: `${Date.now()}-${file.originalFilename}`,
      });
      return res.status(200).json({ url: result.secure_url });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to upload file', details: (error as Error).message });
    }
  });
}
