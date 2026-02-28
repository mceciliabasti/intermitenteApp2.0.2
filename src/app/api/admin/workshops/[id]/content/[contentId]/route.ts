import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Workshop from '@/models/Workshop';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; contentId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id, contentId } = await params;
  const body = await request.json();
  // body can be { enabled: boolean } or { content: { title, type, fileUrl, enabled, tags } }

  const workshop = await Workshop.findById(id);
  if (!workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
  }

  // Find and update content in all sections
  for (const section of Object.keys(workshop.sections)) {
    const contentArray = workshop.sections[section as keyof typeof workshop.sections];
    const contentIndex = contentArray.findIndex((c: any) => c._id.toString() === contentId);
    if (contentIndex !== -1) {
      if (body && typeof body.enabled === 'boolean' && (!body.content)) {
        contentArray[contentIndex].enabled = body.enabled;
      }
      if (body && body.content) {
        const update = body.content as any;
        if (typeof update.title === 'string') contentArray[contentIndex].title = update.title;
        if (typeof update.type === 'string') contentArray[contentIndex].type = update.type;
        if (typeof update.fileUrl === 'string') contentArray[contentIndex].fileUrl = update.fileUrl;
        if (typeof update.enabled === 'boolean') contentArray[contentIndex].enabled = update.enabled;
        if (Array.isArray(update.tags)) contentArray[contentIndex].tags = update.tags;
      }
      break;
    }
  }

  await workshop.save();
  return NextResponse.json(workshop);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; contentId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id, contentId } = await params;

  const workshop = await Workshop.findById(id);
  if (!workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
  }

  // Find and remove content in all sections
  for (const section of Object.keys(workshop.sections)) {
    const contentArray = workshop.sections[section as keyof typeof workshop.sections];
    workshop.sections[section as keyof typeof workshop.sections] = contentArray.filter((c: any) => c._id.toString() !== contentId);
  }

  await workshop.save();
  return NextResponse.json({ message: 'Content deleted' });
}