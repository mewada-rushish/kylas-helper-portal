"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import toast from "react-hot-toast";

function SessionValidator({ children }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "SessionExpired") {
      toast.error("Your session has expired due to a password change. Please log in again.");
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  return children;
}

export default function NextAuthSessionProvider({ children }) {
  // Refetch interval (e.g. 5 minutes) ensures long-lived tabs eventually check for invalidation
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <SessionValidator>
        {children}
      </SessionValidator>
    </SessionProvider>
  );
}
