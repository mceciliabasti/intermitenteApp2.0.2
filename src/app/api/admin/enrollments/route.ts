import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Toggle enrollment enabled status
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { userId, workshopId, enabled } = await request.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const enrollment = user.enrollments.find(
      (e: any) => e.workshop.toString() === workshopId
    );
    if (!enrollment) {
      return NextResponse.json({ error: 'Inscripción no encontrada' }, { status: 404 });
    }

    enrollment.enabled = enabled;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      { error: 'Error al actualizar inscripción' },
      { status: 500 }
    );
  }
}

// Delete enrollment
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { userId, workshopId } = await request.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    user.enrollments = user.enrollments.filter(
      (e: any) => e.workshop.toString() !== workshopId
    );
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Error al eliminar inscripción' },
      { status: 500 }
    );
  }
}
