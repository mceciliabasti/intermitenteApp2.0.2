import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Notification from '@/models/Notification';
import Workshop from '@/models/Workshop';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    // Find all unpaid payments
    const unpaidPayments = await Payment.find({ paid: false })
      .populate('user', 'email firstName lastName')
      .populate('workshop', 'name');

    const now = new Date();
    const adminUser = await User.findOne({ email: session.user.email });

    let generatedCount = 0;

    for (const payment of unpaidPayments) {
      if (!payment.dueDate) continue;

      const dueDate = new Date(payment.dueDate);
      const daysSinceDue = Math.floor(
        (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Generate reminder on day 10 before/at due date, and then every 7 days after
      const shouldSendReminder = daysSinceDue === 10 || daysSinceDue === 0 || (daysSinceDue > 0 && daysSinceDue % 7 === 0);

      if (shouldSendReminder) {
        // Check if reminder already exists for this payment
        const existingReminder = await Notification.findOne({
          'metadata.workshopId': payment.workshop?._id?.toString(),
          'metadata.installmentNumber': payment.installmentNumber,
          'sentTo.user': payment.user._id,
          type: 'payment-reminder',
        });

        if (!existingReminder) {
          // Calculate surcharge for late payments
          let surcharge = 0;
          if (daysSinceDue > 0) {
            surcharge = Math.round(payment.amount * 0.1); // 10% surcharge
          }

          const notification = new Notification({
            title: `💳 Recordatorio de Pago - ${payment.workshop?.name}`,
            message: `Te recordamos que hay una cuota pendiente de $${payment.amount} para el taller "${payment.workshop?.name}". Cuota #${payment.installmentNumber}.${
              surcharge > 0
                ? ` Por el atraso se agregó un recargo de $${surcharge} (10%).`
                : ''
            }`,
            type: 'payment-reminder',
            sentTo: [{ user: payment.user._id, read: false }],
            createdBy: adminUser?._id,
            targetWorkshop: payment.workshop?._id,
            dueDate: payment.dueDate,
            metadata: {
              workshopId: payment.workshop?._id?.toString(),
              installmentNumber: payment.installmentNumber,
              amount: payment.amount,
              surcharge,
            },
            sent: true,
          });

          await notification.save();
          generatedCount++;
        }
      }
    }

    return NextResponse.json({
      message: `Generated ${generatedCount} payment reminders`,
      count: generatedCount,
    });
  } catch (error) {
    console.error('Error generating payment reminders:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
