import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Workshop from '@/models/Workshop';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  const { section, content, materialId } = body;

  const workshop = await Workshop.findById(id);
  if (!workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
  }

  if (materialId) {
    // attach existing material to workshop
    const Material = (await import('@/models/Material')).default;
    const mat = await Material.findById(materialId);
    if (!mat) return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    const contentToPush = {
      title: mat.title,
      type: mat.type,
      fileUrl: mat.fileUrl,
      enabled: mat.enabled,
      tags: mat.tags,
    };
    workshop.sections[section as keyof typeof workshop.sections].push(contentToPush as any);
  } else {
    workshop.sections[section as keyof typeof workshop.sections].push(content);
  }
  await workshop.save();

  // Notify enrolled users
  const enrolledUsers = await User.find({ 'enrollments.workshop': id, 'enrollments.status': 'current' });
  // Obtener admin actual
  const adminUser = await User.findOne({ email: session.user.email });
  const notifications = enrolledUsers.map(user => ({
    user: user._id,
    title: `Nuevo contenido en ${section}`,
    message: `Nuevo contenido disponible en ${section} para el taller: ${workshop.name}`,
    type: 'info',
    createdBy: adminUser ? adminUser._id : undefined,
  }));
  await Notification.insertMany(notifications);

  return NextResponse.json(workshop, { status: 201 });
}