import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  // 1. Define the authentication methods
  providers: [
    CredentialsProvider({
      name: "System Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Phase 2: Live Prisma lookup against MySQL 'User' table
        const prisma = (await import("./prisma")).default;
        const bcrypt = (await import("bcrypt")).default;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.email.split('@')[0], // Extract name from email for now
          email: user.email,
          role: user.role,
          customAccess: user.customAccess ? JSON.parse(user.customAccess) : [],
          rememberMe: credentials.rememberMe === "true"
        };
      }
    })
  ],

  // 2. High-Assurance Session Security
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Maximum session cookie lifespan (30 days)
  },

  // 3. Custom Routing & Redirect Logic (Replaces Middleware)
  pages: {
    signIn: "/login", // NextAuth will automatically redirect unauthenticated users here
    error: "/login",  // Redirect back to login on auth failure
  },

  // 4. Token & Identity Callbacks
  callbacks: {
    // Inject the user role and custom access into the secure JWT
    async jwt({ token, user }) {
      // On initial sign-in, populate the token fields
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.customAccess = user.customAccess;
        token.rememberMe = user.rememberMe;
        // Record exactly when this session was issued (Unix timestamp)
        token.issuedAt = Math.floor(Date.now() / 1000);
      }

      // Handle standard 8-hour expiration if Remember Me was not checked
      const now = Math.floor(Date.now() / 1000);
      if (!token.rememberMe && now - token.issuedAt > 8 * 60 * 60) {
        token.error = "SessionExpired";
      }

      // On every subsequent request, validate the session is still fresh.
      // If the user changed their password after this token was issued, kill it.
      try {
        const prisma = (await import("./prisma")).default;
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { passwordChangedAt: true, role: true, customAccess: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.customAccess = dbUser.customAccess ? JSON.parse(dbUser.customAccess) : [];

          if (dbUser.passwordChangedAt) {
            const changedAtTimestamp = Math.floor(dbUser.passwordChangedAt.getTime() / 1000);
            // If the token was issued BEFORE the password was changed, it's stale — kill it
            if (token.issuedAt < changedAtTimestamp) {
              token.error = "SessionExpired";
            }
          }
        }
      } catch (e) {
        // If DB check fails, allow the session to continue rather than locking everyone out
      }

      return token;
    },
    // Expose the role and custom access to the client session
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.customAccess = token.customAccess;
        session.error = token.error;
      }
      return session;
    }
  }
};