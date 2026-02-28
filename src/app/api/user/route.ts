import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Payment from '@/models/Payment';
import Workshop from '@/models/Workshop';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  // Support ?id= for admin viewing other users
  const url = new URL(request.url);
  const userId = url.searchParams.get('id') || session.user.id;

  // Ensure enrollments.workshop is populated and consistent
  const userDoc = await User.findById(userId).populate('enrollments.workshop');
  if (!userDoc) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Fetch payments and deduplicate by workshop+installment to avoid duplicates
  const rawPayments = await Payment.find({ user: userDoc._id }).populate('workshop', 'name');
  const paymentsMap = new Map<string, any>();
  for (const p of rawPayments) {
    const key = `${String((p.workshop as any)?._id || p.workshop)}_${p.installmentNumber}`;
    // prefer latest (overwrite) so duplicates collapse
    paymentsMap.set(key, p);
  }
  const payments = Array.from(paymentsMap.values());

  const materials: any = {
    pistas: [],
    referencias: [],
    coreos: [],
    guion: [],
    vestuario: [],
  };

  // Build materials only from current, enabled enrollments
  for (const enrollment of userDoc.enrollments || []) {
    if (enrollment.status === 'current' && enrollment.enabled) {
      // enrollment.workshop should be populated; if not, fetch it
      let workshopObj: any = enrollment.workshop;
      if (!workshopObj || typeof workshopObj === 'string' || workshopObj._id === undefined) {
        workshopObj = await Workshop.findById(enrollment.workshop);
      }
      if (!workshopObj) continue;
      Object.keys(materials).forEach((section) => {
        const list = (workshopObj.sections && workshopObj.sections[section]) || [];
        materials[section].push(...list.filter((c: any) => c.enabled));
      });
    }
  }

  // Return enrollments as populated objects for client convenience
  const enrollments = (userDoc.enrollments || []).map((e: any) => ({
    workshop: e.workshop,
    status: e.status,
    enabled: e.enabled,
    enrolledAt: e.enrolledAt,
  }));

  return NextResponse.json({
    user: {
      firstName: userDoc.firstName,
      lastName: userDoc.lastName,
      email: userDoc.email,
      phone: userDoc.phone,
      dni: userDoc.dni,
      enrollments,
    },
    payments,
    materials,
  });
}