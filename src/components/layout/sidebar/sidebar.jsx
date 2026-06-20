"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiLogOut, FiLayout, FiGitBranch, FiCreditCard, FiSettings } from "react-icons/fi";
import { signOut } from "next-auth/react";
import styles from "./sidebar.module.css";

const CENTRAL_NAVIGATION_ITEMS = [
  { id: "canvas", label: "Overview Canvas", icon: FiLayout, href: "/dashboard" },
  { id: "workflows", label: "Workflows", icon: FiGitBranch, href: "/workflows" },
  { id: "invoices", label: "Invoices & ERP", icon: FiCreditCard, href: "/invoices" },
  { id: "settings", label: "Settings", icon: FiSettings, href: "/dashboard#settings", disabled: true }
];

export default function Sidebar({ activeId }) {
  const pathname = usePathname();

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
        {CENTRAL_NAVIGATION_ITEMS.map((item) => {
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