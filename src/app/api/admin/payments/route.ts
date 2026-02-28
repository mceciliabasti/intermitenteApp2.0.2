import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const payments = await Payment.find({ user: userId }).populate('workshop', 'name');
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const { paymentId, paid } = body;
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 });

    const update: any = { paid: !!paid };
    if (paid) update.paidAt = new Date();
    else update.paidAt = null;

    const payment = await Payment.findByIdAndUpdate(paymentId, update, { new: true }).populate('workshop', 'name');
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
