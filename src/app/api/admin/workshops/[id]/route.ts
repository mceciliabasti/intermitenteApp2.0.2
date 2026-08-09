import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Workshop from '@/models/Workshop';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const workshop = await Workshop.findById(id);
  if (!workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
  }
  return NextResponse.json(workshop);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  const body = await request.json();
  // Never overwrite sections from the generic workshop edit form.
  const updatePayload = {
    name: body.name,
    description: body.description,
    picture: body.picture,
    type: body.type,
    startDate: body.startDate,
    endDate: body.endDate,
    capacity: body.capacity,
    instructor: body.instructor,
    installments: body.installments,
    enabled: body.enabled,
  };
  const workshop = await Workshop.findByIdAndUpdate(id, updatePayload, { new: true });
  if (!workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
  }
  return NextResponse.json(workshop);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  await Workshop.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Workshop deleted' });
}