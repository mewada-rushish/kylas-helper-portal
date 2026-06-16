import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  // 1. Fetch the secure session token directly on the server
  const session = await getServerSession(authOptions);

  // 2. Evaluate state and execute immediate structural routing redirection
  if (!session) {
    redirect("/login");
  } else {
    redirect("/dashboard");
  }
}