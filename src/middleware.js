import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAuth = !!req.nextauth.token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/reset-password") || req.nextUrl.pathname.startsWith("/forgot-password");

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return null;
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url));
    }

    if (req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Role-Based Access Control (RBAC) Logic
    const token = req.nextauth.token;
    const role = (token?.role || "MARKETING").toUpperCase();
    const rawCustomAccess = token?.customAccess || [];
    let customAccess = [];
    if (typeof rawCustomAccess === "string") {
      try {
        const parsed = JSON.parse(rawCustomAccess);
        if (Array.isArray(parsed)) {
          customAccess = parsed;
        }
      } catch (e) {}
    } else if (Array.isArray(rawCustomAccess)) {
      customAccess = rawCustomAccess;
    }
    const path = req.nextUrl.pathname;

    // Define base modules
    const baseAccess = {
      MARKETING: ["/dashboard", "/invoices", "/profile"],
      AUTOMATION_ENGINEER: ["/dashboard", "/invoices", "/workflows", "/profile"],
      ACCOUNTING: ["/dashboard", "/invoices", "/profile"],
      SUPER_ADMIN: ["*"], // All access
      DEVELOPER: ["*"] // All access
    };

    const allowedPaths = baseAccess[role] || [];
    
    // Check access rules
    const isAdminRoute = path.startsWith("/users");
    const isAdmin = role === "SUPER_ADMIN" || role === "DEVELOPER";

    let hasAccess = false;
    if (isAdminRoute && isAdmin) {
      hasAccess = true;
    } else {
      const hasBaseAccess = allowedPaths.includes("*") || allowedPaths.some(p => path.startsWith(p));
      const hasCustomAccess = customAccess.some(p => path.startsWith(p));
      
      // If customAccess overrides exist, they take precedence over base role access.
      if (customAccess.length > 0) {
        hasAccess = hasCustomAccess;
      } else {
        hasAccess = hasBaseAccess;
      }
    }

    if (!hasAccess) {
      // Access denied, redirect to a fallback. If already on dashboard and denied, we have a problem.
      if (path === "/dashboard") {
        // Just let them in to dashboard if they have literally no other access, or show an unauthorized page.
        // For now, allow dashboard as a safe fallback to prevent infinite loops.
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

  },
  {
    callbacks: {
      authorized: ({ token }) => true, // We handle authorized behavior inside the middleware function
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/workflows/:path*",
    "/invoices/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/login",
    "/reset-password",
    "/forgot-password",
  ],
};
