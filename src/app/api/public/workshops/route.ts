import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Workshop from '@/models/Workshop';

export async function GET() {
  try {
    await dbConnect();
    const workshops = await Workshop.find({ enabled: true });
    return NextResponse.json(workshops);
  } catch (error) {
    console.error('Error fetching public workshops:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
