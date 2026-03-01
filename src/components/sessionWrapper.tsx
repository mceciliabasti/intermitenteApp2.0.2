'use client';
import { SessionProvider } from "next-auth/react";

const sessionWrapper = ({ children }: { children: React.ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default sessionWrapper;