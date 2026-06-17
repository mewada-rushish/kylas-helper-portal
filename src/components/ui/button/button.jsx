"use client";

import { FiLoader } from "react-icons/fi";
import styles from "./button.module.css";

export default function AdminButton({ 
  children, 
  icon: Icon, 
  variant = "secondary", 
  onClick, 
  isActive = false, 
  disabled = false,
  loading = false,
  loadingText = "Saving...",
  type = "button",
  className = "" 
}) {
  const buttonClassName = [
    styles.btnBase,
    styles[`btn_${variant}`],
    isActive ? styles.btnActive : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <button 
      type={type}
      className={buttonClassName} 
      onClick={onClick}
      disabled={disabled || loading}
    >
      <span className={styles.btnContent}>
        {loading ? (
          <FiLoader className={styles.spinAnimation} />
        ) : (
          Icon && <Icon className={styles.btnIcon} />
        )}
        {children && (
          <span className={styles.btnText}>
            {loading ? loadingText : children}
          </span>
        )}
      </span>
    </button>
  );
}