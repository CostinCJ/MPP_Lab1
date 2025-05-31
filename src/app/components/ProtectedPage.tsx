"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface ProtectedPageProps {
  children: React.ReactNode;
}

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      // Redirect to sign-in page, preserving the intended destination
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.2em' }}>Loading session...</div>;
  }

  if (status === "unauthenticated") {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.2em' }}>Redirecting to sign in...</div>;
  }

  // If authenticated, render the children
  return <>{children}</>;
}