import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const file = req.body.file || req.files?.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Si el archivo viene como buffer
    const buffer = file.buffer || Buffer.from(file, 'base64');
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.mimetype || file.type};base64,${base64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'auto',
      folder: 'materials',
      public_id: `${Date.now()}-${file.originalname || file.name}`,
    });
    return res.status(200).json({ url: result.secure_url });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
}
