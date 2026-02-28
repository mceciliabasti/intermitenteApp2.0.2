import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Workshop from '@/models/Workshop';
import User from '@/models/User';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow admins to fetch any workshop
    if (session.user.role === 'admin') {
      const workshop = await Workshop.findById(id).lean();
      if (!workshop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      // filter sections to only enabled content
      const sections = {} as any;
      for (const key of Object.keys(workshop.sections || {})) {
        sections[key] = (workshop.sections[key] || []).filter((c: any) => c.enabled);
      }
      return NextResponse.json({ ...workshop, sections });
    }

    // Non-admins: check enrollment
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const enrolled = (user.enrollments || []).some((e: any) => String(e.workshop) === id && e.enabled);
    if (!enrolled) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const workshop = await Workshop.findById(id).lean();
    if (!workshop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sections = {} as any;
    for (const key of Object.keys(workshop.sections || {})) {
      sections[key] = (workshop.sections[key] || []).filter((c: any) => c.enabled);
    }

    return NextResponse.json({ ...workshop, sections });
  } catch (error) {
    console.error('Error fetching protected workshop content:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
