"use client";

import { FiLogOut } from "react-icons/fi";
import { signOut } from "next-auth/react";
import styles from "./sidebar.module.css";

export default function Sidebar({ items = [], activeId }) {
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
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${isActive ? styles.activeNav : ""}`}
              disabled={item.disabled}
              onClick={item.onClick}
            >
              {Icon && <Icon className={styles.navIcon} />}
              <span>{item.label}</span>
            </button>
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