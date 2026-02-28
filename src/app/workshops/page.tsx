'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import StudentNavBar from '@/components/StudentNavBar';

interface Workshop {
  _id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function WorkshopsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [available, setAvailable] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  // Always call hooks at the top level, before any return
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      // Fetch enrolled workshops from user endpoint
      fetch('/api/user')
        .then((r) => r.json())
        .then((data) => {
          const enrollments = (data.user?.enrollments || []);
          const enrolledWorkshops = enrollments
            .filter((e: any) => e.enabled && e.workshop && e.workshop.enabled)
            .map((e: any) => e.workshop)
            .filter((w: any) => w); // Remove nulls
          setWorkshops(enrolledWorkshops);
        })
        .catch(() => setWorkshops([]))
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/');
    }
  }, [status, session, router]);

  if (status === 'loading' || loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return null;
}
