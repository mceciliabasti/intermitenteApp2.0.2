import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Workshop from '@/models/Workshop';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const workshops = await Workshop.find({});
  return NextResponse.json(workshops);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  try {
    const body = await request.json();
    console.log('Workshop POST body:', body);
    // Explicitly assign all fields to ensure picture is included
    const workshop = new Workshop({
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
      sections: body.sections,
    });
    await workshop.save();
    // Return plain object to avoid serialization issues
    return NextResponse.json(workshop.toObject(), { status: 201 });
  } catch (error) {
    console.error('Workshop creation error:', error);
    let details = 'Unknown error';
    if (error && typeof error === 'object' && 'message' in error) {
      details = (error as any).message;
    } else {
      details = String(error);
    }
    return NextResponse.json({ error: 'Failed to create workshop', details }, { status: 500 });
  }
}