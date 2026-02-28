import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Payment from '@/models/Payment';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { id } = await params;
  // Get all payments for this workshop
  const payments = await Payment.find({ workshop: id });
  return NextResponse.json(payments);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const { paymentId, paid } = await request.json();
  const payment = await Payment.findByIdAndUpdate(paymentId, { paid }, { new: true });
  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }
  return NextResponse.json(payment);
}
