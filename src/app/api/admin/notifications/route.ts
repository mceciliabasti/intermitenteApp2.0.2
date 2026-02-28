import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const notifications = await Notification.find({})
      .populate('createdBy', 'firstName lastName email')
      .populate('targetWorkshop', 'name')
      .populate('sentTo.user', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    
    // Get current admin user
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build sentTo array from targetUserIds
    const sentTo = (body.targetUserIds || []).map((userId: string) => ({
      user: userId,
      read: false,
    }));

    const notification = new Notification({
      title: body.title,
      message: body.message,
      type: body.type || 'info',
      sentTo,
      createdBy: adminUser._id,
      targetWorkshop: body.targetWorkshop || undefined,
      dueDate: body.dueDate || undefined,
      metadata: body.metadata || {},
      sent: true,
      scheduledFor: body.scheduledFor || undefined,
    });

    await notification.save();
    await notification.populate('createdBy', 'firstName lastName email');
    await notification.populate('sentTo.user', 'firstName lastName email');

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
