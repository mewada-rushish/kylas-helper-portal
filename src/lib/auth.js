import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  // 1. Define the authentication methods
  providers: [
    CredentialsProvider({
      name: "System Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Phase 1: Hardcoded secure bypass for UI development.
        // Phase 2: We will replace this with a Prisma lookup against your MySQL 'User' table.
        if (credentials.email === "admin@asmita.com" && credentials.password === "secure123") {
          return { 
            id: "1", 
            name: "AsmitA Administrator", 
            email: "admin@asmita.com", 
            role: "SUPER_ADMIN" 
          };
        }
        
        // Return null if user data could not be retrieved
        return null;
      }
    })
  ],

  // 2. High-Assurance Session Security
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8-Hour working session limit
  },

  // 3. Custom Routing & Redirect Logic (Replaces Middleware)
  pages: {
    signIn: "/login", // NextAuth will automatically redirect unauthenticated users here
    error: "/login",  // Redirect back to login on auth failure
  },

  // 4. Token & Identity Callbacks
  callbacks: {
    // Inject the user role into the secure JWT
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    // Expose the role to the client session so we can render UI based on permissions
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  }
};