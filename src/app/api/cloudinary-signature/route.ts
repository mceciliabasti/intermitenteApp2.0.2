// Este endpoint genera una firma segura para Cloudinary
import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary env vars missing' }, { status: 500 });
  }
  // El string a firmar debe ser 'folder=materials&timestamp=TIMESTAMP' (orden exacto)
  const paramsToSign = `folder=materials&timestamp=${timestamp}`;
  const signature = require('crypto').createHash('sha1').update(paramsToSign + apiSecret).digest('hex');
  return NextResponse.json({ timestamp, signature, apiKey, cloudName, folder: 'materials' });
}
