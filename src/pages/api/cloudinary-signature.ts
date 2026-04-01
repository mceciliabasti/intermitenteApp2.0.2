import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { public_id, folder, resource_type, signature, timestamp } = req.body;
    // Generar la firma para el upload seguro
    const paramsToSign: Record<string, any> = {
      timestamp,
      folder,
      public_id,
      resource_type,
    };
    // Eliminar undefined
    Object.keys(paramsToSign).forEach(
      (k) => paramsToSign[k] === undefined && delete paramsToSign[k]
    );
    const signed = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);
    res.status(200).json({ signature: signed, apiKey: process.env.CLOUDINARY_API_KEY, cloudName: process.env.CLOUDINARY_CLOUD_NAME });
  } catch (error) {
    res.status(500).json({ error: 'Error generating signature', details: (error as Error).message });
  }
}
