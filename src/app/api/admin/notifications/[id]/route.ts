import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const notification = await Notification.findByIdAndUpdate(
      id,
      {
        title: body.title,
        message: body.message,
        type: body.type,
        targetWorkshop: body.targetWorkshop || undefined,
        dueDate: body.dueDate || undefined,
        metadata: body.metadata || {},
      },
      { new: true }
    ).populate('createdBy', 'firstName lastName email').populate('sentTo.user', 'firstName lastName email');

    if (!notification) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id } = await params;
    
    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
