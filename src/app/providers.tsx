'use client';

import { SessionProvider } from 'next-auth/react';
import AudioProvider from '@/components/AudioProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AudioProvider>{children}</AudioProvider>
    </SessionProvider>
  );
}