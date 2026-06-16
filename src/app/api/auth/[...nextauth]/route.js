import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Initialize the NextAuth handler with our custom configuration
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests
// This is required by the Next.js App Router to handle the dynamic API routes
export { handler as GET, handler as POST };