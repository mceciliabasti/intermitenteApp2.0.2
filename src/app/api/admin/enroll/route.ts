
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Workshop from '@/models/Workshop';
import Payment from '@/models/Payment';
import Notification from '@/models/Notification';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { userId, workshopId, workshopIds } = body;

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetIds = Array.isArray(workshopIds) ? workshopIds : (workshopId ? [workshopId] : []);
    if (targetIds.length === 0) return NextResponse.json({ error: 'No workshops provided' }, { status: 400 });

    for (const wid of targetIds) {
      const workshop = await Workshop.findById(wid);
      if (!workshop) continue;

      // Check if already enrolled
      const existing = user.enrollments.find((e: any) => e.workshop.toString() === wid);
      if (existing) {
        return NextResponse.json({ error: `El usuario ya está inscripto en el taller ${workshop.name}` }, { status: 400 });
      }

      // Add enrollment
      user.enrollments.push({
        workshop: wid,
        status: 'current',
        enabled: true,
        enrolledAt: new Date(),
      });

      // Create payments for this workshop (solo si no existen)
      const payments = [];
      for (let i = 1; i <= (workshop.installments || 1); i++) {
        const exists = await Payment.findOne({ user: userId, workshop: wid, installmentNumber: i });
        if (!exists) {
          const payment = new Payment({
            user: userId,
            workshop: wid,
            installmentNumber: i,
            amount: workshop.installments > 0 ? 100 / workshop.installments : 0,
            dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
          });
          payments.push(payment);
        }
      }
      if (payments.length > 0) {
        await Payment.insertMany(payments);
      }

      // Create notification (add required fields)
      const notification = new Notification({
        title: `Inscripción exitosa: ${workshop.name}`,
        message: `Te has inscrito al taller: ${workshop.name}. Revisa tus pagos pendientes.`,
        type: 'success',
        sentTo: [{ user: userId, read: false }],
        createdBy: session.user.id,
        targetWorkshop: wid,
        sent: true
      });
      await notification.save();
    }

    await user.save();
    // Populate enrollments for response
    await user.populate('enrollments.workshop');
    return NextResponse.json({ message: 'Enrolled successfully', enrollments: user.enrollments });
  } catch (error) {
    // Log error to server console for diagnostics
    console.error('Enroll API error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}