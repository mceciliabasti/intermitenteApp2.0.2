export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await dbConnect();
    const { notificationId } = await (request as any).json();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Remove the sentTo entry for this user from the notification
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { $pull: { sentTo: { user: user._id } } },
      { new: true }
    );
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    // Find user by email to get their ID
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find notifications where user is in sentTo array

    const notifications = await Notification.find({
      'sentTo.user': user._id,
    })
      .populate('createdBy', 'firstName lastName')
      .populate('targetWorkshop', 'name')
      .populate('sentTo.user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { notificationId } = await (request as any).json();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark as read for this user
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        $set: {
          'sentTo.$[elem].read': true,
          'sentTo.$[elem].readAt': new Date(),
        },
      },
      {
        arrayFilters: [{ 'elem.user': user._id }],
        new: true,
      }
    );

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}