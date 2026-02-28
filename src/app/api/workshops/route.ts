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

  try {
    await dbConnect();
    const workshops = await Workshop.find({});
    return NextResponse.json(workshops);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workshops' }, { status: 500 });
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
    const workshop = new Workshop(body);
    await workshop.save();
    return NextResponse.json(workshop, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create workshop' }, { status: 500 });
  }
}