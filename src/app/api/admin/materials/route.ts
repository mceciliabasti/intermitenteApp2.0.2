import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Material from '@/models/Material';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const materials = await Material.find().sort({ createdAt: -1 });
  return NextResponse.json(materials);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const body = await request.json();
  const material = new Material(body);
  await material.save();
  return NextResponse.json(material, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const { id, updates } = await request.json();
  const material = await Material.findByIdAndUpdate(id, updates, { new: true });
  if (!material) return NextResponse.json({ error: 'Material not found' }, { status: 404 });
  return NextResponse.json(material);
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const { id } = await request.json();
  await Material.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Deleted' });
}
