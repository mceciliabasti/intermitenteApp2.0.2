import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const userDoc = await User.findById(session.user.id);
  if (!userDoc) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  const isMatch = await bcrypt.compare(currentPassword, userDoc.password);
  if (!isMatch) {
    return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });
  }

  userDoc.password = await bcrypt.hash(newPassword, 10);
  await userDoc.save();

  return NextResponse.json({ success: true });
}
