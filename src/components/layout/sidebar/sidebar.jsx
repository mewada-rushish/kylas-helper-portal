"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLogOut, FiLayout, FiGitBranch, FiCreditCard, FiSettings, FiUsers } from "react-icons/fi";
import { useSession, signOut } from "next-auth/react";
import styles from "./sidebar.module.css";

const CENTRAL_NAVIGATION_ITEMS = [
  { id: "canvas", label: "Overview Canvas", icon: FiLayout, href: "/dashboard" },
  { id: "workflows", label: "Workflows", icon: FiGitBranch, href: "/workflows" },
  { id: "invoices", label: "Invoices & ERP", icon: FiCreditCard, href: "/invoices" },
  { id: "settings", label: "Settings", icon: FiSettings, href: "/settings" },
  { id: "users", label: "User Management", icon: FiUsers, href: "/users" }
];

const BASE_ACCESS = {
  META_MARKETING: ["/dashboard", "/workflows"],
  ACCOUNTING: ["/dashboard", "/invoices"],
  WEB_DEVELOPER: ["/dashboard", "/workflows", "/settings"],
  SUPER_ADMIN: ["*"],
  DEVELOPER: ["*"]
};

export default function Sidebar({ activeId }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role || "META_MARKETING";
  const rawCustomAccess = session?.user?.customAccess || [];
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
  const allowedPaths = BASE_ACCESS[role] || [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.storeProfile}>
          <div className={styles.storeAvatar}>A</div>
          <div className={styles.storeDetails}>
            <span className={styles.storeName}>AsmitA Operations</span>
            <span className={styles.storeLink}>Admin Console</span>
          </div>
        </div>
      </div>

      <nav className={styles.navigation}>
        {CENTRAL_NAVIGATION_ITEMS.filter((item) => {
          // User management is always accessible to SUPER_ADMIN/DEVELOPER
          if (item.id === "users") {
            return role === "SUPER_ADMIN" || role === "DEVELOPER";
          }

          const hasBaseAccess = allowedPaths.includes("*") || allowedPaths.some(p => item.href.startsWith(p));
          const hasCustomAccess = customAccess.some(p => item.href.startsWith(p));
          
          if (customAccess.length > 0) {
            return hasCustomAccess;
          }
          return hasBaseAccess;
        }).map((item) => {
          const Icon = item.icon;

          const isActive = activeId
            ? item.id === activeId
            : pathname.startsWith(item.href.split("#")[0]);

          if (item.disabled) {
            return (
              <button
                key={item.id}
                type="button"
                className={styles.navItem}
                disabled
              >
                {Icon && <Icon className={styles.navIcon} />}
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.activeNav : ""}`}
            >
              {Icon && <Icon className={styles.navIcon} />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <footer className={styles.sidebarFooter}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={styles.logoutBtn}
          type="button"
        >
          <FiLogOut className={styles.navIcon} />
          <span>Sign out</span>
        </button>
      </footer>
    </aside>
  );
}