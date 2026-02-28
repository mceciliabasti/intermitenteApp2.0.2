import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Workshop from '@/models/Workshop';
import Notification from '@/models/Notification';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const body = await request.json();
    const { workshopId } = body;

    const student = await User.findOne({ email: session.user.email });
    if (!student) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const workshop = workshopId ? await Workshop.findById(workshopId) : null;

    // Find admin users to notify
    const admins = await User.find({ role: 'admin' });
    const sentTo = admins.map(a => ({ user: a._id }));

    const notif = new Notification({
      title: `Solicitud de inscripción${workshop ? ` — ${workshop.name}` : ''}`,
      message: `${student.firstName} ${student.lastName} (${student.email}) solicita inscripción${workshop ? ` al taller "${workshop.name}"` : ''}.`,
      type: 'info',
      sentTo,
      createdBy: student._id,
      targetWorkshop: workshop ? workshop._id : undefined,
      sent: false,
    });

    await notif.save();
    return NextResponse.json({ ok: true, notificationId: notif._id });
  } catch (error) {
    console.error('Error creating enroll request:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
