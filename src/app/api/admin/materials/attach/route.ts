import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { materialId, workshopIds, section } = await request.json();

  if (!materialId || !Array.isArray(workshopIds) || workshopIds.length === 0 || !section) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const Material = (await import('@/models/Material')).default;
  const Workshop = (await import('@/models/Workshop')).default;
  const material = await Material.findById(materialId);
  if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 404 });

  const results: any[] = [];
  for (const wid of workshopIds) {
    const w = await Workshop.findById(wid);
    if (!w) continue;
    const contentToPush = {
      title: material.title,
      type: material.type,
      fileUrl: material.fileUrl,
      enabled: material.enabled,
      tags: material.tags,
    };
    w.sections[section as keyof typeof w.sections].push(contentToPush as any);
    await w.save();
    results.push({ workshop: wid });
  }

  return NextResponse.json({ message: 'Attached', results });
}
